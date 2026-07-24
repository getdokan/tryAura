<?php
/**
 * PHPUnit bootstrap for the TryAura test suite.
 *
 * Uses the wp-phpunit package (no svn needed) for the WordPress test scaffolding,
 * loads the plugin on muplugins_loaded, and creates the plugin's tables after WP
 * is installed. No test ever calls the real Gemini API (see docs/adr/0002).
 *
 * @package TryAura\Tests
 */

define( 'TRYAURA_TESTS_DIR', __DIR__ );
define( 'TRYAURA_PLUGIN_ROOT', dirname( __DIR__, 2 ) );

// Composer autoload must load first so wp-phpunit can set WP_PHPUNIT__DIR.
require_once TRYAURA_PLUGIN_ROOT . '/vendor/autoload.php';

$_tests_dir = getenv( 'WP_TESTS_DIR' ) ?: getenv( 'WP_PHPUNIT__DIR' );

if ( ! $_tests_dir ) {
	$_tests_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib';
}

if ( ! file_exists( $_tests_dir . '/includes/functions.php' ) ) {
	echo "Could not find {$_tests_dir}/includes/functions.php — is wp-phpunit/wp-phpunit installed? Run composer install.\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	exit( 1 );
}

// Gives us tests_add_filter().
require_once $_tests_dir . '/includes/functions.php';

define( 'TEST_WC_DIR', dirname( TRYAURA_PLUGIN_ROOT ) . '/woocommerce' );

// Load WooCommerce (if present) then the plugin, once mu-plugins have loaded.
tests_add_filter(
	'muplugins_loaded',
	function () {
		if ( ! defined( 'WC_USE_TRANSACTIONS' ) ) {
			define( 'WC_USE_TRANSACTIONS', false );
		}
		if ( file_exists( TEST_WC_DIR . '/woocommerce.php' ) ) {
			require TEST_WC_DIR . '/woocommerce.php';
		}
		require TRYAURA_PLUGIN_ROOT . '/tryaura.php';
	}
);

// Install WooCommerce, then create the plugin's tables, after WP is installed.
tests_add_filter(
	'setup_theme',
	function () {
		if ( class_exists( '\WC_Install' ) ) {
			\WC_Install::install();
			\WC_Install::create_tables();
		}
		\Dokan\TryAura\Common\Installer::create_tables();
	}
);

// Boot the WordPress test environment.
require $_tests_dir . '/includes/bootstrap.php';
