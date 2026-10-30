# Operational Deployment Runbook & Troubleshooting Guide: Ella API

**Document Type:** Confluence Operational Runbook  
**Service:** Ella E-Commerce Backend API  
**Status:** Approved for Production  
**Primary On-Call:** DevOps / Platform Engineering Team  

---

## 1. System Architecture & Topology

```
                  Internet / Client Requests
                              |
                              v
                [ AWS Application Load Balancer ]
                    (HTTPS:443 / SSL Termination)
                              |
                              +--------------------------+
                              |                          |
                              v                          v
                     [ ECS Fargate Task 1 ]     [ ECS Fargate Task 2 ]
                        (Port 4000)                (Port 4000)
                              |                          |
                              +-------------+------------+
                                            |
                                            v (Encrypted Private VPC)
                               [ Amazon Aurora PostgreSQL ]
                                     (Multi-AZ Cluster)
```

---

## 2. Pre-Deployment Verification Checklist

Before triggering a production deployment, ensure the following criteria are validated:
- [ ] All GitHub Actions CI checks have completed with **Green** status.
- [ ] Code is merged into `main` with approval from code owners.
- [ ] Database migration scripts have been tested against a staging database with backward compatibility verified.
- [ ] Rollback strategy and target container image digest are documented in the release ticket.
- [ ] Deployment window is active (outside peak e-commerce trading hours).

---

## 3. Containerization Review & Troubleshooting (DevOps Assessment Task 2)

During the audit of the initial repository Docker configuration, several critical build and runtime blockers were identified and fixed:

### Problem 1: Docker Build Failure due to Hardcoded `.env` Copy
- **Diagnosis**: The original `Dockerfile` contained `COPY .env ./` in the runner stage. Because `.env` is correctly excluded by `.gitignore`, executing `docker compose up -d --build` on a fresh clone failed with:
  `ERROR: failed to solve: "/.env": not found`.
- **Solution**: Removed hardcoded `.env` copying from the Dockerfile. Updated `Dockerfile` to copy `.env.example` as a non-secret fallback and configured `docker-compose.yml` to supply runtime environment variables dynamically.

### Problem 2: Production Entrypoint Mismatch Crashing Container
- **Diagnosis**: The original `Dockerfile` and `docker-compose.yml` had conflicting entrypoints (`dist/src/main.js` vs `dist/main`). In `package.json`, `"start:prod"` was set to `node dist/main`, which threw `Cannot find module` because the NestJS compiler outputs to `dist/src/main.js`.
- **Solution**: Standardized the entrypoint across `package.json`, `Dockerfile`, and `docker-compose.yml` to `node dist/src/main.js`. Excluded `qa` from `tsconfig.build.json` to prevent output path fragmentation.

### Problem 3: Redundant and Bloated Dependencies in Runner Image
- **Diagnosis**: Original `Dockerfile` ran `npm install typeorm@^0.3.27` manually and installed all devDependencies in the production container, resulting in an oversized 1.2GB image.
- **Solution**: Implemented a multi-stage build:
  - *Stage 1 (Builder)*: Installs devDependencies and compiles TypeScript.
  - *Stage 2 (Runner)*: Installs **only** production dependencies (`npm ci --omit=dev`), cleans npm cache, runs as a secure non-root user (`USER node`), and reduces image size to ~180MB.

### Problem 4: Missing Database Readiness Health Check
- **Diagnosis**: The API container started simultaneously with Postgres, occasionally crashing because PostgreSQL was initializing its cluster files and not yet accepting connections.
- **Solution**: Configured a Docker health check in `docker-compose.yml` using `pg_isready -U ${DB_USERNAME:-postgres} -d ${DB_DATABASE:-ella}` with `condition: service_healthy` on the API service.

---

## 4. Standard Deployment Procedure

### 4.1 Local / Staging Deployment (Docker Compose)

```bash
# 1. Clone repository
git clone https://github.com/ellatech-eth/QA-Assessment.git
cd QA-Assessment

# 2. Setup environment variables
cp .env.example .env

# 3. Build and launch the complete stack (Postgres + NestJS API)
docker compose up -d --build

# 4. Follow application container logs
docker compose logs -f api

# 5. Verify service health
curl -f http://localhost:4000/health
```

### 4.2 Production Cloud Deployment (AWS ECS Fargate)

1. **Tag and Push Image**:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY
   docker build -t $ECR_REGISTRY/ella-api:$COMMIT_SHA .
   docker push $ECR_REGISTRY/ella-api:$COMMIT_SHA
   ```
2. **Execute Database Migrations**:
   Run a one-off ECS migration task before updating the web service:
   ```bash
   aws ecs run-task --cluster ella-production --task-definition ella-migration-task
   ```
3. **Deploy New Service Revision**:
   ```bash
   aws ecs update-service --cluster ella-production --service ella-api-service \
     --task-definition ella-api:$NEW_REVISION --force-new-deployment
   ```
4. **Monitor Rolling Update**:
   AWS ECS drains old tasks only after new tasks pass their ALB `/health` checks.

---

## 5. Verification & Health Check Testing

Execute the following post-deployment smoke tests:

```bash
# 1. Basic Health Endpoint (Status, Uptime, Timestamp)
curl -i http://localhost:4000/health
# Expected: HTTP/1.1 200 OK {"status":"ok","service":"ella-api",...}

# 2. Verify Root Gateway
curl -i http://localhost:4000/
# Expected: HTTP/1.1 200 OK "Hello World!"

