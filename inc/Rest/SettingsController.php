<?php

namespace Dokan\TryAura\Rest;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Custom REST controller for TryAura settings.
 */
class SettingsController {
	/**
	 * REST API namespace.
	 *
	 * @var string api namespace.
	 */
	protected string $namespace = 'try-aura/v1';

	/**
	 * REST API base.
	 *
	 * @var string  rest base.
	 */
	protected string $rest_base = 'settings';

	/**
	 * Option key for settings.
	 *
	 * @var string option key.
	 */
	protected string $option_key;

	/**
	 * Class constructor.
	 *
	 * @param string $option_key Option key.
	 */
	public function __construct( string $option_key ) {
		$this->option_key = $option_key;
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register REST routes.
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'get_settings' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'update_settings' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => array(
						$this->option_key => array(
							'type'              => 'string',
							'required'          => false,
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
			)
		);
	}

	/**
	 * Simple permissions check: only admins (manage_options).
	 */
	public function permissions_check(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * GET callback: return current option value.
	 *
	 * @return WP_REST_Response
	 */
	public function get_settings(): WP_REST_Response {
		$value = (string) get_option( $this->option_key, '' );
		return new WP_REST_Response( array( $this->option_key => $value ) );
	}

	/**
	 * POST callback: update option value.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 * */
	public function update_settings( WP_REST_Request $request ) {
		$new_value = $request->get_param( $this->option_key );

		if ( null === $new_value ) {
			// No value provided; return current value without error to be forgiving.
			$current = (string) get_option( $this->option_key, '' );
			return new WP_REST_Response( array( $this->option_key => $current ) );
		}

		$sanitized = sanitize_text_field( (string) $new_value );
		update_option( $this->option_key, $sanitized );

		return new WP_REST_Response( array( $this->option_key => $sanitized ) );
	}
}
