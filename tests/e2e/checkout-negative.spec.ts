import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { AuthController } from '../../src/api/auth.controller';
import { LoginPage } from '../../src/pages/login.page';
import { TopupPage } from '../../src/pages/topup.page';
import { randomEmail, randomPhone } from '../../src/utils/generator';

function attachDialogListener(page: Page): () => string | null {
  let message: string | null = null;
  page.on('dialog', async (dialog) => {
    message = dialog.message();
    await dialog.accept();
  });
  return () => message;
}

async function loginWithNewUser(page: Page, request: APIRequestContext): Promise<TopupPage> {
  const auth = new AuthController(request);
  const email = randomEmail('neg');
  const password = 'Pass1234';

  const response = await auth.register({ email, password });
  expect(response.status()).toBe(201);

  const loginPage = new LoginPage(page);
  const topupPage = new TopupPage(page);

  await loginPage.goto();
  await loginPage.login(email, password);
  await expect(topupPage.storeView).toBeVisible();

  return topupPage;
}

test.describe('Checkout Negative Tests', () => {
  test('No package selected shows validation or error', async ({ page, request }) => {
    const getDialogMessage = attachDialogListener(page);
    const topupPage = await loginWithNewUser(page, request);

    await test.step('Unset package selection if possible', async () => {
      await topupPage.packageSelect.evaluate((el) => {
        const select = el as HTMLSelectElement;
        select.selectedIndex = -1;
        select.value = '';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    const packageCleared = await topupPage.packageSelect.evaluate((el) => {
      const select = el as HTMLSelectElement;
      return select.selectedIndex === -1 || select.value === '';
    });
    if (!packageCleared) {
      test.skip(true, 'Package dropdown does not allow an unselected state.');
    }

    await test.step('Attempt to proceed without package', async () => {
      await topupPage.fillPhone(randomPhone());
      await topupPage.selectPaymentMethod('credit_card');
      await topupPage.acceptTerms();

      const disabled = await topupPage.confirmButton.isDisabled();
      if (disabled) {
        expect(disabled).toBe(true);
        return;
      }

      await topupPage.confirmPayment();
    });

    await test.step('Verify blocking feedback', async () => {
      const dialogMessage = getDialogMessage();
      if (dialogMessage) {
        expect(dialogMessage.toLowerCase()).toContain('package');
        return;
      }
      await expect(topupPage.modalError).toBeVisible();
      await expect(topupPage.modalErrorReason).toContainText(/Invalid payload|package|select/i);
    });
  });

  test('Invalid mobile number blocks checkout', async ({ page, request }) => {
    const getDialogMessage = attachDialogListener(page);
    const topupPage = await loginWithNewUser(page, request);

    await test.step('Select package and enter invalid phone', async () => {
      await topupPage.selectPackageByValue('1199');
      await topupPage.fillPhone('123');
      await topupPage.selectPaymentMethod('credit_card');
      await topupPage.acceptTerms();
    });

    await test.step('Attempt to confirm payment', async () => {
      await topupPage.confirmPayment();
    });

    await test.step('Verify phone validation error', async () => {
      const dialogMessage = getDialogMessage();
      if (dialogMessage) {
        expect(dialogMessage.toLowerCase()).toMatch(/phone|valid/);
        return;
      }

      await expect(topupPage.phoneError).toBeVisible();
      await expect(topupPage.phoneError).toContainText('valid');
    });
  });
});