# 3. Swagger UI Verification
curl -I http://localhost:4000/api
# Expected: HTTP/1.1 200 OK
```

---

## 6. Rollback Procedures

### 6.1 Fast Application Rollback (Zero-Downtime)
If the new release exhibits elevated error rates or memory leaks:

1. **In AWS ECS**:
   Revert the ECS service to the previous known good task definition:
   ```bash
   aws ecs update-service --cluster ella-production --service ella-api-service \
     --task-definition ella-api:$PREVIOUS_GOOD_REVISION
   ```
2. **In Docker Compose**:
   ```bash
   docker compose down
   git checkout $PREVIOUS_RELEASE_TAG
   docker compose up -d --build
   ```

### 6.2 Database Migration Rollback
If the deployment failed due to an incompatible schema migration:
```bash
# Execute TypeORM down migration
npm run migration:revert
```

---

## 7. Common Failures, Diagnostics & Triage Runbook

### Incident 1: Database Connection Refused (`connect ECONNREFUSED 5432`)
- **Symptoms**: API container crashes immediately or logs `AggregateError: connect ECONNREFUSED`.
- **Root Cause**: PostgreSQL is either stopped, still initializing, or not binding to `5432`.
- **Diagnostic Commands**:
  ```bash
  docker compose ps
  docker compose logs db
  ```
- **Remediation**:
  Ensure DB healthcheck passes:
  ```bash
  docker compose exec db pg_isready -U postgres -d ella
  ```
  If running locally without Docker Compose, check that `DB_HOST=localhost` in `.env`. Inside Docker Compose, ensure `DB_HOST=db`.

---

### Incident 2: Port Collision (`EADDRINUSE: address already in use :::4000`)
- **Symptoms**: `Error: listen EADDRINUSE: address already in use :::4000`.
- **Root Cause**: Another application or orphaned node process is already bound to port 4000.
- **Diagnostic Commands (Windows / Linux)**:
  ```powershell
  # Windows:
  Get-NetTCPConnection -LocalPort 4000 | Select-Object OwningProcess
  Stop-Process -Id <PID> -Force
  ```
  ```bash
  # Linux:
  lsof -i :4000
  kill -9 <PID>
  ```
- **Remediation**: Change `PORT=4001` in `.env` or terminate the conflicting process.

---

### Incident 3: Container Killed due to Out of Memory (OOM 137)
- **Symptoms**: Container exits with code `137`.
- **Diagnostic Commands**:
  ```bash
  docker inspect <container_id> --format='{{.State.OOMKilled}}'
  ```
- **Remediation**: Increase container memory limit in `docker-compose.yml` or AWS ECS task definition from 512MB to 1024MB. Check for unindexed `findAll` relation queries causing memory spikes.

---

## 8. Cloud Deployment Plan: AWS Architecture (DevOps Task 6)

For deploying this containerized application to AWS, we adopt a modern, scalable, serverless container architecture:

```mermaid
flowchart TD
    subgraph VPC [Amazon VPC 10.0.0.0/16]
        subgraph PublicSubnets [Public Subnets (us-east-1a / 1b)]
            ALB[Application Load Balancer<br/>HTTPS:443]
            NAT[NAT Gateways]
        end
        subgraph PrivateSubnets [Private App Subnets]
            ECS1[ECS Fargate Task 1]
            ECS2[ECS Fargate Task 2]
        end
        subgraph DataSubnets [Isolated Data Subnets]
            RDSPrimary[(Amazon RDS PostgreSQL<br/>Primary)]
            RDSStandby[(Amazon RDS PostgreSQL<br/>Standby Multi-AZ)]
        end
    end

    Route53[Amazon Route 53] --> ALB
    ALB --> ECS1
    ALB --> ECS2
    ECS1 --> RDSPrimary
    ECS2 --> RDSPrimary
    RDSPrimary -. Synchronous Replication .-> RDSStandby
```

### 8.1 Architecture Components

1. **Virtual Private Cloud (VPC)**:
   - Configured across two Availability Zones for high availability.
   - Public subnets host the Application Load Balancer and NAT Gateways.
   - Private subnets host the containerized application (no direct public IP).
   - Isolated data subnets host the database cluster.

2. **Compute: AWS ECS with Fargate**:
   - Serverless container orchestration: no EC2 virtual machines to patch or maintain.
   - Auto-scaling policies based on CPU utilization (> 70%) and request count per target (> 1000 requests/minute).
   - High availability: Tasks spread evenly across multiple availability zones.

3. **Database: Amazon RDS PostgreSQL (Multi-AZ)**:
   - Managed PostgreSQL 16 engine with automated backups, point-in-time recovery, and read replicas.
   - Multi-AZ synchronous replication ensures automatic failover in < 60 seconds without data loss.

4. **Security & Secrets**:
   - **AWS Secrets Manager**: Stores DB passwords; injected directly into ECS tasks via IAM role permissions.
   - **AWS Certificate Manager (ACM)**: Manages TLS certificates for SSL termination on the load balancer.
   - **Security Groups**: Principle of least privilege — RDS only accepts incoming connections on port 5432 originating from the ECS Security Group.

5. **CI/CD Integration**:
   - GitHub Actions connects to AWS via OpenID Connect (OIDC).
   - Pushes built Docker images to **Amazon ECR**.
   - Triggers an ECS rolling service update with automated rollback.

