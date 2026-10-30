# Bug Report Catalog: Ella API

This document details deep technical, logical, architectural, and build defects identified during exploratory testing and code auditing of the Ella E-Commerce Backend API.

---

## Summary of Identified Defects

| Bug ID | Title | Module | Severity | Priority | Status |
|---|---|---|---|---|---|
| **BUG-001** | Inventory stock increases upon transaction purchase instead of decreasing | Transactions | **Blocker** | P0 | Fixed |
| **BUG-002** | Updating a product overwrites product price with quantity value | Products | **Critical** | P0 | Identified |
| **BUG-003** | Duplicate user registration returns 201 Created with mock data instead of 409 Conflict | Users | **Critical** | P0 | Fixed |
| **BUG-004** | TypeScript compilation error TS2352 breaks application build out-of-the-box | Users / Build | **Blocker** | P0 | Fixed |
| **BUG-005** | Missing database transaction / row lock causes race conditions and overselling | Transactions | **Critical** | P1 | Identified |
| **BUG-006** | Transactions do not verify `OUT_OF_STOCK` product status prior to purchase | Transactions | **High** | P1 | Identified |
| **BUG-007** | Missing `@IsEmail()` validation allows invalid email strings | Users | **Medium** | P2 | Identified |
| **BUG-008** | Missing `@Min(0)` on price allows products with negative or zero price | Products | **Medium** | P2 | Identified |
| **BUG-009** | Update endpoints bind to `CreateDto` instead of `UpdateDto` | Products / Users | **Medium** | P2 | Identified |
| **BUG-010** | Lack of atomicity: transaction record committed before product stock save | Transactions | **High** | P1 | Identified |
| **BUG-011** | Docker build fails on clean clone due to hardcoded `COPY .env ./` | DevOps / Docker | **Blocker** | P0 | Fixed |
| **BUG-012** | Production start script points to non-existent `dist/main` instead of `dist/src/main` | DevOps / Build | **High** | P1 | Fixed |

---

## Detailed Bug Reports

### BUG-001: Inventory stock increases upon transaction purchase instead of decreasing
- **Severity**: Blocker
- **Priority**: P0 (Immediate fix required)
- **Module**: `Transactions` (`src/transactions/transactions.service.ts`)
- **Endpoint**: `POST /transactions`

#### Description
When a customer purchases a product, the backend increases the inventory balance by the purchased quantity rather than decrementing it. For example, buying 2 units of an item with stock 10 results in stock 12 instead of 8.

#### Steps to Reproduce
1. Create a product with `quantity: 10`:
   ```http
   POST /products
   { "name": "Item A", "price": 20.0, "quantity": 10 }
   ```
2. Create a user:
   ```http
   POST /users
   { "name": "Buyer", "email": "buyer@example.com" }
   ```
3. Execute a transaction purchasing 2 units:
   ```http
   POST /transactions
   { "userId": 1, "productId": 1, "quantity": 2 }
   ```
4. Query the product balance:
   ```http
   GET /products/1
   ```

#### Actual Result
- Product quantity is reported as `12`.
- Status remains `FOR_SALE` indefinitely; inventory grows with sales.

#### Expected Result
- Product quantity should be decremented: `10 - 2 = 8`.
- If quantity reaches `0`, product status must transition to `OUT_OF_STOCK`.

#### Root Cause Analysis
In `src/transactions/transactions.service.ts` line 61:
```typescript
// Faulty implementation:
product.quantity += dto.quantity; // <-- Arithmetic inversion defect
if (product.quantity === 0) {
  product.status = ProductStatus.OUT_OF_STOCK;
}
await this.productRepository.save(product);
```

#### Remediation
Change `+=` to `-=`:
```typescript
product.quantity -= dto.quantity;
if (product.quantity === 0) {
  product.status = ProductStatus.OUT_OF_STOCK;
}
await this.productRepository.save(product);
```

---

### BUG-002: Updating a product overwrites product price with quantity value
- **Severity**: Critical
- **Priority**: P0
- **Module**: `Products` (`src/products/products.service.ts`)
- **Endpoint**: `PUT /products/:id`

#### Description
When updating product details, the `price` column is assigned the value of `dto.quantity` instead of `dto.price`. Any update payload alters the product's selling price to match its stock quantity.

#### Steps to Reproduce
1. Create a product with `price: 150.00` and `quantity: 5`:
   ```http
   POST /products
   { "name": "Mechanical Keyboard", "price": 150.00, "quantity": 5 }
   ```
2. Update the product name and quantity:
   ```http
   PUT /products/1
   { "name": "RGB Mechanical Keyboard", "price": 150.00, "quantity": 25 }
   ```
