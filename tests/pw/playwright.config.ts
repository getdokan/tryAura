import { defineConfig, devices } from '@playwright/test';
import { ADMIN_STORAGE_STATE } from './utils/auth';

// The @lite and @pro suites run back to back in CI, so each needs its own report
// paths or the second run overwrites the first one's evidence.
const REPORT_DIR = process.env.E2E_REPORT_DIR || 'playwright-report';
// Deliberately NOT under test-results/: Playwright wipes its outputDir at the
// start of every run, so the @pro run would delete the @lite run's summary.
const RESULTS_JSON = process.env.E2E_RESULTS || 'test-summary/results.json';

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
				[ 'json', { outputFile: RESULTS_JSON } ],
				[ 'html', { open: 'never', outputFolder: REPORT_DIR } ],
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
		// Logs in once and writes the session to ADMIN_STORAGE_STATE. Runs first
		// because every other project depends on it.
		{ name: 'setup', testMatch: /_auth\.setup\.ts/ },
		{
			name: 'chromium',
			testMatch: /.*\.spec\.ts/,
			// Start every spec from the cached session instead of re-running the
			// login form per test (~2s each).
			use: {
				...devices[ 'Desktop Chrome' ],
				storageState: ADMIN_STORAGE_STATE,
			},
			dependencies: [ 'setup' ],
		},
	],
} );
