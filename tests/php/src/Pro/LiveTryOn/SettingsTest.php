<?php
/**
 * @package TryAura\Tests
 */

namespace Dokan\TryAura\Test\Pro\LiveTryOn;

use Dokan\TryAuraPro\Live\Settings;

/**
 * Live Try-On settings: validation, permissions and what the admin screen receives.
 *
 * @group pro
 * @group live-try-on
 *
 * @covers \Dokan\TryAuraPro\Live\Settings
 * @covers \Dokan\TryAuraPro\Live\REST\SettingsController
 */
class SettingsTest extends LiveTestCase {

	private function save( array $values ) {
		return $this->dispatch( 'POST', '/tryaura/v1/live/settings', $values );
	}

	public function test_admin_screen_gets_defaults_and_never_the_key(): void {
		$this->as_admin();
		$this->store_key();

		$data = $this->dispatch( 'GET', '/tryaura/v1/live/settings' )->get_data();

		$this->assertSame( 'valid', $data['key_status'] );
		$this->assertSame( 'abcd', $data['key_last4'] );
		$this->assertSame( 30, $data['max_session'] );
		$this->assertSame( 'tap', $data['start_mode'] );
		$this->assertSame( 100, $data['daily_limit'] );
		$this->assertSame( 3, $data['per_shopper_limit'] );
		$this->assertFalse( $data['logged_in_only'] );
		$this->assertTrue( $data['privacy_link'] );
		$this->assertSame( Settings::default_consent_text(), $data['consent_text'] );

		foreach ( array( 'key', 'key_salt', 'key_fingerprint' ) as $secret ) {
			$this->assertArrayNotHasKey( $secret, $data );
		}
		$this->assertStringNotContainsString( self::VALID_KEY, wp_json_encode( $data ) );
	}

