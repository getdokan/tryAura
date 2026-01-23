<?php

namespace Dokan\TryAura\Rest;

use Dokan\TryAura\TryAura;
use WP_REST_Request;
use WP_REST_Response;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Custom REST controller for TryAura settings.
 *
 * @since PLUGIN_SINCE
 */
class SettingsController {
	/**
	 * REST API namespace.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @var string api namespace.
	 */
	protected string $namespace = 'try-aura/v1';

	/**
	 * REST API base.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @var string  rest base.
	 */
	protected string $rest_base = 'settings';

	/**
	 * Option key for settings.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @var string option key.
	 */
	protected string $option_key = 'try_aura_settings';

	/**
	 * Class constructor.
	 *
	 * @since PLUGIN_SINCE
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register REST routes.
	 *
	 * @since PLUGIN_SINCE
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
							'type'     => 'object',
							'required' => false,
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/bulk-try-on',
			array(
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'bulk_try_on' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => array(
						'enabled' => array(
							'type'     => 'boolean',
							'required' => true,
						),
					),
				),
			)
		);
	}

	/**
	 * Simple permissions check: only admins (manage_options).
	 *
	 * @since PLUGIN_SINCE
	 */
	public function permissions_check(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * GET callback: return current option value.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @return WP_REST_Response
	 */
	public function get_settings(): WP_REST_Response {
		$value = get_option( $this->option_key, array() );
		return new WP_REST_Response( array( $this->option_key => $value ) );
	}

	/**
	 * POST callback: update option value.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 * */
	public function update_settings( WP_REST_Request $request ) {
		$new_value = $request->get_param( $this->option_key );

		if ( null === $new_value ) {
			// No value provided; return current value without error to be forgiving.
			$current = get_option( $this->option_key, array() );
			return new WP_REST_Response( array( $this->option_key => $current ) );
		}

		// Sanitize the new value recursively.
		$new_value = map_deep( $new_value, 'sanitize_text_field' );
		update_option( $this->option_key, $new_value );

		return new WP_REST_Response( array( $this->option_key => $new_value ) );
	}

	/**
	 * Bulk enable/disable try-on for all products.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function bulk_try_on( WP_REST_Request $request ): WP_REST_Response {
		if ( ! class_exists( 'WooCommerce' )) {
			return new WP_REST_Response(
				array(
					'message' => __( 'WooCommerce is not active.', 'try-aura' ),
				),
				400
			);
		}

		$enabled = $request->get_param( 'enabled' ) ? 'yes' : 'no';

		$products = wc_get_products(
			array(
				'limit'  => -1,
				'return' => 'ids',
				'status' => 'publish',
			)
		);

		$total_products = count( $products );

		if ( 0 === $total_products ) {
			return new WP_REST_Response(
				array(
					'message' => __( 'No products found to update.', 'try-aura' ),
				),
				200
			);
		}

		$chunk_count = 10;
		$chunks      = array_chunk( $products, $chunk_count );

		foreach ( $chunks as $chunk ) {
			WC()->queue()->add(
				'try_aura_bulk_update_products_try_on',
				array(
					'product_ids' => $chunk,
					'enabled'     => $enabled,
				),
				'try-aura'
			);
		}

		return new WP_REST_Response(
			array(
				'message' => sprintf(
					// translators: %1$d total products, %2$d enable/disable.
					__( '%1$d products added to queue to %2$s try-on.', 'try-aura' ),
					$total_products,
					'yes' === $enabled ? 'enable' : 'disable'
				),
			),
			200
		);
	}
}
