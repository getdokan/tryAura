import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the TryAura E2E suite (runs against wp-env's "tests"
 * instance on port 8899). No test calls the real Gemini API — the browser path
 * is stubbed via page.route and the server path via the guard mu-plugin
 * (see docs/adr/0002-token-free-test-strategy.md).
 */
export default defineConfig( {
	testDir: './tests/e2e',
	globalSetup: './global-setup.ts',
	timeout: 30_000,
	expect: { timeout: 10_000 },
	fullyParallel: false,
	forbidOnly: !! process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	// On CI the `github` reporter alone only annotates failures, so a passing run
	// leaves no trace that anything ran. `list` puts every test in the build log,
	// `json` feeds scripts/ci-summary.mjs (the job summary), and `html` is
	// uploaded as an artifact.
	reporter: process.env.CI
		? [
				[ 'list' ],
				[ 'github' ],
				[ 'json', { outputFile: 'test-results/results.json' } ],
				[ 'html', { open: 'never', outputFolder: 'playwright-report' } ],
		  ]
		: 'list',
	use: {
		baseURL: process.env.WP_BASE_URL || 'http://localhost:8899',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		// Watch it live: `PW_SLOWMO=800 npm run test:e2e -- --headed`.
		launchOptions: { slowMo: Number( process.env.PW_SLOWMO ) || 0 },
	},
	projects: [
		{ name: 'chromium', use: { ...devices[ 'Desktop Chrome' ] } },
	],
} );
