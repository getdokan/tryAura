import { useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
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
import { Modal } from '@wordpress/components';

declare const wp: any;

type PreviewProps = {
	imageUrls: string[];
	attachmentIds: number[];
	onClose: () => void;
	supportsVideo?: boolean;
};

async function resolveSettings(): Promise< {
	apiKey: string | null;
	imageModel: string | null;
	videoModel: string | null;
} > {
	try {
		const aura = ( window as any )?.tryAura;
		const data = ( await apiFetch( {
			path: '/try-aura/v1/settings',
		} ) ) as any;
		const settings = data && data.try_aura_settings;
		const google = settings && settings.google;
		return {
			apiKey: google?.apiKey || aura?.apiKey || null,
			imageModel: google?.imageModel || aura?.imageModel || null,
			videoModel: google?.videoModel || aura?.videoModel || null,
		};
	} catch {
		const aura = ( window as any )?.tryAura;
		return {
			apiKey: aura?.apiKey || null,
			imageModel: aura?.imageModel || null,
			videoModel: aura?.videoModel || null,
		};
	}
}

const PreviewModal = ( {
	imageUrls,
	attachmentIds,
	onClose,
	supportsVideo,
}: PreviewProps ) => {
	const {
		isBlockEditorPage,
		isWoocommerceProductPage,
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
		isThumbnailMode,
		defaultImageModel,
		defaultVideoModel,
	} = useSelect(
		( select ) => {
			const store = select( STORE_NAME );
			const aiModelsStore = select( 'try-aura/ai-models' );
			return {
				isBlockEditorPage: store.getIsBlockEditorPage(),
				isWoocommerceProductPage: store.getIsWoocommerceProductPage(),
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
				isThumbnailMode: store.isThumbnailMode(),
				defaultImageModel: aiModelsStore.getDefaultImageModel(),
				defaultVideoModel: aiModelsStore.getDefaultVideoModel(),
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

			const { apiKey, imageModel: savedImageModel } =
				await resolveSettings();
			if ( ! apiKey ) {
				throw new Error(
					__(
						'Missing Google AI API key. Please set it on the TryAura settings page.',
						'try-aura'
					)
				);
			}

			const imageModel =
				savedImageModel ||
				defaultImageModel ||
				'gemini-2.5-flash-image-preview';

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

			const isBlockPage = isBlockEditorPage && ! isWoocommerceProductPage;
			const safetyInstruction =
				'Do not generate any nudity, harassment, or abuse.';

			if ( isBlockPage && ! imageConfigData?.optionalPrompt?.trim() ) {
				throw new Error(
					__(
						'Please provide a prompt for the image generation.',
						'try-aura'
					)
				);
			}

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

			let promptText: string = isBlockPage
				? `Generate a high-quality AI image based on the provided image(s) and user instructions.\n\nInstructions: ${ imageConfigData?.optionalPrompt?.trim() }\n\nRequirements: Maintain professional composition and a brand-safe output. ${ safetyInstruction }`
				: `Generate a high-quality AI product try-on image where the product from the provided image(s) is naturally worn or used by a suitable human model.\n\nPreferences:\n- Background preference: ${ imageConfigData?.backgroundType }\n- Output style: ${ imageConfigData?.styleType }\n${
						isThumbnailMode
							? `- Video Platform: ${
									imageConfigData?.videoPlatform || 'youtube'
							  }\n`
							: ''
				  }\nRequirements: Automatically determine an appropriate model. Ensure the product fits perfectly with accurate lighting, proportions, and textures preserved. Maintain professional composition and a brand-safe output. ${ safetyInstruction }${ extras }${ multiHint }`;
			promptText = applyFilters(
				'tryaura.ai_enhance_prompt_text',
				promptText,
				imageConfigData,
				extras,
				multiHint,
				isBlockEditorPage,
				isWoocommerceProductPage
			);
			const prompt = applyFilters( 'tryaura.ai_enhance_prompt', [
				{ text: promptText },
				...encodedImages.map( ( img ) => ( {
					inlineData: { mimeType: img.mimeType, data: img.base64 },
				} ) ),
			] );

			doAction( 'tryaura.ai_enhance_prompt_before_generate', prompt );
			const contentParams = {
				model: imageModel,
				contents: prompt,
				config: {
					responseModalities: [ 'IMAGE' ],
					candidateCount: 1,
					imageConfig: {
						aspectRatio: imageConfigData?.imageSize || '1:1',
					},
				},
			};
			const response: any = await ( ai as any ).models.generateContent(
				applyFilters(
					'tryaura.ai_enhance_model_content',
					contentParams
				)
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

			const usage = response?.usageMetadata;
			const postId = ( window as any )?.tryAura?.postId;
			const postType = ( window as any )?.tryAura?.postType;

			apiFetch( {
				path: '/try-aura/v1/log-usage',
				method: 'POST',
				data: {
					type: 'image',
					model: imageModel,
					prompt: promptText,
					input_tokens: usage?.promptTokenCount,
					output_tokens: usage?.responseTokenCount,
					total_tokens: usage?.totalTokenCount,
					generated_from: 'admin',
					object_id: postId,
					object_type: postType,
					status: 'success',
				},
			} ).catch( () => {
				// ignore logging errors
			} );
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
			const uploadRes = await apiFetch( {
				url: applyFilters(
					'tryaura.media_upload_rest_api',
					`${ restBase }wp/v2/media`
				),
				method: 'POST',
				headers: {
					'Content-Disposition': `attachment; filename="${ filename }"`,
					'Content-Type': mime,
				},
				body: blob,
			} ).catch( ( e: any ) => {
				const text = e?.message || 'Upload failed.';
				doAction(
					'tryaura.ai_enhance_upload_failed',
					filename,
					blob,
					text
				);
				throw new Error( text );
			} );

			const json: any = uploadRes;
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

			const { apiKey, videoModel: savedVideoModel } =
				await resolveSettings();
			if ( ! apiKey ) {
				throw new Error(
					__(
						'Missing Google AI API key. Please set it on the TryAura settings page.',
						'try-aura'
					)
				);
			}

			const videoModel =
				savedVideoModel ||
				defaultVideoModel ||
				'veo-3.0-fast-generate-001';

			const isBlockPage = isBlockEditorPage && ! isWoocommerceProductPage;
			const safetyInstruction =
				'Do not generate any nudity, harassment, or abuse.';

			if ( isBlockPage && ! videoConfigData?.optionalPrompt?.trim() ) {
				throw new Error(
					__(
						'Please provide a prompt for the video generation.',
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
			const { styles, cameraMotion, aspectRatio } = videoConfigData;

			const cameraMotionText =
				cameraMotion && cameraMotion !== 'none'
					? `Apply a '${ cameraMotion }' camera motion, ensuring the subject or product remains centered in the frame at all times.`
					: '';

			let styleText = '';
			if ( styles && styles !== 'none' ) {
				if ( styles === 'natural' ) {
					styleText =
						'Ensure the lighting and environment look natural and realistic.';
				} else if ( styles === 'studio' ) {
					styleText =
						'Use professional studio lighting with a clean, high-end look.';
				} else if ( styles === 'cinematic' ) {
					styleText =
						'Apply cinematic lighting and color grading for a dramatic, movie-like quality.';
				} else {
					styleText = `Keep the scene aligned with ${ styles } preferences.`;
				}
			}

			const baseInstruction = isBlockPage
				? `Create a smooth high-quality video based on the provided image and the following user instructions: ${ videoConfigData?.optionalPrompt?.trim() }.`
				: `Create a smooth product showcase video based on the ${
						videoSource === 'generated-image'
							? 'generated try-on image'
							: 'provided original image'
				  }.`;

			const modelInstruction = ! isBlockPage
				? `make the model walk relaxed.${ extras }`
				: '';

			let videoPromptText = [
				baseInstruction,
				cameraMotionText,
				styleText,
				modelInstruction,
				safetyInstruction,
			]
				.filter( Boolean )
				.join( ' ' );

			videoPromptText = applyFilters(
				'tryaura.video_generation_prompt',
				videoPromptText,
				isBlockEditorPage,
				isWoocommerceProductPage
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
			// Start long-running video generation operation via @google/genai SDK
			const ai = new GoogleGenAI( { apiKey } );
			let operation: any = await ( ai as any ).models.generateVideos(
				applyFilters( 'tryaura.video_generation_params', {
					model: videoModel,
					source: {
						prompt: videoPromptText,
						image: {
							imageBytes: sourceImageByteBase64,
							mimeType: sourceImageMime,
						},
					},
					config: {
						aspectRatio,
						// resolution: '720p',
						// durationSeconds: 8,
						// fps: 24,
						negativePrompt: 'blurry, low quality, distorted faces',
						// SEED: For deterministic output (0 to 4,294,967,295)
						// seed: 12345,

						// SAFETY: Person generation settings
						// personGeneration: 'allow_adult', // options: 'allow_adult', 'disallow'

						// RESULTS: Number of videos to generate (1-4)
						numberOfVideos: 1,
					},
				} )
			);

			doAction( 'tryaura.video_generation_start', operation );

			setVideoStatus( 'polling' );
			setVideoMessage(
				__(
					'Rendering video… This can take up to a minute.',
					'try-aura'
				)
			);

			for ( let i = 0; i < 60; i++ ) {
				if ( operation.done ) {
					break;
				}
				// up to ~10 minutes
				await new Promise( ( r ) => setTimeout( r, 10000 ) );
				operation = await ( ai as any ).operations.getVideosOperation( {
					operation,
				} );
			}

			if ( ! operation.done ) {
				throw new Error(
					__( 'Timed out waiting for video generation.', 'try-aura' )
				);
			}

			const uri = applyFilters(
				'tryaura.video_generation_download_uri',
				operation.response?.generateVideoResponse
					?.generatedSamples?.[ 0 ]?.video?.uri ||
					operation.response?.generatedVideos?.[ 0 ]?.video?.uri ||
					operation.response?.generatedVideos?.[ 0 ]?.uri
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

			const video = document.createElement( 'video' );
			video.src = objectUrl;
			video.onloadedmetadata = () => {
				const postId = ( window as any )?.tryAura?.postId;
				const postType = ( window as any )?.tryAura?.postType;

				apiFetch( {
					path: '/try-aura/v1/log-usage',
					method: 'POST',
					data: {
						type: 'video',
						model: videoModel,
						prompt: videoPromptText,
						video_seconds: video.duration,
						generated_from: 'admin',
						object_id: postId,
						object_type: postType,
						status: 'success',
					},
				} ).catch( () => {
					// ignore logging errors
				} );
			};

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

			const uploadRes = await apiFetch(
				applyFilters( 'tryaura.video_generation_upload_options', {
					url: applyFilters(
						'tryaura.video_generation_upload',
						restBase + 'wp/v2/media'
					),
					method: 'POST',
					headers: {
						'Content-Disposition': `attachment; filename="${ filename }"`,
						'Content-Type': mime,
					},
					body: blob,
				} )
			).catch( ( e: any ) => {
				const text = e?.message || __( 'Upload failed.', 'try-aura' );
				doAction(
					'tryaura.video_generation_upload_failed',
					filename,
					blob,
					text
				);
				throw new Error( text );
			} );

			const json: any = uploadRes;
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
		<Modal
			onRequestClose={ onClose }
			className="tryaura ai-enhancer-preview-modal"
			__experimentalHideHeader
			shouldCloseOnClickOutside={ false }
		>
			<div className="ai-enhancer-modal__content">
				<div className="flex flex-row justify-between border-b-[1px] border-b-[#E9E9E9] pt-[16px] pl-[24px] pr-[24px]">
					<h2 className="mt-0">
						{ isThumbnailMode
							? __(
									'AI Product Video Thumbnail Generation',
									'try-aura'
							  )
							: __( 'AI Product Image Generation', 'try-aura' ) }
					</h2>
					<button
						className="w-[16px] h-[16px] cursor-pointer"
						onClick={ onClose }
						aria-label="Close modal"
						disabled={ isBusy || isVideoBusy }
					>
						<X size={ 16 } />
					</button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-11 md:flex-row gap-[32px] mt-[27px] pl-[24px] pr-[24px]">
					<OriginalImage
						imageUrls={ imageUrls }
						multiple={ multiple }
						className="col-span-1 md:col-span-3 max-h-[533px] overflow-auto"
					/>
					<ConfigSettings
						supportsVideo={ supportsVideo }
						doGenerate={ doGenerate }
						doGenerateVideo={ doGenerateVideo }
						className="col-span-1 md:col-span-4 flex flex-col gap-[32px]"
					/>
					<Output
						supportsVideo={ supportsVideo }
						className="col-span-1 md:col-span-4"
					/>
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
							loading={ uploading || videoUploading }
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
						loading={ isBusy || isVideoBusy }
					>
						{ __( 'Close', 'try-aura' ) }
					</Button>
				</div>
			</div>

			<Toaster position="bottom-right" />
		</Modal>
	);
};

export default PreviewModal;
