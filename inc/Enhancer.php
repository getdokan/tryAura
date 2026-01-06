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

		$settings    = get_option( 'try_aura_settings', array() );
		$api_key     = isset( $settings['google']['apiKey'] ) ? $settings['google']['apiKey'] : '';
		$image_model = isset( $settings['google']['imageModel'] ) ? $settings['google']['imageModel'] : '';
		$video_model = isset( $settings['google']['videoModel'] ) ? $settings['google']['videoModel'] : '';

		// Pass settings (API key, REST URL, nonce) to the enhancer UI.
		wp_localize_script(
			'try-aura-enhancer',
			'tryAura',
			array(
				'restUrl'    => esc_url_raw( rest_url() ),
				'nonce'      => wp_create_nonce( 'wp_rest' ),
				'apiKey'     => $api_key,
				'imageModel' => $image_model,
				'videoModel' => $video_model,
				'postId'     => $post_id,
				'postType'   => $post_type,
			)
		);

		wp_enqueue_style( 'try-aura-components' );
		wp_enqueue_style( 'try-aura-enhancer' );
		wp_enqueue_script( 'try-aura-ai-models' );
		wp_enqueue_script( 'try-aura-components' );
		wp_enqueue_script( 'try-aura-enhancer' );
	}
}