3. Fetch the product:
   ```http
   GET /products/1
   ```

#### Actual Result
```json
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "name": "RGB Mechanical Keyboard",
    "price": "25",
    "quantity": 25
  }
}
```
The price of $150.00 was overwritten to $25.00!

#### Root Cause Analysis
In `src/products/products.service.ts` line 111:
```typescript
product.name = dto.name ?? product.name;
product.price = dto.quantity ?? product.price; // <-- Copy-paste bug: dto.quantity used instead of dto.price
product.quantity = dto.quantity ?? product.quantity;
product.status = dto.status ?? product.status;
```

#### Remediation
```typescript
product.price = dto.price ?? product.price;
```

---

### BUG-003: Duplicate user registration returns 201 Created with mock data instead of 409 Conflict
- **Severity**: Critical
- **Priority**: P0
- **Module**: `Users` (`src/users/users.service.ts`)
- **Endpoint**: `POST /users`

#### Description
When registering a user with an email address that already exists in PostgreSQL, the unique constraint violation (`23505`) is intercepted by a custom catch block that responds with `201 Created` and fabricated data (`id: 0, transactions: []`).

#### Steps to Reproduce
1. Register a user with email `john@example.com`:
   ```http
   POST /users
   { "name": "John Doe", "email": "john@example.com" }
   ```
2. Re-send the exact same request:
   ```http
   POST /users
   { "name": "John Doe", "email": "john@example.com" }
   ```

#### Actual Result
- HTTP Status: `201 Created`
- Response Payload:
  ```json
  {
    "statusCode": 201,
    "message": "User created successfully",
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "id": 0,
      "transactions": []
    }
  }
  ```
The client believes a new record with `id: 0` was created.

#### Expected Result
- HTTP Status: `409 Conflict`
- Response Payload:
  ```json
  {
    "statusCode": 409,
    "message": "Email already exists",
    "error": "Conflict"
  }
  ```

#### Root Cause Analysis
In `src/users/users.service.ts` lines 31-40:
```typescript
if (
  error instanceof QueryFailedError &&
  (error as any).code === '23505'
) {
  return {
    statusCode: HttpStatus.CREATED,
    message: 'User created successfully',
    data: { ...dto, id: 0, transactions: [] } as User,
  };
}
```

#### Remediation
Throw a standard `ConflictException`:
```typescript
if (
  error instanceof QueryFailedError &&
  (error as any).code === '23505'
) {
  throw new ConflictException('Email already exists');
}
```

---

### BUG-004: TypeScript compilation error TS2352 breaks application build out-of-the-box
- **Severity**: Blocker
- **Priority**: P0
- **Module**: `Users / Build Toolchain` (`src/users/users.service.ts`)
- **Command**: `npm run build` / `docker build .`

#### Description
Running `npm run build` on a freshly cloned repository fails immediately with TypeScript error `TS2352`:
```
src/users/users.service.ts:38:17 - error TS2352: Conversion of type '{ id: number; transactions: never[]; name: string; email: string; }' to type 'User' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type '{ id: number; transactions: never[]; name: string; email: string; }' is missing the following properties from type 'User': createdAt, updatedAt

38           data: { ...dto, id: 0, transactions: [] } as User,
```

#### Impact
Prevents `npm run build`, `npm run start:prod`, and Docker container creation from succeeding.

#### Remediation
Resolved automatically when fixing BUG-003 by removing the dummy object cast and throwing `ConflictException`.

---

### BUG-005: Missing database transaction / row lock causes race conditions and overselling
- **Severity**: Critical
- **Priority**: P1
- **Module**: `Transactions` (`src/transactions/transactions.service.ts`)
- **Endpoint**: `POST /transactions`

#### Description
When multiple customers purchase the same product concurrently (e.g. flash sale where stock is 1), both requests read `product.quantity = 1` simultaneously. Both requests pass the `quantity > product.quantity` guard, and both save a transaction, resulting in negative inventory or oversold stock.

#### Root Cause Analysis
The service performs non-atomic queries:
1. `this.productRepository.findOne({ where: { id } })` (No pessimistic lock `SELECT FOR UPDATE`)
2. Evaluates stock in memory.
3. Saves transaction.
4. Saves product with updated quantity.

#### Remediation
Wrap order execution inside a TypeORM `queryRunner` or `dataSource.transaction()` using a pessimistic write lock:
```typescript
await this.dataSource.transaction(async (manager) => {
  const product = await manager.findOne(Product, {
    where: { id: dto.productId },
    lock: { mode: 'pessimistic_write' },
  });
  if (dto.quantity > product.quantity) {
    throw new ConflictException('Insufficient stock');
  }
  const tx = manager.create(Transaction, { user, product, quantity: dto.quantity });
  await manager.save(tx);
  product.quantity -= dto.quantity;
  await manager.save(product);
});
```

