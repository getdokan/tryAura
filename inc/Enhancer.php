<?php

namespace Dokan\TryAura;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Registers and enqueues the Featured Image AI Enhancer UI assets in the editor.
 */
class Enhancer {

	/**
	 * Class constructor.
	 */
	public function __construct() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue' ) );
	}

	/**
	 * Enqueue the enhancer UI only on post edit screens.
	 *
	 * @param string $hook Current admin page hook suffix.
	 */
	public function enqueue( string $hook ): void {
		// Limit to classic/block editor post screens where the featured image modal is used.
		if ( 'post.php' !== $hook && 'post-new.php' !== $hook ) {
			return;
		}

		global $post;
		$post_id   = $post ? $post->ID : 0;
		$post_type = $post ? $post->post_type : '';

		// Pass settings (API key, REST URL, nonce) to the enhancer UI.
		wp_localize_script(
			'try-aura-enhancer',
			'tryAura',
			array(
				'restUrl'  => esc_url_raw( rest_url() ),
				'nonce'    => wp_create_nonce( 'wp_rest' ),
				'apiKey'   => get_option( 'try_aura_api_key', '' ),
				'postId'   => $post_id,
				'postType' => $post_type,
			)
		);

		wp_enqueue_style( 'try-aura-components' );
		wp_enqueue_style( 'try-aura-enhancer' );
		wp_enqueue_script( 'try-aura-ai-models' );
		wp_enqueue_script( 'try-aura-components' );
		wp_enqueue_script( 'try-aura-enhancer' );
	}
}
