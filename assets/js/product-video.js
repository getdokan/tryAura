( function ( $ ) {
	'use strict';

	$( function () {
		const $gallery = $( '.woocommerce-product-gallery' );
		if ( ! $gallery.length ) {
			return;
		}

		const $mainImageWrapper = $gallery.find(
			'.woocommerce-product-gallery__wrapper'
		);
		const $mainImage = $mainImageWrapper
			.find( '.woocommerce-product-gallery__image' )
			.first();

		$( document ).on(
			'click',
			'.try-aura-video-thumbnail a',
			function ( e ) {
				e.preventDefault();
				e.stopPropagation();

				const $thumbnailContainer = $( this ).closest(
					'.try-aura-video-thumbnail'
				);
				const videoUrl = $thumbnailContainer.data( 'video-url' );
				const videoPlatform =
					$thumbnailContainer.data( 'video-platform' );

				// Remove existing video player if any
				$mainImageWrapper
					.find( '.try-aura-video-player-container' )
					.remove();

				let videoHtml = '';
				if ( videoPlatform === 'youtube' ) {
					const videoId = getYoutubeId( videoUrl );
					if ( videoId ) {
						videoHtml = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${ videoId }?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
					}
				} else {
					videoHtml = `<video width="100%" height="auto" controls autoplay><source src="${ videoUrl }" type="video/mp4">${
						navigator.appName === 'Microsoft Internet Explorer'
							? 'Your browser does not support the video tag.'
							: ''
					}</video>`;
				}

				if ( videoHtml ) {
					const $container = $(
						'<div class="try-aura-video-player-container"></div>'
					).html( videoHtml );
					$mainImageWrapper.prepend( $container );
					$mainImage.hide();
				}
			}
		);

		// Handle clicking other thumbnails to remove video
		$( document ).on(
			'click',
			'.woocommerce-product-gallery__image:not(.try-aura-video-thumbnail)',
			function () {
				const $container = $mainImageWrapper.find(
					'.try-aura-video-player-container'
				);
				if ( $container.length ) {
					$container.remove();
					$mainImage.show();
				}
			}
		);

		function getYoutubeId( url ) {
			const regExp =
				/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
			const match = url.match( regExp );
			return match && match[ 2 ].length === 11 ? match[ 2 ] : false;
		}
	} );
} )( jQuery );
