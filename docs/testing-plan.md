# TryAura — Testing Plan (PHPUnit + E2E, token-free)

> Goal: stand up a PHPUnit + Playwright E2E suite for the TryAura free plugin,
> modelled on how **dokan-lite** and **WooCommerce** structure their tests, while
> spending **zero Gemini API tokens** on every automated run.
>
> Strategy locked in [ADR 0002 — Token-free test strategy](adr/0002-token-free-test-strategy.md).

---

## 1. Findings

### 1.1 Current state of TryAura

- **No test suite exists.** No `tests/` directory, no `phpunit.xml`, no E2E tooling.
- `composer.json` `require-dev` has only the PHPCS toolchain + Mozart — **no PHPUnit**.
- `package.json` has build/lint/format scripts — **no Playwright/Cypress/Jest**.
- Quality today is enforced only by PHPCS, ESLint, Prettier, StyleLint.

### 1.2 The token surface — there are **two** generation paths

"Reduce tokens while testing" is not one lever. Gemini is called from two places, and
**both must be stubbed** for a run to cost nothing:

| # | Path | Where | How Gemini is reached |
|---|------|-------|-----------------------|
| 1 | Admin enhancer (image/video) | **Browser** — `src/admin/enhancer/PreviewModal.tsx` | `new GoogleGenAI({apiKey}).models.generateContent(...)` (lines 198, 207, 405, 600) |
| 2 | Customer virtual try-on | **PHP** — `inc/Rest/GenerateController.php::handle_generation()` | `wp_remote_post()` to `https://generativelanguage.googleapis.com/...` (lines 111, 142) |

Everything else on the PHP side never touches Gemini and is therefore **inherently
token-free**: settings, container/provider wiring, promotion dismissal, media
sideload, product meta, REST permissions.

### 1.3 TryAura's testable REST surface

| Controller | Route(s) | Notes |
|---|---|---|
| `SettingsController` | `tryaura/v1/settings`, `.../settings/bulk-try-on` | option CRUD + sanitize; WC-guarded bulk toggle |
| `GenerateController` | `generate/v1` (try-on) | **the PHP Gemini call** — stub target |
| `PromotionController` | `tryaura/v1/promotion/dismiss-banner` | writes per-user dismissal timestamp |
| `VideoThumbnailController` | media save | `wp_upload_bits` / `media_handle_sideload` / `wp_insert_attachment` |
| `ProductController` | product data | WooCommerce product info |
| `DashboardController` | stats / `log-usage` | usage analytics aggregation |

### 1.4 How dokan-lite / WooCommerce structure tests (the template)

> The bundled `woocommerce` copy is the built plugin and ships **no** tests. All
> conventions below come from **dokan-lite** (richest, most current), with
> **dokan-pro** noted where it differs.

