import { createRoot } from '@wordpress/element';
import './style.scss';
import ProductVideoGallery from './components/ProductVideoGallery';
import { Toaster } from 'react-hot-toast';

declare const jQuery: any;
declare const tryAuraVideo: any;

( function ( $ ) {
	$( function () {
		let $modalContainer = $( '#try-aura-video-modal-container' );
		if ( ! $modalContainer.length ) {
			$modalContainer = $(
				'<div id="try-aura-video-modal-container" class="tryaura"></div>'
			);
			$( 'body' ).append( $modalContainer );
		}

		const root = createRoot( $modalContainer[ 0 ] );

		const renderModal = (
			initialData = null,
			onSave = null,
			onClose = null,
			originalImageUrl = null
		) => {
			root.render(
				<>
					<ProductVideoGallery
						editingVideo={ initialData }
						onSave={ onSave }
						onClose={ onClose }
						isExternalOpen={ !! initialData || !! onSave }
						originalImageUrl={ originalImageUrl }
					/>
					<Toaster position="top-right" />
				</>
			);
		};

		renderModal();

		const addVideoButtons = () => {
			// For Gallery Images
			$( '#product_images_container ul.product_images > li' ).each(
				function () {
					const $image = $( this );
					const attachmentId = $image.data( 'attachment_id' );

					if (
						! attachmentId ||
						$image.find( '.try-aura-product-gallery-video' ).length
					) {
						return;
					}

					const videoData =
						tryAuraVideo.videoData &&
						tryAuraVideo.videoData[ attachmentId ]
							? JSON.stringify(
									tryAuraVideo.videoData[ attachmentId ]
							  )
							: '';

					const buttonClass = videoData
						? 'try-aura-edit-video'
						: 'try-aura-add-video';
					const iconClass = videoData
						? 'dashicons-edit'
						: 'dashicons-plus';

					const dataObj =
						tryAuraVideo.videoData &&
						tryAuraVideo.videoData[ attachmentId ]
							? tryAuraVideo.videoData[ attachmentId ]
							: null;

					const $img = $image.find( 'img' );
					if ( $img.length ) {
						if ( ! $img.data( 'original-src' ) ) {
							$img.data( 'original-src', $img.attr( 'src' ) );
						}

						if ( dataObj?.useCustomThumbnail && dataObj?.thumbnailUrl ) {
							$img.attr( 'src', dataObj.thumbnailUrl );
						}
					}

					$image.append( `
					<div class="tryaura try-aura-product-video-wrapp absolute bottom-0 left-0 right-0 z-10">
						<a href="#" class="try-aura-btn try-aura-product-gallery-video flex items-center justify-center gap-1.25 bg-primary text-white no-underline py-1.25 text-[11px] font-semibold leading-none hover:bg-primary-dark ${ buttonClass }" data-attachment-id="${ attachmentId }">
							<span class="dashicons ${ iconClass } text-[14px]! w-3.5! h-3.5! flex! items-center! justify-center!"></span>
							${ tryAuraVideo.videoText }
						</a>
						<input type="hidden" class="try-aura-video-data-input" name="try_aura_video_data[${ attachmentId }]" value='${ videoData }'>
					</div>
				` );
				}
			);

			// For Featured Image
			const $mainImage = $( '#postimagediv .inside' );
			const mainAttachmentId = $( '#_thumbnail_id' ).val();
			if (
				mainAttachmentId &&
				mainAttachmentId !== '-1' &&
				! $mainImage.find( '.try-aura-product-gallery-video' ).length
			) {
				const videoData =
					tryAuraVideo.videoData &&
					tryAuraVideo.videoData[ mainAttachmentId ]
						? JSON.stringify(
								tryAuraVideo.videoData[ mainAttachmentId ]
						  )
						: '';

				const buttonClass = videoData
					? 'try-aura-edit-video'
					: 'try-aura-add-video';
				const iconClass = videoData
					? 'dashicons-edit'
					: 'dashicons-plus';

				const dataObj =
					tryAuraVideo.videoData &&
					tryAuraVideo.videoData[ mainAttachmentId ]
						? tryAuraVideo.videoData[ mainAttachmentId ]
						: null;

				const $img = $mainImage.find( 'img' );
				if ( $img.length ) {
					if ( ! $img.data( 'original-src' ) ) {
						$img.data( 'original-src', $img.attr( 'src' ) );
					}

					if ( dataObj?.useCustomThumbnail && dataObj?.thumbnailUrl ) {
						$img.attr( 'src', dataObj.thumbnailUrl );
					}
				}

				$mainImage.append( `
					<div class="tryaura try-aura-product-video-wrapp absolute bottom-0 left-0 right-0 z-10">
						<a href="#" class="try-aura-btn try-aura-product-gallery-video flex items-center justify-center gap-1.25 bg-primary text-white no-underline py-1.25 text-[11px] font-semibold leading-none hover:bg-primary-dark ${ buttonClass }" data-attachment-id="${ mainAttachmentId }">
							<span class="dashicons ${ iconClass } text-[14px]! w-3.5! h-3.5! flex! items-center! justify-center!"></span>
							${ tryAuraVideo.videoText }
						</a>
						<input type="hidden" class="try-aura-video-data-input" name="try_aura_video_data[${ mainAttachmentId }]" value='${ videoData }'>
					</div>
				` );
			}
		};

		addVideoButtons();

		const inputImage = document.querySelector(
			'input#product_image_gallery'
		);
		if ( inputImage ) {
			const observer = new MutationObserver( ( changes ) => {
				changes.forEach( ( change ) => {
					if (
						change.attributeName &&
						change.attributeName.includes( 'value' )
					) {
						addVideoButtons();
					}
				} );
			} );
			observer.observe( inputImage, { attributes: true } );
		}

		const galleryList = document.querySelector(
			'#product_images_container ul.product_images'
		);
		if ( galleryList ) {
			const observer = new MutationObserver( () => {
				addVideoButtons();
			} );
			observer.observe( galleryList, { childList: true } );
		}

		const mainImageInside = document.querySelector(
			'#postimagediv .inside'
		);
		if ( mainImageInside ) {
			const observer = new MutationObserver( () => {
				addVideoButtons();
			} );
			observer.observe( mainImageInside, { childList: true } );
		}

		$( 'body' ).on(
			'click',
			'.try-aura-product-gallery-video',
			function ( e ) {
				e.preventDefault();
				const $btn = $( this );
				const $wrapp = $btn.closest( '.try-aura-product-video-wrapp' );
				const $input = $wrapp.find( '.try-aura-video-data-input' );
				const currentData = JSON.parse( $input.val() || '{}' );

				const $li = $btn.closest( 'li.image' );
				const $img = $li.length
					? $li.find( 'img' )
					: $( '#postimagediv .inside img' );
				const originalImageUrl = $img.attr( 'src' );

				renderModal(
					Object.keys( currentData ).length > 0 ? currentData : null,
					( newData ) => {
						$input.val( JSON.stringify( newData ) );
						const $icon = $btn.find( '.dashicons' );
						if (
							! newData ||
							Object.keys( newData ).length === 0
						) {
							$btn.removeClass( 'try-aura-edit-video' ).addClass(
								'try-aura-add-video'
							);
							$icon
								.removeClass( 'dashicons-edit' )
								.addClass( 'dashicons-plus' );

							const originalSrc = $img.data( 'original-src' );
							if ( originalSrc ) {
								$img.attr( 'src', originalSrc );
							}
						} else {
							$btn.removeClass( 'try-aura-add-video' ).addClass(
								'try-aura-edit-video'
							);
							$icon
								.removeClass( 'dashicons-plus' )
								.addClass( 'dashicons-edit' );

							if (
								newData.useCustomThumbnail &&
								newData.thumbnailUrl
							) {
								$img.attr( 'src', newData.thumbnailUrl );
							} else {
								const originalSrc = $img.data( 'original-src' );
								if ( originalSrc ) {
									$img.attr( 'src', originalSrc );
								}
							}
						}
						renderModal(); // Close modal
					},
					() => {
						renderModal(); // Close modal
					},
					originalImageUrl
				);
			}
		);
	} );
} )( jQuery );
