<?php
/**
 * @package TryAura\Tests
 */

namespace Dokan\TryAura\Test\Pro\LiveTryOn;

use Dokan\TryAuraPro\Live\KeyManager;
use Dokan\TryAuraPro\Live\KeyVault;
use Dokan\TryAuraPro\Live\Settings;

/**
 * API key verification, encrypted storage and key status tracking.
 *
 * @group pro
 * @group live-try-on
 *
 * @covers \Dokan\TryAuraPro\Live\KeyManager
 * @covers \Dokan\TryAuraPro\Live\KeyVault
 */
class KeyTest extends LiveTestCase {

	public function set_up(): void {
		parent::set_up();

		$this->as_admin();
	}

	private function save_key( string $key ) {
		return $this->dispatch( 'POST', '/tryaura/v1/live/key', array( 'key' => $key ) );
	}

	public function test_valid_key_is_verified_then_stored_encrypted(): void {
		$this->fake_decart( 200, array( 'apiKey' => 'ek_verify' ) );

		$response = $this->save_key( self::VALID_KEY );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'valid', $response->get_data()['key_status'] );
		$this->assertSame( 'abcd', $response->get_data()['key_last4'] );
		$this->assertStringNotContainsString( self::VALID_KEY, wp_json_encode( $response->get_data() ) );

		// One throwaway mint: 1 second, try-on model only.
		$this->assertCount( 1, $this->decart_requests );
		$request = $this->decart_requests[0];
		$this->assertSame( self::VALID_KEY, $request['headers']['x-api-key'] );
		$this->assertSame( 1, $request['body']['expiresIn'] );
		$this->assertSame( array( 'lucy-vton-3.5' ), $request['body']['allowedModels'] );
		$this->assertSame( 15, $request['timeout'] );