**PHPUnit**
- Layout: `tests/php/` — `phpunit.xml`, `bootstrap.php`, `phpunit-wp-config.php`, and
  test classes under `tests/php/src/` PSR-4-mapped to `WeDevs\Dokan\Test\`
  (`autoload-dev`). **Feature-grouped**, not unit-vs-integration folders; the
  unit/integration split is a per-test boolean (`$is_unit_test`) on the base class.
- `phpunit.xml`: `bootstrap="tests/php/bootstrap.php"`, env
  `WP_PHPUNIT__TESTS_CONFIG`, single testsuite scanning `tests/php`. No coverage block.
- `bootstrap.php`: loads Composer autoload → resolves WP test lib (`WP_TESTS_DIR` →
  `WP_PHPUNIT__DIR` → temp) → loads WooCommerce then the plugin on `muplugins_loaded`
  → installs WC (with HPOS) on `setup_theme` → boots WP test scaffolding.
- `require-dev`: `phpunit/phpunit ^9.6`, `wp-phpunit/wp-phpunit dev-master`,
  `yoast/phpunit-polyfills ^1.0`, `brain/monkey ^2.0` (brings Mockery).
- DB install: standard `bin/install-wp-tests.sh`.
- Base class: `DokanTestCase extends WP_UnitTestCase` mixing Brain Monkey + Mockery +
  DB/array assertion traits; spins up a fresh `WP_REST_Server`, seeds users, exposes
  `get/post/put/delete_request()` helpers and order builders. Factories subclass
  `WP_UnitTest_Factory` (`product`, `order`, `seller`, ...). WooCommerce-style
  `WC_Helper_*` fixtures under `tests/php/src/Helpers/`.
- **HTTP mocking:** dokan's PHPUnit has **no** `pre_http_request`/`wp_remote_*` stub —
  they mock PHP functions/objects with Brain Monkey + Mockery and exercise real WC/DB.
  For a third-party API you **introduce** the `pre_http_request` filter (they use it
  only in their E2E mu-plugin — see below).
- Runner: `composer test` → `phpunit`; `composer test-f` → `phpunit --filter`.

**E2E**
- **Playwright** (`@playwright/test`), no Cypress/Puppeteer. Specs under `tests/pw/`
  (`tests/pw/tests/e2e/` UI + page objects, `tests/pw/tests/api/` API).
- Environment: **`@wordpress/env`** via `.wp-env.json` (WP + WooCommerce + Basic-Auth +
  helpers; maps the plugin and an mu-plugins dir into the container).
- `playwright.config.ts`: staged **projects with dependencies** —
  `site_setup → auth_setup → e2e_setup → e2e_tests → coverage/teardown`; tag filtering
  (`@lite`, `@pro`). Auth via persisted `storageState`; data seeded via REST + direct DB.
- **Network interception:** heavy use of `page.route(...)`:
  - `route.abort()` for real third-party hosts (Stripe, hCaptcha).
  - `route.fulfill({...})` with canned JSON to stub success/error/loading paths
    (e.g. `adminChangelogPage.ts` stubbing a REST endpoint).
  - A **server-side guard mu-plugin** (`tests/pw/mu-plugins/disable-updates-and-external-http.php`)
    adds a `pre_http_request` filter returning `WP_Error` for `wordpress.org`, so the
    site makes no slow outbound calls during tests.
- npm scripts in `tests/pw/package.json`: `start:env`/`stop:env`/`reset:env`, `test`,
  `test:e2e`, `test:api`, `test:ui`, `test:debug`.

---

## 2. The token-reduction strategy

**Rule: no test ever holds a real Gemini key or lets a request reach
`generativelanguage.googleapis.com`.** Stub at both layers and every test costs zero
tokens.

### 2.1 PHPUnit — stub `wp_remote_post` via `pre_http_request`

Add to the base TestCase (hangs off the Brain Monkey `set_up()` slot):

```php
protected function fake_gemini( array $response = null ) {
    add_filter( 'pre_http_request', function ( $pre, $args, $url ) use ( $response ) {
        if ( str_contains( $url, 'generativelanguage.googleapis.com' ) ) {
            return array(
                'response' => array( 'code' => 200 ),
                'body'     => wp_json_encode( $response ?? $this->gemini_image_fixture() ),
            );
        }
        return $pre; // non-Gemini calls pass through (there are none in tests)
    }, 10, 3 );
}
```

Covers the **try-on** PHP path. Assert the request body TryAura *builds* (prompt +
`inline_data` parts) and how it *maps* the stubbed response — plus the error branches
(`is_wp_error`, `data['error']`, bad nonce).

### 2.2 E2E — intercept the browser call (Playwright)

```ts
await page.route('**/generativelanguage.googleapis.com/**', route =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(geminiImageFixture), // fixture embeds a 1×1 base64 PNG
  }));
