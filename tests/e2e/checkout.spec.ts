import { test, expect } from '@playwright/test';
import { AuthController } from '../../src/api/auth.controller';
import { LoginPage } from '../../src/pages/login.page';
import { TopupPage } from '../../src/pages/topup.page';
import { randomEmail } from '../../src/utils/generator';

type ParsedTimestamp = {
  date: Date;
  formatted: string;
};

const BANGKOK_TIMEZONE = 'Asia/Bangkok';

function formatBangkok(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: BANGKOK_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return formatter.format(date).replace(',', '');
}

function parseServerTimestamp(value: string): ParsedTimestamp | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!match) {
    return null;
  }
  const [, year, month, day, hour, minute, second] = match;
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`);
  return {
    date,
    formatted: formatBangkok(date),
  };
}

function parseAmount(value: string): number {
  return Number(value.replace(/,/g, '').trim());
}

test.describe('Checkout E2E', () => {
  test('Happy path purchase', async ({ page, request }) => {
    const loginPage = new LoginPage(page);
    const topupPage = new TopupPage(page);
    const auth = new AuthController(request);
    const email = randomEmail('e2e');
    const password = 'Pass1234';

    const baseAmount = 1199 + 49;
    const expectedTotal = Number((baseAmount + baseAmount * 0.07).toFixed(2));

    await test.step('Register a new user via API', async () => {
      const response = await auth.register({ email, password });
      expect(response.status()).toBe(201);
    });

    await test.step('Login to the store', async () => {
      await loginPage.goto();
      await loginPage.login(email, password);
      await expect(topupPage.storeView).toBeVisible();
    });

    await test.step('Configure the top-up package', async () => {
      await topupPage.selectPackageByValue('1199');
      await expect(topupPage.packageSelect).toHaveValue('1199');
      await topupPage.toggleAddon(true);
      await expect(topupPage.addonCheckbox).toBeChecked();
      await expect(topupPage.subtotalValue).toContainText('1,248.00');
    });

    await test.step('Select payment method and confirm', async () => {
      await topupPage.selectPaymentMethod('credit_card');
      await expect(topupPage.paymentCredit).toBeChecked();
      await topupPage.acceptTerms();
      await expect(topupPage.confirmButton).toBeEnabled();
      await topupPage.confirmPayment();
    });

    await test.step('Verify success modal with transaction ID', async () => {
      await expect(topupPage.modalSuccess).toBeVisible();
      await expect(topupPage.modalTxnId).toHaveText(/TXN-/);
    });

    await test.step('Validate history timestamp and amount', async () => {
      await topupPage.openHistory();
      await expect(topupPage.historyView).toBeVisible();
      const row = topupPage.historyTbody.locator('tr').first();
      await expect(row).toBeVisible();

      const cells = row.locator('td');
      const timestampText = (await cells.nth(0).innerText()).trim();
      const parsed = parseServerTimestamp(timestampText);
      expect(parsed).not.toBeNull();
      const parsedValue = parsed as ParsedTimestamp;

      const now = new Date();
      expect(parsedValue.formatted).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/);
      const diffMs = Math.abs(now.getTime() - parsedValue.date.getTime());
      expect(diffMs).toBeLessThanOrEqual(120000);

      await expect(cells.nth(2)).toContainText('5G Max Speed');
      await expect(cells.nth(3)).toContainText('Credit Card');

      const amountText = (await cells.nth(4).innerText()).trim();
      const amountValue = parseAmount(amountText);
      expect(amountValue).toBeCloseTo(expectedTotal, 2);
    });
  });
});
