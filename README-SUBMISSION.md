# Ella API — QA & DevOps Assessment Submission

**Candidate Assessment Submission**  
**Role:** QA / DevOps Engineer  
**Target Repository:** [https://github.com/ellatech-eth/QA-Assessment](https://github.com/ellatech-eth/QA-Assessment)  
**Date:** October 2026  

---

## 🌟 Executive Summary

This submission delivers a complete, production-ready QA engineering and DevOps implementation for the Ella E-Commerce Backend API (`Users`, `Products`, and `Transactions`). 

Both the **Quality Assurance** track and **DevOps** track have been fully completed with deep technical rigor, automated test suites, container orchestration troubleshooting, infrastructure runbooks, and CI/CD pipelines.

---

## 📁 Repository Submission Structure

```
.
├── .github/
│   └── workflows/
│       └── ci.yml                   # Complete GitHub Actions CI/CD Pipeline
├── devops/
│   ├── ci-notes.md                  # CI architecture, quality gates & CD extension notes
│   ├── environment-notes.md         # Dev/Staging/Test/Prod matrix & secret management
│   └── deployment-runbook.md        # Confluence-style deployment, rollback & cloud plan
├── qa/
│   ├── test-strategy.md             # Comprehensive 1-2 page Quality Assurance Strategy
│   ├── BUGS.md                      # Professional bug reports catalog (12 deep defects)
│   ├── performance-test.js          # k6 load testing script & bottleneck analysis
│   ├── code-review-guidelines.md    # Junior mentorship standards & mock PR review
│   ├── reporters/
│   │   └── html-reporter.js         # Custom Zero-Dependency Interactive HTML Test Reporter
│   ├── postman/
│   │   └── ella-api.postman_collection.json # Exported Postman collection (happy/error paths)
│   ├── playwright/                  # Playwright API Testing Suite (@playwright/test)
│   │   ├── playwright.config.ts     # Playwright configuration (baseURL, retries, reporting)
│   │   ├── README.md                # Playwright execution instructions
│   │   └── tests/
│   │       ├── e2e-user-flow.spec.ts # Critical E2E purchase flow using Playwright API
│   │       ├── users.spec.ts        # Users endpoint Playwright tests
│   │       ├── products.spec.ts     # Products endpoint Playwright tests
│   │       └── transactions.spec.ts # Transactions endpoint Playwright tests
│   └── automation-framework/        # Production-grade API Automation Test Framework (Supertest + Jest)
│       ├── architecture-view.md     # Architecture specification & sequence diagrams
│       ├── jest.config.js           # Runner configuration
│       ├── package.json             # Framework script definition
│       ├── tsconfig.json            # Framework TypeScript config
│       ├── README.md                # Framework execution guide
│       ├── src/
│       │   ├── api-clients/         # Client Object Model (Base, Users, Products, Transactions)
│       │   ├── config/              # Dynamic environment configuration
│       │   └── fixtures/            # Collision-free dynamic Data Factory
│       └── tests/                   # Automated API Test Suites
│           ├── e2e-user-flow.spec.ts    # End-to-End User -> Product -> Purchase Flow
│           ├── users.api.spec.ts        # Users endpoint validation & negative tests
│           ├── products.api.spec.ts     # Products endpoint inventory tests
│           └── transactions.api.spec.ts # Order placement & stock validation tests
├── src/
│   ├── app.controller.ts            # Added GET /health endpoint
│   ├── app.service.ts               # Health check status provider
│   ├── migrations/
│   │   └── 1700000000000-InitialMigration.ts # Automated schema migration
│   └── (Unit tests across all services: users, products, transactions)
├── docker-compose.yml               # Fixed multi-container production Compose
├── docker-compose.dev.yml           # Fixed local database Compose
├── Dockerfile                       # Hardened multi-stage Dockerfile (non-root, health check)
└── README-SUBMISSION.md             # This document
```

---

## 🛠️ Summary of Accomplishments

### Track A: Quality Assurance

1. **Test Strategy & Planning (`qa/test-strategy.md`)**:
   - Comprehensive test strategy defining the testing pyramid (Unit, API, E2E, Load, Security).
   - Tooling justification (Jest, Supertest, k6, GitHub Actions, Docker).
   - Environment strategy (ephemeral test DBs, staging isolation, collision-free data factories).
   - Deployment risk mitigation (canary rollouts, zero-downtime database migrations, health check gates).

2. **Automated API Testing Framework (`qa/automation-framework/`)**:
   - Architected using the **API Client Object Pattern** with TypeScript, Supertest, and Jest.
   - Built a dynamic `DataFactory` guaranteeing collision-free entities across parallel test runs.
   - Implemented the critical End-to-End user flow (`e2e-user-flow.spec.ts`):
     $$\text{User Registration} \longrightarrow \text{Product Catalog Browsing} \longrightarrow \text{Order Placement} \longrightarrow \text{Stock Verification}$$
   - Modular functional and boundary suites for Users, Products, and Transactions.

3. **Exploratory Testing & Bug Reporting (`qa/BUGS.md`)**:
   - Identified and documented **12 deep technical, logical, architectural, and build defects**:
     - **BUG-001 (Blocker)**: `TransactionsService.create` increments stock instead of decrementing (`+=` instead of `-=`).
     - **BUG-002 (Critical)**: `ProductsService.update` overwrites `product.price` with `dto.quantity`.
     - **BUG-003 (Critical)**: `UsersService.create` returns fake `201 Created` with `id: 0` on duplicate email instead of `409 Conflict`.
     - **BUG-004 (Blocker)**: TypeScript error `TS2352` breaks compilation (`npm run build`) out of the box.
     - **BUG-005 (Critical)**: Missing row locks / database transactions cause race conditions and overselling.
     - **BUG-006 (High)**: Transactions ignore `OUT_OF_STOCK` product status.
     - **BUG-007 (Medium)**: Missing `@IsEmail()` validation in `CreateUserDto`.
     - **BUG-008 (Medium)**: Missing `@Min(0)` on `price` allows negative prices.
     - **BUG-009 (Medium)**: Update controllers bind to `CreateDto` instead of `UpdateDto`.
     - **BUG-010 (High)**: Lack of atomicity in transaction creation (no rollback if product save fails).
     - **BUG-011 (Blocker)**: Docker build fails on clean clone due to hardcoded `COPY .env ./`.
     - **BUG-012 (High)**: `package.json` `"start:prod"` points to `dist/main` instead of `dist/src/main`.

4. **Performance & Load Testing (`qa/performance-test.js`)**:
   - High-throughput k6 script simulating realistic browse-to-buy ratios (70% catalog reads, 30% order creation).
   - Thresholds enforcing $p95 < 250\text{ ms}$, $p99 < 500\text{ ms}$, error rate $< 1\%$.
   - Baseline analysis documenting database connection pool bottlenecks, TypeORM relation loading overhead, and Redis caching recommendations.

5. **Code Review & Mentorship (`qa/code-review-guidelines.md`)**:
   - Engineering standards checklist (AAA pattern, test independence, flakiness prevention, precise assertions).
   - Realistic mock pull request review demonstrating empathetic, constructive coaching for junior QA engineers.

6. **Postman API Collection (`qa/postman/`)**:
   - Ready-to-import Postman collection covering happy paths, validation errors (400), not found errors (404), and conflict errors (409).

7. **Automated Interactive HTML Test Reports (`reports/*.html`)**:
   - Custom, zero-dependency reporter (`qa/reporters/html-reporter.js`) automatically generated on every test run.
   - Features: Coloured SVG Donut/Pie charts (Pass/Fail/Skip), response time latency histograms, KPI cards (Pass rate %, Avg latency, Total runtime), and real-time search/filtering.
   - Automatically archived as a workflow artifact in GitHub Actions CI.

---

### Track B: DevOps

1. **CI/CD Pipeline (`.github/workflows/ci.yml` & `devops/ci-notes.md`)**:
   - Full GitHub Actions workflow executing on every push and pull request.
   - Runs linting (`npm run lint`), build compilation (`npm run build`), unit tests with coverage (`npm test`), and container build verification.
   - Fail-fast design with artifact upload and continuous deployment (CD) extension documentation.

2. **Containerization & Build Troubleshooting (`devops/deployment-runbook.md` & Docker files)**:
   - Diagnosed and fixed the clean-clone build failure caused by `COPY .env ./`.
   - Replaced bloated single-stage build with an optimized multi-stage build running as non-root `USER node` (~180MB image size).
   - Added container health checks and synchronized startup with PostgreSQL `service_healthy` conditions.

3. **Automated Schema Migrations (`src/migrations/1700000000000-InitialMigration.ts`)**:
   - Created the baseline database schema migration.
   - Configured `migrationsRun: true` in `app.module.ts` so the database schema initializes automatically upon container startup.

4. **Health Check Endpoint (`GET /health`)**:
   - Added production health check endpoint in `src/app.controller.ts` providing status, service name, timestamp, and uptime.

5. **Environment Configuration Notes (`devops/environment-notes.md`)**:
   - Full documentation of all environment variables.
   - Detailed comparison matrix across Development, Testing/CI, Staging, and Production (SSL, pooling, logging, error handling, secret stores).

6. **Deployment Runbook & Cloud Architecture (`devops/deployment-runbook.md`)**:
   - Confluence-style operational runbook covering build, deployment, zero-downtime rollback, and triage for 5 common incidents.
   - Cloud deployment plan detailing serverless container deployment on **AWS ECS Fargate** with **Amazon RDS PostgreSQL** (Multi-AZ), Application Load Balancers, and AWS Secrets Manager.

---

## 🚀 How to Run the Project & Tests

### 1. Run Unit Tests (Jest)
```bash
# Run all unit tests across Users, Products, and Transactions (27 tests passing)
npm test

# Run with test coverage report
npm test -- --coverage
```

### 2. Run Linting and Build
```bash
# Verify static analysis
npm run lint

# Compile production TypeScript build
npm run build
```

### 3. Run the Automated API Testing Framework
Ensure the backend is running (`npm run start:dev` or Docker), then:
```bash
# Option A: Run Supertest + Jest API Automation Framework
npm run test:api

# Run specifically the critical E2E user purchase flow (Supertest)
npx jest --config qa/automation-framework/jest.config.js tests/e2e-user-flow.spec.ts

# Option B: Run Playwright API Testing Suite
npm run test:playwright
# or directly:
npx playwright test --config qa/playwright/playwright.config.ts
```

### 4. Run the Full Stack with Docker
```bash
# Launch database and API
docker compose up -d --build

# Verify container health
curl -f http://localhost:4000/health
```

### 5. Run Performance Tests (k6)
```bash
k6 run qa/performance-test.js
```

---

## 🔍 Assumptions & Suggested Next Steps

1. **Database Locking**: Future releases should implement pessimistic write locks (`SELECT ... FOR UPDATE`) in `TransactionsService.create` to eliminate race conditions during high-concurrency flash sales.
2. **Caching**: Integrate Redis for `GET /products` and `GET /products/:id` with TTL-based expiration and event-driven invalidation upon catalog updates.
3. **Pagination**: Implement pagination (`limit` / `offset` or cursor tokens) for all `findAll` endpoints to avoid unbounded database relation loads as transaction volume grows.

