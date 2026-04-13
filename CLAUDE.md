# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**TryAura** is a WordPress/WooCommerce plugin that adds AI-powered features to fashion and eCommerce stores using Google Gemini. It has three core features:

1. **Featured Image Enhancer** — Generates or enhances product images inside the WordPress media modal (admin)
2. **Video Generation(Pro Feature)** — Creates short product showcase videos via Gemini Veo 3 (admin)
3. **Virtual Try-On** — Customer-facing modal on single product pages; the shopper uploads or captures a photo and Gemini composites them wearing the product (frontend)

AI generation runs **client-side** in the browser via `@google/genai`. The Gemini API key is passed from PHP to JS via `wp_localize_script`. The PHP backend's role is to receive completed generations and save them to the WordPress media library via REST API.

The plugin is built for extensibility: a pro plugin declares itself via the `tryaura_is_pro_exists` filter, and 20+ PHP filters plus 40+ `@wordpress/hooks` points allow third-party customization throughout.

## Commands

### JavaScript/TypeScript
```bash
npm run build        # Production build
npm start            # Development watch mode
npm run lint:js      # ESLint check
npm run format       # Prettier format
npm run makepot      # Generate translation .pot file
npm run zip          # Create distribution ZIP
npm run release      # Full release pipeline (composer install, build, makepot, version bump, zip)
```

### PHP
```bash
composer install              # Install dependencies (includes Mozart for dep isolation)
composer install --no-dev -o  # Production (optimized)
composer phpcs                # PHP CodeSniffer check
composer phpcbf               # Auto-fix PHP code style
```

No test suite exists — code quality is enforced via PHPCS, ESLint, Prettier, and StyleLint only.

## Architecture

### PHP Backend (`inc/`)

