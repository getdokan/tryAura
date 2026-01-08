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

		const getFirstMainImage = () => {
			const $wrapper = getMainWrapper();
			let $img = $wrapper.find(
				'.woocommerce-product-gallery__image:not(.try-aura-video-thumbnail)'
			);
			if ( ! $img.length ) {
				$img = $wrapper.find( 'img' ).first();
			}
			return $img.first();
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

			const $mainWrapper = getMainWrapper();
			const $mainImage = getFirstMainImage();

			// Remove existing video player if any
			$mainWrapper.find( '.try-aura-video-player-container' ).remove();

			let videoHtml = '';
			if ( videoPlatform === 'youtube' ) {
				const videoId = getYoutubeId( videoUrl );
				if ( videoId ) {
					videoHtml = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${ videoId }?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
				}
			} else {
				videoHtml = `<video width="100%" height="auto" controls autoplay><source src="${ videoUrl }" type="video/mp4">Your browser does not support the video tag.</video>`;
			}

			if ( videoHtml ) {
				const $container = $(
					'<div class="try-aura-video-player-container"></div>'
				).html( videoHtml );

				// If we are in a slider, we might want to overlay the current visible area
				if ( $gallery.find( '.flex-viewport' ).length ) {
					$gallery.find( '.flex-viewport' ).append( $container );
				} else {
					$mainWrapper.prepend( $container );
				}

				$mainImage.css( 'visibility', 'hidden' );
			}
		} );

		// Handle clicking other thumbnails or navigation to remove video
		$( document ).on(
			'click',
			'.woocommerce-product-gallery__image:not(.try-aura-video-thumbnail), .flex-control-nav li, .woocommerce-product-gallery__trigger',
			function () {
				const $mainWrapper = getMainWrapper();
				const $container = $mainWrapper.find(
					'.try-aura-video-player-container'
				);
				if ( $container.length ) {
					$container.remove();
					getFirstMainImage().css( 'visibility', 'visible' );
				}
			}
		);

		// Support for themes using Swiper or other sliders that trigger events
		$( document ).on( 'found_variation', function () {
			$( '.try-aura-video-player-container' ).remove();
			getFirstMainImage().css( 'visibility', 'visible' );
		} );

		function getYoutubeId( url ) {
			const regExp =
				/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
			const match = url.match( regExp );
			return match && match[ 2 ].length === 11 ? match[ 2 ] : false;
		}
	} );
} )( jQuery );
