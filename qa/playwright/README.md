# Playwright API Testing Suite: Ella API

This folder contains an automated API testing suite built with **Playwright Test** (`@playwright/test`), utilizing Playwright's native `APIRequestContext` for high-performance HTTP testing against the Ella E-Commerce Backend.

---

## 📁 Structure

```
qa/playwright/
├── playwright.config.ts           # Playwright runner configuration (baseURL, headers, retries)
├── README.md                      # Execution guide
└── tests/
    ├── e2e-user-flow.spec.ts      # Critical End-to-End User Flow (Register -> Browse -> Buy)
    ├── users.spec.ts              # Users module functional & validation tests
    ├── products.spec.ts           # Products module inventory & price tests
    └── transactions.spec.ts       # Order placement & stock boundary tests
```

---

## 🚀 Execution Instructions

### Prerequisites
1. Ensure the Ella API is running locally:
   ```bash
   npm run start:dev
   # or with docker:
   docker compose up -d
   ```
2. Install `@playwright/test` (if not already installed):
   ```bash
   npm install -D @playwright/test
   ```

### Running the Playwright Tests

```bash
# Run all Playwright API test suites
npx playwright test --config qa/playwright/playwright.config.ts

# Run specifically the critical E2E user purchase flow
npx playwright test qa/playwright/tests/e2e-user-flow.spec.ts --config qa/playwright/playwright.config.ts

# Run tests against a custom environment
API_BASE_URL=https://staging.api.ella.internal npx playwright test --config qa/playwright/playwright.config.ts

# View HTML Test Report
npx playwright show-report playwright-report
```

