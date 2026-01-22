import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../../src/pages/login.page';

function attachDialogListener(page: Page): () => string | null {
  let message: string | null = null;
  page.on('dialog', async (dialog) => {
    message = dialog.message();
    await dialog.accept();
  });
  return () => message;
}

test.describe('Registration Negative Tests', () => {
  test('Empty submission shows validation feedback', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const getDialogMessage = attachDialogListener(page);

    await loginPage.goto();
    await loginPage.openRegister();

    await loginPage.registerButton.click();
    await page.waitForTimeout(200);

    const dialogMessage = getDialogMessage();
    if (dialogMessage) {
      expect(dialogMessage).toContain('required');
      return;
    }

    await expect(loginPage.registerMessage).toContainText('Email and password are required.');
  });

  test('Invalid email format is rejected or flagged', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const getDialogMessage = attachDialogListener(page);

    await loginPage.goto();
    await loginPage.openRegister();

    await loginPage.registerEmailInput.fill('testuser');
    await loginPage.registerPasswordInput.fill('Pass1234');
    await loginPage.registerButton.click();
    await page.waitForTimeout(200);

    const dialogMessage = getDialogMessage();
    if (dialogMessage) {
      expect(dialogMessage.toLowerCase()).toContain('email');
      return;
    }

    const registerMessage = (await loginPage.registerMessage.textContent())?.trim() || '';
    if (registerMessage && /email|invalid|required/i.test(registerMessage)) {
        return;
    }

    const emailValidity = await loginPage.registerEmailInput.evaluate((el) =>
      (el as HTMLInputElement).validity.valid
    );
    expect(emailValidity).toBe(false);
  });

  test('Password mismatch shows error (if confirm field exists)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const getDialogMessage = attachDialogListener(page);

    await loginPage.goto();
    await loginPage.openRegister();

    const confirmField = page.locator(
      '#confirm-password, #reg-confirm-password, #register-confirm-password, #confirmPassword'
    );

    if ((await confirmField.count()) === 0) {
      test.skip(true, 'Confirm password field is not implemented in the UI.');
    }

    await loginPage.registerEmailInput.fill('mismatch@example.com');
    await loginPage.registerPasswordInput.fill('Pass123');
    await confirmField.first().fill('Pass999');
    await loginPage.registerButton.click();
    await page.waitForTimeout(200);

    const dialogMessage = getDialogMessage();
    if (dialogMessage) {
      expect(dialogMessage.toLowerCase()).toContain('match');
      return;
    }

    await expect(loginPage.registerMessage).toContainText('match');
  });

  test('Short password is rejected if min length enforced', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const getDialogMessage = attachDialogListener(page);

    await loginPage.goto();
    await loginPage.openRegister();

    const minLength = await loginPage.registerPasswordInput.getAttribute('minlength');
    if (!minLength) {
      test.skip(true, 'No minLength validation present on the password field.');
    }

    await loginPage.registerEmailInput.fill('shortpass@example.com');
    await loginPage.registerPasswordInput.fill('a');
    await loginPage.registerButton.click();
    await page.waitForTimeout(200);

    const dialogMessage = getDialogMessage();
    if (dialogMessage) {
      expect(dialogMessage.toLowerCase()).toMatch(/short|length|min/);
      return;
    }

    const passwordValidity = await loginPage.registerPasswordInput.evaluate((el) =>
      (el as HTMLInputElement).validity.valid
    );
    expect(passwordValidity).toBe(false);
  });
});

test.describe('Login Negative Tests', () => {
  test('Empty submission shows validation feedback', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const getDialogMessage = attachDialogListener(page);

    await loginPage.goto();

    await loginPage.loginButton.click();
    await page.waitForTimeout(200);

    const dialogMessage = getDialogMessage();
    if (dialogMessage) {
      expect(dialogMessage).toContain('required');
      return;
    }

    await expect(loginPage.loginMessage).toContainText('Email and password are required.');
  });

  test('SQL injection attempt is rejected', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.emailInput.fill("' OR '1'='1");
    await loginPage.passwordInput.fill('random-pass');
    await loginPage.loginButton.click();

    await expect(loginPage.loginMessage).toContainText('Invalid credentials');
  });
});
