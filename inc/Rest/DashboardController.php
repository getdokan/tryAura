<?php

namespace Dokan\TryAura\Rest;

use WP_REST_Request;
use WP_REST_Response;

class DashboardController {
	protected string $namespace = 'try-aura/v1';

	public function __construct() {
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
		global $wpdb;
		$table = $wpdb->prefix . 'tryaura';

		$image_count   = $wpdb->get_var( "SELECT COUNT(*) FROM $table WHERE type = 'image' AND status = 'success'" );
		$video_count   = $wpdb->get_var( "SELECT COUNT(*) FROM $table WHERE type = 'video' AND status = 'success'" );
		$total_tokens  = $wpdb->get_var( "SELECT SUM(total_tokens) FROM $table WHERE status = 'success'" );
		$video_seconds = $wpdb->get_var( "SELECT SUM(video_seconds) FROM $table WHERE type = 'video' AND status = 'success'" );

		return new WP_REST_Response( array(
			'image_count'   => (int) $image_count,
			'video_count'   => (int) $video_count,
			'total_tokens'  => (int) $total_tokens,
			'video_seconds' => (float) $video_seconds,
		), 200 );
	}

	public function log_usage( WP_REST_Request $request ) {
		global $wpdb;
		$table  = $wpdb->prefix . 'tryaura';
		$params = $request->get_json_params();

		$data = array(
			'user_id'        => get_current_user_id(),
			'provider'       => $params['provider'] ?? 'google',
			'model'          => $params['model'] ?? '',
			'type'           => $params['type'] ?? 'image',
			'generated_from' => $params['generated_from'] ?? 'admin',
			'prompt'         => $params['prompt'] ?? '',
			'input_tokens'   => (int) ( $params['input_tokens'] ?? 0 ),
			'output_tokens'  => (int) ( $params['output_tokens'] ?? 0 ),
			'total_tokens'   => (int) ( $params['total_tokens'] ?? 0 ),
			'video_seconds'  => (float) ( $params['video_seconds'] ?? 0 ),
			'output_count'   => (int) ( $params['output_count'] ?? 1 ),
			'status'         => $params['status'] ?? 'success',
			'error_message'  => $params['error_message'] ?? null,
			'meta'           => isset( $params['meta'] ) ? wp_json_encode( $params['meta'] ) : null,
			'created_at'     => current_time( 'mysql' ),
		);

		$wpdb->insert( $table, $data );

		return new WP_REST_Response( array( 'success' => true, 'id' => $wpdb->insert_id ), 200 );
	}
}
