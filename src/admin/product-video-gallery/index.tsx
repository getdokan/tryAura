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
						if ( ! $img.data( 'original-id' ) ) {
							$img.data( 'original-id', attachmentId );
						}
						if ( ! $img.data( 'original-srcset' ) ) {
							$img.data(
								'original-srcset',
								$img.attr( 'srcset' )
							);
						}
						if ( ! $img.data( 'original-sizes' ) ) {
							$img.data( 'original-sizes', $img.attr( 'sizes' ) );
						}

						if (
							dataObj?.useCustomThumbnail &&
							dataObj?.thumbnailUrl
						) {
							$img.attr( 'src', dataObj.thumbnailUrl )
								.removeAttr( 'srcset' )
								.removeAttr( 'sizes' );
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
		};

		addVideoButtons();

		const addGlobalVideoButton = () => {
			const $container = $( '.add_product_images' );
			if (
				$container.length &&
				! $( '#try-aura-add-global-video' ).length
			) {
				const $btnWrapper = $(
					'<div class="tryaura try-aura-add-global-video-wrapper"></div>'
				);
				const $btn = $( `
					<button type="button" id="try-aura-add-global-video" class="mt-3.25 flex flex-row justify-center items-center gap-1 rounded-[5px] bg-primary px-3 py-2 text-[14px] text-white hover:bg-bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-video" aria-hidden="true"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"></path><rect x="2" y="6" width="14" height="12" rx="2"></rect></svg>
						${ tryAuraVideo.addVideoText }
					</button>
				` );
				$btnWrapper.append( $btn );
				$container.append( $btnWrapper );

				$btn.on( 'click', function ( e ) {
					e.preventDefault();
					renderModal(
						null,
						async ( newData ) => {
							if ( ! newData || ! newData.url ) {
								renderModal();
								return;
							}

							let attachmentId = newData.thumbnailId;
							let thumbnailUrl = newData.thumbnailUrl;

							if ( ! newData.useCustomThumbnail ) {
								// Generate thumbnail via REST API
								try {
									const response = await fetch(
										`${ tryAuraVideo.restUrl }try-aura/v1/generate-thumbnail`,
										{
											method: 'POST',
											headers: {
												'Content-Type':
													'application/json',
												'X-WP-Nonce':
													tryAuraVideo.nonce,
											},
											body: JSON.stringify( {
												platform: newData.platform,
												url: newData.url,
												image: newData.generatedThumbnail,
											} ),
										}
									);
									const result = await response.json();
									if ( result.attachment_id ) {
										attachmentId = result.attachment_id;
										thumbnailUrl = result.url;
									} else {
										// eslint-disable-next-line no-alert
										alert(
											result.message ||
												'Failed to generate thumbnail'
										);
										return;
									}
								} catch ( err ) {
									// eslint-disable-next-line no-console
									console.error( err );
									return;
								}
							}

							if ( attachmentId ) {
								// Add to WooCommerce gallery
								const $gallery = $(
									'#product_images_container ul.product_images'
								);
								const $galleryInput = $(
									'#product_image_gallery'
								);
								const ids = $galleryInput
									.val()
									.split( ',' )
									.filter( Boolean );

								ids.push( attachmentId.toString() );
								$galleryInput
									.val( ids.join( ',' ) )
									.trigger( 'change' );

								// Add the item to the list so we don't have to wait for refresh
								$gallery.append( `
									<li class="image" data-attachment_id="${ attachmentId }">
										<img src="${ thumbnailUrl }" />
										<ul class="actions">
											<li><a href="#" class="delete" title="Delete image">Delete</a></li>
										</ul>
									</li>
								` );

								// Save video data
								const saveData = { ...newData };
								delete saveData.generatedThumbnail;
								if ( saveData.useCustomThumbnail ) {
									delete saveData.thumbnailId;
									delete saveData.thumbnailUrl;
								}

								if ( ! tryAuraVideo.videoData ) {
									tryAuraVideo.videoData = {};
								}
								tryAuraVideo.videoData[ attachmentId ] =
									saveData;

								// Re-run addVideoButtons to add the "Video" button to the new item
								addVideoButtons();
							}

							renderModal();
						},
						() => {
							renderModal();
						}
					);
				} );
			}
		};

		addGlobalVideoButton();

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
						addGlobalVideoButton();
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
				addGlobalVideoButton();
			} );
			observer.observe( galleryList, { childList: true } );
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
				const $img = $li.find( 'img' );
				const originalImageUrl = $img.attr( 'src' );

				renderModal(
					Object.keys( currentData ).length > 0 ? currentData : null,
					async ( newData ) => {
						let attachmentId = $btn.data( 'attachment-id' );
						let targetId = attachmentId;
						let thumbnailUrl = newData?.thumbnailUrl;

						if (
							newData &&
							! newData.useCustomThumbnail &&
							newData.url
						) {
							// Generate thumbnail via REST API
							try {
								const response = await fetch(
									`${ tryAuraVideo.restUrl }try-aura/v1/generate-thumbnail`,
									{
										method: 'POST',
										headers: {
											'Content-Type': 'application/json',
											'X-WP-Nonce': tryAuraVideo.nonce,
										},
										body: JSON.stringify( {
											platform: newData.platform,
											url: newData.url,
											image: newData.generatedThumbnail,
										} ),
									}
								);
								const result = await response.json();
								if ( result.attachment_id ) {
									targetId = result.attachment_id;
									thumbnailUrl = result.url;
								} else {
									// eslint-disable-next-line no-alert
									alert(
										result.message ||
											'Failed to generate thumbnail'
									);
									return;
								}
							} catch ( err ) {
								// eslint-disable-next-line no-console
								console.error( err );
								return;
							}
						} else if ( newData && newData.useCustomThumbnail ) {
							if ( newData.thumbnailId ) {
								targetId = newData.thumbnailId;
							}
						} else if ( newData ) {
							const originalId = $img.data( 'original-id' );
							if ( originalId ) {
								targetId = originalId;
							}
						}

						const $parentLi = $btn.closest( 'li.image' );
						const $icon = $btn.find( '.dashicons' );

						if ( String( targetId ) !== String( attachmentId ) ) {
							const $galleryInput = $( '#product_image_gallery' );
							const ids = $galleryInput
								.val()
								.split( ',' )
								.filter( Boolean );
							const index = ids.indexOf(
								attachmentId.toString()
							);
							if ( index !== -1 ) {
								ids[ index ] = targetId.toString();
								$galleryInput
									.val( ids.join( ',' ) )
									.trigger( 'change' );
							}
							$parentLi
								.data( 'attachment_id', targetId )
								.attr( 'data-attachment_id', targetId );

							if (
								tryAuraVideo.videoData &&
								tryAuraVideo.videoData[ attachmentId ]
							) {
								tryAuraVideo.videoData[ targetId ] =
									tryAuraVideo.videoData[ attachmentId ];
								delete tryAuraVideo.videoData[ attachmentId ];
							}

							$btn.data( 'attachment-id', targetId ).attr(
								'data-attachment-id',
								targetId
							);
							$input.attr(
								'name',
								`try_aura_video_data[${ targetId }]`
							);
							attachmentId = targetId;
						}

						if ( ! tryAuraVideo.videoData ) {
							tryAuraVideo.videoData = {};
						}

						if (
							! newData ||
							Object.keys( newData ).length === 0
						) {
							delete tryAuraVideo.videoData[ attachmentId ];

							$btn.removeClass( 'try-aura-edit-video' ).addClass(
								'try-aura-add-video'
							);
							$icon
								.removeClass( 'dashicons-edit' )
								.addClass( 'dashicons-plus' );

							const originalSrc = $img.data( 'original-src' );
							const originalSrcset =
								$img.data( 'original-srcset' );
							const originalSizes = $img.data( 'original-sizes' );

							if ( originalSrc ) {
								$img.attr( 'src', originalSrc );
							}
							if ( originalSrcset ) {
								$img.attr( 'srcset', originalSrcset );
							} else {
								$img.removeAttr( 'srcset' );
							}
							if ( originalSizes ) {
								$img.attr( 'sizes', originalSizes );
							} else {
								$img.removeAttr( 'sizes' );
							}
							$input.val( '' );
						} else {
							// Strip redundant info for storage
							const saveData = { ...newData };
							if ( saveData.useCustomThumbnail ) {
								delete saveData.thumbnailId;
								delete saveData.thumbnailUrl;
							}

							tryAuraVideo.videoData[ attachmentId ] = saveData;
							$input.val( JSON.stringify( saveData ) );

							$btn.removeClass( 'try-aura-add-video' ).addClass(
								'try-aura-edit-video'
							);
							$icon
								.removeClass( 'dashicons-plus' )
								.addClass( 'dashicons-edit' );

							if ( newData.useCustomThumbnail && thumbnailUrl ) {
								$img.attr( 'src', thumbnailUrl )
									.removeAttr( 'srcset' )
									.removeAttr( 'sizes' );
							} else if ( ! newData.useCustomThumbnail ) {
								const originalSrc = $img.data( 'original-src' );
								const originalSrcset =
									$img.data( 'original-srcset' );
								const originalSizes =
									$img.data( 'original-sizes' );

								if ( originalSrc ) {
									$img.attr( 'src', originalSrc );
								}
								if ( originalSrcset ) {
									$img.attr( 'srcset', originalSrcset );
								} else {
									$img.removeAttr( 'srcset' );
								}
								if ( originalSizes ) {
									$img.attr( 'sizes', originalSizes );
								} else {
									$img.removeAttr( 'sizes' );
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
