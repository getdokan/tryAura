# Token-free test strategy

TryAura generates through Google Gemini, which bills per token, and it calls Gemini from
two places — the admin **Enhancer** (in the browser via `@google/genai`) and the customer
**Try-On** (server-side via `wp_remote_post` in `GenerateController`). We want a test
suite, modelled on dokan-lite, that can run unlimited times — locally and in CI — at zero
API cost.

## Decision

No automated test ever calls the real Gemini API. Two tiers, both fully stubbed:

- **PHPUnit** (dokan-style, boots real WordPress + WooCommerce) stubs the server-side
  Try-On call with a `pre_http_request` filter on the base TestCase.
- **Playwright E2E** (on `@wordpress/env`) stubs the browser Enhancer call with
  `page.route('**/generativelanguage.googleapis.com/**')` and the server Try-On call with
  a `pre_http_request` mu-plugin loaded into the test environment.

Fixtures are **100% synthetic and hand-authored** from the response shapes already visible
in the code (a 1×1 base64 PNG inside the image JSON; a few-KB stub MP4 plus a "done"
operation JSON with a rewritten fake `uri` for video). There is **no live-smoke tier**. If
a real sample is ever needed to shape a fixture, a human captures it out-of-band and hands
over the data — the test code still never calls the API.

## Considered options

- **Record-once, replay-forever** (spend a handful of real calls one time, commit the real
  responses, replay from then on). Rejected: even a one-time cost was declined, and the
  response shapes are simple enough to hand-author accurately from the code.
- **Record-once + a nightly opt-in live-smoke** to catch Gemini response-shape drift.
  Rejected for the same cost reason; drift is accepted as a known risk.

## Consequences

- If Google changes a Gemini response shape, the suite won't notice until production —
  mitigated by keeping fixtures minimal and refreshing them whenever a real sample is
  supplied.
- Video generation is Pro-only (Veo), so the fake-`uri` / stub-MP4 fixtures belong to the
  **Pro** suite. The free suite only asserts the **locked** Video tab, never a Veo flow.
- This is the one place the suite deliberately deviates from dokan-lite, which does no HTTP
  stubbing at all — the stub layer is ours to introduce and maintain.
