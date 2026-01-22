import { test, expect, Page } from '@playwright/test';
import { AuthController } from '../../src/api/auth.controller';
import { LoginPage } from '../../src/pages/login.page';
import { PaymentMethod, TopupPage } from '../../src/pages/topup.page';
import { randomEmail, randomPhone } from '../../src/utils/generator';

type CheckoutScenario = {
  packageName: string;
  price: number;
  paymentMethod: PaymentMethod;
  discountCode?: string;
};

const testData: CheckoutScenario[] = [
  { packageName: '5G Max Speed', price: 1199, paymentMethod: 'credit_card', discountCode: 'QA10' },
  { packageName: 'Super Save Marathon', price: 1500, paymentMethod: 'wallet', discountCode: 'QA10' },
  { packageName: 'Daily Unlimited', price: 49, paymentMethod: 'qr' },
];

const paymentLabels: Record<PaymentMethod, string> = {
  credit_card: 'Credit Card',
  wallet: 'Wallet',
  qr: 'QR',
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatThb(value: number): string {
  return `THB ${currencyFormatter.format(value)}`;
}

function parseAmount(value: string): number {
  return Number(value.replace(/,/g, '').trim());
}

async function selectPackageByName(page: Page, topupPage: TopupPage, name: string): Promise<void> {
  const value = await topupPage.packageSelect.evaluate((el, packageName) => {
    const select = el as HTMLSelectElement;
    const option = Array.from(select.options).find(
      (item) => (item as HTMLOptionElement).dataset.name === packageName
    ) as HTMLOptionElement | undefined;
    return option ? option.value : null;
  }, name);

  if (!value) {
    throw new Error(`Package not found: ${name}`);
  }

  await topupPage.selectPackageByValue(value);
}

async function loginWithNewUser(page: Page): Promise<TopupPage> {
  const auth = new AuthController(page.request);
  const email = randomEmail('data');
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

test.describe('Checkout Data-Driven Tests', () => {
  for (const data of testData) {
    test(`Purchase ${data.packageName} via ${data.paymentMethod}`, async ({ page }) => {
      const topupPage = await loginWithNewUser(page);
      const discountedPrice = data.discountCode === 'QA10' ? data.price * 0.9 : data.price;
      const expectedTotal = Number((discountedPrice * 1.07).toFixed(2));

      await test.step('Configure package and payment', async () => {
        await selectPackageByName(page, topupPage, data.packageName);
        await expect(topupPage.packageSelect).toHaveValue(String(data.price));
        if (data.discountCode) {
          await topupPage.discountInput.fill(data.discountCode);
          await topupPage.discountInput.blur();
        }
        await topupPage.fillPhone(randomPhone());
        await topupPage.selectPaymentMethod(data.paymentMethod);
        await expect(topupPage.totalValue).toContainText(formatThb(expectedTotal));
        await topupPage.acceptTerms();
      });

      await test.step('Confirm payment and verify success', async () => {
        await topupPage.confirmPayment();
        await expect(topupPage.modalSuccess).toBeVisible();
        await expect(topupPage.modalTxnId).toHaveText(/TXN-/);
        await topupPage.closeModalButton.click();
        await expect(topupPage.modalOverlay).toHaveAttribute('aria-hidden', 'true');
      });

      await test.step('Verify history reflects correct amount', async () => {
        await topupPage.openHistory();
        await expect(topupPage.historyView).toBeVisible();
        const row = topupPage.historyTbody.locator('tr').first();
        await expect(row).toBeVisible();

        const cells = row.locator('td');
        await expect(cells.nth(2)).toContainText(data.packageName);
        await expect(cells.nth(3)).toContainText(paymentLabels[data.paymentMethod]);

        const amountText = (await cells.nth(4).innerText()).trim();
        const amountValue = parseAmount(amountText);
        expect(amountValue).toBeCloseTo(expectedTotal, 2);
      });
    });
  }
});