PSR-4 namespace `Dokan\TryAura\` maps to `inc/`. The plugin uses a **service container** (League\Container, isolated via Mozart into `lib/packages/`) with service providers loaded in `inc/Plugin.php`:

- `CommonServiceProvider` — assets, installer
- `AdminServiceProvider` — admin menu, image enhancer
- `FrontendServiceProvider` — frontend try-on feature
- `WooCommerceServiceProvider` — WooCommerce product integrations
- `RestServiceProvider` — REST API controllers

Entry point: `tryaura.php` → `inc/Plugin.php` → service providers boot

Key REST controllers in `inc/Rest/`:
- `GenerateController` — AI image/video generation requests
- `SettingsController` — read/write plugin settings
- `DashboardController` — usage analytics data
- `ProductController` — WooCommerce product data

### JavaScript/TypeScript Frontend (`src/`)

Multi-entry-point React (via `@wordpress/element`) + TypeScript + Tailwind CSS v4 build. Entry points are defined in `webpack.config.js` and produce separate bundles in `build/`.

**Admin features:**
- `src/admin/dashboard/` — Settings pages (API keys, WooCommerce config) and usage analytics dashboard rendered as a React SPA in the plugin's admin menu
- `src/admin/enhancer/` — Featured image AI enhancer injected into the WordPress media modal via `@wordpress/hooks` filters
- `src/admin/woocommerce-products-list/` — Adds try-on column to the WooCommerce products list table
- `src/admin/product-video-gallery/` — Admin controls for product video gallery

**Frontend (customer-facing):**
- `src/frontend/tryon/` — Virtual try-on modal on WooCommerce single product pages (camera/upload user photo + product image → Gemini API → result display)
- `src/frontend/product-video/` — Product video gallery display

**Shared:**
- `src/components/` — Reusable UI components (exported from `index.tsx`)
- `src/data/ai-models/` and `src/data/settings/` — WordPress data stores (`@wordpress/data`) for plugin configuration
- `src/utils/` — Utility functions

### Build System

Extends `@wordpress/scripts` webpack config. `webpack-dependency-mapping.js` handles externals. Tailwind is processed via PostCSS. Mozart runs automatically during `composer install` to prefix `league/container` into `lib/packages/` to avoid conflicts with other plugins.

### Deployment

Tagged git pushes trigger `.github/workflows/deploy.yml`, which builds the plugin and deploys to WordPress.org SVN. Requires `SVN_USERNAME` and `SVN_PASSWORD` secrets.

## Extensibility for TryAura Pro and Third-Party Plugins

### Pro Plugin Detection

The free plugin gates premium UI via a single boolean flag. Pro plugins declare themselves by hooking into:

```php
add_filter( 'tryaura_is_pro_exists', '__return_true' );
```

`TryAura::is_pro_exists()` (`inc/TryAura.php:41`) wraps this filter. The result is passed as `hasPro` via `wp_localize_script` to both the admin enhancer (`inc/Admin/Enhancer.php:62`) and the frontend try-on (`inc/WooCommerce/Frontend/TryOn.php:59`), so React components can conditionally render pro UI.

### PHP Service Container Extension

Each service provider exposes a filter that allows injecting or replacing services before the container boots. Use these on or before the `tryaura_classes_loaded_before` action.

| Filter | Provider |
|---|---|
| `tryaura_common_container_services` | `CommonServiceProvider` |
| `tryaura_admin_container_services` | `AdminServiceProvider` |
| `tryaura_frontend_container_services` | `FrontendServiceProvider` |
| `tryaura_woocommerce_container_services` | `WooCommerceServiceProvider` |
| `tryaura_rest_container_services` | `RestServiceProvider` |

```php
add_filter( 'tryaura_rest_container_services', function( $services ) {
    $services['my_rest_controller'] = MyRestController::class;
    return $services;
} );
```

Custom service providers can also be added directly:

```php
add_action( 'tryaura_loaded', function( $container ) {
    $container->addServiceProvider( new MyServiceProvider() );
} );
```

Extend `inc/DependencyManagement/BaseServiceProvider.php` (abstract) or `BootableServiceProvider.php` (for providers needing a `boot()` phase) when writing custom providers.

### PHP Lifecycle Actions

| Action | When | Args |
|---|---|---|
| `tryaura_loaded` | After container is built (`plugins_loaded`) | `$container` |
| `tryaura_classes_loaded_before` | Before providers boot (`init`) | `$container` |
| `tryaura_classes_loaded` | After all providers boot | `$container` |
| `tryaura_register_scripts` | During script registration | — |
| `tryaura_register_admin_dashboard_assets` | Admin dashboard page enqueue | — |
| `tryaura_register_enhancer_assets` | Enhancer assets enqueue | — |

### PHP Data & Settings Filters

| Filter | Purpose |
|---|---|
| `tryaura_ai_models` | Add or modify available AI provider models passed to JS |
| `tryaura_scripts` / `tryaura_styles` | Modify registered script/style handles |
| `tryaura_is_gemini_settings_readonly` | Make API settings read-only in admin (return `true`) |
| `tryaura_admin_dashboard_stats_data` | Modify usage stats before dashboard display |
| `tryaura_admin_dashboard_chart_data_item` | Modify individual chart data points |
| `tryaura_recent_activity_type` / `tryaura_recent_activity_type_list` | Extend activity log types |

Plugin settings are stored in the `tryaura_settings` option (structure: `google.apiKey`, `google.imageModel`, `google.videoModel`, `woocommerce.bulkTryOnEenabled`). Product meta keys: `_tryaura_try_on` and `_tryaura_product_video`.

### JavaScript / React Extension via `@wordpress/hooks`

The plugin uses `addFilter` / `applyFilters` / `doAction` from `@wordpress/hooks`. Pro or third-party scripts should enqueue after the relevant TryAura handle and use the same API.

**Admin — Enhancer modal:**

| Hook | Type | Purpose |
|---|---|---|
| `tryaura.enhancer.modal_title` | filter | Change modal heading |
| `tryaura.enhancer.tabs` | filter | Add/remove config tabs |
| `tryaura.enhancer.output_styles` | filter | Add output style options |
| `tryaura.enhancer.aspect_ratios` | filter | Add aspect ratio options |
| `tryaura.enhancer.background_preferences` | filter | Add background options |
| `tryaura.ai_enhance_image_prompt_base` | filter | Modify base prompt sent to Gemini |
| `tryaura.ai_enhance_prompt` | filter | Modify final prompt before API call |
| `tryaura.admin_enhance_btn_toolbar` | filter | Modify toolbar button config |

**Admin — Dashboard:**

| Hook | Type | Purpose |
|---|---|---|
| `tryaura.routes` | filter | Add custom dashboard routes/pages |
| `tryaura.recent.activity.tabs` | filter | Add activity log tabs |
| `tryaura.chartlines` | filter | Add chart data series |

**Frontend — Try-on modal:**

| Hook | Type | Purpose |
|---|---|---|
| `tryaura.tryon.product_image_url` | filter | Override product image URL |
| `tryaura.wp_media_selection` | filter | Adjust camera capture dimensions |

**Key doAction hooks** (fired in sequence for instrumenting or side-effecting flows):
- Enhancer: `tryaura.media_frame_open_before/after`, `tryaura.ai_enhance_prompt_before/after_generate`, `tryaura.ai_enhance_upload_before/after/failed`
- Try-on: `tryaura.before/after_camera_start`, `tryaura.before/after_photo_capture`, `tryaura.photo_selected_before/after`, `tryaura.tryon.button_added`

### Shared JavaScript Libraries

Three bundles are exported as globals for consumption by dependent plugins. Declare them as webpack externals and list the corresponding script handles as dependencies when calling `wp_enqueue_script`.

| Global | Script handle | Source |
|---|---|---|
| `window.tryaura.components` | `tryaura-components` | `src/components/index.tsx` — shared React UI components |
| `window.tryaura.aiProvidersStore` | `tryaura-ai-models` | `src/data/ai-models/` — `@wordpress/data` store for AI provider config |
| `window.tryaura.settingsStore` | `tryaura-settings` | `src/data/settings/` — `@wordpress/data` store for plugin settings |

In your webpack config, map the import paths to their globals:

```js
externals: {
    '@tryaura/components':  ['tryaura', 'components'],
    '@tryaura/ai-models':   ['tryaura', 'aiProvidersStore'],
    '@tryaura/settings':    ['tryaura', 'settingsStore'],
}
```
