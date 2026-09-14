<?php
/**
 * @package TryAura\Tests
 */

namespace Dokan\TryAura\Test\Pro\LiveTryOn;

use Dokan\TryAura\Database\UsageManager;
use Dokan\TryAuraPro\Live\KeyVault;
use Dokan\TryAuraPro\Live\Origin;
use Dokan\TryAuraPro\Live\Product;
use Dokan\TryAuraPro\Live\REST\SessionController;
use Dokan\TryAuraPro\Live\Settings;

/**
 * POST /live/session-token: the seven checks, their order, the mint and the ledger row.
 *
 * @group pro
 * @group live-try-on
 *
 * @covers \Dokan\TryAuraPro\Live\REST\SessionController
 * @covers \Dokan\TryAuraPro\Live\Ledger
 * @covers \Dokan\TryAuraPro\Live\Shopper
 */
class SessionTokenTest extends LiveTestCase {

	private int $product_id;

	public function set_up(): void {
		parent::set_up();

		$this->store_key();
		$this->product_id = $this->create_product()->get_id();
		$this->fake_decart_token();
		$this->as_guest();
	}

	public function test_mints_a_scoped_token_and_records_the_session(): void {
		Settings::update( array( 'max_session' => 45 ) );

		$response = $this->request_token( $this->product_id );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( 'ek_phpunit_token', $data['apiKey'] );
		$this->assertSame( 45, $data['maxSessionDuration'] );
		$this->assertSame( 'lucy-vton-3.5', $data['model'] );
		$this->assertStringContainsString( 'featured-', $data['referenceImageUrl'] );
		$this->assertStringContainsString( 'Linen Shirt', $data['prompt'] );
		$this->assertMatchesRegularExpression( '/^\d+\.[a-f0-9]{20}$/', $data['sessionRef'] );
		$this->assertSame( 'no-store', $response->get_headers()['Cache-Control'] ?? '' );

		// Nothing the modal needs before the mint, and never the permanent key.
		$this->assertArrayNotHasKey( 'consentText', $data );
		$this->assertArrayNotHasKey( 'startMode', $data );
		$this->assertStringNotContainsString( 'dct_', wp_json_encode( $data ) );

		$this->assertCount( 1, $this->decart_requests );
		$request = $this->decart_requests[0];
		$this->assertSame( self::VALID_KEY, $request['headers']['x-api-key'] );
		$this->assertSame( 15, $request['body']['expiresIn'] );
		$this->assertSame( array( 'lucy-vton-3.5' ), $request['body']['allowedModels'] );
		$this->assertSame( array( Origin::canonical() ), $request['body']['allowedOrigins'] );
		$this->assertSame( 45, $request['body']['constraints']['realtime']['maxSessionDuration'] );
		$this->assertSame( $this->product_id, $request['body']['metadata']['product_id'] );
		$this->assertStringStartsWith( 'g:', $request['body']['metadata']['shopper_ref'] );

		$rows = $this->live_rows();
		$this->assertCount( 1, $rows );
		$this->assertSame( 'decart', $rows[0]['provider'] );
		$this->assertSame( 'lucy-vton-3.5', $rows[0]['model'] );
		$this->assertSame( 'video', $rows[0]['type'] );
		$this->assertSame( 'tryon', $rows[0]['generated_from'] );
		$this->assertSame( 'success', $rows[0]['status'] );
		$this->assertSame( '0', (string) $rows[0]['user_id'] );
		$this->assertSame( (string) $this->product_id, (string) $rows[0]['object_id'] );
		$this->assertSame( $data['prompt'], $rows[0]['prompt'] );

		$meta = $this->row_meta( $rows[0] );
		$this->assertSame( 'minted', $meta['state'] );
		$this->assertSame( 45, $meta['cap'] );
		$this->assertSame( 'tap', $meta['start_mode'] );
		$this->assertSame( $request['body']['metadata']['shopper_ref'], $meta['shopper_ref'] );
	}

	public function test_signed_in_shopper_is_counted_by_account(): void {
		$user_id = self::factory()->user->create( array( 'role' => 'customer' ) );
		wp_set_current_user( $user_id );

		$this->assertSame( 200, $this->request_token( $this->product_id )->get_status() );

		$row = $this->live_rows()[0];
		$this->assertSame( (string) $user_id, (string) $row['user_id'] );
		$this->assertSame( 'u:' . $user_id, $this->row_meta( $row )['shopper_ref'] );
	}

