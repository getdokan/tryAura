<?php
/**
 * Plugin Name: TryAura Test Guard
 * Description: Test-environment only. Stubs every Gemini call (so the server-side
 *              try-on path never spends a token) and blocks wordpress.org update
 *              checks that stall admin renders. See docs/adr/0002.
 */

// phpcs:disable

// --- Disable auto-updates / update checks (they stall fresh-install admin renders). ---
add_filter( 'automatic_updater_disabled', '__return_true' );
remove_action( 'admin_init', '_maybe_update_core' );
remove_action( 'admin_init', '_maybe_update_plugins' );
remove_action( 'admin_init', '_maybe_update_themes' );

// --- Stub Gemini + block wordpress.org, before any real request goes out. ---
add_filter(
	'pre_http_request',
	static function ( $pre, $args, $url ) {
		$host = (string) wp_parse_url( $url, PHP_URL_HOST );

		// The server-side try-on path calls generativelanguage.googleapis.com —
		// return a canned image so no token is ever spent.
		if ( '' !== $host && false !== strpos( $host, 'generativelanguage.googleapis.com' ) ) {
			return array(
				'response' => array( 'code' => 200, 'message' => 'OK' ),
				'body'     => wp_json_encode(
					array(
						'candidates' => array(
							array(
								'content' => array(
									'parts' => array(
										array(
											'inlineData' => array(
												'mimeType' => 'image/png',
												'data'     => 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
											),
										),
									),
								),
							),
						),
						'usageMetadata' => array(
							'promptTokenCount'     => 12,
							'candidatesTokenCount' => 34,
							'totalTokenCount'      => 46,
						),
					)
				),
				'headers'  => array(),
			);
		}

		// Fail wordpress.org calls instantly (wp-env already provisioned everything locally).
		if ( '' !== $host && false !== strpos( $host, 'wordpress.org' ) ) {
			return new WP_Error( 'tryaura_test_http_blocked', 'wordpress.org HTTP disabled in test env' );
		}

		return $pre;
	},
	10,
	3
);

// --- Simulate an active TryAura Pro license in the test env. Real activation needs a
// valid key + the Appsero license server; CI has neither. Faking the option Appsero
// reads ({ key, status: 'activate' }) makes is_valid() → true, cascading to
// is_pro_exists() AND loading the Pro feature UI. Only applies when tryaura-pro is
// active, so @lite runs (Pro deactivated) are unaffected. ---
add_filter(
	'pre_option_tryaura_pro_license',
	static function ( $pre ) {
		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		if ( is_plugin_active( 'tryaura-pro/tryaura-pro.php' ) ) {
			return array(
				'key'         => 'e2e-test-key',
				'status'      => 'activate',
				'expiry_days' => false,
			);
		}
		return $pre;
	},
	10
);

// phpcs:enable
