<?php
/**
 * Dashboard Controller.
 *
 * @package TryAura
 */

namespace Dokan\TryAura\Rest;

use WP_REST_Request;
use WP_REST_Response;
use Dokan\TryAura\Database\UsageManager;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Dashboard Controller class.
 *
 * @since 1.0.0
 */
class DashboardController {
	/**
	 * Namespace.
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected string $namespace = 'try-aura/v1';

	/**
	 * Usage Manager.
	 *
	 * @since 1.0.0
	 *
	 * @var UsageManager
	 */
	protected UsageManager $manager;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->manager = new UsageManager();
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/stats',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_stats' ),
				'permission_callback' => array( $this, 'permissions_check' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/chart-data',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_chart_data' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => array(
					'start_date' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
					'end_date'   => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/log-usage',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'log_usage' ),
				'permission_callback' => array( $this, 'permissions_check' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/activities',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_activities' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => array(
					'limit' => array(
						'default'           => 5,
						'sanitize_callback' => 'absint',
						'schema'            => array(
							'type'    => 'integer',
							'default' => 5,
						),
					),
					'type'  => array(
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
						'schema'            => array(
							'type' => 'string',
							'enum' => array( '', 'image', 'video', 'tryon' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Permissions check.
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function permissions_check() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Get activities.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request REST Request.
	 *
	 * @return WP_REST_Response
	 */
	public function get_activities( WP_REST_Request $request ) {
		$params     = $request->get_params();
		$activities = $this->manager->get_recent_activities( $params );

		return new WP_REST_Response( $activities, 200 );
	}

	/**
	 * Get chart data.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request REST Request.
	 *
	 * @return WP_REST_Response
	 */
	public function get_chart_data( WP_REST_Request $request ) {
		$params = $request->get_params();
		$args   = array();

		if ( ! empty( $params['start_date'] ) ) {
			$args['start_date'] = sanitize_text_field( $params['start_date'] );
		}

		if ( ! empty( $params['end_date'] ) ) {
			$args['end_date'] = sanitize_text_field( $params['end_date'] );
		}

		// Default to current month if no dates provided.
		if ( empty( $args['start_date'] ) && empty( $args['end_date'] ) ) {
			$args['start_date'] = current_time( 'Y-m-01' );
			$args['end_date']   = current_time( 'Y-m-d' );
		}

		$chart_data = $this->manager->get_chart_data( $args );

		return new WP_REST_Response( $chart_data, 200 );
	}

	/**
	 * Get statistics.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request REST Request.
	 *
	 * @return WP_REST_Response
	 */
	public function get_stats( WP_REST_Request $request ) {
		$params = $request->get_params();
		$args   = array();

		if ( ! empty( $params['start_date'] ) ) {
			$args['start_date'] = sanitize_text_field( $params['start_date'] );
		}

		if ( ! empty( $params['end_date'] ) ) {
			$args['end_date'] = sanitize_text_field( $params['end_date'] );
		}

		// Default to current month if no dates provided.
		if ( empty( $args['start_date'] ) && empty( $args['end_date'] ) ) {
			$args['start_date'] = current_time( 'Y-m-01' );
			$args['end_date']   = current_time( 'Y-m-d' );
		}

		$stats = $this->manager->get_stats( $args );

		return new WP_REST_Response( $stats, 200 );
	}

	/**
	 * Log usage.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request REST Request.
	 *
	 * @return WP_REST_Response
	 */
	public function log_usage( WP_REST_Request $request ) {
		$params = $request->get_json_params();
		$id     = $this->manager->log_usage( $params );

		return new WP_REST_Response(
			array(
				'success' => true,
				'id'      => $id,
			),
			200
		);
	}
}