		$stored = get_option( Settings::OPTION_KEY );
		$this->assertStringNotContainsString( self::VALID_KEY, maybe_serialize( $stored ) );
		$this->assertEqualsWithDelta( time(), $stored['key_added_at'], 5 );
		$this->assertSame( self::VALID_KEY, ( new KeyManager() )->get_key() );
	}

	/**
	 * @dataProvider rejected_verifications
	 */
	public function test_failed_verification_stores_nothing( int $decart_status, string $code, int $http_status, string $message_part ): void {
		$this->fake_decart( $decart_status, array( 'error' => 'nope' ) );

		$response = $this->save_key( self::VALID_KEY );

		$this->assertSame( $http_status, $response->get_status() );
		$this->assertSame( $code, $response->get_data()['code'] );
		$this->assertStringContainsString( $message_part, $response->get_data()['message'] );
		$this->assertSame( 'none', Settings::get()['key_status'] );
		$this->assertSame( '', Settings::get()['key'] );
	}

	public static function rejected_verifications(): array {
		return array(
			'invalid key (401)'             => array( 401, 'tryaura_live_key_rejected', 400, 'not accepted' ),
			'temporary ek_ token (403)'     => array( 403, 'tryaura_live_key_is_client_token', 400, 'temporary token' ),
			'our request is wrong (400)'    => array( 400, 'tryaura_live_verify_failed', 500, 'checking the key' ),
			'missing header (422)'          => array( 422, 'tryaura_live_verify_failed', 500, 'checking the key' ),
			'rate limited by Decart (429)'  => array( 429, 'tryaura_live_unreachable', 503, 'Could not reach' ),
			'Decart outage (500)'           => array( 500, 'tryaura_live_unreachable', 503, 'Could not reach' ),
			'network timeout'               => array( 0, 'tryaura_live_unreachable', 503, 'Could not reach' ),
		);
	}

	public function test_rejected_replacement_keeps_the_working_key(): void {
		$this->store_key();
		$this->fake_decart( 401 );

		$this->assertSame( 400, $this->save_key( 'dct_typo_key_0000' )->get_status() );

		$this->assertSame( 'valid', Settings::get()['key_status'] );
		$this->assertSame( self::VALID_KEY, ( new KeyManager() )->get_key() );
	}

	public function test_blank_key_is_rejected_without_calling_decart(): void {
		$this->fake_decart( 200 );

		$response = $this->save_key( "  \t " );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'tryaura_live_key_empty', $response->get_data()['code'] );
		$this->assertSame( array(), $this->decart_requests );
	}

	public function test_missing_key_parameter_is_rejected(): void {
		$response = $this->dispatch( 'POST', '/tryaura/v1/live/key' );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_missing_callback_param', $response->get_data()['code'] );
	}

	public function test_there_is_no_route_that_reads_the_key(): void {
		$this->store_key();

		$response = $this->dispatch( 'GET', '/tryaura/v1/live/key' );

		$this->assertNotSame( 200, $response->get_status() );
		$this->assertStringNotContainsString( self::VALID_KEY, wp_json_encode( $response->get_data() ) );
	}

	public function test_delete_removes_the_key(): void {
		$this->store_key();

		$response = $this->dispatch( 'DELETE', '/tryaura/v1/live/key' );

		$this->assertSame( 'none', $response->get_data()['key_status'] );
		$this->assertSame( '', Settings::get()['key'] );
		$this->assertNull( ( new KeyManager() )->get_key() );
	}

	public function test_encryption_round_trip_and_unreadable_payloads(): void {
		$salt   = KeyVault::new_salt();
		$cipher = KeyVault::encrypt( self::VALID_KEY, $salt );

		$this->assertNotSame( '', $cipher );
		$this->assertStringNotContainsString( self::VALID_KEY, $cipher );
		$this->assertSame( self::VALID_KEY, KeyVault::decrypt( $cipher, $salt ) );
		$this->assertNotSame( $cipher, KeyVault::encrypt( self::VALID_KEY, $salt ), 'Each encryption uses a fresh nonce.' );

		$this->assertNull( KeyVault::decrypt( $cipher, KeyVault::new_salt() ), 'Wrong salt.' );
		$this->assertNull( KeyVault::decrypt( substr( $cipher, 0, -4 ) . 'AAAA', $salt ), 'Tampered ciphertext.' );
		$this->assertNull( KeyVault::decrypt( 'plain-text', $salt ), 'No prefix.' );
		$this->assertNull( KeyVault::decrypt( 's1:%%%not-base64%%%', $salt ), 'Bad base64.' );
		$this->assertNull( KeyVault::decrypt( 's1:' . base64_encode( 'short' ), $salt ), 'Too short.' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		$this->assertNull( KeyVault::decrypt( 'o1:' . base64_encode( str_repeat( 'x', 40 ) ), $salt ), 'Garbage OpenSSL payload.' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
	}

	public function test_changed_auth_key_marks_the_key_expired(): void {
		$this->store_key();
		Settings::update( array( 'key_fingerprint' => KeyVault::fingerprint( 'another-site-salt' ) ) );

		KeyManager::refresh_key_status();

		$this->assertSame( 'expired', Settings::get()['key_status'] );
	}

	public function test_key_that_no_longer_decrypts_is_marked_expired_on_use(): void {
		$this->store_key();
		Settings::update( array( 'key_salt' => KeyVault::new_salt() ) );

		$this->assertNull( ( new KeyManager() )->get_key() );
		$this->assertSame( 'expired', Settings::get()['key_status'] );
	}

	/**
	 * @dataProvider key_ages
	 */
	public function test_expiry_warning_starts_after_22_days( int $days, string $expected ): void {
		$this->store_key( Settings::KEY_STATUS_VALID, time() - $days * DAY_IN_SECONDS );

		KeyManager::refresh_key_status();

		$this->assertSame( $expected, Settings::get()['key_status'] );
	}

	public static function key_ages(): array {
		return array(
			'fresh'           => array( 0, 'valid' ),
			'21 days'         => array( 21, 'valid' ),
			'22 days'         => array( 22, 'expiring' ),
			'past 29 days'    => array( 35, 'expiring' ),
		);
	}

	public function test_expired_key_is_not_revived_by_refresh(): void {
		$this->store_key( Settings::KEY_STATUS_EXPIRED );

		KeyManager::refresh_key_status();

		$this->assertSame( 'expired', Settings::get()['key_status'] );
	}

	public function test_limit_pause_never_touches_key_status(): void {
		$this->store_key( Settings::KEY_STATUS_EXPIRING, time() - 23 * DAY_IN_SECONDS );

		Settings::pause_for_today();
		Settings::clear_pause();

		$this->assertSame( 'expiring', Settings::get()['key_status'] );
	}

	public function test_settings_screen_shows_estimated_expiry(): void {
		$this->store_key( Settings::KEY_STATUS_VALID, time() - 2 * DAY_IN_SECONDS );

		$data = $this->dispatch( 'GET', '/tryaura/v1/live/settings' )->get_data();

		$this->assertSame( 27, $data['days_until_expiry'] );
		$this->assertNotSame( '', $data['estimated_expiry'] );
		$this->assertNotSame( '', $data['key_added_at'] );
	}
}
