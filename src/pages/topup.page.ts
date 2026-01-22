import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export type PaymentMethod = 'credit_card' | 'wallet' | 'qr';

export class TopupPage extends BasePage {
  readonly storeView: Locator;
  readonly userDisplay: Locator;
  readonly historyButton: Locator;
  readonly logoutButton: Locator;

  readonly phoneInput: Locator;
  readonly phoneError: Locator;
  readonly packageSelect: Locator;
  readonly addonCheckbox: Locator;
  readonly discountInput: Locator;
  readonly discountStatus: Locator;

  readonly paymentCredit: Locator;
  readonly paymentWallet: Locator;
  readonly paymentQr: Locator;
  readonly paymentError: Locator;
  readonly termsCheckbox: Locator;

  readonly subtotalValue: Locator;
  readonly vatValue: Locator;
  readonly totalValue: Locator;

  readonly confirmButton: Locator;
  readonly confirmSpinner: Locator;
  readonly confirmText: Locator;

  readonly historyView: Locator;
  readonly historyUser: Locator;
  readonly historyTable: Locator;
  readonly historyTbody: Locator;
  readonly historyLoading: Locator;
  readonly historyError: Locator;
  readonly historyEmpty: Locator;
  readonly backToStoreButton: Locator;

  readonly modalOverlay: Locator;
  readonly modalSuccess: Locator;
  readonly modalError: Locator;
  readonly modalTxnId: Locator;
  readonly modalErrorReason: Locator;
  readonly closeModalButton: Locator;

  constructor(page: Page) {
    super(page);
    this.storeView = page.locator('#view-store');
    this.userDisplay = page.locator('#display-user');
    this.historyButton = page.locator('#btn-history');
    this.logoutButton = page.locator('#btn-logout');

    this.phoneInput = page.locator('#input-phone');
    this.phoneError = page.locator('#error-phone');
    this.packageSelect = page.locator('#select-package');
    this.addonCheckbox = page.locator('#check-addon-movie');
    this.discountInput = page.locator('#input-discount');
    this.discountStatus = page.locator('#discount-status');

    this.paymentCredit = page.locator('#payment-credit');
    this.paymentWallet = page.locator('#payment-wallet');
    this.paymentQr = page.locator('#payment-qr');
    this.paymentError = page.locator('#error-payment');
    this.termsCheckbox = page.locator('#check-terms');

    this.subtotalValue = page.locator('#display-subtotal');
    this.vatValue = page.locator('#display-vat');
    this.totalValue = page.locator('#display-total');

    this.confirmButton = page.locator('#btn-confirm');
    this.confirmSpinner = page.locator('#btn-spinner');
    this.confirmText = page.locator('#btn-text');

    this.historyView = page.locator('#view-history');
    this.historyUser = page.locator('#history-user');
    this.historyTable = page.locator('#history-table');
    this.historyTbody = page.locator('#history-tbody');
    this.historyLoading = page.locator('#history-loading');
    this.historyError = page.locator('#history-error');
    this.historyEmpty = page.locator('#history-empty');
    this.backToStoreButton = page.locator('#btn-back-store');

    this.modalOverlay = page.locator('#modal-overlay');
    this.modalSuccess = page.locator('#modal-success');
    this.modalError = page.locator('#modal-error');
    this.modalTxnId = page.locator('#modal-txn-id');
    this.modalErrorReason = page.locator('#modal-error-reason');
    this.closeModalButton = page.locator('#btn-close-modal');
  }

  async fillPhone(phone: string): Promise<void> {
    await this.phoneInput.fill(phone);
  }

  async selectPackageByValue(value: string): Promise<void> {
    await this.packageSelect.selectOption(value);
  }

  async toggleAddon(enabled: boolean): Promise<void> {
    if (enabled) {
      await this.addonCheckbox.check();
    } else {
      await this.addonCheckbox.uncheck();
    }
  }

  async applyDiscount(code: string): Promise<void> {
    await this.discountInput.fill(code);
    await this.discountInput.blur();
  }

  async selectPaymentMethod(method: PaymentMethod): Promise<void> {
    const lookup: Record<PaymentMethod, Locator> = {
      credit_card: this.paymentCredit,
      wallet: this.paymentWallet,
      qr: this.paymentQr,
    };

    await lookup[method].check();
  }

  async acceptTerms(): Promise<void> {
    if (!(await this.termsCheckbox.isChecked())) {
      await this.termsCheckbox.check();
    }
  }

  async confirmPayment(): Promise<void> {
    await this.page.mouse.click(0, 0);
    await expect(this.confirmButton).toBeEnabled();
    await this.confirmButton.scrollIntoViewIfNeeded();
    await this.confirmButton.click({ force: true });
  }

  async openHistory(): Promise<void> {
    await this.historyButton.click();
  }

  async backToStore(): Promise<void> {
    await this.backToStoreButton.click();
  }
}
