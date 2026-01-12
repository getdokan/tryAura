import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../store';
import { PRO_STORE_NAME } from './store';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { GoogleGenAI } from '@google/genai';
import { applyFilters, doAction } from '@wordpress/hooks';
import toast from 'react-hot-toast';

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

export function useVideoLogic( { imageUrls, attachmentIds } ) {
	const {
		isBlockEditorPage,
		isWoocommerceProductPage,
		generatedUrl,
		defaultVideoModel,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		const aiModelsStore = select( 'try-aura/ai-models' );
		return {
			isBlockEditorPage: store.getIsBlockEditorPage(),
			isWoocommerceProductPage: store.getIsWoocommerceProductPage(),
			generatedUrl: store.getGeneratedUrl(),
			defaultVideoModel: aiModelsStore.getDefaultVideoModel(),
		};
	}, [] );

	const {
		videoUrl,
		videoUploading,
		videoConfigData,
		isVideoBusy,
		videoSource,
		selectedVideoIndices,
	} = useSelect( ( select ) => {
		const store = select( PRO_STORE_NAME );
		return {
			videoUrl: store.getVideoUrl(),
			videoUploading: store.getVideoUploading(),
			videoConfigData: store.getVideoConfigData(),
			isVideoBusy: store.isVideoBusy(),
			videoSource: store.getVideoSource(),
			selectedVideoIndices: store.getSelectedVideoIndices(),
		};
	}, [] );

	const {
		setVideoStatus,
		setVideoMessage,
		setVideoUrl,
		setVideoError,
		setVideoUploading,
		setVideoSource,
		setSelectedVideoIndices,
	} = useDispatch( PRO_STORE_NAME );

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
			const rest = ( window as any )?.tryAura?.restUrl;
			const nonce = ( window as any )?.tryAura?.nonce;
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

	return {
		doGenerateVideo,
		setVideoInMediaSelection,
		videoUrl,
		videoUploading,
		isVideoBusy,
		videoSource,
		selectedVideoIndices,
		setVideoSource,
		setSelectedVideoIndices,
	};
}
