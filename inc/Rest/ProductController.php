<?php

namespace Dokan\TryAura\Rest;

use WP_REST_Request;
use WP_REST_Response;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Product REST controller.
 *
 * @since 1.0.0
 */
class ProductController {
	/**
	 * REST API namespace.
	 *
	 * @since 1.0.0
	 *
	 * @var string api namespace.
	 */
	protected string $namespace = 'tryaura/v1';

	/**
	 * Class constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register REST routes.
	 *
	 * @since 1.0.0
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/product/(?P<id>\d+)/images',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_product_images' ),
				'permission_callback' => array( $this, 'permissions_check' ),
			)
		);
	}

	/**
	 * Get product images.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_product_images( WP_REST_Request $request ) {
		$product_id = $request->get_param( 'id' );

		if ( ! function_exists( 'wc_get_product' ) ) {
			return new WP_REST_Response( array( 'message' => __( 'WooCommerce is not active', 'tryaura' ) ), 500 );
		}

		$product = wc_get_product( $product_id );

		if ( ! $product ) {
			return new WP_REST_Response( array( 'message' => __( 'Product not found', 'tryaura' ) ), 404 );
		}

		$gallery_ids = $product->get_gallery_image_ids();
		$image_id    = $product->get_image_id();
		$image_url   = wp_get_attachment_url( $image_id, 'full' );

		$images = array(
			(string) $product_id => $image_url,
		);

		foreach ( $gallery_ids as $id ) {
			$images[ (string) $id ] = wp_get_attachment_url( $id );
		}

		return new WP_REST_Response( $images, 200 );
	}

	/**
	 * Check if the current user is logged in.
	 *
	 * @since 1.0.0
	 */
	public function permissions_check() {
		return is_user_logged_in();
	}
}
