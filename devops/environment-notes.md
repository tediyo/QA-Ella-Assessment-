# Environment Configuration & Secret Management Guide: Ella API

This document provides a comprehensive operational breakdown of configuration parameters and environment strategies across **Development**, **Testing / CI**, **Staging**, and **Production**.

---

## 1. Environment Variable Reference Guide

Based on `.env.example`, the following variables control the application runtime:

| Variable | Type | Default (Local) | Purpose | Sensitive? |
|---|---|---|---|---|
| `PORT` | Integer | `4000` | HTTP port on which NestJS listens | No |
| `NODE_ENV` | String | `development` | Runtime environment (`development`, `test`, `staging`, `production`) | No |
| `DB_HOST` | String | `localhost` / `db` | Hostname or IP of the PostgreSQL database instance | No |
| `DB_PORT` | Integer | `5432` | Port for PostgreSQL service | No |
| `DB_USERNAME` | String | `postgres` | Database authentication username | Yes (in Prod) |
| `DB_PASSWORD` | String | `postgres` | Database authentication password | **CRITICAL** |
| `DB_DATABASE` | String | `ella` | Target database catalog name | No |
| `DB_SSL` | Boolean | `false` | Enforce SSL/TLS encrypted database connection | No |
| `LOG_LEVEL` | String | `debug` | Log verbosity (`debug`, `info`, `warn`, `error`) | No |
| `CORS_ORIGINS`| String | `*` | Allowed CORS origins (comma-delimited) | No |

---

## 2. Environment Comparison Matrix

| Configuration Dimension | Development (Local) | Testing / CI Runner | Staging Environment | Production Environment |
|---|---|---|---|---|
| **`NODE_ENV`** | `development` | `test` | `staging` | `production` |
| **`PORT`** | `4000` | `4001` (or dynamic) | `4000` | `4000` (behind ALB/443) |
| **`DB_HOST`** | `localhost` or `db` | `localhost` / `postgres` service | Managed RDS instance (Single-AZ) | Managed RDS Aurora (Multi-AZ Cluster) |
| **`DB_SSL`** | `false` | `false` | `true` (Require CA cert) | `true` (Strict CA verification) |
| **Connection Pool** | `max: 5` | `max: 10` | `max: 20` | `max: 50` (Tuned to instance memory) |
| **Schema Strategy** | `synchronize: false`<br/>`migrationsRun: true` | `synchronize: false`<br/>Automated fresh migrations | `migrationsRun: true`<br/>Automated migration job | `synchronize: false`<br/>Pre-deploy manual migration gate |
| **Logging** | Human-readable pretty logs (`debug`) | Silent or minimal error logs | JSON structured logs (`info`) | JSON structured logs (`warn`, `error`) |
| **Error Handling** | Detailed stack traces returned in HTTP 500 | Stack traces in test output | Sanitized error messages | Sanitized error messages, zero stack exposure |
| **Swagger UI (`/api`)**| **Enabled** | Disabled | **Enabled** (Behind VPN/Auth) | **Disabled** (Security hardening) |

---

## 3. Detailed Technical Analysis of Environment Differences

### 3.1 Database Management: Migrations vs Synchronization
- **Development & Testing**:
  - `synchronize: false` is strictly enforced to match production behavior.
  - Migrations are generated via `npm run migration:generate` and executed automatically via `migrationsRun: true` or `npm run migration:run`.
- **Production**:
  - **Never use `synchronize: true` in production**, as TypeORM can drop tables or columns if an entity definition differs slightly.
  - Production migrations are executed as a separate, pre-deployment container task (e.g. ECS RunTask or Kubernetes Job) *before* traffic is shifted to new application containers.

### 3.2 Security & SSL/TLS Encryption
- **Development**: Plaintext TCP connections between app and local Docker database are permissible for performance and debugging convenience.
- **Production & Staging**: Database connections **must enforce TLS 1.3** (`ssl: { rejectUnauthorized: true }`). Communication between services passes through an encrypted VPC mesh or AWS PrivateLink.

### 3.3 Connection Pooling Optimization
- Default TypeORM pools without explicit limits can saturate database connection thresholds (`max_connections = 100`).
- **Production Settings**:
  ```typescript
  extra: {
    max: 30, // maximum connection pool size per container replica
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  }
  ```

---

## 4. Production Secret Management Best Practices

1. **Never Commit `.env` Files**:
   - `.env` must remain in `.gitignore`.
   - Docker images must **never** bundle `.env` files into build layers.
2. **Dynamic Secret Injection via Cloud Secret Stores**:
   - In AWS ECS / Kubernetes, secrets are stored in **AWS Secrets Manager** or **HashiCorp Vault**.
   - The orchestration platform injects these secrets securely into container environment variables at runtime:
   ```json
   "secrets": [
     {
       "name": "DB_PASSWORD",
       "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:ella/db/password"
     }
   ]
   ```
3. **Automated Secret Rotation**:
   - Production database credentials must be configured for automated 60-day rotation via AWS Secrets Manager Lambda rotators without service disruption.

