# Ella API Automation Framework

A production-grade, modular API Test Automation Framework designed for the Ella E-Commerce Backend API (`Users`, `Products`, and `Transactions`).

---

## 🏛️ Architecture Overview

The framework employs the **API Client Object Pattern** (analogous to the Page Object Model in Web UI automation) to decouple HTTP protocol and endpoint details from test assertions and business scenarios.

```
qa/automation-framework/
├── jest.config.js               # Jest execution runner config
├── package.json                 # Standalone script definition
├── tsconfig.json                # TypeScript compiler config
├── src/
│   ├── api-clients/             # Dedicated API Client Wrappers
│   │   ├── BaseApiClient.ts     # HTTP wrapper with Supertest, header injection
│   │   ├── UsersApiClient.ts    # /users operations (CRUD)
│   │   ├── ProductsApiClient.ts # /products operations (CRUD)
│   │   ├── TransactionsApiClient.ts # /transactions operations
│   │   ├── HealthApiClient.ts   # /health operational probes
│   │   └── index.ts             # Barrel export
│   ├── config/
│   │   └── test-config.ts       # Dynamic environment configuration
│   └── fixtures/
│       └── data-factory.ts      # Collision-free, randomized test data generator
└── tests/                       # Automated Test Suites
    ├── e2e-user-flow.spec.ts    # Critical User Flow (User -> Product -> Purchase)
    ├── users.api.spec.ts        # Users endpoint validation & negative suites
    ├── products.api.spec.ts     # Products endpoint inventory & pricing suites
    └── transactions.api.spec.ts # Order placement & stock validation suites
```

---

## 🚀 Key Features

1. **Layered Abstraction**: Test suites contain only business assertions. HTTP mechanics (headers, JSON serialization, URL building) are encapsulated in client classes.
2. **Data Isolation (Data Factory)**: Dynamically generates collision-free test data using timestamps and atomic counters, avoiding race conditions and database constraint failures during concurrent test runs.
3. **Multi-Environment Support**: Configurable via `API_BASE_URL` environment variable to test against local development (`http://localhost:4000`), ephemeral pull-request environments, or staging.
4. **Resilient Assertions**: Full schema, status code, and business payload validation using Jest and Supertest.

---

## 💻 Execution Instructions

### Prerequisites
1. Node.js (v20+ recommended)
2. Ensure the Ella API backend is running (`npm run start:dev` or `docker compose up -d`)

### Running the Tests

From the repository root:

```bash
# Run the complete API test automation suite
npm run test:api

# Run specifically the critical E2E user flow
npx jest --config qa/automation-framework/jest.config.js tests/e2e-user-flow.spec.ts

# Run tests against a custom environment
API_BASE_URL=https://staging.api.ella.internal npm run test:api
```

