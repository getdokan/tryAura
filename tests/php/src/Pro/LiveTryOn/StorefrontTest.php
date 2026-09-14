<?php
/**
 * @package TryAura\Tests
 */

namespace Dokan\TryAura\Test\Pro\LiveTryOn;

use Dokan\TryAuraPro\Live\Settings;
use Dokan\TryAuraPro\Live\Storefront;

/**
 * Whether the Live try-on button loads on a product page, and what it receives.
 *
 * @group pro
 * @group live-try-on
 *
 * @covers \Dokan\TryAuraPro\Live\Storefront
 */
class StorefrontTest extends LiveTestCase {

	public function set_up(): void {
		parent::set_up();

		if ( ! wp_script_is( Storefront::SCRIPT_HANDLE, 'registered' ) ) {
			wp_register_script( Storefront::SCRIPT_HANDLE, 'https://example.org/live.js', array(), '1', true );
		}
	}

	public function tear_down(): void {
		wp_dequeue_script( Storefront::SCRIPT_HANDLE );
		wp_dequeue_style( Storefront::SCRIPT_HANDLE );

		$script = wp_scripts()->query( Storefront::SCRIPT_HANDLE );
		if ( $script ) {
			unset( $script->extra['before'] );
		}

		parent::tear_down();
	}

	/**
	 * Load a product page and run the Storefront enqueue.
	 *
	 * @param int $product_id Product ID.
	 */
	private function visit_product( int $product_id ): void {
		$this->go_to( get_permalink( $product_id ) );
		$GLOBALS['post'] = get_post( $product_id ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		setup_postdata( $GLOBALS['post'] );

		( new Storefront() )->enqueue();
	}

	/**
	 * Decoded `window.tryAuraLive` config printed before the script.
	 */
	private function page_config(): array {
		$before = (array) wp_scripts()->get_data( Storefront::SCRIPT_HANDLE, 'before' );
		$inline = implode( "\n", array_filter( $before ) );

		$this->assertMatchesRegularExpression( '/^window\.tryAuraLive = (\{.*\});$/s', trim( $inline ) );
		preg_match( '/^window\.tryAuraLive = (\{.*\});$/s', trim( $inline ), $matches );

		return (array) json_decode( $matches[1], true );
	}

	public function test_available_only_when_key_limits_product_and_image_allow_it(): void {
		$product    = $this->create_product();
		$storefront = static function () {
			return new Storefront();
		};

		$this->assertFalse( $storefront()->is_available( $product->get_id() ), 'No key.' );

		$this->store_key();
		$this->assertTrue( $storefront()->is_available( $product->get_id() ) );

		Settings::update( array( 'key_status' => Settings::KEY_STATUS_EXPIRING ) );
		$this->assertTrue( $storefront()->is_available( $product->get_id() ), 'Expiring keys still work.' );

		Settings::update( array( 'key_status' => Settings::KEY_STATUS_EXPIRED ) );
		$this->assertFalse( $storefront()->is_available( $product->get_id() ), 'Expired key.' );

		$this->store_key();
		Settings::pause_for_today();
		$this->assertFalse( $storefront()->is_available( $product->get_id() ), 'Paused for today.' );

		Settings::clear_pause();
		$this->assertFalse( $storefront()->is_available( $this->create_product( array( 'live' => 'no' ) )->get_id() ), 'Switched off.' );
		$this->assertFalse( $storefront()->is_available( $this->create_product( array( 'image' => false ) )->get_id() ), 'No image.' );
		$this->assertFalse( $storefront()->is_available( 999999 ), 'Not a product.' );
	}

	public function test_prints_a_typed_config_without_the_key(): void {
		$this->store_key();
		Settings::update(
			array(
				'max_session'    => 20,
				'start_mode'     => 'open',
				'logged_in_only' => true,
			)
		);
		$product = $this->create_product();

		$this->visit_product( $product->get_id() );

		$this->assertTrue( wp_script_is( Storefront::SCRIPT_HANDLE, 'enqueued' ) );

		$config = $this->page_config();
		$this->assertSame( $product->get_id(), $config['productId'] );
		$this->assertSame( 20, $config['maxSession'] );
		$this->assertSame( 'open', $config['startMode'] );
		$this->assertTrue( $config['loggedInOnly'] );
		$this->assertFalse( $config['isLoggedIn'] );
		$this->assertSame( Settings::default_consent_text(), $config['consentText'] );
		$this->assertStringContainsString( 'featured-', $config['referenceImageUrl'] );
		$this->assertStringContainsString( $product->get_name(), $config['prompt'] );
		$this->assertNotEmpty( $config['restUrl'] );
		$this->assertNotEmpty( $config['sessionNonce'] );

		$inline = implode( '', (array) wp_scripts()->get_data( Storefront::SCRIPT_HANDLE, 'before' ) );
		$this->assertStringNotContainsString( 'dct_', $inline );
		$this->assertStringNotContainsString( self::VALID_KEY, $inline );
	}

	public function test_config_cannot_break_out_of_the_script_tag(): void {
		$this->store_key();
		$product = $this->create_product( array( 'name' => 'Shirt </script><script>alert(1)</script>' ) );

		$this->visit_product( $product->get_id() );

		$inline = implode( '', (array) wp_scripts()->get_data( Storefront::SCRIPT_HANDLE, 'before' ) );
		$this->assertStringNotContainsStringIgnoringCase( '</script>', $inline );
	}

	public function test_privacy_link_only_when_switched_on_and_a_page_exists(): void {
		$this->store_key();
		$product = $this->create_product();
		$page_id = self::factory()->post->create(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
			)
		);
		update_option( 'wp_page_for_privacy_policy', $page_id );

		$this->visit_product( $product->get_id() );
		$this->assertNotSame( '', $this->page_config()['privacyUrl'] );

		wp_dequeue_script( Storefront::SCRIPT_HANDLE );
		unset( wp_scripts()->query( Storefront::SCRIPT_HANDLE )->extra['before'] );
		Settings::update( array( 'privacy_link' => false ) );

		$this->visit_product( $product->get_id() );
		$this->assertSame( '', $this->page_config()['privacyUrl'] );
	}

	public function test_nothing_loads_when_unavailable_or_off_product_pages(): void {
		$this->store_key();
		$off = $this->create_product( array( 'live' => 'no' ) );

		$this->visit_product( $off->get_id() );
		$this->assertFalse( wp_script_is( Storefront::SCRIPT_HANDLE, 'enqueued' ), 'Switched-off product.' );

		$this->create_product();
		$this->go_to( home_url( '/' ) );
		( new Storefront() )->enqueue();
		$this->assertFalse( wp_script_is( Storefront::SCRIPT_HANDLE, 'enqueued' ), 'Not a product page.' );
	}

	public function test_missing_build_does_not_break_the_page(): void {
		$this->store_key();
		$product = $this->create_product();
		wp_deregister_script( Storefront::SCRIPT_HANDLE );

		$this->visit_product( $product->get_id() );

		$this->assertFalse( wp_script_is( Storefront::SCRIPT_HANDLE, 'enqueued' ) );
	}
}
