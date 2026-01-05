import { useEffect, useRef, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { X } from 'lucide-react';
import UserImageSection from './UserImageSection';
import ProductImagesSection from './ProductImagesSection';
import Output from './Output';
import { applyFilters, doAction } from '@wordpress/hooks';

type TryOnModalProps = {
	productImages: string[];
	onClose: () => void;
};

const TryOnModal = ( { productImages, onClose }: TryOnModalProps ) => {
	const [ userImages, setUserImages ] = useState< string[] >( [] );
	const [ status, setStatus ] = useState<
		'idle' | 'fetching' | 'generating' | 'parsing' | 'done' | 'error'
	>( 'idle' );
	const [ message, setMessage ] = useState< string >(
		__( 'Select or capture one or more photos, then click Try', 'try-aura' )
	);
	const [ error, setError ] = useState< string | null >( null );
	const [ generatedUrl, setGeneratedUrl ] = useState< string | null >( null );
	const [ activeTab, setActiveTab ] = useState< 'upload' | 'camera' >(
		'upload'
	);
	const [ cameraActive, setCameraActive ] = useState< boolean >( false );
	const [ selectedProductImages, setSelectedProductImages ] = useState<
		string[]
	>( productImages.length > 0 ? [ productImages[ 0 ] ] : [] );

	// Camera
	const videoRef = useRef< HTMLVideoElement | null >( null );
	const streamRef = useRef< MediaStream | null >( null );
	const canvasRef = useRef< HTMLCanvasElement | null >( null );

	useEffect( () => {
		document.body.classList.add( 'try-aura-tryon-open' );
		return () => {
			document.body.classList.remove( 'try-aura-tryon-open' );
			stopCamera();
		};
	}, [] );

	const startCamera = async () => {
		try {
			doAction( 'try-aura.before_camera_start', {
				videoRef,
				streamRef,
				canvasRef,
			} );
			const stream = await navigator.mediaDevices.getUserMedia( {
				video: { facingMode: 'user' },
				audio: false,
			} );
			streamRef.current = stream;
			setCameraActive( true );
			const video = videoRef.current;
			if ( video ) {
				try {
					( video as any ).srcObject = stream;
					await video.play?.();
				} catch {}
			}
			setMessage( 'Camera active — click Capture when ready' );
			setError( null );

			doAction( 'try-aura.after_camera_start', {
				videoRef,
				streamRef,
				canvasRef,
			} );
		} catch ( e: any ) {
			setError( e?.message || 'Unable to access camera.' );
		}
	};

	const stopCamera = () => {
		try {
			streamRef.current?.getTracks().forEach( ( t ) => t.stop() );
		} catch {}
		streamRef.current = null;
		setCameraActive( false );
		doAction(
			'try-aura.after_camera_stop',
			videoRef,
			streamRef,
			canvasRef
		);
		const video = videoRef.current;
		if ( video ) {
			try {
				video.pause?.();
				( video as any ).srcObject = null;
				video.load?.();
			} catch {}
		}
	};

	// Stop camera when switching away from Camera tab
	useEffect( () => {
		if ( activeTab !== 'camera' ) {
			stopCamera();
		}
	}, [ activeTab ] );

	// Attach stream to video when camera becomes active or when returning to Camera tab
	useEffect( () => {
		const video = videoRef.current;
		const stream = streamRef.current;
		if ( cameraActive && activeTab === 'camera' && video && stream ) {
			try {
				( video as any ).srcObject = stream;
				video.play?.().catch( () => {} );
			} catch {}
		}
	}, [ cameraActive, activeTab ] );

	const capture = () => {
		if ( ! videoRef.current ) {
			return;
		}
		const video = videoRef.current;
		// Ensure video has enough data and valid dimensions
		if (
			( video as any ).readyState !== undefined &&
			( video as any ).readyState < 2
		) {
			setError(
				__(
					'Camera not ready yet. Please wait a moment and try again.',
					'try-aura'
				)
			);
			return;
		}
		const w = applyFilters(
			'tryaura.tryon.photo_capture_width',
			video.videoWidth || 640
		);
		const h = applyFilters(
			'tryaura.tryon.photo_capture_height',
			video.videoHeight || 480
		);
		if ( ! w || ! h ) {
			setError(
				__(
					'Camera not ready yet. Please wait a moment and try again.',
					'try-aura'
				)
			);
			return;
		}
		doAction( 'try-aura.before_photo_capture', { videoRef, canvasRef } );
		if ( ! canvasRef.current ) {
			canvasRef.current = document.createElement( 'canvas' );
		}
		const canvas = canvasRef.current;
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext( '2d' );
		if ( ! ctx ) {
			return;
		}
		ctx.drawImage( video, 0, 0, w, h );
		const dataUrl = applyFilters(
			'tryaura.tryon.photo_capture_data_url',
			canvas.toDataURL( 'image/jpeg', 0.95 )
		);
		setUserImages( [ dataUrl ] );
		setMessage( 'Photo captured. Click Try to generate.' );
		stopCamera();

		doAction( 'try-aura.after_photo_capture', {
			videoRef,
			canvasRef,
			dataUrl,
		} );
	};

	const onFileChange = ( e: any ) => {
		const files: FileList | undefined = e?.target?.files;

		if ( ! files || files.length === 0 ) {
			return;
		}
		const readers: Promise< string >[] = [];
		for ( let i = 0; i < files.length; i++ ) {
			const f = files[ i ];
			readers.push(
				new Promise( ( resolve, reject ) => {
					const reader = new FileReader();
					reader.onloadend = () => resolve( reader.result as string );
					reader.onerror = reject;
					reader.readAsDataURL( f );
				} )
			);
		}
		Promise.all( readers )
			.then( ( results ) => {
				doAction( 'try-aura.photo_selected_before', { files, results } );
				setUserImages( results );
				setMessage( __( 'Photo(s) selected. Click Try to generate.', 'try-aura' ) );
				doAction( 'try-aura.photo_selected_after', { files, results } );
			} )
			.catch( () => {
				setError( __( 'Failed to read one or more files.', 'try-aura' ) );
			} );
		try {
			if ( e?.target ) {
				e.target.value = null;
			}
		} catch {}
	};

	const removeUserImage = ( index: number ) => {
		setUserImages( ( prev ) => prev.filter( ( _, i ) => i !== index ) );
	};

	const toggleProductImage = ( url: string ) => {
		url = applyFilters( 'tryaura.tryon.product_image_url', url );
		setSelectedProductImages( ( prev ) => {
			if ( prev.includes( url ) ) {
				if ( prev.length <= 1 ) {
					return prev;
				}
				return prev.filter( ( u ) => u !== url );
			}
			if ( prev.length < 3 ) {
				return [ ...prev, url ];
			}
			return prev;
		} );
	};

	const toInlineData = async (
		img: string
	): Promise< { mimeType: string; data: string } > => {
		if ( img.startsWith( 'data:' ) ) {
			const comma = img.indexOf( ',' );
			const header = img.substring( 0, Math.max( 0, comma ) );
			const match = /^data:([^;]+)/.exec( header );
			const mimeType = match && match[ 1 ] ? match[ 1 ] : 'image/png';
			const data = comma >= 0 ? img.substring( comma + 1 ) : img;
			return { mimeType, data };
		}
		const resp = await apiFetch( { url: img, parse: false } ) as Response;
		const blob = await resp.blob();
		const mimeType = blob.type || 'image/png';
		const base64 = await new Promise< string >( ( resolve, reject ) => {
			const reader = new FileReader();
			reader.onloadend = () => {
				const result = reader.result as string;
				const comma = result.indexOf( ',' );
				resolve( comma >= 0 ? result.substring( comma + 1 ) : result );
			};
			reader.onerror = reject;
			reader.readAsDataURL( blob );
		} );
		return { mimeType, data: base64 };
	};

	const doTry = async () => {
		if ( userImages.length === 0 ) {
			setError(
				__( 'Please select or capture your photo first.', 'try-aura' )
			);
			return;
		}
		if ( selectedProductImages.length === 0 ) {
			setError(
				__( 'Please select at least one product image.', 'try-aura' )
			);
			return;
		}
		try {
			setError( null );
			setStatus( 'fetching' );
			setMessage( __( 'Preparing images…', 'try-aura' ) );

			const primaryUserImage = userImages[ 0 ];
			const userInline = await toInlineData( primaryUserImage );
			const productInlineList = await Promise.all(
				selectedProductImages.map( toInlineData )
			);

			const images = [
				`data:${ userInline.mimeType };base64,${ userInline.data }`,
				...productInlineList.map(
					( p ) => `data:${ p.mimeType };base64,${ p.data }`
				),
			];

			setStatus( 'generating' );
			setMessage( __( 'Generating try-on preview…', 'try-aura' ) );

			const promptText = applyFilters(
				'tryaura.tryon.prompt_text',
				'Create a realistic virtual try-on image. The first image is the user/customer photo. The subsequent image(s) are the product to wear/use. Put the product on the person naturally with correct proportions, lighting, and perspective. Keep a neutral background suitable for eCommerce.'
			);

			// @ts-ignore
			const restUrl = window?.tryAura?.restUrl;
			// @ts-ignore
			const nonce = window?.tryAura?.nonce;

			if ( ! restUrl || ! nonce ) {
				throw new Error(
					__( 'REST API not configured properly.', 'try-aura' )
				);
			}

			const data = ( await apiFetch( {
				url: `${ restUrl.replace( /\/?$/, '/' ) }generate/v1/image`,
				method: 'POST',
				headers: {
					'X-WP-Nonce': nonce,
				},
				data: {
					prompt: promptText,
					images,
				},
			} ) ) as any;

			if ( data.image ) {
				const dataUrl = `data:image/png;base64,${ data.image }`;
				setGeneratedUrl( dataUrl );
				setStatus( 'done' );
				setMessage( __( 'Done', 'try-aura' ) );

				const usage = data.usage;
				apiFetch( {
					path: '/try-aura/v1/log-usage',
					method: 'POST',
					data: {
						type: 'image',
						model: 'gemini-2.5-flash-image',
						prompt: promptText,
						input_tokens: usage?.promptTokenCount,
						output_tokens: usage?.candidatesTokenCount || usage?.responseTokenCount,
						total_tokens: usage?.totalTokenCount,
						generated_from: 'tryon',
						status: 'success',
					},
				} ).catch( () => {
					// ignore logging errors
				} );
			} else {
				throw new Error( __( 'Model did not return an image.', 'try-aura' ) );
			}
		} catch ( e: any ) {
			setError( e?.message || __( 'Generation failed.', 'try-aura' ) );
			setStatus( 'error' );
			setMessage( __( 'Generation failed.', 'try-aura' ) );
		}
	};

	const addToCart = () => {
		// @ts-ignore
		const productId = applyFilters( 'tryaura.tryon.product_id', window?.tryAura?.productId );
		if ( productId ) {
			window.location.href = applyFilters( 'tryaura.tryon.add_to_cart_url', `?add-to-cart=${ productId }` );
		}
	};

	const isBusy =
		status === 'fetching' ||
		status === 'generating' ||
		status === 'parsing';

	return (
		<>
			<div className="ai-enhancer-modal fixed inset-[0px] bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-[200000]">
				<div className="ai-enhancer-modal__content bg-[#fff] rounded-[3px] max-w-[1000px] w-[90vw] h-auto">
					<div className="flex flex-row justify-between border-b-[1px] border-b-[#E9E9E9] p-[16px_24px]">
						<h2 className="m-0 font-[700] font-bold text-[18px] text-[#25252D]">
							{ __( 'Try-On Product', 'try-aura' ) }
						</h2>
						<button
							className="w-[16px] h-[16px] cursor-pointer p-0 m-0 bg-transparent"
							onClick={ onClose }
							aria-label="Close modal"
						>
							<X size={ 16 } />
						</button>
					</div>

					<div className="flex flex-row gap-[24px] mt-[24px] pl-[24px] pr-[24px]">
						<UserImageSection
							onFileChange={ onFileChange }
							userImages={ userImages }
							removeUserImage={ removeUserImage }
							videoRef={ videoRef }
							capture={ capture }
							cameraActive={ cameraActive }
							setActiveTab={ setActiveTab }
							startCamera={ startCamera }
							stopCamera={ stopCamera }
							activeTab={ activeTab }
							setUserImages={ setUserImages }
							error={ error }
						/>

						<ProductImagesSection
							productImages={ productImages }
							selectedProductImages={ selectedProductImages }
							onToggleImage={ toggleProductImage }
						/>

						<Output
							generatedUrl={ generatedUrl }
							message={ message }
							isBusy={ isBusy }
						/>
					</div>
					{ /* Actions */ }
					<div className="mt-[24px] border-t-[1px] border-t-[#E9E9E9] flex flex-row justify-end p-[16px_24px] gap-[12px]">
						<button
							className="bg-[#000000] text-white px-[50px] py-[10px] cursor-pointer font-[500] text-[14px]"
							onClick={ doTry }
							disabled={
								isBusy ||
								userImages.length === 0 ||
								selectedProductImages.length === 0
							}
						>
							{ isBusy
								? __( 'Trying…', 'try-aura' )
								: __( 'Try On', 'try-aura' ) }
						</button>
						<button
							className="bg-white text-black px-[50px] py-[10px] cursor-pointer border border-[#E9E9E9] font-[500] text-[14px]"
							onClick={ addToCart }
						>
							{ __( 'Add to Cart', 'try-aura' ) }
						</button>
					</div>
				</div>
			</div>
		</>
	);
};

export default TryOnModal;
