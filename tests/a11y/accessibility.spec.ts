import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { AuthController } from '../../src/api/auth.controller';
import { LoginPage } from '../../src/pages/login.page';
import { TopupPage } from '../../src/pages/topup.page';
import { randomEmail } from '../../src/utils/generator';

test.describe('Accessibility (WCAG 2.1)', () => {
  test('Login page accessibility', async ({ page }) => {
    test.fail(
      true,
      'WCAG Violation: Login button contrast ratio (3.76) is below AA standard (4.5).'
    );

    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await expect(loginPage.loginView).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('Store page accessibility', async ({ page, request }) => {
    test.fail(
      true,
      'WCAG Violation: Hidden modal overlay contains focusable elements (aria-hidden-focus).'
    );

    const auth = new AuthController(request);
    const email = randomEmail('a11y');
    const password = 'Pass1234';

    const response = await auth.register({ email, password });
    expect(response.status()).toBe(201);

    const loginPage = new LoginPage(page);
    const topupPage = new TopupPage(page);

    await loginPage.goto();
    await loginPage.login(email, password);
    await expect(topupPage.storeView).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
