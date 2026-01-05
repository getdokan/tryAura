import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from './store';
import { GoogleGenAI } from '@google/genai';
import { Button } from '../../components';
import { __ } from '@wordpress/i18n';
import { X } from 'lucide-react';
import OriginalImage from './PreviewSections/OriginalImage';
import ConfigSettings from './PreviewSections/ConfigSettings';
import Output from './PreviewSections/Output';
import { applyFilters, doAction } from '@wordpress/hooks';
import toast, { Toaster } from 'react-hot-toast';

declare const wp: any;

type PreviewProps = {
	imageUrls: string[];
	attachmentIds: number[];
	onClose: () => void;
	supportsVideo?: boolean;
};

async function resolveApiKey(): Promise< string | null > {
	try {
		const key = window?.tryAura?.apiKey;
		if ( key && key.length > 0 ) {
			return key;
		}
		const rest = window?.tryAura?.restUrl;
		const nonce = window?.tryAura?.nonce;
		if ( ! rest || ! nonce ) {
			return null;
		}
		const res = await fetch(
			rest.replace( /\/?$/, '/' ) + 'try-aura/v1/settings',
			{
				headers: { 'X-WP-Nonce': nonce },
				credentials: 'same-origin',
			}
		);
		if ( ! res.ok ) {
			return null;
		}
		const data = await res.json();
		const opt = ( data && ( data as any ).try_aura_api_key ) as
			| string
			| undefined;
		return opt && opt.length > 0 ? opt : null;
	} catch {
		return null;
	}
}

