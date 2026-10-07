<?php
/**
 * @package TryAura\Tests
 */

namespace Dokan\TryAura\Test\Pro\LiveTryOn;

use Dokan\TryAura\Database\UsageManager;
use Dokan\TryAuraPro\Live\Ledger;
use Dokan\TryAuraPro\Live\REST\SessionController;
use Dokan\TryAuraPro\Live\Settings;

/**
 * POST /live/session-ended and the abandoned-session sweep.
 *
 * @group pro
 * @group live-try-on
 *
 * @covers \Dokan\TryAuraPro\Live\REST\SessionController
 * @covers \Dokan\TryAuraPro\Live\Ledger
 */
class SessionEndedTest extends LiveTestCase {

	private string $session_ref;
	private int $row_id;

	public function set_up(): void {
		parent::set_up();

		$this->store_key();
		$product_id = $this->create_product()->get_id();
		$this->fake_decart_token();
		$this->as_guest();

		$this->session_ref = $this->request_token( $product_id )->get_data()['sessionRef'];
		$this->row_id      = (int) $this->live_rows()[0]['id'];
	}

	private function end_session( array $params ) {
		return $this->dispatch(
			'POST',
			'/tryaura/v1/live/session-ended',
			array_merge(
				array(
					'session_ref' => $this->session_ref,
					'nonce'       => wp_create_nonce( SessionController::NONCE_ACTION ),
				),
				$params
			)
		);
	}

	private function row(): array {
		global $wpdb;

		return $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM %i WHERE id = %d', UsageManager::get_table_name(), $this->row_id ), ARRAY_A );
	}

	public function test_records_seconds_reason_and_session_id(): void {
		$response = $this->end_session(
			array(
				'seconds'    => 12.345,
				'reason'     => 'stopped',
				'session_id' => 'sess_abc',
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['recorded'] );

		$row  = $this->row();
		$meta = $this->row_meta( $row );
		$this->assertSame( 12.35, (float) $row['video_seconds'] );
		$this->assertSame( 'success', $row['status'] );
		$this->assertSame( 'completed', $meta['state'] );
		$this->assertSame( 'stopped', $meta['end_reason'] );
		$this->assertSame( 'sess_abc', $meta['session_id'] );
	}

	/**
	 * @dataProvider reported_seconds
	 */
	public function test_seconds_are_clamped_to_the_session_cap( $reported, float $stored ): void {
		$this->end_session( array( 'seconds' => $reported ) );

		$this->assertSame( $stored, (float) $this->row()['video_seconds'] );
	}

	public static function reported_seconds(): array {
		return array(
			'within the cap'  => array( 20, 20.0 ),
			'exactly the cap' => array( 30, 30.0 ),
			'beyond the cap'  => array( 999, 30.0 ),
			'negative'        => array( -5, 0.0 ),
			'numeric string'  => array( '7.5', 7.5 ),
		);
	}

	public function test_error_reason_marks_the_row_failed(): void {
		$this->end_session(
			array(
				'seconds' => 3,
				'reason'  => 'error',
			)
		);

		$this->assertSame( 'failed', $this->row()['status'] );
	}

	public function test_only_the_first_report_counts(): void {
		$this->assertTrue( $this->end_session( array( 'seconds' => 10 ) )->get_data()['recorded'] );
		$this->assertFalse( $this->end_session( array( 'seconds' => 25 ) )->get_data()['recorded'] );

		$this->assertSame( 10.0, (float) $this->row()['video_seconds'] );
	}

	public function test_reason_and_session_id_are_sanitized(): void {
		$this->end_session(
			array(
				'reason'     => 'Max Duration<script>',
				'session_id' => str_repeat( 'x', 150 ),
			)
		);

		$meta = $this->row_meta( $this->row() );
		$this->assertMatchesRegularExpression( '/^[a-z0-9_\-]+$/', $meta['end_reason'] );
		$this->assertSame( 100, strlen( $meta['session_id'] ) );
	}

	/**
	 * @dataProvider bad_refs
	 */
	public function test_forged_or_malformed_refs_are_rejected( callable $make_ref ): void {
		$response = $this->end_session( array( 'session_ref' => $make_ref( $this->row_id ) ) );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 0.0, (float) $this->row()['video_seconds'] );
	}

