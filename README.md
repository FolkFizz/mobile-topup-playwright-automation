[![Playwright Tests](https://github.com/FolkFizz/mobile-topup-playwright-automation/actions/workflows/playwright.yml/badge.svg)](https://github.com/FolkFizz/mobile-topup-playwright-automation/actions/workflows/playwright.yml)

# Mobile TopUp Automation Sandbox ??

A robust, production-grade E2E automation framework verifying functional, security, and accessibility standards.

**Target App:** https://mobile-topup-store.onrender.com

## Tech Stack
- **Core:** Playwright, TypeScript, Page Object Model (POM)
- **Specialized Tools:**
  - `@axe-core/playwright` (Accessibility / WCAG 2.1)
  - `allure-playwright` (Advanced Reporting)
  - GitHub Actions (CI/CD Pipeline)

## Test Coverage Strategy
| Coverage Area | What It Validates |
| :-- | :-- |
| ? **Functional E2E** | Complete Checkout flow (Login ? Select Package ? Payment) |
| ? **Negative Testing** | UI validation & edge cases (Invalid Phone, No Package selected) |
| ? **Data-Driven Testing** | Parameterized scenarios across packages, payment methods, and discount logic |
| ? **API Security** | Backend vulnerability checks (BOLA / Unauthenticated Top-up detection) |
| ? **Mobile Emulation** | Responsive flow on iPhone 13 viewport |
| ? **Accessibility (A11y)** | Automated WCAG 2.1 audits (color contrast, ARIA behavior) |

## ?? Known Bugs (Automation Findings)
| Severity | Defect Description | Status |
| :-- | :-- | :-- |
| **Critical** | API `/api/topup` accepts requests without Auth Token (Security Flaw). | Open (Expected Failure) |
| **Serious** | Login button contrast ratio (3.76) fails WCAG AA standard. | Open (Expected Failure) |
| **Serious** | Modal overlay has `aria-hidden` focus issues (aria-hidden-focus). | Open (Expected Failure) |

## Project Structure
```
mobile-topup-playwright-automation/
+- src/
¦  +- api/
¦  +- pages/
¦  +- utils/
¦  +- fixtures/
+- tests/
¦  +- api/
¦  +- e2e/
¦  +- ui/
¦  +- a11y/
+- .github/
   +- workflows/
```

## ? How to Run

### Standard Execution
Run all tests in headless mode (default):
```bash
npm install
npx playwright test
```

### Targeted Execution (Examples)
Run specific test suites to verify key features:

**?? Mobile Viewport (iPhone 13 Emulation):**
```bash
npx playwright test tests/e2e/mobile-checkout.spec.ts --headed
```

**? Accessibility Audit (WCAG 2.1):**
```bash
npx playwright test tests/a11y/accessibility.spec.ts
```

**?? API Security Scan:**
```bash
npx playwright test tests/api/security.spec.ts
```

### View Reports
Generate and open the HTML report:
```bash
npx playwright show-report
```
