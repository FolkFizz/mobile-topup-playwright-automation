import { test, expect, devices } from '@playwright/test';
import { AuthController } from '../../src/api/auth.controller';
import { LoginPage } from '../../src/pages/login.page';
import { TopupPage } from '../../src/pages/topup.page';
import { randomEmail, randomPhone } from '../../src/utils/generator';

test.use({ ...devices['iPhone 13'] });

test.describe('Mobile Checkout', () => {
  test('Critical path login to top-up on iPhone 13', async ({ page }) => {
    const auth = new AuthController(page.request);
    const email = randomEmail('mobile');
    const password = 'Pass1234';
    const phone = randomPhone();

    await test.step('Register user via API', async () => {
      const response = await auth.register({ email, password });
      expect(response.status()).toBe(201);
    });

    const loginPage = new LoginPage(page);
    const topupPage = new TopupPage(page);

    await test.step('Login on mobile viewport', async () => {
      await loginPage.goto();
      await loginPage.login(email, password);
      await expect(topupPage.storeView).toBeVisible();
    });

    await test.step('Verify layout fits viewport', async () => {
      const noHorizontalScroll = await page.evaluate(() =>
        document.documentElement.scrollWidth <= window.innerWidth
      );
      expect(noHorizontalScroll).toBe(true);
    });

    await test.step('Configure top-up and confirm payment', async () => {
      await topupPage.selectPackageByValue('1199');
      await topupPage.discountInput.fill('QA10');
      await topupPage.discountInput.blur();
      await topupPage.fillPhone(phone);
      await topupPage.selectPaymentMethod('credit_card');
      await topupPage.acceptTerms();
      await topupPage.confirmPayment();
    });

    await test.step('Verify success modal', async () => {
      await expect(topupPage.modalSuccess).toBeVisible();
      await expect(topupPage.modalTxnId).toHaveText(/TXN-/);
    });
  });
});