	public static function bad_refs(): array {
		return array(
			'wrong signature' => array(
				static function ( $id ) {
					return $id . '.00000000000000000000';
				},
			),
			'another row id'  => array(
				static function ( $id ) {
					return ( $id + 1 ) . '.' . substr( Ledger::session_ref( $id ), -20 );
				},
			),
			'not a ref'       => array(
				static function () {
					return 'hello';
				},
			),
			'empty'           => array(
				static function () {
					return '';
				},
			),
		);
	}

	public function test_valid_ref_for_a_non_live_row_records_nothing(): void {
		$gemini_row = (int) ( new UsageManager() )->log_usage(
			array(
				'provider' => 'google',
				'type'     => 'image',
				'status'   => 'success',
			)
		);

		$response = $this->end_session( array( 'session_ref' => Ledger::session_ref( $gemini_row ) ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertFalse( $response->get_data()['recorded'] );
	}

	public function test_bad_nonce_and_invalid_seconds_are_refused(): void {
		$bad_nonce = $this->end_session( array( 'nonce' => 'nope' ) );
		$this->assertSame( 403, $bad_nonce->get_status() );
		$this->assertSame( 'bad_nonce', $this->reason( $bad_nonce ) );

		$this->assertSame( 400, $this->end_session( array( 'seconds' => 'ten' ) )->get_status() );
	}

	public function test_abandoned_sweep_only_touches_old_unreported_rows(): void {
		global $wpdb;
		$manager = new UsageManager();

		$old_minted    = $this->row_id;
		$recent_minted = (int) $manager->log_usage(
			array(
				'provider' => 'decart',
				'type'     => 'video',
				'status'   => 'success',
				'meta'     => array( 'state' => Ledger::STATE_MINTED ),
			)
		);
		$old_completed = (int) $manager->log_usage(
			array(
				'provider' => 'decart',
				'type'     => 'video',
				'status'   => 'success',
				'meta'     => array( 'state' => Ledger::STATE_COMPLETED ),
			)
		);
		$old_gemini    = (int) $manager->log_usage(
			array(
				'provider' => 'google',
				'type'     => 'image',
				'status'   => 'success',
				'meta'     => array( 'state' => Ledger::STATE_MINTED ),
			)
		);

		foreach ( array( $old_minted, $old_completed, $old_gemini ) as $id ) {
			$this->age_row( $id, '2 HOUR' );
		}

		$this->assertSame( 1, ( new Ledger() )->mark_abandoned() );

		$state = static function ( int $id ) use ( $wpdb ) {
			$meta = $wpdb->get_var( $wpdb->prepare( 'SELECT meta FROM %i WHERE id = %d', UsageManager::get_table_name(), $id ) );
			return json_decode( (string) $meta, true )['state'] ?? '';
		};

		$this->assertSame( 'abandoned', $state( $old_minted ) );
		$this->assertSame( 'minted', $state( $recent_minted ), 'Too recent: the session may still be running.' );
		$this->assertSame( 'completed', $state( $old_completed ) );
		$this->assertSame( 'minted', $state( $old_gemini ), 'Only Live rows are swept.' );

		// An abandoned session can no longer be reported.
		$this->assertFalse( $this->end_session( array( 'seconds' => 5 ) )->get_data()['recorded'] );
	}

	public function test_session_cap_from_the_row_is_used_not_current_settings(): void {
		Settings::update( array( 'max_session' => 10 ) );

		$this->end_session( array( 'seconds' => 25 ) );

		$this->assertSame( 25.0, (float) $this->row()['video_seconds'], 'The session was minted with a 30s cap.' );
	}
}
