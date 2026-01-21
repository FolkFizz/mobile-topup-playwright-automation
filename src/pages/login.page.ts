import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  readonly loginView: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly loginMessage: Locator;
  readonly forgotPasswordButton: Locator;
  readonly linkToRegister: Locator;

  readonly registerView: Locator;
  readonly registerEmailInput: Locator;
  readonly registerPasswordInput: Locator;
  readonly registerButton: Locator;
  readonly registerMessage: Locator;
  readonly backToLoginButton: Locator;

  constructor(page: Page) {
    super(page);
    this.loginView = page.locator('#view-login');
    this.emailInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('#btn-login');
    this.loginMessage = page.locator('#login-message');
    this.forgotPasswordButton = page.locator('#link-forgot-pass');
    this.linkToRegister = page.locator('#link-to-register');

    this.registerView = page.locator('#view-register');
    this.registerEmailInput = page.locator('#reg-username');
    this.registerPasswordInput = page.locator('#reg-password');
    this.registerButton = page.locator('#btn-register');
    this.registerMessage = page.locator('#register-message');
    this.backToLoginButton = page.locator('#link-to-login');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async openRegister(): Promise<void> {
    await this.linkToRegister.click();
  }

  async register(email: string, password: string): Promise<void> {
    await this.registerEmailInput.fill(email);
    await this.registerPasswordInput.fill(password);
    await this.registerButton.click();
  }

  async backToLogin(): Promise<void> {
    await this.backToLoginButton.click();
  }
}