---

### BUG-006: Transactions do not verify `OUT_OF_STOCK` product status prior to purchase
- **Severity**: High
- **Priority**: P1
- **Module**: `Transactions` (`src/transactions/transactions.service.ts`)
- **Endpoint**: `POST /transactions`

#### Description
If an administrator manually sets a product status to `OUT_OF_STOCK` (e.g. damaged goods, recall, seasonal hold) while `quantity > 0`, customers can still purchase the product because `TransactionsService.create` only checks `dto.quantity > product.quantity`.

#### Remediation
Add status check before fulfillment:
```typescript
if (product.status === ProductStatus.OUT_OF_STOCK) {
  throw new ConflictException(`Product ${product.id} is out of stock`);
}
```

---

### BUG-007: Missing `@IsEmail()` validation allows invalid email strings
- **Severity**: Medium
- **Priority**: P2
- **Module**: `Users` (`src/users/dto/create-user.dto.ts`)
- **Endpoint**: `POST /users`

#### Description
The `CreateUserDto` only decorates `email` with `@IsNotEmpty()`. Strings like `"admin"`, `"abc@def"`, or `"12345"` are accepted and stored as emails.

#### Remediation
Update `CreateUserDto`:
```typescript
import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  name: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  email: string;
}
```

---

### BUG-008: Missing `@Min(0)` on price allows products with negative or zero price
- **Severity**: Medium
- **Priority**: P2
- **Module**: `Products` (`src/products/dto/create-product.dto.ts`)
- **Endpoint**: `POST /products`

#### Description
`CreateProductDto` specifies `@IsNumber()` for `price`, but lacks a `@Min(0.01)` validator. Attackers or erroneous client apps can create products with negative prices (e.g., `price: -100`), which could corrupt balance calculation in future ledger systems.

#### Remediation
Decorate `price` with `@Min(0.01, { message: 'Price must be greater than zero' })`.

---

### BUG-009: Update endpoints bind to `CreateDto` instead of `UpdateDto`
- **Severity**: Medium
- **Priority**: P2
- **Module**: `UsersController` & `ProductsController`
- **Endpoints**: `PUT /users/:id`, `PUT /products/:id`

#### Description
The controller handlers for `PUT /users/:id` and `PUT /products/:id` declare their `@Body()` parameter as `CreateUserDto` and `CreateProductDto`, rather than `UpdateUserDto` and `UpdateProductDto`. As a result, partial updates fail validation if all fields from the creation DTO are not provided in the request body.

#### Remediation
Bind the controllers to their respective `UpdateUserDto` and `UpdateProductDto`.

---

### BUG-010: Lack of atomicity: transaction record committed before product stock save
- **Severity**: High
- **Priority**: P1
- **Module**: `Transactions` (`src/transactions/transactions.service.ts`)

#### Description
In `TransactionsService.create`:
```typescript
const savedTransaction = await this.transactionRepository.save(transaction);
product.quantity -= dto.quantity;
await this.productRepository.save(product);
```
If the database connection drops or a constraint error occurs while executing `productRepository.save(product)`, the transaction record remains committed in the database, while the inventory was never decremented.

#### Remediation
Enclose both operations in a TypeORM database transaction with rollback.

---

### BUG-011: Docker build fails on clean clone due to hardcoded `COPY .env ./`
- **Severity**: Blocker
- **Priority**: P0
- **Module**: `DevOps / Dockerfile`

#### Description
The repository `.gitignore` correctly ignores `.env`. However, `Dockerfile` contains:
```dockerfile
COPY .env ./
```
When running `docker compose up -d --build` on a fresh checkout where `.env` has not been manually created from `.env.example`, the Docker build crashes with:
`ERROR: failed to solve: failed to compute cache key: "/.env": not found`.

#### Remediation
Remove `COPY .env ./` or use `COPY .env.example .env` as a fallback, injecting real secrets at runtime via Docker Compose or Kubernetes ConfigMap/Secret.

---

### BUG-012: Production start script points to non-existent `dist/main` instead of `dist/src/main`
- **Severity**: High
- **Priority**: P1
- **Module**: `DevOps / package.json`

#### Description
In `package.json`, `"start:prod"` was defined as `"node dist/main"`. However, the NestJS TypeScript compiler generates compiled output inside `dist/src/main.js`. Running `npm run start:prod` crashes with `Cannot find module '/dist/main'`.

#### Remediation
Update `"start:prod"` to `"node dist/src/main"`.

