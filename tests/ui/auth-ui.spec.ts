import { test, expect } from '@playwright/test';
import { AuthController } from '../../src/api/auth.controller';
import { LoginPage } from '../../src/pages/login.page';
import { OrderPage } from '../../src/pages/order.page';
import { randomEmail } from '../../src/utils/generator';

test.describe('Auth UI', () => {
  test('Register and login via UI', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const orderPage = new OrderPage(page);
    const email = randomEmail('ui');
    const password = 'Pass1234';

    await test.step('Open register view', async () => {
      await loginPage.goto();
      await loginPage.openRegister();
      await expect(loginPage.registerView).toBeVisible();
    });

    await test.step('Submit registration and return to login', async () => {
      await loginPage.register(email, password);
      await expect(loginPage.loginView).toBeVisible();
      await expect(loginPage.emailInput).toHaveValue(email);
    });

    await test.step('Login with the new user', async () => {
      await loginPage.login(email, password);
      await expect(orderPage.storeView).toBeVisible();
      await expect(orderPage.userDisplay).toContainText(email);
    });
  });

  test('Forgot password OTP flow', async ({ page, request }) => {
    const loginPage = new LoginPage(page);
    const orderPage = new OrderPage(page);
    const auth = new AuthController(request);
    const email = randomEmail('reset');
    const password = 'Pass1234';
    const newPassword = 'NewPass1234';

    await test.step('Seed a user via API', async () => {
      const response = await auth.register({ email, password });
      expect(response.status()).toBe(201);
    });

    await test.step('Request OTP for the user', async () => {
      await loginPage.goto();
      await page.locator('#link-forgot-pass').click();
      await expect(page.locator('#view-forgot-email')).toBeVisible();
      await page.locator('#forgot-email').fill(email);
      await page.locator('#btn-send-otp').click();
      await expect(page.locator('#view-forgot-otp')).toBeVisible();
      await expect(page.locator('#otp-email')).toContainText(email);
    });

    await test.step('Verify OTP and reset password', async () => {
      await page.locator('#input-otp').fill('1234');
      await page.locator('#btn-verify-otp').click();
      await expect(page.locator('#view-reset-pass')).toBeVisible();
      await page.locator('#new-password').fill(newPassword);
      await page.locator('#btn-reset-pass').click();
      await expect(loginPage.loginView).toBeVisible();
    });

    await test.step('Login with the new password', async () => {
      await loginPage.login(email, newPassword);
      await expect(orderPage.storeView).toBeVisible();
      await expect(orderPage.userDisplay).toContainText(email);
    });
  });
});
