<?php
/**
 * @package TryAura\Tests
 */

namespace Dokan\TryAura\Test\Pro\LiveTryOn;

use Dokan\TryAura\Database\UsageManager;
use Dokan\TryAuraPro\Live\Ledger;
use Dokan\TryAuraPro\Live\Maintenance;
use Dokan\TryAuraPro\Live\Product;
use Dokan\TryAuraPro\Live\Settings;

/**
 * The daily maintenance job.
 *
 * @group pro
 * @group live-try-on
 *
 * @covers \Dokan\TryAuraPro\Live\Maintenance
 */
class MaintenanceTest extends LiveTestCase {

	public function test_job_is_scheduled_once_for_site_midnight(): void {
		as_unschedule_all_actions( Maintenance::HOOK );
		delete_transient( 'tryaura_live_maintenance_checked' );

		$maintenance = new Maintenance();
		$maintenance->maybe_schedule();

		$this->assertTrue( as_has_scheduled_action( Maintenance::HOOK, array(), Maintenance::GROUP ) );

		$next     = as_next_scheduled_action( Maintenance::HOOK, array(), Maintenance::GROUP );
		$midnight = ( new \DateTimeImmutable( 'tomorrow', wp_timezone() ) )->getTimestamp();
		$this->assertSame( $midnight, $next );

		// Calling again (for example on the next request) does not add a second job.
		delete_transient( 'tryaura_live_maintenance_checked' );
		$maintenance->maybe_schedule();

		$pending = as_get_scheduled_actions(
			array(
				'hook'     => Maintenance::HOOK,
				'status'   => \ActionScheduler_Store::STATUS_PENDING,
				'per_page' => -1,
			),
			'ids'
		);
		$this->assertCount( 1, $pending );
	}

	public function test_live_boot_schedules_the_job(): void {
		$this->assertTrue(
			as_has_scheduled_action( Maintenance::HOOK, array(), Maintenance::GROUP ) || (bool) get_transient( 'tryaura_live_maintenance_checked' ),
			'Maintenance must reach the scheduler when Live boots after Action Scheduler.'
		);
	}

	public function test_run_clears_yesterdays_pause_but_keeps_todays(): void {
		Settings::update(
			array(
				'limit_paused'    => true,
				'limit_paused_on' => wp_date( 'Y-m-d', time() - DAY_IN_SECONDS ),
			)
		);

		( new Maintenance() )->run();
		$this->assertFalse( (bool) Settings::get()['limit_paused'] );

		Settings::pause_for_today();
		( new Maintenance() )->run();
		$this->assertTrue( Settings::is_limit_paused() );
	}

	public function test_run_warns_about_expiry_and_sweeps_abandoned_sessions(): void {
		$this->store_key( Settings::KEY_STATUS_VALID, time() - 23 * DAY_IN_SECONDS );

		$row_id = (int) ( new UsageManager() )->log_usage(
			array(
				'provider' => 'decart',
				'type'     => 'video',
				'status'   => 'success',
				'meta'     => array( 'state' => Ledger::STATE_MINTED ),
			)
		);
		$this->age_row( $row_id, '3 HOUR' );

		( new Maintenance() )->run();

		$this->assertSame( 'expiring', Settings::get()['key_status'] );
		$this->assertSame( 'abandoned', $this->row_meta( $this->live_rows()[0] )['state'] );
	}

	public function test_handler_only_mode_does_not_schedule(): void {
		as_unschedule_all_actions( Maintenance::HOOK );
		delete_transient( 'tryaura_live_maintenance_checked' );

		new Maintenance( false );

		$this->assertFalse( as_has_scheduled_action( Maintenance::HOOK ) );
		$this->assertNotFalse( has_action( Maintenance::HOOK ), 'A queued run still has a handler.' );
	}

	public function test_bulk_job_keeps_a_handler_outside_the_live_boot(): void {
		$this->assertNotFalse( has_action( Product::BULK_HOOK ) );
	}

	public function test_unschedule_removes_daily_and_bulk_jobs(): void {
		delete_transient( 'tryaura_live_maintenance_checked' );
		( new Maintenance() )->maybe_schedule();
		as_enqueue_async_action(
			Product::BULK_HOOK,
			array(
				'product_ids' => array( 1, 2 ),
				'enabled'     => 'yes',
			),
			'tryaura'
		);

		Maintenance::unschedule();

		$this->assertFalse( as_has_scheduled_action( Maintenance::HOOK ) );
		$this->assertFalse( as_has_scheduled_action( Product::BULK_HOOK ) );
		$this->assertFalse( get_transient( 'tryaura_live_maintenance_checked' ) );
	}

	public function test_run_without_a_key_or_sessions_is_harmless(): void {
		( new Maintenance() )->run();

		$this->assertSame( 'none', Settings::get()['key_status'] );
		$this->assertFalse( Settings::is_limit_paused() );
	}
}