```

Covers the **admin enhancer** path. Same `page.route().fulfill()` pattern dokan-lite
uses in `adminChangelogPage.ts`.

### 2.3 E2E — server-side guard mu-plugin

Copy dokan-lite's `disable-updates-and-external-http.php` into `tests/pw/mu-plugins/`
and add a `pre_http_request` branch that stubs Gemini (covers the **try-on** path
inside the browser-driven flow) and blocks `wordpress.org`.

### 2.4 Fixtures are 100% synthetic — no live tier

**Decision:** the harness never calls Gemini, not even once to record fixtures, and there
is **no live-smoke tier.** All fixtures are **hand-authored** from the response shapes
already visible in the code — a 1×1 base64 PNG in the image JSON; a few-KB stub MP4 plus a
"done" operation JSON with a rewritten fake `uri` for video. If a real sample is ever
needed to shape a fixture, a human captures it out-of-band and hands over the data; the
test code still never calls the API. Accepted trade-off: fixtures can drift from a changed
Gemini response shape without the suite noticing — see
[ADR 0002](adr/0002-token-free-test-strategy.md). Note the **video** fixtures exercise a
**Pro-only** flow (Veo), so they live in the Pro suite; the free suite only asserts the
**locked** Video tab.

---

## 3. PHPUnit implementation plan (mirror dokan-lite)

**Scaffold**
- `tests/php/` → `phpunit.xml`, `bootstrap.php`, `phpunit-wp-config.php`.
- Test classes under `tests/php/src/`, PSR-4 `Dokan\TryAura\Test\` via `autoload-dev`,
  grouped by feature: `Rest/`, `Admin/`, `Settings/`, `Promotion/`, `WooCommerce/`.
- `composer require-dev`: `phpunit/phpunit ^9.6`, `wp-phpunit/wp-phpunit`,
  `yoast/phpunit-polyfills ^1.0`, `brain/monkey ^2.0`.
- `bin/install-wp-tests.sh` (standard WP scaffold installer).
- `composer test` → `phpunit`; `composer test-f` → `phpunit --filter`.
- `bootstrap.php` loads WooCommerce then TryAura on `muplugins_loaded`.
- Base `TryAuraTestCase extends WP_UnitTestCase` (Brain Monkey + Mockery + REST request
  helpers + `fake_gemini()` + a `gemini_image_fixture()`), plus a `WP_UnitTest_Factory`
  subclass for products.

**Coverage (all token-free)**

| Target | Assertions |
|---|---|
| `GenerateController` (try-on) | with `fake_gemini()`: correct request body (prompt + `inline_data`); response mapping; nonce/permission + `is_wp_error` / `data['error']` branches |
| `SettingsController` | GET/POST settings, `sanitize_settings`, `bulk-try-on` (WC-guarded), `manage_options` permission |
| `PromotionController` + `Promotion` | dismissal writes the user-meta timestamp; `should_show_upgrade_banner()` true/false across pro-active + 30-day expiry; `plugin_action_links` only when pro absent |
| `VideoThumbnailController` | media sideload creates an attachment |
| Container / providers | each provider registers services; `is_pro_exists` gating |
| `ProductController` / `DashboardController` | product data shape; stats aggregation + `log-usage` |

---

## 4. E2E implementation plan (Playwright + @wordpress/env)

**Scaffold**
- `tests/pw/` → `.wp-env.json` (WP + WooCommerce + Basic-Auth + the guard mu-plugin
  mapped in), `playwright.config.ts` with staged projects
  `site_setup → auth_setup → e2e_setup → e2e_tests`, page objects, `utils/`, fixtures.
- Auth via persisted `storageState`; seed data via REST + `wp-cli`.
- npm scripts in `tests/pw/package.json`: `start:env`, `stop:env`, `reset:env`,
  `test:e2e`, `test:api`, `test:ui`, `test:debug`.

**Flows (each with Gemini stubbed)**

_Free-usable:_
- Admin enhancer: open media modal → generate **image** (free options) → assert result saved to Media Library.
- Settings: connect + save Gemini settings.
- Frontend try-on: upload photo → generate → result renders.
- Products-list: try-on toggle column.

_Pro-locked states (assert the gating, not the feature):_
- Video + Edit tabs render locked (crown); aspect-ratios beyond 1:1 locked; custom/negative prompt disabled.
- Promo banner / sidebar Upgrade / "Upgrade to Pro" link appear only when `hasPro` is false; dismissal persists.

---

## 5. Suggested phasing

1. **Scaffold + token guard first** — `install-wp-tests.sh`, `phpunit.xml`,
   `bootstrap.php`, base TestCase with `fake_gemini()`, and one green test (settings
   CRUD). Proves the zero-token harness before writing volume.
2. **PHP breadth** — the controller / promotion / media table in §3.
3. **E2E harness** — wp-env + guard mu-plugin + one stubbed enhancer flow end-to-end.
4. **E2E breadth** — try-on, settings, promo, products-list.
5. **CI** — GitHub Actions, lean matrix (PHP 7.4 + current 8.x, latest WP+WC, plus a
   WP 6.6 min job): `composer test` on the install-wp-tests scaffold, then a Playwright
   job on wp-env. No live-API job — the suite is fully stubbed.

---

## 6. Resolved decisions

Settled in the grilling session; recorded in
[ADR 0002](adr/0002-token-free-test-strategy.md):

1. **Template** — mirror **dokan-lite** (the bundled `woocommerce` ships no tests).
2. **Two tiers** — dokan-style **PHPUnit** (boots real WP + WooCommerce via
   `install-wp-tests.sh`) + **Playwright E2E** on **`@wordpress/env`**.
3. **No real Gemini, ever** — 100% synthetic, hand-authored fixtures; no live-smoke tier.
4. **Coverage scope** — both free-usable flows **and** Pro-locked states (the gating).
5. **CI** — GitHub Actions, lean matrix (PHP 7.4 + current 8.x, latest WP+WC, WP 6.6 min).

---

## 7. Why this is zero-token

- **PHPUnit:** the only Gemini caller is the try-on `wp_remote_post`, intercepted by
  `pre_http_request`. Every other PHP test never touches Gemini.
- **E2E:** the browser SDK call is intercepted by `page.route`, and the server-side
  try-on call is intercepted by the guard mu-plugin. No real key is ever configured in
  the test environment.
- **Net:** every run — local or CI — makes **no** real Gemini requests → **0 tokens**,
  always. There is no live-API path anywhere in the suite.
