# Ella API — QA / DevOps Intern Assessment

This repository contains a NestJS API used to assess **QA / DevOps Intern** candidates. It
simulates an e-commerce backend with **Users**, **Products**, and **Transactions** modules.

The assessment has two tracks that mirror the role: a **Quality Assurance** track and a
**DevOps** track. Please attempt **both**. We're more interested in how you think, how you
document your work, and your attention to detail than in how many items you finish.

> **Time-box:** aim for roughly 1–2 days. If you run out of time, prioritise depth over
> breadth and write down what you *would* have done next.

---

## Track A — Quality Assurance

1. **Exploratory & functional testing**
   Explore the API and hunt for bugs. The system contains several defects that behave
   incorrectly. For each bug, log a clear report containing: a title, severity, steps to
   reproduce, expected vs. actual result, and (where possible) the endpoint/payload used.
   A `BUGS.md` file or a Jira-style export is fine.

2. **Test cases from acceptance criteria**
   Pick **one** module (Users, Products, or Transactions) and write manual test cases
   derived from its expected behaviour (positive, negative, and edge cases).

3. **Unit tests**
   Write automated unit tests for **one** module to verify its logic. Run with `npm test`.

4. **API testing (Postman)**
   Create a Postman collection that exercises the endpoints (happy paths + validation /
   error cases). Export it and include it in your submission.

5. **Performance testing (k6)** *(nice to have)*
   Write a k6 script to load-test one endpoint and summarise the results.

---

## Track B — DevOps

1. **CI/CD pipeline**
   Add a CI pipeline (GitHub Actions is preferred — `.github/workflows/ci.yml`) that, on
   every push and pull request, installs dependencies, runs the linter, builds the project,
   and runs the unit tests. The pipeline should **fail** when any step fails. Include a
   short note on how you'd extend it toward continuous **deployment**.

2. **Containerization & build troubleshooting**
   Bring the full stack up with Docker (`docker compose up -d --build`). Review the
   `Dockerfile`, `docker-compose.yml`, and `docker-compose.dev.yml`. Document any problems
   you hit getting a clean build/run, how you diagnosed them, and how you fixed them.

3. **Environment configuration**
   Using `.env.example` as a starting point, document the environment variables required
   for the **development**, **staging**, and **testing** environments, and explain what
   changes between them.

4. **Health checks & monitoring** *(nice to have)*
   Add a simple health-check endpoint (e.g. `GET /health`) **or** describe how you would
   monitor this service's application logs and basic system health in a running environment.

5. **Deployment runbook**
   Write a short runbook / troubleshooting guide (Markdown, Confluence-style) covering how
   to build, deploy, and roll back this service, plus common failures and their fixes.

6. **Cloud deployment plan** *(bonus)*
   Briefly describe, at a beginner level, how you would deploy this containerized app to a
   cloud platform of your choice (AWS, Azure, or GCP).

---

## Getting Started

### Prerequisites
- Node.js
- Docker & Docker Compose

### Installation & Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # then edit .env if needed
   ```

3. **Start the database (Docker)**
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

4. **Run migrations**
   Generate and run migrations to set up the database schema:
   ```bash
   npm run migration:generate
   npm run migration:run
   ```

5. **Start the application**
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:4000`.

## API Documentation

Once the application is running, you can access the Swagger documentation at:
- UI: http://localhost:4000/api
- JSON: http://localhost:4000/api-json

## Testing & Quality Assurance

- **Unit Tests**: `npm test` (Runs 27 Jest unit tests across Users, Products, and Transactions)
- **API Automation Framework**: `npm run test:api` (Runs automated Supertest + Jest API suites)
- **Playwright API Suite**: `npm run test:playwright` (Runs native Playwright API tests)
- **Performance Testing**: `k6 run qa/performance-test.js`

### 📊 Interactive HTML Test Reports (Auto-Generated on Every Run)

Running `npm test` or `npm run test:api` automatically generates an interactive HTML dashboard with colored pie charts, response time graphs, and KPI metrics.

- **Unit Test Report**: `reports/unit-test-report.html`
- **API Automation Report**: `reports/api-test-report.html`

#### How to View the Report:
- **Windows (PowerShell)**: `Start-Process "reports/unit-test-report.html"`
- **macOS**: `open reports/unit-test-report.html`
- **Linux**: `xdg-open reports/unit-test-report.html`
- **Or double-click** `reports/unit-test-report.html` in File Explorer.
- **GitHub Actions CI**: Available as a downloadable artifact (`html-test-report.zip`) under the workflow run summary.

## Deployment (Docker)

To build and run the entire stack (App + DB):

```bash
docker compose up -d --build
```

---

## Submission

Please submit a Git repository (or an archive) containing your work. A clear structure is
appreciated, for example:

```
/qa       # BUGS.md, test cases, unit tests, Postman collection, k6 script
/devops   # CI workflow, runbook, environment notes, cloud plan
README-SUBMISSION.md   # short summary of what you did and how to run it
```

Include a brief summary of your findings, the decisions you made, and anything you'd
improve with more time.
