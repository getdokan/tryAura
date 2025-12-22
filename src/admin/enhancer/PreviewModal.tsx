import { useEffect, useState } from '@wordpress/element';
import { GoogleGenAI } from '@google/genai';
import { Button } from '../../components';
import { __ } from '@wordpress/i18n';
import { X } from 'lucide-react';
import OriginalImage from './PreviewSections/OriginalImage';
import ConfigSettings from './PreviewSections/ConfigSettings';
import Output from './PreviewSections/Output';

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
	const [ isBlockEditorPage, setIsBlockEditorPage ] = useState( false );
	const [ isWoocommerceProductPage, setIsWoocommerceProductPage ] =
		useState( false );
	const [ status, setStatus ] = useState<
		'idle' | 'fetching' | 'generating' | 'parsing' | 'done' | 'error'
	>( 'idle' );
	const [ message, setMessage ] = useState< string >( 'Ready to generate' );
	const [ generatedUrl, setGeneratedUrl ] = useState< string | null >( null );
	const [ error, setError ] = useState< string | null >( null );
	const [ backgroundType, setBackgroundType ] =
		useState< string >( 'studio' );
	const [ styleType, setStyleType ] = useState< string >( 'photo-realistic' );
	const [ imageSize, setImageSize ] = useState< string >( '1:1' );
	const [ optionalPrompt, setOptionalPrompt ] = useState< string >( '' );
	const [ uploading, setUploading ] = useState< boolean >( false );
	// Video generation state
	const [ videoStatus, setVideoStatus ] = useState<
		'idle' | 'generating' | 'polling' | 'downloading' | 'done' | 'error'
	>( 'idle' );
	const [ videoMessage, setVideoMessage ] = useState< string >(
		'Ready to generate video'
	);
	const [ videoUrl, setVideoUrl ] = useState< string | null >( null );
	const [ videoError, setVideoError ] = useState< string | null >( null );
	const [ videoUploading, setVideoUploading ] = useState< boolean >( false );
	const [ activeTab, setActiveTab ] = useState< 'image' | 'video' >(
		'image'
	);
	const multiple = imageUrls.length > 1;

	useEffect( () => {
		setIsBlockEditorPage(
			document.body.classList.contains( 'block-editor-page' )
		);
		setIsWoocommerceProductPage(
			document.body.classList.contains( 'post-type-product' )
		);
		document.body.classList.add( 'ai-enhancer-modal-open' );
		return () => document.body.classList.remove( 'ai-enhancer-modal-open' );
	}, [] );

	// Reset state when image changes
	useEffect( () => {
		setStatus( 'idle' );
		setMessage( 'Ready to generate' );
		setGeneratedUrl( null );
		setError( null );
		// Reset video state too when images change
		setVideoStatus( 'idle' );
		setVideoMessage( 'Ready to generate video' );
		if ( videoUrl && videoUrl.startsWith( 'blob:' ) ) {
			try {
				URL.revokeObjectURL( videoUrl );
			} catch {}
		}
		setVideoUrl( null );
		setVideoError( null );
		setActiveTab( 'image' );
	}, [ imageUrls ] );

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
			const apiKey = await resolveApiKey();
			if ( ! apiKey ) {
				throw new Error(
					'Missing Google AI API key. Please set it on the TryAura settings page.'
				);
			}

			setStatus( 'fetching' );
			setMessage( 'Fetching images…' );
			const encodedImages = await Promise.all(
				imageUrls.map( async ( url ) => {
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
				optionalPrompt && optionalPrompt.trim().length
					? `\n\nAdditional instruction from user: ${ optionalPrompt.trim() }`
					: '';
			const multiHint =
				imageUrls.length > 1
					? '\n\nNote: Multiple input images provided. If a person/model photo and separate product images are present, compose the result with the model wearing/using the product(s) while keeping the background as requested.'
					: '';
			const promptText = `Generate a high-quality AI product try-on image where the product from the provided image(s) is naturally worn or used by a suitable human model.\n\nPreferences:\n- Background preference: ${ backgroundType }\n- Output style: ${ styleType }\n\nRequirements: Automatically determine an appropriate model. Ensure the product fits perfectly with accurate lighting, proportions, and textures preserved. Maintain professional composition and a brand-safe output.${ extras }${ multiHint }`;
			const prompt = [
				{ text: promptText },
				...encodedImages.map( ( img ) => ( {
					inlineData: { mimeType: img.mimeType, data: img.base64 },
				} ) ),
			];

			const response: any = await ( ai as any ).models.generateContent( {
				model: 'gemini-2.5-flash-image-preview',
				contents: prompt,
			} );

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
				throw new Error( 'Missing WordPress REST configuration.' );
			}
			const restBase = rest.replace( /\/?$/, '/' );

			// Convert data URL to Blob by fetching it (works for data: URLs too)
			const blob = await fetch( generatedUrl ).then( ( r ) => r.blob() );
			const mime = blob.type || 'image/png';
			const ext = ( mime.split( '/' )?.[ 1 ] || 'png' ).split(
				'+'
			)?.[ 0 ];
			const primaryAttachmentId =
				attachmentIds && attachmentIds.length > 0
					? attachmentIds[ 0 ]
					: null;
			const filename = primaryAttachmentId
				? `enhanced-${ primaryAttachmentId }-${ Date.now() }.${ ext }`
				: `enhanced-${ Date.now() }.${ ext }`;

			const uploadRes = await fetch( restBase + 'wp/v2/media', {
				method: 'POST',
				headers: {
					'X-WP-Nonce': nonce,
					'Content-Disposition': `attachment; filename="${ filename }"`,
					'Content-Type': mime,
				},
				credentials: 'same-origin',
				body: blob,
			} );
			if ( ! uploadRes.ok ) {
				const text = await uploadRes.text();
				throw new Error( text || 'Upload failed.' );
			}
			const json = await uploadRes.json();
			const newId = json?.id;
			if ( ! newId ) {
				throw new Error(
					'Upload succeeded but no attachment ID returned.'
				);
			}

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
					wp.media.featuredImage.set( newId );
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
			if ( ! generatedUrl ) {
				setVideoError( 'Please generate an image first.' );
				return;
			}
			setVideoError( null );
			setVideoStatus( 'generating' );
			setVideoMessage( 'Starting video generation…' );

			const apiKey = await resolveApiKey();
			if ( ! apiKey ) {
				throw new Error(
					'Missing Google AI API key. Please set it on the TryAura settings page.'
				);
			}

			const extras =
				optionalPrompt && optionalPrompt.trim().length
					? `\n\nAdditional instruction from user: ${ optionalPrompt.trim() }`
					: '';
			const videoPromptText = `Create a short 3–5 second smooth product showcase video based on the generated try-on image. Use gentle camera motion and keep the scene aligned with preferences. make the model walk relaxed.`;
			// Extract base64 from the generated data URL to avoid stack overflow from large buffers
			let generatedImageByteBase64 = '';
			let generatedImageMime = 'image/png';
			if ( generatedUrl.startsWith( 'data:' ) ) {
				const commaIdx = generatedUrl.indexOf( ',' );
				const header = generatedUrl.substring(
					0,
					Math.max( 0, commaIdx )
				);
				const match = /^data:([^;]+)/.exec( header );
				generatedImageMime =
					match && match[ 1 ] ? match[ 1 ] : 'image/png';
				generatedImageByteBase64 =
					commaIdx >= 0
						? generatedUrl.substring( commaIdx + 1 )
						: generatedUrl;
			} else {
				const blob = await fetch( generatedUrl ).then( ( r ) =>
					r.blob()
				);
				generatedImageMime = blob.type || 'image/png';
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
				generatedImageByteBase64 =
					commaIdx2 >= 0
						? dataUrl.substring( commaIdx2 + 1 )
						: dataUrl;
			}
			// Start long-running video generation operation via REST API
			const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
			const startRes = await fetch(
				`${ BASE_URL }/models/veo-3.0-fast-generate-001:predictLongRunning`,
				{
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
									bytesBase64Encoded:
										generatedImageByteBase64,
									mimeType: generatedImageMime,
								},
							},
						],
					} ),
				}
			);
			if ( ! startRes.ok ) {
				const t = await startRes.text();
				throw new Error( t || 'Failed to start video generation.' );
			}
			const startJson = await startRes.json();
			const operationName = startJson?.name;
			if ( ! operationName ) {
				throw new Error(
					'No operation name returned from video generation.'
				);
			}

			setVideoStatus( 'polling' );
			setVideoMessage( 'Rendering video… This can take up to a minute.' );
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
						t || 'Failed to check video generation status.'
					);
				}
				const json = await statusRes.json();
				if ( json?.done ) {
					finalJson = json;
					break;
				}
			}
			if ( ! finalJson ) {
				throw new Error( 'Timed out waiting for video generation.' );
			}

			const uri =
				finalJson?.response?.generateVideoResponse
					?.generatedSamples?.[ 0 ]?.video?.uri ||
				finalJson?.response?.generatedVideos?.[ 0 ]?.video?.uri ||
				finalJson?.response?.generatedVideos?.[ 0 ]?.uri;

			if ( ! uri ) {
				throw new Error( 'No downloadable video URI was returned.' );
			}

			setVideoStatus( 'downloading' );
			setVideoMessage( 'Downloading video…' );

			const dlRes = await fetch( uri, {
				headers: { 'x-goog-api-key': apiKey },
				redirect: 'follow',
			} as RequestInit );
			if ( ! dlRes.ok ) {
				const t = await dlRes.text();
				throw new Error( t || 'Failed to download generated video.' );
			}
			const videoBlob = await dlRes.blob();

			const objectUrl = URL.createObjectURL( videoBlob );
			if ( videoUrl && videoUrl.startsWith( 'blob:' ) ) {
				try {
					URL.revokeObjectURL( videoUrl );
				} catch {}
			}
			setVideoUrl( objectUrl );
			setVideoStatus( 'done' );
			setVideoMessage( 'Done' );
			setVideoError( null );
		} catch ( e: any ) {
			setVideoError( e?.message || 'Video generation failed.' );
			setVideoStatus( 'error' );
			setVideoMessage( 'Video generation failed.' );
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
				throw new Error( 'Missing WordPress REST configuration.' );
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

			const uploadRes = await fetch( restBase + 'wp/v2/media', {
				method: 'POST',
				headers: {
					'X-WP-Nonce': nonce,
					'Content-Disposition': `attachment; filename="${ filename }"`,
					'Content-Type': mime,
				},
				credentials: 'same-origin',
				body: blob,
			} );
			if ( ! uploadRes.ok ) {
				const text = await uploadRes.text();
				throw new Error( text || 'Upload failed.' );
			}
			const json = await uploadRes.json();
			const newId = json?.id;
			if ( ! newId ) {
				throw new Error(
					'Upload succeeded but no attachment ID returned.'
				);
			}

			// Select it in the media frame (do not set featured image for videos)
			try {
				const frameObj =
					wp?.media?.frame ||
					( wp?.media?.featuredImage?.frame
						? wp.media.featuredImage.frame()
						: null );
				if ( frameObj ) {
					const state =
						typeof frameObj.state === 'function'
							? frameObj.state()
							: null;
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
			} catch {}

			onClose();
		} catch ( e: any ) {
			setVideoError(
				e?.message || 'Failed to add video to Media Library.'
			);
		} finally {
			setVideoUploading( false );
		}
	};

	const isBusy =
		uploading ||
		status === 'fetching' ||
		status === 'generating' ||
		status === 'parsing';
	const isVideoBusy =
		videoUploading ||
		videoStatus === 'generating' ||
		videoStatus === 'polling' ||
		videoStatus === 'downloading';

	const disabledImageAddToMedia = isBusy || uploading || ! generatedUrl;
	const disabledVideoAddToMedia = isVideoBusy || videoUploading || ! videoUrl;

	return (
		<div className="ai-enhancer-modal fixed inset-[0px] bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-[200000]">
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
						activeTab={ activeTab }
						setActiveTab={ setActiveTab }
						isBlockEditorPage={ isBlockEditorPage }
						isWoocommerceProductPage={ isWoocommerceProductPage }
						backgroundType={ backgroundType }
						setBackgroundType={ setBackgroundType }
						generatedUrl={ generatedUrl }
						videoUrl={ videoUrl }
						styleType={ styleType }
						setStyleType={ setStyleType }
						imageSize={ imageSize }
						setImageSize={ setImageSize }
						optionalPrompt={ optionalPrompt }
						setOptionalPrompt={ setOptionalPrompt }
						doGenerate={ doGenerate }
						isBusy={ isBusy }
						doGenerateVideo={ doGenerateVideo }
						isVideoBusy={ isVideoBusy }
					/>
					<Output
						generatedUrl={ generatedUrl }
						supportsVideo={ supportsVideo }
						activeTab={ activeTab }
						setActiveTab={ setActiveTab }
						message={ message }
						videoUrl={ videoUrl }
						videoMessage={ videoMessage }
						videoError={ videoError }
						doGenerateVideo={ doGenerateVideo }
						isVideoBusy={ isVideoBusy }
						videoUploading={ videoUploading }
						setVideoInMediaSelection={ setVideoInMediaSelection }
						error={ error }
					/>
				</div>
				{ /* Actions */ }
				<div className="mt-[24px] border-t-[1px] border-t-[#E9E9E9] flex flex-row justify-end p-[16px_24px] gap-[12px]">
					{ generatedUrl && (
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
							{ uploading
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
		</div>
	);
};

export default PreviewModal;
