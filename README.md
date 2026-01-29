# TryAura — AI Virtual Try‑On and Content Enhancer for WordPress

## Overview
TryAura is an AI‑powered virtual try‑on and content creation plugin for WordPress and WooCommerce. It helps stores create better product visuals without costly photoshoots by enabling:

- AI product image generation from existing media
- Optional short product showcase video generation
- A shopper‑facing “Try on” experience on product pages (upload or camera)

## What’s Included

### Featured Image Enhancer (Editor)
- Adds an “Enhance with AI” button inside the Featured Image media modal toolbar.
- Generates an AI image from one or multiple selected images using Google Gemini via `@google/genai`.
- Options before generation: Background preference (plain white, studio, natural), Output style (photo‑realistic, studio mockup, model shoot), and an optional free‑text prompt.
- Shows generation status and the result side‑by‑side with the original(s).
- “Set image” uploads the generated image to the Media Library and, when in the Featured Image modal, sets it as the featured image. In other contexts (Add Media), it only selects the upload so the user can insert it normally.
- Supports Regenerate and Download.
- Video generation: after an image is generated, you can Generate/Regenerate a short video (Veo 3 via Gemini REST LRO). The video can be downloaded or added to the Media Library.

### Frontend Try On (WooCommerce product pages)
- Injects a “Try on” button next to the Add to cart button.
- Opens a modal over the page (document.body portal, high z‑index) where shoppers can:
  - Upload a photo or use their camera (capture).
  - Click Try to generate a composite try‑on image combining the shopper image with the product images from the page.
- Shows result with a Download option. (Frontend does not upload to the Media Library.)

## Requirements
- WordPress 6.8+
- PHP 8.0+
- Node.js 18+
- WooCommerce for the frontend try‑on button (single product templates)

## Installation
- Place the plugin directory in `wp-content/plugins`
- Ensure Composer autoload is available (`vendor/autoload.php` is required by `tryaura.php`)
- Activate the plugin in the WordPress admin

## Configuration (API Key)
- In WP Admin, go to: TryAura (top‑level menu)
- Enter your Google AI API key and Save
- The key is stored as the option: `try_aura_api_key` and is also available to the frontend/admin scripts via localization

## Build

```bash
npm install
npm run build
```

Build artifacts are written to `build/` and include dependency extraction `.asset.php` files for each entry.

## Key Files
- `tryaura.php` — plugin bootstrap
- `inc/Plugin.php` — central bootstrap (registers settings REST, Enhancer, TryOn, Admin)
- `inc/Admin.php` — TryAura settings page and admin asset enqueue + localization (restUrl, nonce, apiKey)
- `inc/Enhancer.php` — enqueues the editor Featured Image Enhancer (`build/enhancer.js`)
- `inc/TryOn.php` — enqueues the frontend Try On assets on single product pages (`build/tryon.js`)
- `src/enhancer.tsx` — Featured Image Enhancer UI and AI logic (image + video); React 18 `createRoot`; renders via a body‑level portal
- `src/tryon.tsx` — Frontend Try On UI for WooCommerce product page; camera/upload and AI generation client‑side
- `src/index.tsx` — Admin settings app (save and fetch API key via REST)
- `webpack.config.js` — extends `@wordpress/scripts`, entries: index, enhancer, tryon
- `tsconfig.json` — uses `react-jsx` with `@wordpress/element`
- `package.json` — scripts (build/start/lint/format), dependencies (`@google/genai`, `@wordpress/*`)

## How It Works

### Image Generation (Editor + Frontend)
- Uses `@google/genai` with the model `gemini-2.5-flash-image-preview`.
- For multiple selected images (editor), each is sent as an `inlineData` part; the UI shows originals in a grid and the generated result alongside.
- UI states include fetching, generating, parsing, error, and done; interactive buttons are disabled while busy.

### Video Generation (Editor)
- Implemented via the Gemini REST API long‑running operation (LRO):
  1. Start: `POST https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-fast-generate-001:predictLongRunning` with `x-goog-api-key`.
  2. Poll: `GET /v1beta/{operation_name}` until `done`.
  3. Download: Follow the returned video `uri` (with `x-goog-api-key` header) and present as a Blob URL.
- The result can be downloaded or uploaded to the WP Media Library and selected in the media frame.

### Uploading to WordPress (Editor)
- Generated images/videos are uploaded via the WP REST API (`wp/v2/media`) using the localized root and nonce.
- When the active media frame is the Featured Image modal (state `"featured-image"`), the uploaded image is set as the Featured Image; otherwise it is just selected so users can insert it manually.

## Security & Privacy Notes
- The API key is stored in WordPress options and exposed to scripts only for authenticated contexts (localized into enqueued scripts). Do not commit your key.
- Image/video generation is performed client‑side, calling Google APIs directly from the browser; media uploaded to WordPress happens via the logged‑in user’s REST nonce.

## Usage

### Featured Image Enhancer (Editor)
1. Open the post editor and click “Set featured image”.
2. Select one or more images in the modal.
3. Click “Enhance with AI”.
4. Choose Background preference, Output style, and optionally enter a prompt.
5. Click Generate.
6. After generation, you may Regenerate, Download, Set image, and optionally Generate video.

### Frontend Try On (WooCommerce)
1. Open a single product page.
2. Click “Try on” next to the Add to cart button.
3. Upload a photo or use the camera, then click Try.
4. Download the result if you like it.

## Troubleshooting
- “Missing Google AI API key”: Go to the TryAura settings page and save a valid key.
- Buttons disabled or spinner stuck: Check browser console for network errors to Google APIs or WP REST.
- Featured image changes when using Add Media: This has been handled; featured image is only set inside the Featured Image frame.

## Limitations
- Frontend Try On does not upload results to the Media Library.
- Video generation depends on external long‑running operations; large queues may increase wait times.

## License
GPL‑2.0‑or‑later (matches the WordPress plugin header in `tryaura.php`)

## Credits
- Uses `@google/genai` and WordPress `@wordpress/*` packages.
- © TryAura Contributors.
