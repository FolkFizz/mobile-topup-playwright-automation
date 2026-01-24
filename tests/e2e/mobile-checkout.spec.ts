import { test, expect, devices } from '@playwright/test';
import { AuthController } from '../../src/api/auth.controller';
import { LoginPage } from '../../src/pages/login.page';
import { OrderPage } from '../../src/pages/order.page';
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
        const orderPage = new OrderPage(page);

        await loginPage.goto();
        await loginPage.login(email, password);
        await expect(orderPage.storeView).toBeVisible();

        await orderPage.selectPackageByValue('1199');
        await orderPage.discountInput.fill('QA10');
        await orderPage.discountInput.blur();
        await orderPage.fillPhone(phone);
        await orderPage.selectPaymentMethod('credit_card');
        await orderPage.acceptTerms();
        await orderPage.confirmPayment();

        await expect(orderPage.modalSuccess).toBeVisible();
        await expect(orderPage.modalTxnId).toHaveText(/TXN-/);
      } finally {
        await context.close();
      }
    });
  }
});
