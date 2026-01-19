/* global jQuery */
( function ( $, wp ) {
	'use strict';

	$( function () {
		const $gallery = $( '.woocommerce-product-gallery' );
		if ( ! $gallery.length ) {
			return;
		}

		if ( ! wp || ! wp.element || ! wp.components || ! wp.components.Modal ) {
			return;
		}

		const { createElement } = wp.element;
		const { Modal } = wp.components;
		const createRootFn = wp.element.createRoot;

		let modalRoot = null;

		const VideoModal = ( { videoUrl, videoPlatform, onClose } ) => {
			let videoHtml = '';
			if ( videoPlatform === 'youtube' ) {
				const videoId = getYoutubeId( videoUrl );
				if ( videoId ) {
					videoHtml = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${ videoId }?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
				}
			} else {
				videoHtml = `<video width="100%" height="auto" controls autoplay><source src="${ videoUrl }" type="video/mp4">Your browser does not support the video tag.</video>`;
			}

			return createElement(
				Modal,
				{
					title: 'Video Player',
					onRequestClose: onClose,
					shouldCloseOnClickOutside: true,
					shouldCloseOnEsc: true,
					className: 'try-aura-video-modal-root',
				},
				createElement( 'div', {
					className: 'try-aura-video-modal-player',
					dangerouslySetInnerHTML: { __html: videoHtml },
				} )
			);
		};

		const openModal = ( videoUrl, videoPlatform ) => {
			let container = document.getElementById(
				'try-aura-video-modal-container'
			);
			if ( ! container ) {
				container = document.createElement( 'div' );
				container.id = 'try-aura-video-modal-container';
				document.body.appendChild( container );
			}

			const handleClose = () => {
				if ( modalRoot && modalRoot.unmount ) {
					modalRoot.unmount();
				} else if ( wp.element.render ) {
					wp.element.render( null, container );
				}
				container.remove();
				modalRoot = null;
			};

			if ( createRootFn ) {
				modalRoot = createRootFn( container );
				modalRoot.render(
					createElement( VideoModal, {
						videoUrl,
						videoPlatform,
						onClose: handleClose,
					} )
				);
			} else if ( wp.element.render ) {
				wp.element.render(
					createElement( VideoModal, {
						videoUrl,
						videoPlatform,
						onClose: handleClose,
					} ),
					container
				);
			}
		};

		// Capture phase listener to beat theme lightboxes and other scripts
		document.addEventListener(
			'click',
			function ( e ) {
				const target = e.target.closest( '.try-aura-video-item' );
				if ( target ) {
					const videoUrl = target.getAttribute(
						'data-try-aura-video-url'
					);
					if ( videoUrl ) {
						const videoPlatform = target.getAttribute(
							'data-try-aura-video-platform'
						);

						e.preventDefault();
						e.stopPropagation();
						e.stopImmediatePropagation();

						openModal( videoUrl, videoPlatform );
					}
				}
			},
			true
		);

		function getYoutubeId( url ) {
			const regExp =
				/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
			const match = url.match( regExp );
			return match && match[ 2 ].length === 11 ? match[ 2 ] : false;
		}
	} );
} )( jQuery, wp );
