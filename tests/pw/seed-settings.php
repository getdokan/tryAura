<?php
/**
 * Seeds a dummy Gemini API key into tryaura_settings when none is set.
 *
 * PreviewModal bails out before it ever calls Gemini if google.apiKey is empty
 * (src/admin/enhancer/PreviewModal.tsx), so on a clean database the enhancer and
 * image-config specs have nothing to intercept. Only settings-save.spec.ts writes
 * a key, and with workers: 1 it runs after them — locally those specs only pass
 * because the dev database already holds a key.
 *
 * The key is fake and never leaves the browser: every Gemini request is stubbed
 * by page.route in the specs and by the guard mu-plugin server-side. See
 * docs/adr/0002-token-free-test-strategy.md.
 *
 * Run via: wp eval-file wp-content/plugins/tryaura/tests/pw/seed-settings.php
 */

// phpcs:disable

$settings = get_option( 'tryaura_settings', array() );
$settings = is_array( $settings ) ? $settings : array();
$google   = isset( $settings['google'] ) && is_array( $settings['google'] ) ? $settings['google'] : array();

if ( empty( $google['apiKey'] ) ) {
	$google['apiKey']     = 'AIza-e2e-test-key';
	$settings['google']   = $google;

	update_option( 'tryaura_settings', $settings );

	WP_CLI::success( 'Seeded a test Gemini API key.' );
} else {
	WP_CLI::log( 'Gemini API key already set — left as is.' );
}
