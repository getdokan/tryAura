<?php

namespace Dokan\TryAura\Rest;

use Dokan\TryAura\Admin\Promotion;
use WP_REST_Response;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * REST controller for Pro promotion state (promo banner dismissal).
 *
 * @since 2.0.0
 */
class PromotionController {
	/**
	 * REST API namespace.
	 *
	 * @since 2.0.0
	 *
	 * @var string api namespace.
	 */
	protected string $namespace = 'tryaura/v1';

	/**
	 * REST API base.
	 *
	 * @since 2.0.0
	 *
	 * @var string rest base.
	 */
	protected string $rest_base = 'promotion';

	/**
	 * Class constructor.
	 *
	 * @since 2.0.0
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register REST routes.
	 *
	 * @since 2.0.0
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/dismiss-banner',
			array(
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'dismiss_banner' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
			)
		);
	}

	/**
	 * Simple permissions check: only admins (manage_options).
	 *
	 * @since 2.0.0
	 */
	public function permissions_check(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Record the promo banner dismissal for the current user.
	 *
	 * Stores a timestamp so the banner can re-appear after the dismissal
	 * duration (30 days) elapses.
	 *
	 * @since 2.0.0
	 *
	 * @return WP_REST_Response
	 */
	public function dismiss_banner(): WP_REST_Response {
		update_user_meta( get_current_user_id(), Promotion::BANNER_DISMISSED_META_KEY, time() );

		return new WP_REST_Response( array( 'dismissed' => true ) );
	}
}
