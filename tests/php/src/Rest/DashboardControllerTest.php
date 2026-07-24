<?php
/**
 * @package TryAura\Tests
 */

namespace Dokan\TryAura\Test\Rest;

use Dokan\TryAura\Database\UsageManager;
use Dokan\TryAura\Test\TryAuraTestCase;

/**
 * Usage logging and the stats aggregation (the `{prefix}tryaura` table).
 *
 * @covers \Dokan\TryAura\Rest\DashboardController
 */
class DashboardControllerTest extends TryAuraTestCase {

	public function set_up(): void {
		parent::set_up();

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
	}

	public function test_stats_aggregate_logged_usage(): void {
		$manager = new UsageManager();
		$manager->log_usage(
			array(
				'type'         => 'image',
				'model'        => 'gemini-2.5-flash-image',
				'total_tokens' => 100,
				'status'       => 'success',
				'created_at'   => current_time( 'mysql' ),
			)
		);
		$manager->log_usage(
			array(
				'type'         => 'image',
				'model'        => 'gemini-2.5-flash-image',
				'total_tokens' => 50,
				'status'       => 'success',
				'created_at'   => current_time( 'mysql' ),
			)
		);

		$response = $this->dispatch( 'GET', '/tryaura/v1/stats' );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( 2, $data['image_count'] );
		$this->assertSame( 150, $data['total_tokens'] );
	}

	public function test_log_usage_endpoint_persists_a_row(): void {
		$response = $this->dispatch(
			'POST',
			'/tryaura/v1/log-usage',
			array(
				'type'         => 'image',
				'model'        => 'gemini-2.5-flash-image',
				'total_tokens' => 10,
				'status'       => 'success',
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertTrue( $data['success'] );
		$this->assertGreaterThan( 0, $data['id'] );
	}
}
