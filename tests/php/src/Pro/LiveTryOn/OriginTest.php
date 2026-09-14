<?php
/**
 * @package TryAura\Tests
 */

namespace Dokan\TryAura\Test\Pro\LiveTryOn;

use Dokan\TryAuraPro\Live\Origin;

/**
 * Canonical store origin sent as `allowedOrigins`.
 *
 * @group pro
 * @group live-try-on
 *
 * @covers \Dokan\TryAuraPro\Live\Origin
 */
class OriginTest extends LiveTestCase {

	/**
	 * @dataProvider urls
	 */
	public function test_canonical_origin( string $url, string $expected ): void {
		$this->assertSame( $expected, Origin::canonical( $url ) );
	}

	public static function urls(): array {
		return array(
			'uppercase host and trailing slash'  => array( 'https://Shop.Example.com/', 'https://shop.example.com' ),
			'default http port dropped'          => array( 'http://shop.example.com:80', 'http://shop.example.com' ),
			'default https port dropped'         => array( 'https://shop.example.com:443/', 'https://shop.example.com' ),
			'custom port kept'                   => array( 'https://shop.example.com:8443/store', 'https://shop.example.com:8443' ),
			'http port on https is not default'  => array( 'https://shop.example.com:80', 'https://shop.example.com:80' ),
			'path, query and fragment dropped'   => array( 'https://shop.example.com/sub/dir?x=1#top', 'https://shop.example.com' ),
			'uppercase scheme'                   => array( 'HTTPS://shop.example.com', 'https://shop.example.com' ),
			'subdomain kept'                     => array( 'https://www.shop.example.com', 'https://www.shop.example.com' ),
			'IPv4 host with port'                => array( 'http://127.0.0.1:8080/wp', 'http://127.0.0.1:8080' ),
			'no host'                            => array( '/relative/path', '' ),
		);
	}

	public function test_defaults_to_home_url(): void {
		update_option( 'home', 'https://Store.Example.org/shop/' );

		$this->assertSame( 'https://store.example.org', Origin::canonical() );
	}
}
