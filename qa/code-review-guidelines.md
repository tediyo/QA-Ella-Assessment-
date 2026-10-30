# Code Review & Mentorship Guidelines: Automated Test Engineering

This guide outlines our team's engineering standards, architectural principles, and mentorship practices when reviewing automated test code submitted by junior QA and software engineers.

---

## 1. Mentorship Philosophy & Review Culture

Code reviews are **learning conversations**, not administrative gates. Our goals when reviewing test code are to:
- **Build Autonomous Engineers**: Explain the *why* behind design patterns rather than simply commanding changes.
- **Praise Good Solutions**: Acknowledge clean abstractions, thorough edge-case coverage, and clear test naming.
- **Encourage Psychological Safety**: Frame comments around the code, not the person (e.g. *"This query might cause a race condition"* instead of *"You forgot to handle race conditions"*).
- **Distinguish Requirements from Suggestions**: Use clear prefixes such as `[Nit]`, `[Question]`, `[Suggestion]`, or `[Blocker]`.

---

## 2. Core Review Checklist for Automated Test Code

### 2.1 Test Independence & Isolation
- [ ] **No Sequential Dependency**: Tests must execute in any arbitrary order. Test B must never rely on data created by Test A.
- [ ] **Dynamic Fixtures**: Prohibit static, hardcoded credentials or emails (`test@test.com`, `admin123`). Enforce dynamic generators (`DataFactory.createUniqueUser()`).
- [ ] **Self-Contained Teardown**: Resources created during tests must either be isolated via ephemeral databases or cleaned up after execution.

### 2.2 Test Structure & Readability (AAA Pattern)
- [ ] **Arrange-Act-Assert**: Code blocks should clearly delineate setup, action, and validation.
- [ ] **Self-Documenting Titles**: Test descriptions should state the condition and expected outcome (e.g. `should return 409 Conflict when creating user with existing email` rather than `test user 2`).
- [ ] **Single Conceptual Assertion**: Each test should verify one logical behavior. Avoid 50-line test cases that test five different features sequentially.

### 2.3 Assertion Quality & Depth
- [ ] **Avoid Shallow Assertions**: Reject tests that only check `res.status === 200` without validating the returned data schema or values.
- [ ] **Avoid Loose Matchers**: Discourage `expect(res.body).toBeTruthy()`. Demand exact structural comparisons (`toMatchObject`, `toHaveProperty`).
- [ ] **Boundary & Negative Coverage**: Ensure negative paths (400 validation, 404 not found, 409 conflict, boundary integers 0 and -1) are covered alongside happy paths.

### 2.4 Reliability & Flakiness Prevention
- [ ] **No Hardcoded Sleeps**: Prohibit arbitrary `sleep(3000)` calls. Enforce polling with timeouts or event-driven waits.
- [ ] **Network & Concurrency Resilience**: Handle potential latency and retry policies gracefully.

### 2.5 Architecture & Maintainability
- [ ] **Client / Page Object Pattern**: Direct HTTP calls (`fetch`, raw `axios`) must not be written inside test specs. They must be encapsulated in dedicated API client classes.
- [ ] **DRY without Obfuscation**: Abstract boilerplate setup into fixtures, but keep the test itself readable without requiring the reviewer to jump through 10 helper functions.

---

## 3. Mock Pull Request Review

**Pull Request Title:** `feat(qa): Add automated test suite for Transactions module`  
**Author:** Junior QA Engineer  
**Reviewer:** Senior QA / DevOps Lead  

---

### File Diff & Review Comments

#### File: `qa/tests/transaction-checkout.spec.ts`

```typescript
@@ -0,0 +1,38 @@
+ import request from 'supertest';
+
+ describe('Checkout Test', () => {
+   it('works', async () => {
+     // create transaction
+     const res = await request('http://localhost:4000')
+       .post('/transactions')
+       .send({
+         userId: 1,
+         productId: 2,
+         quantity: 1
+       });
+
+     await new Promise(r => setTimeout(r, 2000));
+
+     expect(res.status).toBe(201);
+     expect(res.body).toBeTruthy();
+   });
+ });
```

---

### Inline Reviewer Comments

> **Line 3:** `describe('Checkout Test', () => {`  
> **Line 4:** `it('works', async () => {`  
> **Comment `[Suggestion - Readability]`:**  
> *"Great initiative setting up this checkout test! To make test reports informative when running in CI, let's follow the Behavior-Driven naming pattern here:*  
> ```typescript
> describe('Transactions API - Checkout Flow', () => {
>   it('should successfully create an order and record transaction when stock is available', async () => {
> ```  
> *This way, if the test fails in our GitHub Actions pipeline, the team immediately knows what business feature broke without digging into the source code."*

---

> **Line 5:** `const res = await request('http://localhost:4000')`  
> **Comment `[Blocker - Architecture & Environment Agnostic]`:**  
> *"Hardcoding `'http://localhost:4000'` prevents this test from running in our CI runner or staging environment. Let's utilize our `TransactionsApiClient` class:*  
> ```typescript
> const transactionsClient = new TransactionsApiClient();
> const res = await transactionsClient.createTransaction(payload);
> ```  
> *This automatically pulls the base URL from the `API_BASE_URL` environment variable and ensures standard JSON headers are injected consistently across all tests."*

---

> **Line 8-11:** `userId: 1, productId: 2, quantity: 1`  
> **Comment `[Blocker - Test Independence & Flakiness]`:**  
> *"Using hardcoded IDs like `userId: 1` and `productId: 2` assumes that these records already exist in the database with sufficient stock. If another test runs beforehand and deletes user 1 or drains product 2's stock, this test will fail intermittently (a flaky test).*  
>  
> *Let's use our `DataFactory` to create dedicated test fixtures inside the test or `beforeAll`:*  
> ```typescript
> const user = await usersClient.createUser(DataFactory.createUniqueUser());
> const product = await productsClient.createProduct(DataFactory.createUniqueProduct({ quantity: 5 }));
> const payload = DataFactory.createTransactionPayload(user.body.data.id, product.body.data.id, 1);
> ```  
> *This guarantees full test independence regardless of the order or state of the database."*

---

> **Line 14:** `await new Promise(r => setTimeout(r, 2000));`  
> **Comment `[Nit - Performance & Flakiness]`:**  
> *"Is there a specific asynchronous worker running in the background here? Because `POST /transactions` is a synchronous HTTP call that resolves once saved, this 2-second sleep simply slows down our CI build pipeline without adding value. Let's remove this sleep."*

---

> **Line 16-17:**  
> `expect(res.status).toBe(201);`  
> `expect(res.body).toBeTruthy();`  
> **Comment `[Important - Assertion Precision]`:**  
> *"`expect(res.body).toBeTruthy()` will pass even if the API returns `{ error: 'Something went wrong' }`. Let's assert the specific response schema and values to verify that the transaction was recorded accurately:*  
> ```typescript
> expect(res.status).toBe(201);
> expect(res.body.statusCode).toBe(201);
> expect(res.body.data).toMatchObject({
>   quantity: 1,
>   user: expect.objectContaining({ id: user.body.data.id }),
>   product: expect.objectContaining({ id: product.body.data.id })
> });
> ```  
> *Notice how asserting the relationship IDs validates that our foreign keys are mapped correctly."*

---

### Reviewer Summary & Sign-off

> *"Thanks for this initial PR! The core test flow is solid. Once we refactor the test to use the `TransactionsApiClient` and dynamically provision the test user and product with `DataFactory`, this will be a high-quality, rock-solid addition to our test suite. Happy to hop on a quick screen share if you'd like to walk through the client setup together!"*

