<?php

namespace Dokan\TryAura\Rest;

use WP_REST_Request;
use WP_REST_Response;
use Dokan\TryAura\Database\UsageManager;

class DashboardController {
	protected string $namespace = 'try-aura/v1';
	protected UsageManager $manager;

	public function __construct() {
		$this->manager = new UsageManager();
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	public function register_routes(): void {
		register_rest_route( $this->namespace, '/stats', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_stats' ),
			'permission_callback' => array( $this, 'permissions_check' ),
		) );

		register_rest_route( $this->namespace, '/log-usage', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'log_usage' ),
			'permission_callback' => array( $this, 'permissions_check' ),
		) );
	}

	public function permissions_check() {
		return current_user_can( 'manage_options' );
	}

	public function get_stats() {
		$stats = $this->manager->get_stats();

		return new WP_REST_Response( $stats, 200 );
	}

	public function log_usage( WP_REST_Request $request ) {
		$params = $request->get_json_params();
		$id     = $this->manager->log_usage( $params );

		return new WP_REST_Response( array( 'success' => true, 'id' => $id ), 200 );
	}
}