const PreviewModal = ( {
	imageUrls,
	attachmentIds,
	onClose,
	supportsVideo,
}: PreviewProps ) => {
	const {
		generatedUrl,
		uploading,
		videoUrl,
		videoUploading,
		videoConfigData,
		imageConfigData,
		activeTab,
		isBusy,
		isVideoBusy,
		videoSource,
		selectedImageIndices,
		selectedVideoIndices,
	} = useSelect(
		( select ) => {
			const store = select( STORE_NAME );
			return {
				generatedUrl: store.getGeneratedUrl(),
				uploading: store.getUploading(),
				videoUrl: store.getVideoUrl(),
				videoUploading: store.getVideoUploading(),
				videoConfigData: store.getVideoConfigData(),
				imageConfigData: store.getImageConfigData(),
				activeTab: store.getActiveTab(),
				isBusy: store.isBusy(),
				isVideoBusy: store.isVideoBusy(),
				videoSource: store.getVideoSource(),
				selectedImageIndices: store.getSelectedImageIndices(),
				selectedVideoIndices: store.getSelectedVideoIndices(),
			};
		},
		[ STORE_NAME ]
	);

	const {
		setIsBlockEditorPage,
		setIsWoocommerceProductPage,
		setStatus,
		setMessage,
		setGeneratedUrl,
		setError,
		setUploading,
		setVideoStatus,
		setVideoMessage,
		setVideoUrl,
		setVideoError,
		setVideoUploading,
		resetState,
	} = useDispatch( STORE_NAME );

	const multiple = imageUrls.length > 1;

	useEffect( () => {
		setIsBlockEditorPage(
			document.body.classList.contains(
				applyFilters(
					'teyaura.is_block_editor_page_classname',
					'block-editor-page'
				)
			)
		);
		setIsWoocommerceProductPage(
			document.body.classList.contains(
				applyFilters(
					'teyaura.is_woocommerce_product_page_classname',
					'post-type-product'
				)
			)
		);
		document.body.classList.add(
			applyFilters(
				'tryaura.ai_enhance_modal_classname',
				'ai-enhancer-modal-open'
			)
		);
		return () =>
			document.body.classList.remove(
				applyFilters(
					'tryaura.ai_enhance_modal_classname',
					'ai-enhancer-modal-open'
				)
			);
	}, [] );

	// Reset state when image changes
	useEffect( () => {
		if ( videoUrl && videoUrl.startsWith( 'blob:' ) ) {
			try {
				URL.revokeObjectURL( videoUrl );
			} catch {}
		}
		resetState();
	}, [ imageUrls, resetState ] );

	// Revoke video blob URL on unmount/change to free memory
	useEffect( () => {
		return () => {
			if ( videoUrl && videoUrl.startsWith( 'blob:' ) ) {
				try {
					URL.revokeObjectURL( videoUrl );
				} catch {}
			}
		};
	}, [ videoUrl ] );

	const doGenerate = async () => {
		try {
			setError( null );
			const selectedUrls = imageUrls.filter( ( _, idx ) =>
				selectedImageIndices.includes( idx )
			);

			if ( selectedUrls.length === 0 ) {
				throw new Error(
					__( 'Please select at least one image.', 'try-aura' )
				);
			}

			const apiKey = await resolveApiKey();
			if ( ! apiKey ) {
				throw new Error(
					__(
						'Missing Google AI API key. Please set it on the TryAura settings page.',
						'try-aura'
					)
				);
			}

			setStatus( 'fetching' );
			setMessage( __( 'Fetching images…', 'try-aura' ) );
			const encodedImages = await Promise.all(
				selectedUrls.map( async ( url ) => {
					const resp = await fetch( url, {
						credentials: 'same-origin',
					} );
					const blob = await resp.blob();
					const mimeType = blob.type || 'image/png';
					const base64 = await new Promise< string >(
						( resolve, reject ) => {
							const reader = new FileReader();
							reader.onloadend = () => {
								const result = reader.result as string;
								const comma = result.indexOf( ',' );
								resolve(
									comma >= 0
										? result.substring( comma + 1 )
										: result
								);
							};
							reader.onerror = reject;
							reader.readAsDataURL( blob );
						}
					);
					return { mimeType, base64 };
				} )
			);

			setStatus( 'generating' );
			setMessage( 'Thinking and generating…' );
			const ai = new GoogleGenAI( { apiKey } );

			const extras =
				imageConfigData?.optionalPrompt &&
				imageConfigData?.optionalPrompt.trim().length
					? `\n\nAdditional instruction from user: ${ imageConfigData?.optionalPrompt.trim() }`
					: '';
			const multiHint =
				selectedUrls.length > 1
					? applyFilters(
							'tryaura.ai_enhance_multi_image_hint',
							'\n\nNote: Multiple input images provided. If a person/model photo and separate product images are present, compose the result with the model wearing/using the product(s) while keeping the background as requested.'
					  )
					: '';
			const promptText = applyFilters(
				'tryaura.ai_enhance_prompt_text',
				`Generate a high-quality AI product try-on image where the product from the provided image(s) is naturally worn or used by a suitable human model.\n\nPreferences:\n- Background preference: ${ imageConfigData?.backgroundType }\n- Output style: ${ imageConfigData?.styleType }\n\nRequirements: Automatically determine an appropriate model. Ensure the product fits perfectly with accurate lighting, proportions, and textures preserved. Maintain professional composition and a brand-safe output.${ extras }${ multiHint }`,
				imageConfigData,
				extras,
				multiHint
			);
			const prompt = applyFilters( 'tryaura.ai_enhance_prompt', [
				{ text: promptText },
				...encodedImages.map( ( img ) => ( {
					inlineData: { mimeType: img.mimeType, data: img.base64 },
				} ) ),
			] );

			doAction( 'tryaura.ai_enhance_prompt_before_generate', prompt );
			const response: any = await ( ai as any ).models.generateContent(
				applyFilters( 'tryaura.ai_enhance_model_content', {
					model: 'gemini-2.5-flash-image-preview',
					contents: prompt,
				} )
			);
			doAction( 'tryaura.ai_enhance_prompt_after_generate', response );

			setStatus( 'parsing' );
			setMessage( __( 'Processing results…', 'try-aura' ) );
			const parts = response?.candidates?.[ 0 ]?.content?.parts || [];
			let data64: string | null = null;
			let outMime: string = 'image/png';
			for ( const part of parts ) {
				if ( part.inlineData ) {
					data64 = part.inlineData.data;
					outMime = part.inlineData.mimeType || outMime;
					break;
				}
			}

			if ( ! data64 ) {
				throw new Error( 'Model did not return an image.' );
			}

			const dataUrl = `data:${ outMime };base64,${ data64 }`;
			setGeneratedUrl( dataUrl );
			setStatus( 'done' );
			setMessage( 'Done' );
			setError( null );
		} catch ( e: any ) {
			setError( e?.message || 'Generation failed.' );
			setStatus( 'error' );
			setMessage( 'Generation failed.' );
		}
	};

	const setInMediaSelection = async () => {
		if ( ! generatedUrl ) {
			return;
		}
		try {
			setUploading( true );
			const rest = window?.tryAura?.restUrl;
			const nonce = window?.tryAura?.nonce;
			if ( ! rest || ! nonce ) {
				throw new Error(
					__( 'Missing WordPress REST configuration.', 'try-aura' )
				);
			}
			const restBase = rest.replace( /\/?$/, '/' );

			// Convert data URL to Blob by fetching it (works for data: URLs too)
			const blob = await fetch( generatedUrl ).then( ( r ) => r.blob() );
			const mime = blob.type || 'image/png';
			const ext = ( mime.split( '/' )?.[ 1 ] || 'png' ).split(
				'+'
			)?.[ 0 ];
			const primaryAttachmentId = applyFilters(
				'tryaura.ai_enhance_primary_attachment_id',
				attachmentIds && attachmentIds.length > 0
					? attachmentIds[ 0 ]
					: null
			);
			const filename = applyFilters(
				'tryaura.ai_enhance_filename',
				primaryAttachmentId
					? `enhanced-${ primaryAttachmentId }-${ Date.now() }.${ ext }`
					: `enhanced-${ Date.now() }.${ ext }`
			);

			doAction(
				'tryaura.ai_enhance_upload_before',
				filename,
				blob,
				nonce,
				restBase
			);
			const uploadRes = await fetch(
				applyFilters(
					'tryaura.media_upload_rest_api',
					`${ restBase }'wp/v2/media'`
				),
				{
					method: 'POST',
					headers: {
						'X-WP-Nonce': nonce,
						'Content-Disposition': `attachment; filename="${ filename }"`,
						'Content-Type': mime,
					},
					credentials: 'same-origin',
					body: blob,
				}
			);
			if ( ! uploadRes.ok ) {
				const text = await uploadRes.text();
				doAction(
					'tryaura.ai_enhance_upload_failed',
					filename,
					blob,
					text
				);
				throw new Error( text || 'Upload failed.' );
			}
			const json = await uploadRes.json();
			const newId = json?.id;
			if ( ! newId ) {
				doAction( 'tryaura.ai_enhance_upload_failed', filename, blob );
				throw new Error(
					'Upload succeeded but no attachment ID returned.'
				);
			}

			doAction(
				'tryaura.ai_enhance_upload_success',
				filename,
				blob,
				newId
			);

			// Select it in the media frame. Only set featured image if we're in the featured image modal.
			try {
				const frameObj =
					wp?.media?.frame ||
					( wp?.media?.featuredImage?.frame
						? wp.media.featuredImage.frame()
						: null );
				let isFeaturedContext = false;
				if ( frameObj ) {
					// Detect context via frame options/state id when possible.
					const state =
						typeof frameObj.state === 'function'
							? frameObj.state()
							: null;
					const stateId =
						( state &&
							( state.id ||
								( state.get && state.get( 'id' ) ) ||
								( state.attributes &&
									state.attributes.id ) ) ) ||
						( frameObj.options && frameObj.options.state );
					if ( stateId === 'featured-image' ) {
						isFeaturedContext = true;
					}
					// Update current selection to the newly uploaded attachment so it can be inserted or set.
					const selection = state?.get?.( 'selection' );
					if ( selection ) {
						const att = wp?.media?.model?.Attachment?.get
							? wp.media.model.Attachment.get( newId )
							: null;
						if ( att?.fetch ) {
							try {
								await att.fetch();
							} catch {}
						}
						if ( att ) {
							selection.reset( [ att ] );
						}
					}
				}
				// Only set the featured image when the current frame is the featured image modal.
				if ( isFeaturedContext && wp?.media?.featuredImage?.set ) {
					doAction(
						'tryaura.ai_enhance_upload_success_before',
						filename,
						blob,
						newId
					);
					wp.media.featuredImage.set( newId );
					doAction(
						'tryaura.ai_enhance_upload_success_after',
						filename,
						blob,
						newId
					);
				}
			} catch ( e ) {
				// ignore UI sync errors
			}

			onClose();
		} catch ( e: any ) {
			setError( e?.message || 'Failed to set image.' );
		} finally {
			setUploading( false );
		}
	};

	const doGenerateVideo = async () => {
		try {
			let sourceUrl = '';
			if ( videoSource === 'generated-image' ) {
				if ( ! generatedUrl ) {
					setVideoError(
						__( 'Please generate an image first.', 'try-aura' )
					);
					return;
				}
				sourceUrl = generatedUrl;
			} else {
				if ( ! selectedVideoIndices || ! selectedVideoIndices.length ) {
					setVideoError(
						__(
							'Please select at least one original image.',
							'try-aura'
						)
					);
					return;
				}
				// Use the first selected original image as the reference
				sourceUrl = imageUrls[ selectedVideoIndices[ 0 ] ];
			}

			setVideoError( null );
			setVideoStatus( 'generating' );
			setVideoMessage( __( 'Starting video generation…', 'try-aura' ) );

			const apiKey = await resolveApiKey();
			if ( ! apiKey ) {
				throw new Error(
					__(
						'Missing Google AI API key. Please set it on the TryAura settings page.',
						'try-aura'
					)
				);
			}

			const extras = applyFilters(
				'tryaura.video_generation_extras',
				videoConfigData?.optionalPrompt &&
					videoConfigData?.optionalPrompt.trim().length
					? `\n\nAdditional instruction from user: ${ videoConfigData?.optionalPrompt.trim() }`
					: ''
			);
			const { styles, cameraMotion, aspectRatio, duration } =
				videoConfigData;
			const videoPromptText = applyFilters(
				'tryaura.video_generation_prompt',
				videoSource === 'generated-image'
					? `Create a smooth ${ duration } product showcase video based on the generated try-on image. Use '${ cameraMotion }' camera motion and keep the scene aligned with ${ styles } preferences. Aspect ratio: ${ aspectRatio }. make the model walk relaxed.${ extras }`
					: `Create a smooth ${ duration } product showcase video based on the provided original image. Use '${ cameraMotion }' camera motion and keep the scene aligned with ${ styles } preferences. Aspect ratio: ${ aspectRatio }. make the model walk relaxed.${ extras }`
			);
			// Extract base64 from the source URL
			let sourceImageByteBase64 = '';
			let sourceImageMime = 'image/png';
			if ( sourceUrl.startsWith( 'data:' ) ) {
				const commaIdx = sourceUrl.indexOf( ',' );
				const header = sourceUrl.substring(
					0,
					Math.max( 0, commaIdx )
				);
				const match = /^data:([^;]+)/.exec( header );
				sourceImageMime =
					match && match[ 1 ] ? match[ 1 ] : 'image/png';
				sourceImageByteBase64 =
					commaIdx >= 0
						? sourceUrl.substring( commaIdx + 1 )
						: sourceUrl;
			} else {
				const blob = await fetch( sourceUrl ).then( ( r ) => r.blob() );
				sourceImageMime = blob.type || 'image/png';
				const dataUrl: string = await new Promise(
					( resolve, reject ) => {
						const reader = new FileReader();
						reader.onloadend = () =>
							resolve( reader.result as string );
						reader.onerror = reject;
						reader.readAsDataURL( blob );
					}
				);
				const commaIdx2 = dataUrl.indexOf( ',' );
				sourceImageByteBase64 =
					commaIdx2 >= 0
						? dataUrl.substring( commaIdx2 + 1 )
						: dataUrl;
			}
			// Start long-running video generation operation via REST API
			const BASE_URL = applyFilters(
				'tryaura.video_generation_base_url',
				'https://generativelanguage.googleapis.com/v1beta'
			);
			const startRes = await fetch(
				applyFilters(
					'tryaura.video_generation_start_url',
					`${ BASE_URL }/models/veo-3.0-fast-generate-001:predictLongRunning`
				),
				applyFilters( 'tryaura.video_generation_start_fetch_options', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'x-goog-api-key': apiKey,
					},
					body: JSON.stringify( {
						instances: [
							{
								prompt: videoPromptText,
								image: {
									bytesBase64Encoded: sourceImageByteBase64,
									mimeType: sourceImageMime,
								},
							},
						],
					} ),
				} )
			);
			doAction( 'tryaura.video_generation_start', startRes );
			if ( ! startRes.ok ) {
				const t = await startRes.text();
				doAction( 'tryaura.video_generation_start_failed', startRes );
				throw new Error( t || 'Failed to start video generation.' );
			}
			const startJson = await startRes.json();
			const operationName = startJson?.name;
			if ( ! operationName ) {
				doAction( 'tryaura.video_generation_start_failed', startJson );
				throw new Error(
					'No operation name returned from video generation.'
				);
			}

			doAction( 'tryaura.video_generation_start_success', startJson );

			setVideoStatus( 'polling' );
			setVideoMessage(
				__(
					'Rendering video… This can take up to a minute.',
					'try-aura'
				)
			);
			let finalJson: any = null;
			for ( let i = 0; i < 60; i++ ) {
				// up to ~10 minutes
				await new Promise( ( r ) => setTimeout( r, 10000 ) );
				const statusRes = await fetch(
					`${ BASE_URL }/${ operationName }`,
					{
						headers: { 'x-goog-api-key': apiKey },
					}
				);
				if ( ! statusRes.ok ) {
					const t = await statusRes.text();
					throw new Error(
						t ||
							__(
								'Failed to poll video generation status.',
								'try-aura'
							)
					);
				}
				const json = await statusRes.json();
				if ( json?.done ) {
					finalJson = json;
					break;
				}
			}
			if ( ! finalJson ) {
				throw new Error(
					__( 'Timed out waiting for video generation.', 'try-aura' )
				);
			}

			const uri = applyFilters(
				'tryaura.video_generation_download_uri',
				finalJson?.response?.generateVideoResponse
					?.generatedSamples?.[ 0 ]?.video?.uri ||
					finalJson?.response?.generatedVideos?.[ 0 ]?.video?.uri ||
					finalJson?.response?.generatedVideos?.[ 0 ]?.uri
			);

			if ( ! uri ) {
				throw new Error(
					__( 'No downloadable video URI was returned.', 'try-aura' )
				);
			}

			setVideoStatus( 'downloading' );
			setVideoMessage( __( 'Downloading video…', 'try-aura' ) );

			const dlRes = await fetch( uri, {
				headers: { 'x-goog-api-key': apiKey },
				redirect: 'follow',
			} as RequestInit );
			if ( ! dlRes.ok ) {
				const t = await dlRes.text();
				throw new Error(
					t || __( 'Failed to download generated video.', 'try-aura' )
				);
			}

			doAction( 'tryaura.video_generation_download', dlRes );
			const videoBlob = await dlRes.blob();

			const objectUrl = applyFilters(
				'tryaura.video_generation_object_url',
				URL.createObjectURL( videoBlob )
			);
			if ( videoUrl && videoUrl.startsWith( 'blob:' ) ) {
				try {
					URL.revokeObjectURL( videoUrl );
				} catch {}
			}
			setVideoUrl( objectUrl );
			setVideoStatus( 'done' );
			setVideoMessage( 'Done' );
			setVideoError( null );

			doAction( 'tryaura.video_generation_done', videoBlob );
		} catch ( e: any ) {
			setVideoError(
				e?.message || __( 'Video generation failed.', 'try-aura' )
			);
			setVideoStatus( 'error' );
			setVideoMessage( __( 'Video generation failed.', 'try-aura' ) );
		}
	};

	const setVideoInMediaSelection = async () => {
		if ( ! videoUrl ) {
			return;
		}
		try {
			setVideoUploading( true );
			const rest = window?.tryAura?.restUrl;
			const nonce = window?.tryAura?.nonce;
			if ( ! rest || ! nonce ) {
				throw new Error(
					__( 'Missing WordPress REST configuration.', 'try-aura' )
				);
			}
			const restBase = rest.replace( /\/?$/, '/' );

			const blob = await fetch( videoUrl ).then( ( r ) => r.blob() );
			const mime = blob.type || 'video/mp4';
			const ext = ( mime.split( '/' )?.[ 1 ] || 'mp4' ).split(
				'+'
			)?.[ 0 ];
			const primaryAttachmentId =
				attachmentIds && attachmentIds.length > 0
					? attachmentIds[ 0 ]
					: null;
			const filename = primaryAttachmentId
				? `enhanced-video-${ primaryAttachmentId }-${ Date.now() }.${ ext }`
				: `enhanced-video-${ Date.now() }.${ ext }`;

			const uploadRes = await fetch(
				applyFilters(
					'tryaura.video_generation_upload',
					restBase + 'wp/v2/media'
				),
				applyFilters( 'tryaura.video_generation_upload_options', {
					method: 'POST',
					headers: {
						'X-WP-Nonce': nonce,
						'Content-Disposition': `attachment; filename="${ filename }"`,
						'Content-Type': mime,
					},
					credentials: 'same-origin',
					body: blob,
				} )
			);
			if ( ! uploadRes.ok ) {
				const text = await uploadRes.text();
				doAction(
					'tryaura.video_generation_upload_failed',
					filename,
					blob,
					text
				);
				throw new Error( text || __( 'Upload failed.', 'try-aura' ) );
			}
			const json = await uploadRes.json();
			const newId = json?.id;
			if ( ! newId ) {
				throw new Error(
					'Upload succeeded but no attachment ID returned.'
				);
			}

			toast.success( __( 'Video added to Media Library.', 'try-aura' ) );

			doAction(
				'tryaura.video_generation_upload_success',
				filename,
				blob,
				newId
			);
		} catch ( e: any ) {
			setVideoError(
				e?.message || 'Failed to add video to Media Library.'
			);
		} finally {
			setVideoUploading( false );
		}
	};

	const disabledImageAddToMedia = isBusy || uploading || ! generatedUrl;
	const disabledVideoAddToMedia = isVideoBusy || videoUploading || ! videoUrl;

	return (
		<div className="ai-enhancer-modal fixed inset-[0px] bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-[160000]">
			<div className="ai-enhancer-modal__content bg-[#fff] rounded-[3px] max-w-[1000px] w-[90vw] h-auto">
				<div className="flex flex-row justify-between border-b-[1px] border-b-[#E9E9E9] pt-[16px] pl-[24px] pr-[24px]">
					<h2 className="mt-0">
						{ __( 'AI Product Image Generation', 'try-aura' ) }
					</h2>
					<button
						className="w-[16px] h-[16px] cursor-pointer"
						onClick={ onClose }
						aria-label="Close modal"
					>
						<X size={ 16 } />
					</button>
				</div>

				<div className="flex flex-row gap-[32px] mt-[27px] pl-[24px] pr-[24px]">
					<OriginalImage
						imageUrls={ imageUrls }
						multiple={ multiple }
					/>
					<ConfigSettings
						supportsVideo={ supportsVideo }
						doGenerate={ doGenerate }
						doGenerateVideo={ doGenerateVideo }
					/>
					<Output supportsVideo={ supportsVideo } />
				</div>
				{ /* Actions */ }
				<div className="mt-[24px] border-t-[1px] border-t-[#E9E9E9] flex flex-row justify-end p-[16px_24px] gap-[12px]">
					{ ( generatedUrl || videoUrl ) && (
						<Button
							onClick={
								activeTab === 'image'
									? setInMediaSelection
									: setVideoInMediaSelection
							}
							disabled={
								activeTab === 'image'
									? disabledImageAddToMedia
									: disabledVideoAddToMedia
							}
						>
							{ (
								activeTab === 'image'
									? uploading
									: videoUploading
							)
								? __( 'Adding…' )
								: __( 'Add to Media Library', 'try-aura' ) }
						</Button>
					) }

					<Button
						variant="outline"
						onClick={ onClose }
						disabled={ isBusy || isVideoBusy }
					>
						{ __( 'Close', 'try-aura' ) }
					</Button>
				</div>
			</div>

			<Toaster position="bottom-right" />
		</div>
	);
};

export default PreviewModal;
