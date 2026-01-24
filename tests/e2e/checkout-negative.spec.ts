import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { AuthController } from '../../src/api/auth.controller';
import { LoginPage } from '../../src/pages/login.page';
import { OrderPage } from '../../src/pages/order.page';
import { randomEmail, randomPhone } from '../../src/utils/generator';

function attachDialogListener(page: Page): () => string | null {
  let message: string | null = null;
  page.on('dialog', async (dialog) => {
    message = dialog.message();
    await dialog.accept();
  });
  return () => message;
}

async function loginWithNewUser(page: Page, request: APIRequestContext): Promise<OrderPage> {
  const auth = new AuthController(request);
  const email = randomEmail('neg');
  const password = 'Pass1234';

  const response = await auth.register({ email, password });
  expect(response.status()).toBe(201);

  const loginPage = new LoginPage(page);
  const orderPage = new OrderPage(page);

  await loginPage.goto();
  await loginPage.login(email, password);
  await expect(orderPage.storeView).toBeVisible();

  return orderPage;
}

test.describe('Checkout Negative Tests', () => {
  test('No package selected shows validation or error', async ({ page, request }) => {
    const getDialogMessage = attachDialogListener(page);
    const orderPage = await loginWithNewUser(page, request);

    await test.step('Unset package selection if possible', async () => {
      await orderPage.packageSelect.evaluate((el) => {
        const select = el as HTMLSelectElement;
        select.selectedIndex = -1;
        select.value = '';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    const packageCleared = await orderPage.packageSelect.evaluate((el) => {
      const select = el as HTMLSelectElement;
      return select.selectedIndex === -1 || select.value === '';
    });
    if (!packageCleared) {
      test.skip(true, 'Package dropdown does not allow an unselected state.');
    }

    await test.step('Attempt to proceed without package', async () => {
      await orderPage.fillPhone(randomPhone());
      await orderPage.selectPaymentMethod('credit_card');
      await orderPage.acceptTerms();

      const disabled = await orderPage.confirmButton.isDisabled();
      if (disabled) {
        expect(disabled).toBe(true);
        return;
      }

      await orderPage.confirmPayment();
    });

    await test.step('Verify blocking feedback', async () => {
      const dialogMessage = getDialogMessage();
      if (dialogMessage) {
        expect(dialogMessage.toLowerCase()).toContain('package');
        return;
      }
      await expect(orderPage.modalError).toBeVisible();
      await expect(orderPage.modalErrorReason).toContainText(/Invalid payload|package|select/i);
    });
  });

  test('Invalid mobile number blocks checkout', async ({ page, request }) => {
    const getDialogMessage = attachDialogListener(page);
    const orderPage = await loginWithNewUser(page, request);

    await test.step('Select package and enter invalid phone', async () => {
      await orderPage.selectPackageByValue('1199');
      await orderPage.fillPhone('123');
      await orderPage.selectPaymentMethod('credit_card');
      await orderPage.acceptTerms();
    });

    await test.step('Attempt to confirm payment', async () => {
      await orderPage.confirmPayment();
    });

    await test.step('Verify phone validation error', async () => {
      const dialogMessage = getDialogMessage();
      if (dialogMessage) {
        expect(dialogMessage.toLowerCase()).toMatch(/phone|valid/);
        return;
      }

      await expect(orderPage.phoneError).toBeVisible();
      await expect(orderPage.phoneError).toContainText('valid');
    });
  });
});
