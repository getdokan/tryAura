<?php
/**
 * @package TryAura\Tests
 */

namespace Dokan\TryAura\Test\Pro\LiveTryOn;

use Dokan\TryAura\Database\UsageManager;
use Dokan\TryAuraPro\Live\Dashboard;

/**
 * Live sessions stay out of the existing Dashboard numbers and get their own activity tab.
 *
 * @group pro
 * @group live-try-on
 *
 * @covers \Dokan\TryAuraPro\Live\Dashboard
 */
class DashboardTest extends LiveTestCase {

	public function set_up(): void {
		parent::set_up();

		$this->as_admin();

		$manager = new UsageManager();
		$rows    = array(
			array(
				'provider'       => 'google',
				'type'           => 'image',
				'generated_from' => 'admin',
			),
			array(
				'provider'       => 'google',
				'type'           => 'image',
				'generated_from' => 'tryon',
			),
			array(
				'provider'       => 'google',
				'type'           => 'video',
				'generated_from' => 'admin',
				'video_seconds'  => 8,
			),
			array(
				'provider'       => 'decart',
				'type'           => 'video',
				'generated_from' => 'tryon',
				'video_seconds'  => 30,
				'meta'           => array( 'state' => 'completed' ),
			),
			array(
				'provider'       => 'decart',
				'type'           => 'video',
				'generated_from' => 'tryon',
				'video_seconds'  => 12,
				'meta'           => array( 'state' => 'minted' ),
			),
		);

		foreach ( $rows as $row ) {
			$manager->log_usage( array_merge( array( 'status' => 'success' ), $row ) );
		}
	}

	private function activities( string $type ): array {
		$params = array( 'limit' => 20 );

		if ( '' !== $type ) {
			$params['type'] = $type;
		}

		$response = $this->dispatch( 'GET', '/tryaura/v1/activities', $params );
		$this->assertSame( 200, $response->get_status(), "Activities tab '{$type}'." );

		return (array) $response->get_data();
	}

	private function providers( array $activities ): array {
		return array_values( array_unique( array_column( $activities, 'provider' ) ) );
	}

	public function test_stats_exclude_live_sessions(): void {
		$stats = ( new UsageManager() )->get_stats();

		$this->assertSame( 2, $stats['image_count'] );
		$this->assertSame( 1, $stats['tryon_count'], 'Only the photo try-on counts as a try-on.' );

		if ( array_key_exists( 'video_count', $stats ) ) {
			$this->assertSame( 1, $stats['video_count'] );
			$this->assertSame( 8.0, (float) $stats['video_seconds'] );
		}
	}

	public function test_chart_excludes_live_sessions(): void {
		$chart = ( new UsageManager() )->get_chart_data(
			array(
				'start_date' => current_time( 'Y-m-d' ),
				'end_date'   => current_time( 'Y-m-d' ),
			)
		);

		$this->assertCount( 1, $chart );
		$this->assertSame( 2, $chart[0]['images'] );
		$this->assertSame( 1, $chart[0]['tryOns'] );

		if ( array_key_exists( 'videos', $chart[0] ) ) {
			$this->assertSame( 1, $chart[0]['videos'] );
		}
	}

	public function test_live_tab_lists_only_live_sessions(): void {
		$live = $this->activities( 'live' );

		$this->assertCount( 2, $live );
		$this->assertSame( array( 'decart' ), $this->providers( $live ) );
	}

	public function test_existing_tabs_exclude_live_sessions(): void {
		$tryon = $this->activities( 'tryon' );
		$this->assertCount( 1, $tryon );
		$this->assertNotContains( 'decart', $this->providers( $tryon ) );

		$this->assertNotContains( 'decart', $this->providers( $this->activities( 'image' ) ) );
	}

	public function test_video_tab_excludes_live_sessions_when_available(): void {
		$response = $this->dispatch(
			'GET',
			'/tryaura/v1/activities',
			array(
				'type'  => 'video',
				'limit' => 20,
			)
		);

		if ( array() === $response->get_data() ) {
			$this->markTestSkipped( 'The AI Videos tab is not active in this run.' );
		}

		$this->assertNotContains( 'decart', $this->providers( (array) $response->get_data() ) );
	}

	public function test_all_tab_includes_live_sessions(): void {
		$this->assertContains( 'decart', $this->providers( $this->activities( '' ) ) );
	}

	public function test_failed_live_sessions_are_not_listed(): void {
		( new UsageManager() )->log_usage(
			array(
				'provider'       => 'decart',
				'type'           => 'video',
				'generated_from' => 'tryon',
				'status'         => 'failed',
			)
		);

		$this->assertCount( 2, $this->activities( 'live' ) );
	}

	public function test_unknown_activity_type_returns_nothing(): void {
		// The route's allowed types sit under a nested `schema` key WordPress does not
		// validate, so an unknown type is not a 400; it must still leak no rows.
		$response = $this->dispatch( 'GET', '/tryaura/v1/activities', array( 'type' => 'bogus' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array(), $response->get_data() );
	}

	public function test_filters_hold_on_a_fresh_dashboard_instance(): void {
		$dashboard = new Dashboard();

		$this->assertSame( "WHERE status = 'success'", $dashboard->scope_usage_queries( "WHERE status = 'success'", 'activities', array( 'type' => '' ) ) );
		$this->assertStringContainsString( "provider != 'decart'", $dashboard->scope_usage_queries( 'WHERE 1=1', 'stats', array() ) );
		$this->assertStringContainsString( "provider != 'decart'", $dashboard->scope_usage_queries( 'WHERE 1=1', 'activities', array( 'type' => 'tryon' ) ) );
		$this->assertSame( "AND provider = 'decart'", $dashboard->live_activity_where( '', 'live' ) );
		$this->assertSame( '', $dashboard->live_activity_where( '', 'tryon' ) );
		$this->assertSame( array( '', 'image', 'live' ), $dashboard->add_rest_type( array( '', 'image', 'live' ) ) );
	}
}
