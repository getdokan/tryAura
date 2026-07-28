<?php
/**
 * WordPress test configuration used by wp-phpunit.
 *
 * Points ABSPATH at the local WordPress codebase and a throwaway test database.
 * WARNING: every run DROPS ALL TABLES with the prefix below — never point this at
 * a real database.
 *
 * @package TryAura\Tests
 */

// The WordPress codebase to test against (the local install five levels up).
define( 'ABSPATH', dirname( __DIR__, 5 ) . '/' );

define( 'WP_DEFAULT_THEME', 'default' );
define( 'WP_DEBUG', true );

// ** Database ** //
define( 'DB_NAME', getenv( 'WP_DB_NAME' ) ?: 'tryaura_tests' );
define( 'DB_USER', getenv( 'WP_DB_USER' ) ?: 'root' );
define( 'DB_PASSWORD', false !== getenv( 'WP_DB_PASS' ) ? getenv( 'WP_DB_PASS' ) : 'root' );
define( 'DB_HOST', getenv( 'WP_DB_HOST' ) ?: 'localhost' );
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );

// Salts — fixed values are fine for a disposable test database.
define( 'AUTH_KEY', 'tryaura-tests' );
define( 'SECURE_AUTH_KEY', 'tryaura-tests' );
define( 'LOGGED_IN_KEY', 'tryaura-tests' );
define( 'NONCE_KEY', 'tryaura-tests' );
define( 'AUTH_SALT', 'tryaura-tests' );
define( 'SECURE_AUTH_SALT', 'tryaura-tests' );
define( 'LOGGED_IN_SALT', 'tryaura-tests' );
define( 'NONCE_SALT', 'tryaura-tests' );

$table_prefix = 'tatest_'; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

define( 'WP_TESTS_DOMAIN', 'example.org' );
define( 'WP_TESTS_EMAIL', 'admin@example.org' );
define( 'WP_TESTS_TITLE', 'TryAura Tests' );
define( 'WP_PHP_BINARY', 'php' );
define( 'WPLANG', '' );
