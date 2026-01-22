import { test, expect, devices } from '@playwright/test';
import { AuthController } from '../../src/api/auth.controller';
import { LoginPage } from '../../src/pages/login.page';
import { TopupPage } from '../../src/pages/topup.page';
import { randomEmail, randomPhone } from '../../src/utils/generator';

const targetDevices = Object.keys(devices).filter(
  (name) => name.includes('iPhone') || name.includes('Pixel')
);

test.describe('Mobile Checkout - Device Matrix', () => {
  for (const deviceName of targetDevices) {
    test(deviceName, async ({ browser }) => {
      const context = await browser.newContext({
        ...devices[deviceName],
      });
      const page = await context.newPage();

      try {
        const auth = new AuthController(context.request);
        const email = randomEmail('mobile');
        const password = 'Pass1234';
        const phone = randomPhone();

        const response = await auth.register({ email, password });
        expect(response.status()).toBe(201);

        const loginPage = new LoginPage(page);
        const topupPage = new TopupPage(page);

        await loginPage.goto();
        await loginPage.login(email, password);
        await expect(topupPage.storeView).toBeVisible();

        await topupPage.selectPackageByValue('1199');
        await topupPage.discountInput.fill('QA10');
        await topupPage.discountInput.blur();
        await topupPage.fillPhone(phone);
        await topupPage.selectPaymentMethod('credit_card');
        await topupPage.acceptTerms();
        await topupPage.confirmPayment();

        await expect(topupPage.modalSuccess).toBeVisible();
        await expect(topupPage.modalTxnId).toHaveText(/TXN-/);
      } finally {
        await context.close();
      }
    });
  }
});
