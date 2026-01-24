import { test, expect } from '@playwright/test';

test.describe('API Security Tests', () => {
  test('Unauthorized access to /api/order is rejected', async ({ request }) => {
    test.fail(
      true,
      'SECURITY FLAW: API accepts order without token (Returns 200 instead of 401). Pending Fix.'
    );

    const response = await request.post('/api/order', {
      data: {
        email: 'security.qa@example.com',
        package: '5G Max Speed',
        phone: '0891234567',
        amount: 1199,
        paymentMethod: 'credit_card',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('Malformed registration payload is rejected', async ({ request }) => {
    const emptyPayloadResponse = await request.post('/api/register', { data: {} });
    expect(emptyPayloadResponse.status()).toBe(400);

    const missingPasswordResponse = await request.post('/api/register', {
      data: { email: 'malformed@example.com' },
    });
    expect(missingPasswordResponse.status()).toBe(400);
  });

  test('Invalid method for /api/login is rejected', async ({ request }) => {
    const response = await request.get('/api/login');
    expect([404, 405]).toContain(response.status());
  });
});
