import { execSync } from 'child_process';

/**
 * Reset per-run state before the suite: clear the admin's promo-banner dismissal
 * so the banner is visible again (the promo-banner spec dismisses it, which would
 * otherwise poison later runs).
 */
export default function globalSetup(): void {
	// Clear the promo-banner dismissal so the banner is visible again.
	try {
		execSync(
			'npx wp-env run tests-cli wp user meta delete admin _tryaura_promo_banner_dismissed_at',
			{ stdio: 'ignore' }
		);
	} catch ( e ) {
		// The meta may not exist yet — that's fine.
	}

	// Ensure the media library has at least one image — the enhancer specs open
	// the media modal and select one (a clean/CI DB would otherwise be empty).
	try {
		const count = execSync(
			'npx wp-env run tests-cli wp post list --post_type=attachment --post_mime_type=image --format=count',
			{ encoding: 'utf8' }
		).trim();
		if ( ! parseInt( count, 10 ) ) {
			execSync(
				'npx wp-env run tests-cli wp media import wp-content/plugins/tryaura/tests/pw/fixtures/sample.png --title="TryAura E2E Sample"',
				{ stdio: 'ignore' }
			);
		}
	} catch ( e ) {
		// best effort — if this fails the enhancer specs will surface it clearly
	}
}
