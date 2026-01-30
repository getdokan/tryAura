import { createRoot } from '@wordpress/element';
import './style.scss';
import ProductVideoGallery from './components/ProductVideoGallery';
import { Toaster } from 'react-hot-toast';
import { __ } from '@wordpress/i18n';

declare const jQuery: any;
declare const tryAuraVideo: any;

( function ( $ ) {
	$( function () {
		let $modalContainer = $( '#tryaura-video-modal-container' );
		if ( ! $modalContainer.length ) {
			$modalContainer = $(
				'<div id="tryaura-video-modal-container" class="tryaura"></div>'
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
			const processImage = ( $image, attachmentId ) => {
				if (
					! attachmentId ||
					attachmentId === '-1' ||
					$image.find( '.tryaura-product-gallery-video' ).length
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

				if ( ! videoData ) {
					return;
				}

				const buttonClass = 'tryaura-edit-video';

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
						$img.data( 'original-srcset', $img.attr( 'srcset' ) );
					}
					if ( ! $img.data( 'original-sizes' ) ) {
						$img.data( 'original-sizes', $img.attr( 'sizes' ) );
					}

					if (
						dataObj?.useCustomThumbnail &&
						dataObj?.thumbnailUrl
					) {
						$img.attr( 'src', dataObj.thumbnailUrl ).removeAttr(
							'srcset'
						);
						if ( $image.is( 'li.image' ) ) {
							$img.attr(
								'sizes',
								'auto, (max-width: 150px) 100vw, 150px'
							);
						} else {
							$img.removeAttr( 'sizes' );
						}
					}
				}

				$image.append( `
					<div class="tryaura tryaura-product-video-wrapp group">
						<a href="#" class="tryaura-btn tryaura-product-gallery-video flex items-center justify-center bg-white/50 hover:bg-white text-white hover:text-primary no-underline ${ buttonClass }" data-attachment-id="${ attachmentId }">
							<span class="hidden group-hover:flex text-[18px]! w-4.5! h-4.5! items-center! justify-center!">
								<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-pencil-icon lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
							</span>
							<span class="text-[18px]! w-4.5! h-4.5! flex! group-hover:hidden! items-center! justify-center! bg-primary rounded-full">
								<svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-play-icon lucide-play"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>
							</span>
						</a>
						<input type="hidden" class="tryaura-video-data-input" name="tryaura_video_data[${ attachmentId }]" value='${ videoData }'>
					</div>
				` );
			};

			// For Gallery Images
			$( '#product_images_container ul.product_images > li' ).each(
				function () {
					const $image = $( this );
					const attachmentId =
						$image.data( 'attachment_id' ) ||
						$image.attr( 'data-attachment_id' );
					processImage( $image, attachmentId );
				}
			);
		};

		addVideoButtons();

		const addGlobalVideoButton = () => {
			const $container = $( '.add_product_images' );
			if (
				$container.length &&
				! $( '#tryaura-add-global-video' ).length
			) {
				const $btnWrapper = $(
					'<div class="tryaura tryaura-add-global-video-wrapper"></div>'
				);
				const $btn = $( `
					<button type="button" id="tryaura-add-global-video" class="mt-3.25 flex flex-row justify-center items-center gap-1 rounded-[5px] bg-primary px-3 py-2 text-[14px] text-white hover:bg-bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full">
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
										`${ tryAuraVideo.restUrl }tryaura/v1/generate-thumbnail`,
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
										<img width="150" height="150" src="${ thumbnailUrl }" sizes="auto, (max-width: 150px) 100vw, 150px" />
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
			'.tryaura-product-gallery-video',
			function ( e ) {
				e.preventDefault();
				const $btn = $( this );
				const $wrapp = $btn.closest( '.tryaura-product-video-wrapp' );
				const $input = $wrapp.find( '.tryaura-video-data-input' );
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
									`${ tryAuraVideo.restUrl }tryaura/v1/generate-thumbnail`,
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
								`tryaura_video_data[${ targetId }]`
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

							$wrapp.remove();

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
						} else {
							// Strip redundant info for storage
							const saveData = { ...newData };
							if ( saveData.useCustomThumbnail ) {
								delete saveData.thumbnailId;
								delete saveData.thumbnailUrl;
							}

							tryAuraVideo.videoData[ attachmentId ] = saveData;
							$input.val( JSON.stringify( saveData ) );

							$btn.removeClass( 'tryaura-add-video' ).addClass(
								'tryaura-edit-video'
							);
							$icon
								.removeClass( 'dashicons-plus' )
								.addClass( 'dashicons-edit' );

							if ( newData.useCustomThumbnail && thumbnailUrl ) {
								$img.attr( 'src', thumbnailUrl ).removeAttr(
									'srcset'
								);
								if ( $parentLi.length ) {
									$img.attr(
										'sizes',
										'auto, (max-width: 150px) 100vw, 150px'
									);
								} else {
									$img.removeAttr( 'sizes' );
								}
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

		// Change Gallery or Featured Image
		$( 'body' ).on(
			'click',
			'li.image img, #postimagediv .inside img',
			function ( e ) {
				e.preventDefault();

				if ( ! window.wp || ! wp.media ) {
					return;
				}

				const $img = $( this );
				const $li = $img.closest( 'li.image' );
				const isGallery = $li.length > 0;
				const $container = isGallery ? $li : $img.closest( '.inside' );

				const attachmentId = isGallery
					? $li.data( 'attachment_id' ) ||
					  $li.attr( 'data-attachment_id' )
					: $( '#_thumbnail_id' ).val();

				if (
					attachmentId &&
					attachmentId !== '-1' &&
					tryAuraVideo.videoData &&
					tryAuraVideo.videoData[ attachmentId ]
				) {
					return;
				}

				const frame = wp.media( {
					title: __( 'Update gallery image', 'tryaura' ),
					button: {
						text: __( 'Use this image', 'tryaura' ),
					},
					multiple: false,
				} );

				frame.on( 'select', function () {
					const attachment = frame
						.state()
						.get( 'selection' )
						.first()
						.toJSON();
					const newAttachmentId = attachment.id;
					const newImageUrl =
						attachment.sizes?.thumbnail?.url || attachment.url;

					if ( isGallery ) {
						// Update gallery input
						const $galleryInput = $( '#product_image_gallery' );
						const ids = $galleryInput
							.val()
							.split( ',' )
							.filter( Boolean );
						const index = ids.indexOf( attachmentId.toString() );
						if ( index !== -1 ) {
							ids[ index ] = newAttachmentId.toString();
							$galleryInput
								.val( ids.join( ',' ) )
								.trigger( 'change' );
						}

						// Update li
						$li.data( 'attachment_id', newAttachmentId ).attr(
							'data-attachment_id',
							newAttachmentId
						);
					} else {
						// Update featured image input
						$( '#_thumbnail_id' )
							.val( newAttachmentId )
							.trigger( 'change' );
					}

					$img.attr( 'src', newImageUrl );
					$img.removeAttr( 'srcset' );
					if ( isGallery ) {
						$img.attr(
							'sizes',
							'auto, (max-width: 150px) 100vw, 150px'
						);
					} else {
						$img.removeAttr( 'sizes' );
					}

					// Update video button's data-attachment-id
					const $videoBtn = $container.find(
						'.tryaura-product-gallery-video'
					);
					if ( $videoBtn.length ) {
						$videoBtn
							.data( 'attachment-id', newAttachmentId )
							.attr( 'data-attachment-id', newAttachmentId );

						// Also update hidden input name
						const $videoInput = $container.find(
							'.tryaura-video-data-input'
						);
						if ( $videoInput.length ) {
							$videoInput.attr(
								'name',
								`tryaura_video_data[${ newAttachmentId }]`
							);

							// If there was video data for the old ID, move it to the new ID
							if (
								tryAuraVideo.videoData &&
								tryAuraVideo.videoData[ attachmentId ]
							) {
								tryAuraVideo.videoData[ newAttachmentId ] =
									tryAuraVideo.videoData[ attachmentId ];
								delete tryAuraVideo.videoData[ attachmentId ];
							}
						}
					}
				} );

				frame.on( 'open', function () {
					const selection = frame.state().get( 'selection' );
					if ( attachmentId && attachmentId !== '-1' ) {
						const attachment = wp.media.attachment( attachmentId );
						attachment.fetch();
						selection.add( attachment ? [ attachment ] : [] );
					}
				} );

				frame.open();
			}
		);
	} );
} )( jQuery );