	public function test_invalid_nonce_is_refused_before_anything_else(): void {
		Settings::update( array( 'key_status' => Settings::KEY_STATUS_EXPIRED ) );

		$response = $this->request_token( $this->product_id, 'not-a-nonce' );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'bad_nonce', $this->reason( $response ) );
		$this->assertSame( array(), $this->decart_requests );
	}

	public function test_missing_nonce_or_bad_product_id_fail_validation(): void {
		$missing_nonce = $this->dispatch( 'POST', '/tryaura/v1/live/session-token', array( 'product_id' => $this->product_id ) );
		$this->assertSame( 400, $missing_nonce->get_status() );

		$bad_id = $this->dispatch(
			'POST',
			'/tryaura/v1/live/session-token',
			array(
				'product_id' => 'shirt',
				'nonce'      => wp_create_nonce( SessionController::NONCE_ACTION ),
			)
		);
		$this->assertSame( 400, $bad_id->get_status() );
	}

	public function test_nonce_from_another_user_is_refused(): void {
		$guest_nonce = wp_create_nonce( SessionController::NONCE_ACTION );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'customer' ) ) );

		$this->assertSame( 'bad_nonce', $this->reason( $this->request_token( $this->product_id, $guest_nonce ) ) );
	}

	/**
	 * @dataProvider unusable_keys
	 */
	public function test_unusable_key_is_refused_without_calling_decart( callable $break_key ): void {
		$break_key();

		$response = $this->request_token( $this->product_id );

		$this->assertSame( 503, $response->get_status() );
		$this->assertSame( 'key_unavailable', $this->reason( $response ) );
		$this->assertSame( array(), $this->decart_requests );
		$this->assertSame( array(), $this->live_rows() );
	}

	public static function unusable_keys(): array {
		return array(
			'no key saved'    => array(
				static function () {
					delete_option( Settings::OPTION_KEY );
				},
			),
			'key expired'     => array(
				static function () {
					Settings::update( array( 'key_status' => Settings::KEY_STATUS_EXPIRED ) );
				},
			),
			'status valid but key blank' => array(
				static function () {
					Settings::update( array( 'key' => '' ) );
				},
			),
		);
	}

	public function test_expiring_key_still_works(): void {
		Settings::update( array( 'key_status' => Settings::KEY_STATUS_EXPIRING ) );

		$this->assertSame( 200, $this->request_token( $this->product_id )->get_status() );
	}

	public function test_undecryptable_key_is_refused_and_marked_expired(): void {
		Settings::update( array( 'key_salt' => KeyVault::new_salt() ) );

		$response = $this->request_token( $this->product_id );

		$this->assertSame( 'key_unavailable', $this->reason( $response ) );
		$this->assertSame( 'expired', Settings::get()['key_status'] );
		$this->assertSame( array(), $this->decart_requests );
	}

	public function test_signed_in_only_refuses_guests_but_not_members(): void {
		Settings::update( array( 'logged_in_only' => true ) );

		$guest = $this->request_token( $this->product_id );
		$this->assertSame( 401, $guest->get_status() );
		$this->assertSame( 'login_required', $this->reason( $guest ) );

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'customer' ) ) );
		$this->assertSame( 200, $this->request_token( $this->product_id )->get_status() );
	}

	public function test_products_that_cannot_run_live_try_on_are_refused(): void {
		$cases = array(
			'does not exist'  => 999999,
			'draft'           => $this->create_product( array( 'status' => 'draft' ) )->get_id(),
			'switched off'    => $this->create_product( array( 'live' => 'no' ) )->get_id(),
			'never switched'  => $this->create_product( array( 'live' => null ) )->get_id(),
			'no image'        => $this->create_product( array( 'image' => false ) )->get_id(),
		);

		// Photo try-on being on must not make Live available.
		update_post_meta( $cases['never switched'], '_tryaura_try_on_enabled', 'yes' );

		foreach ( $cases as $label => $product_id ) {
			$response = $this->request_token( $product_id );

			$this->assertSame( 404, $response->get_status(), $label );
			$this->assertSame( 'product_unavailable', $this->reason( $response ), $label );
		}

		$this->assertSame( array(), $this->decart_requests );
	}

	public function test_gallery_image_only_product_is_allowed(): void {
		$product_id = $this->create_product(
			array(
				'image'   => false,
				'gallery' => 1,
			)
		)->get_id();

		$response = $this->request_token( $product_id );

		$this->assertSame( 200, $response->get_status() );
		$this->assertStringContainsString( 'gallery-0', $response->get_data()['referenceImageUrl'] );
	}

	public function test_checks_run_in_the_documented_order(): void {
		// Expired key (check 2) wins over a paused store (check 7).
		Settings::update( array( 'key_status' => Settings::KEY_STATUS_EXPIRED ) );
		Settings::pause_for_today();
		$this->assertSame( 'key_unavailable', $this->reason( $this->request_token( $this->product_id ) ) );

		// Signed-in rule (check 3) wins over a missing product (check 4).
		$this->store_key();
		Settings::clear_pause();
		Settings::update( array( 'logged_in_only' => true ) );
		$this->assertSame( 'login_required', $this->reason( $this->request_token( 999999 ) ) );

		// Rate limit (check 5) wins over the per-shopper limit (check 6).
		Settings::update(
			array(
				'logged_in_only'    => false,
				'per_shopper_limit' => 1,
			)
		);
		add_filter(
			'tryaura_live_rate_limit_per_minute',
			static function () {
				return 1;
			}
		);
		$this->request_token( $this->product_id );
		$this->assertSame( 'rate_limited', $this->reason( $this->request_token( $this->product_id ) ) );
	}

	public function test_rate_limit_is_per_ip(): void {
		add_filter(
			'tryaura_live_rate_limit_per_minute',
			static function () {
				return 2;
			}
		);

		$this->assertSame( 200, $this->request_token( $this->product_id )->get_status() );
		$this->assertSame( 200, $this->request_token( $this->product_id )->get_status() );

		$third = $this->request_token( $this->product_id );
		$this->assertSame( 429, $third->get_status() );
		$this->assertSame( 'rate_limited', $this->reason( $third ) );

		$_SERVER['REMOTE_ADDR'] = '198.51.100.7';
		$this->assertSame( 200, $this->request_token( $this->product_id )->get_status() );
	}

	public function test_refused_requests_before_check_five_do_not_use_the_rate_limit(): void {
		add_filter(
			'tryaura_live_rate_limit_per_minute',
			static function () {
				return 1;
			}
		);

		$this->request_token( $this->product_id, 'bad-nonce' );
		$this->request_token( 999999 );

		$this->assertSame( 200, $this->request_token( $this->product_id )->get_status() );
	}

	public function test_rate_limit_window_resets_after_a_minute(): void {
		set_transient(
			'tryaura_live_rl_' . md5( '203.0.113.10' ),
			array(
				'start' => time() - 61,
				'count' => 99,
			),
			MINUTE_IN_SECONDS
		);

		$this->assertSame( 200, $this->request_token( $this->product_id )->get_status() );
	}

	public function test_invalid_remote_address_falls_back_safely(): void {
		$_SERVER['REMOTE_ADDR'] = 'not-an-ip';

		$this->assertSame( 200, $this->request_token( $this->product_id )->get_status() );
	}

	public function test_per_shopper_limit(): void {
		Settings::update( array( 'per_shopper_limit' => 1 ) );

		$this->assertSame( 200, $this->request_token( $this->product_id )->get_status() );

		$second = $this->request_token( $this->product_id );
		$this->assertSame( 429, $second->get_status() );
		$this->assertSame( 'shopper_limit', $this->reason( $second ) );

		// Another device is another shopper.
		$_SERVER['HTTP_USER_AGENT'] = 'Another browser';
		$this->assertSame( 200, $this->request_token( $this->product_id )->get_status() );
	}

	public function test_daily_limit_pauses_the_store_without_touching_the_key(): void {
		Settings::update( array( 'daily_limit' => 2 ) );

		$this->assertSame( 200, $this->request_token( $this->product_id )->get_status() );
		$this->assertFalse( Settings::is_limit_paused() );

		// The session that uses up the limit pauses the store straight away.
		$_SERVER['REMOTE_ADDR'] = '198.51.100.1';
		$this->assertSame( 200, $this->request_token( $this->product_id )->get_status() );
		$this->assertTrue( Settings::is_limit_paused() );

		$_SERVER['REMOTE_ADDR'] = '198.51.100.2';
		$third = $this->request_token( $this->product_id );
		$this->assertSame( 429, $third->get_status() );
		$this->assertSame( 'daily_limit', $this->reason( $third ) );
		$this->assertSame( 'valid', Settings::get()['key_status'] );
	}

	public function test_paused_store_is_refused_even_below_the_limit(): void {
		Settings::pause_for_today();

		$this->assertSame( 'daily_limit', $this->reason( $this->request_token( $this->product_id ) ) );
	}

	public function test_yesterdays_pause_and_sessions_do_not_count(): void {
		Settings::update(
			array(
				'daily_limit'     => 1,
				'limit_paused'    => true,
				'limit_paused_on' => wp_date( 'Y-m-d', time() - DAY_IN_SECONDS ),
			)
		);

		$old_id = ( new UsageManager() )->log_usage(
			array(
				'provider'       => 'decart',
				'type'           => 'video',
				'generated_from' => 'tryon',
				'status'         => 'success',
				'meta'           => array( 'state' => 'completed' ),
			)
		);
		$this->age_row( (int) $old_id, '1 DAY' );

		$this->assertSame( 200, $this->request_token( $this->product_id )->get_status() );
	}

	public function test_rejected_key_at_mint_marks_it_expired(): void {
		$this->fake_decart( 401, array( 'error' => 'Invalid or expired API key' ) );

		$response = $this->request_token( $this->product_id );

		$this->assertSame( 503, $response->get_status() );
		$this->assertSame( 'key_invalid', $this->reason( $response ) );
		$this->assertSame( 'expired', Settings::get()['key_status'] );
		$this->assertSame( array(), $this->live_rows() );

		// The next shopper is refused without another Decart call.
		$this->decart_requests = array();
		$this->assertSame( 'key_unavailable', $this->reason( $this->request_token( $this->product_id ) ) );
		$this->assertSame( array(), $this->decart_requests );
	}

	/**
	 * @dataProvider decart_failures
	 */
	public function test_decart_failures_record_nothing( int $status, ?array $body ): void {
		$this->fake_decart( $status, $body );

		$response = $this->request_token( $this->product_id );

		$this->assertSame( 503, $response->get_status() );
		$this->assertSame( 'unavailable', $this->reason( $response ) );
		$this->assertSame( array(), $this->live_rows() );
		$this->assertSame( 'valid', Settings::get()['key_status'] );
		$this->assertFalse( Settings::is_limit_paused() );
	}

	public static function decart_failures(): array {
		return array(
			'rate limited (429)'          => array( 429, array( 'error' => 'slow down' ) ),
			'server error (500)'          => array( 500, null ),
			'forbidden (403)'             => array( 403, array( 'error' => 'model not allowed' ) ),
			'bad request (400)'           => array( 400, array( 'detail' => 'bad body' ) ),
			'network timeout'             => array( 0, null ),
			'200 without a token'         => array( 200, array( 'expiresAt' => '2030-01-01T00:00:00Z' ) ),
		);
	}

	public function test_reference_image_and_prompt_follow_the_product_settings(): void {
		$product    = $this->create_product( array( 'gallery' => 1 ) );
		$gallery_id = $product->get_gallery_image_ids()[0];

		update_post_meta( $product->get_id(), Product::IMAGE_META, $gallery_id );
		update_post_meta( $product->get_id(), Product::PROMPT_META, 'Substitute the upper body garment with a blue linen shirt.' );

		$data = $this->request_token( $product->get_id() )->get_data();
		$this->assertStringContainsString( 'gallery-0', $data['referenceImageUrl'] );
		$this->assertSame( 'Substitute the upper body garment with a blue linen shirt.', $data['prompt'] );

		// An image that no longer belongs to the product falls back to the featured image.
		update_post_meta( $product->get_id(), Product::IMAGE_META, $this->create_image( 'someone-else.jpg' ) );
		$_SERVER['REMOTE_ADDR'] = '198.51.100.9';
		$data = $this->request_token( $product->get_id() )->get_data();
		$this->assertStringContainsString( 'featured-', $data['referenceImageUrl'] );
	}
}