	public function test_routes_require_manage_options(): void {
		$this->as_guest();
		$this->assertSame( 401, $this->dispatch( 'GET', '/tryaura/v1/live/settings' )->get_status() );

		// A shop manager can edit products but not store-wide settings.
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'shop_manager' ) ) );

		$this->assertSame( 403, $this->dispatch( 'GET', '/tryaura/v1/live/settings' )->get_status() );
		$this->assertSame( 403, $this->save( array( 'daily_limit' => 5 ) )->get_status() );
		$this->assertSame( 403, $this->dispatch( 'POST', '/tryaura/v1/live/key', array( 'key' => self::VALID_KEY ) )->get_status() );
		$this->assertSame( 403, $this->dispatch( 'DELETE', '/tryaura/v1/live/key' )->get_status() );
		$this->assertSame( 403, $this->dispatch( 'POST', '/tryaura/v1/live/bulk', array( 'enabled' => true ) )->get_status() );
		$this->assertSame( array(), $this->decart_requests );
	}

	/**
	 * @dataProvider max_session_values
	 */
	public function test_max_session_bounds( $value, bool $accepted ): void {
		$this->as_admin();

		$response = $this->save( array( 'max_session' => $value ) );

		$this->assertSame( $accepted ? 200 : 400, $response->get_status() );
		$this->assertSame( $accepted ? (int) $value : 30, (int) Settings::get()['max_session'] );
	}

	public static function max_session_values(): array {
		return array(
			'minimum'        => array( 10, true ),
			'maximum'        => array( 60, true ),
			'numeric string' => array( '45', true ),
			'below minimum'  => array( 9, false ),
			'above maximum'  => array( 61, false ),
			'negative'       => array( -30, false ),
			'fraction'       => array( 30.5, false ),
			'text'           => array( 'thirty', false ),
		);
	}

	/**
	 * @dataProvider limit_values
	 */
	public function test_session_limits_must_be_at_least_one( string $field, $value, bool $accepted ): void {
		$this->as_admin();

		$response = $this->save( array( $field => $value ) );

		$this->assertSame( $accepted ? 200 : 400, $response->get_status() );
	}

	public static function limit_values(): array {
		return array(
			'daily one'         => array( 'daily_limit', 1, true ),
			'daily zero'        => array( 'daily_limit', 0, false ),
			'daily negative'    => array( 'daily_limit', -5, false ),
			'daily text'        => array( 'daily_limit', 'lots', false ),
			'per shopper one'   => array( 'per_shopper_limit', 1, true ),
			'per shopper zero'  => array( 'per_shopper_limit', 0, false ),
			'per shopper float' => array( 'per_shopper_limit', 2.5, false ),
		);
	}

	public function test_start_mode_accepts_only_known_modes(): void {
		$this->as_admin();

		$this->assertSame( 400, $this->save( array( 'start_mode' => 'always' ) )->get_status() );
		$this->assertSame( 200, $this->save( array( 'start_mode' => 'open' ) )->get_status() );
		$this->assertSame( 'open', Settings::get()['start_mode'] );
	}

	public function test_one_invalid_field_saves_nothing(): void {
		$this->as_admin();

		$response = $this->save(
			array(
				'daily_limit' => 50,
				'max_session' => 99,
			)
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 100, (int) Settings::get()['daily_limit'] );
	}

	public function test_partial_update_keeps_other_fields(): void {
		$this->as_admin();
		$this->save(
			array(
				'max_session'    => 20,
				'logged_in_only' => true,
			)
		);

		$this->save( array( 'daily_limit' => 7 ) );

		$settings = Settings::get();
		$this->assertSame( 20, (int) $settings['max_session'] );
		$this->assertTrue( (bool) $settings['logged_in_only'] );
		$this->assertSame( 7, (int) $settings['daily_limit'] );
	}

	public function test_camera_notice_length_counts_characters_not_bytes(): void {
		$this->as_admin();

		// 300 Bengali letters are 900 bytes but still within the limit.
		$this->assertSame( 200, $this->save( array( 'consent_text' => str_repeat( 'ব', 300 ) ) )->get_status() );
		$this->assertSame( 400, $this->save( array( 'consent_text' => str_repeat( 'ব', 301 ) ) )->get_status() );
	}

	public function test_empty_or_default_notice_is_stored_as_default(): void {
		$this->as_admin();

		$response = $this->save( array( 'consent_text' => '   ' ) );

		$this->assertSame( Settings::default_consent_text(), $response->get_data()['consent_text'] );
		$this->assertSame( '', get_option( Settings::OPTION_KEY )['consent_text'] );

		$this->save( array( 'consent_text' => Settings::default_consent_text() ) );
		$this->assertSame( '', get_option( Settings::OPTION_KEY )['consent_text'] );
	}

	public function test_default_notice_discloses_third_party_storage(): void {
		$notice = Settings::default_consent_text();

		$this->assertStringContainsString( 'third-party', $notice );
		$this->assertStringContainsString( 'store', $notice );
		$this->assertStringNotContainsStringIgnoringCase( 'decart', $notice );
	}

	public function test_camera_notice_is_sanitized(): void {
		$this->as_admin();

		$this->save( array( 'consent_text' => '<script>alert(1)</script>Hello <b>shopper</b>' ) );

		$stored = get_option( Settings::OPTION_KEY )['consent_text'];
		$this->assertStringNotContainsString( '<', $stored );
		$this->assertStringNotContainsString( 'alert', $stored );
		$this->assertStringContainsString( 'Hello shopper', $stored );
	}

	public function test_boolean_fields_are_sanitized(): void {
		$this->as_admin();

		$this->save(
			array(
				'logged_in_only' => 'false',
				'privacy_link'   => '0',
			)
		);
		$this->assertFalse( Settings::get()['logged_in_only'] );
		$this->assertFalse( Settings::get()['privacy_link'] );

		$this->save( array( 'logged_in_only' => '1' ) );
		$this->assertTrue( Settings::get()['logged_in_only'] );
	}

	public function test_raising_daily_limit_lifts_todays_pause_but_lowering_does_not(): void {
		$this->as_admin();
		Settings::pause_for_today();

		$this->save( array( 'daily_limit' => 50 ) );
		$this->assertTrue( Settings::is_limit_paused(), 'Lowering the limit must not resume.' );

		$this->save( array( 'daily_limit' => 200 ) );
		$this->assertFalse( Settings::is_limit_paused() );
	}

	public function test_saving_settings_never_changes_the_key(): void {
		$this->as_admin();
		$this->store_key();
		$before = get_option( Settings::OPTION_KEY );

		$this->save(
			array(
				'key'        => 'dct_injected',
				'key_status' => 'none',
				'daily_limit' => 9,
			)
		);

		$after = get_option( Settings::OPTION_KEY );
		$this->assertSame( $before['key'], $after['key'] );
		$this->assertSame( 'valid', $after['key_status'] );
	}

	public function test_privacy_policy_path_is_reported_when_a_page_is_set(): void {
		$this->as_admin();
		$page_id = self::factory()->post->create(
			array(
				'post_type'   => 'page',
				'post_name'   => 'our-privacy',
				'post_status' => 'publish',
			)
		);
		update_option( 'wp_page_for_privacy_policy', $page_id );

		$data = $this->dispatch( 'GET', '/tryaura/v1/live/settings' )->get_data();

		$this->assertSame( get_privacy_policy_url(), $data['privacy_policy_url'] );
		$this->assertStringStartsWith( '/', $data['privacy_policy_path'] );
		// With plain permalinks the page is identified by its query string, not "/".
		$this->assertNotSame( '/', $data['privacy_policy_path'] );
		$this->assertStringEndsWith( $data['privacy_policy_path'], $data['privacy_policy_url'] );
	}

	public function test_privacy_policy_fields_are_empty_without_a_page(): void {
		$this->as_admin();
		delete_option( 'wp_page_for_privacy_policy' );

		$data = $this->dispatch( 'GET', '/tryaura/v1/live/settings' )->get_data();

		$this->assertSame( '', $data['privacy_policy_url'] );
		$this->assertSame( '', $data['privacy_policy_path'] );
	}
}
