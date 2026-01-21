import { test, expect } from '@playwright/test';
import { AuthController } from '../../src/api/auth.controller';
import { randomEmail } from '../../src/utils/generator';

test.describe('Auth API', () => {
  test('POST /api/register - valid', async ({ request }) => {
    const auth = new AuthController(request);
    const payload = { email: randomEmail('api'), password: 'Pass1234' };

    await test.step('Register a new user', async () => {
      const response = await auth.register(payload);
      expect(response.status()).toBe(201);
      const body = (await response.json()) as { status: string; message?: string };
      expect(body.status).toBe('success');
      expect(body.message).toBe('Created');
    });
  });

  test('POST /api/register - duplicate email returns 400', async ({ request }) => {
    const auth = new AuthController(request);
    const payload = { email: randomEmail('dup'), password: 'Pass1234' };

    await test.step('Create the baseline user', async () => {
      const response = await auth.register(payload);
      expect(response.status()).toBe(201);
    });

    await test.step('Attempt duplicate registration', async () => {
      const response = await auth.register(payload);
      expect(response.status()).toBe(400);
      const body = (await response.json()) as { status: string; message?: string };
      expect(body.status).toBe('error');
      expect(body.message).toBe('Email already registered');
    });
  });

  test('POST /api/login - valid credentials', async ({ request }) => {
    const auth = new AuthController(request);
    const payload = { email: randomEmail('login'), password: 'Pass1234' };

    await test.step('Register a user for login', async () => {
      const response = await auth.register(payload);
      expect(response.status()).toBe(201);
    });

    await test.step('Login with valid credentials', async () => {
      const response = await auth.login(payload);
      expect(response.status()).toBe(200);
      const body = (await response.json()) as { token?: string };
      expect(body.token).toBe('mock-token');
    });
  });

  test('POST /api/login - invalid credentials', async ({ request }) => {
    const auth = new AuthController(request);
    const payload = { email: randomEmail('badlogin'), password: 'Pass1234' };

    await test.step('Register a user', async () => {
      const response = await auth.register(payload);
      expect(response.status()).toBe(201);
    });

    await test.step('Attempt login with wrong password', async () => {
      const response = await auth.login({ email: payload.email, password: 'WrongPass' });
      expect(response.status()).toBe(401);
      const body = (await response.json()) as { status: string; message?: string };
      expect(body.status).toBe('error');
      expect(body.message).toBe('Invalid credentials');
    });
  });
});
