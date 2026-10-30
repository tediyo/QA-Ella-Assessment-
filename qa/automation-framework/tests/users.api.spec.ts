import { UsersApiClient } from '../src/api-clients';
import { DataFactory } from '../src/fixtures/data-factory';

describe('Users API - Functional, Validation & Boundary Suite', () => {
  const usersClient = new UsersApiClient();

  describe('POST /users (Create User)', () => {
    it('should successfully create a new user with valid name and email', async () => {
      const payload = DataFactory.createUniqueUser();
      const res = await usersClient.createUser(payload);

      expect(res.status).toBe(201);
      expect(res.body.statusCode).toBe(201);
      expect(res.body.message).toBe('User created successfully');
      expect(res.body.data).toMatchObject({
        name: payload.name,
        email: payload.email,
      });
      expect(typeof res.body.data.id).toBe('number');
    });

    it('should return 400 Bad Request when name is missing', async () => {
      const payload = { email: 'noname@example.com' } as any;
      const res = await usersClient.createUser(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toEqual(expect.arrayContaining(['Name is required']));
    });

    it('should return 400 Bad Request when email is missing', async () => {
      const payload = { name: 'No Email User' } as any;
      const res = await usersClient.createUser(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toEqual(expect.arrayContaining(['Email is required']));
    });

    it('should properly reject duplicate email registrations with 409 Conflict', async () => {
      const payload = DataFactory.createUniqueUser();
      const firstRes = await usersClient.createUser(payload);
      expect(firstRes.status).toBe(201);

      const duplicateRes = await usersClient.createUser(payload);
      // Expected behavior: 409 Conflict (Documented BUG-003 in BUGS.md if returns 201)
      expect(duplicateRes.status).toBe(409);
    });
  });

  describe('GET /users (Get All Users)', () => {
    it('should return an array of users with transactions relations', async () => {
      const res = await usersClient.getAllUsers();

      expect(res.status).toBe(200);
      expect(res.body.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /users/:id (Get User by ID)', () => {
    it('should return 404 when user ID does not exist', async () => {
      const nonExistentId = 999999;
      const res = await usersClient.getUserById(nonExistentId);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe(`User with ID ${nonExistentId} not found`);
    });
  });
});

