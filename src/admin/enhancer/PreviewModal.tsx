import { useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from './store';
import { Button } from '../../components';
import { __ } from '@wordpress/i18n';
import { X } from 'lucide-react';
import OriginalImage from './PreviewSections/OriginalImage';
import ConfigSettings from './PreviewSections/ConfigSettings';
import Output from './PreviewSections/Output';
import { applyFilters, doAction } from '@wordpress/hooks';
import { Modal, Slot, SlotFillProvider } from '@wordpress/components';
import { PluginArea } from '@wordpress/plugins';
import { GoogleGenAI } from '@google/genai';

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
		};
	} catch {
		const aura = ( window as any )?.tryAura;
		return {
			apiKey: aura?.apiKey || null,
			imageModel: aura?.imageModel || null,
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
		activeTab,
		isBusy,
		isThumbnailMode,
		selectedImageIndices,
		imageConfigData,
		defaultImageModel,
	} = useSelect(
		( select ) => {
			const store = select( STORE_NAME );
			const aiModelsStore = select( 'try-aura/ai-models' );
			return {
				isBlockEditorPage: store.getIsBlockEditorPage(),
				isWoocommerceProductPage: store.getIsWoocommerceProductPage(),
				generatedUrl: store.getGeneratedUrl(),
				uploading: store.getUploading(),
				activeTab: store.getActiveTab(),
				isBusy: store.isBusy(),
				isThumbnailMode: store.isThumbnailMode(),
				selectedImageIndices: store.getSelectedImageIndices(),
				imageConfigData: store.getImageConfigData(),
				defaultImageModel: aiModelsStore.getDefaultImageModel(),
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
		setSelectedImageIndices,
		setImageUrls,
		setAttachmentIds,
		setSupportsVideo,
	} = useDispatch( STORE_NAME );

	const multiple = imageUrls.length > 1;

	useEffect( () => {
		setImageUrls( imageUrls );
		setAttachmentIds( attachmentIds );
		setSupportsVideo( !! supportsVideo );
	}, [ imageUrls, attachmentIds, supportsVideo ] );

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
				: applyFilters(
						'tryaura.ai_enhance_image_prompt_base',
						`Generate a high-quality AI product try-on image where the product from the provided image(s) is naturally worn or used by a suitable human model.\n\nPreferences:\n- Background preference: ${ imageConfigData?.backgroundType }\n- Output style: ${ imageConfigData?.styleType }\nRequirements: Automatically determine an appropriate model. Ensure the product fits perfectly with accurate lighting, proportions, and textures preserved. Maintain professional composition and a brand-safe output. ${ safetyInstruction }${ extras }${ multiHint }`,
						{
							imageConfigData,
							safetyInstruction,
							extras,
							multiHint,
							isThumbnailMode,
						}
				  );
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

	const disabledImageAddToMedia = isBusy || uploading || ! generatedUrl;

	return (
		<Modal
			onRequestClose={ onClose }
			className="tryaura ai-enhancer-preview-modal"
			__experimentalHideHeader
			shouldCloseOnClickOutside={ false }
		>
			<SlotFillProvider>
				<div className="ai-enhancer-modal__content">
					<div className="flex flex-row justify-between border-b-[1px] border-b-[#E9E9E9] pt-[16px] pl-[24px] pr-[24px]">
						<h2 className="mt-0">
							{ applyFilters(
								'tryaura.enhancer.modal_title',
								__( 'AI Product Image Generation', 'try-aura' ),
								{ isThumbnailMode }
							) }
						</h2>
						<button
							className="w-[16px] h-[16px] cursor-pointer"
							onClick={ onClose }
							aria-label="Close modal"
							disabled={ isBusy }
						>
							<X size={ 16 } />
						</button>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-11 md:flex-row gap-[32px] mt-[27px] pl-[24px] pr-[24px]">
						<OriginalImage
							imageUrls={ imageUrls }
							multiple={ multiple }
							{ ...applyFilters(
								'tryaura.enhancer.original_image_props',
								{
									selectedIndices: selectedImageIndices,
									setSelectedIndices: setSelectedImageIndices,
									showSelection: true,
									showGeneratedImage: false,
									limits:
										activeTab === 'image'
											? { min: 1, max: 3 }
											: { min: 1, max: 1 },
								}
							) }
							className="col-span-1 md:col-span-3 max-h-[533px] overflow-auto"
						/>
						<ConfigSettings
							supportsVideo={ supportsVideo }
							doGenerate={ doGenerate }
							className="col-span-1 md:col-span-4 flex flex-col gap-[32px]"
						/>

						{ activeTab === 'image' && (
							<Output
								supportsVideo={ supportsVideo }
								className="col-span-1 md:col-span-4"
							/>
						) }

						<Slot name="TryAuraEnhancerOutput" />
					</div>
					{ /* Actions */ }
					<div className="mt-[24px] border-t-[1px] border-t-[#E9E9E9] flex flex-row justify-end p-[16px_24px] gap-[12px]">
						{ generatedUrl && 'image' === activeTab && (
							<Button
								onClick={ setInMediaSelection }
								disabled={ disabledImageAddToMedia }
								loading={ uploading }
							>
								{ uploading
									? __( 'Adding…' )
									: __( 'Add to Media Library', 'try-aura' ) }
							</Button>
						) }

						<Slot name="TryAuraEnhancerFooterActions" />

						<PluginArea scope="tryaura-enhancer" />

						<Button
							variant="outline"
							onClick={ onClose }
							disabled={ isBusy }
						>
							{ __( 'Close', 'try-aura' ) }
						</Button>
					</div>
				</div>
			</SlotFillProvider>
		</Modal>
	);
};

export default PreviewModal;
