/* global jQuery */
( function ( $ ) {
	'use strict';

	$( function () {
		const $gallery = $( '.woocommerce-product-gallery' );
		if ( ! $gallery.length ) {
			return;
		}

		// Function to get the current main image wrapper (handles some themes having multiple or changing wrappers)
		const getMainWrapper = () => {
			let $wrapper = $gallery.find(
				'.woocommerce-product-gallery__wrapper'
			);
			if ( ! $wrapper.length ) {
				$wrapper = $gallery.find( '.flex-viewport' );
			}
			if ( ! $wrapper.length ) {
				$wrapper = $gallery;
			}
			return $wrapper;
		};

		const removeVideo = () => {
			const $container = $( '.try-aura-video-player-container' );
			if ( $container.length ) {
				$container.remove();
				// Restore visibility to all images that might have been hidden
				$gallery
					.find( '.woocommerce-product-gallery__image, img' )
					.css( 'visibility', '' );
			}
		};

		$( document ).on( 'click', '.try-aura-video-thumbnail', function ( e ) {
			const $this = $( this );
			const videoUrl = $this.data( 'video-url' );

			if ( ! videoUrl ) {
				return;
			}

			const videoPlatform = $this.data( 'video-platform' );

			e.preventDefault();
			e.stopPropagation();

			// Remove any existing video before starting new one
			removeVideo();

			const $mainWrapper = getMainWrapper();

			let videoHtml = '';
			if ( videoPlatform === 'youtube' ) {
				const videoId = getYoutubeId( videoUrl );
				if ( videoId ) {
					videoHtml = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${ videoId }?autoplay=1&enablejsapi=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
				}
			} else {
				videoHtml = `<video width="100%" height="auto" controls autoplay><source src="${ videoUrl }" type="video/mp4">Your browser does not support the video tag.</video>`;
			}

			if ( videoHtml ) {
				const $container = $(
					'<div class="try-aura-video-player-container"></div>'
				).html( videoHtml );

				// If we are in a slider, we want to overlay the viewport
				const $viewport = $gallery.find( '.flex-viewport' );
				if ( $viewport.length ) {
					$viewport.append( $container );
				} else {
					$mainWrapper.prepend( $container );
				}

				// Hide images to show video
				$mainWrapper
					.find( '.woocommerce-product-gallery__image, img' )
					.css( 'visibility', 'hidden' );
			}
		} );

		// Handle clicking other thumbnails or navigation to remove video
		const cleanupSelectors = [
			'.woocommerce-product-gallery__image:not(.try-aura-video-thumbnail)',
			'.flex-control-nav li',
			'.flex-control-nav img',
			'.woocommerce-product-gallery__trigger',
			'.flex-direction-nav a',
			'.woocommerce-product-gallery__wrapper .zoomImg',
		].join( ', ' );

		$( document ).on( 'click', cleanupSelectors, function () {
			removeVideo();
		} );

		// WooCommerce Flexslider specific events
		$gallery.on( 'flexslider_before', function () {
			removeVideo();
		} );

		// Support for themes using Swiper or other sliders that trigger events
		$( document ).on( 'found_variation', function () {
			removeVideo();
		} );

		function getYoutubeId( url ) {
			const regExp =
				/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
			const match = url.match( regExp );
			return match && match[ 2 ].length === 11 ? match[ 2 ] : false;
		}
	} );
} )( jQuery );
