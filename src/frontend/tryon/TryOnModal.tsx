import { useEffect, useRef, useState } from "@wordpress/element";
import { GoogleGenAI } from "@google/genai";
import { __ } from "@wordpress/i18n";
import { X } from "lucide-react";
import UserImageSection from "./UserImageSection";
import ProductImagesSection from "./ProductImagesSection";

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
		'Select or capture one or more photos, then click Try'
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
		} catch ( e: any ) {
			setError( e?.message || 'Unable to access camera.' );
		}
	};

	async function resolveApiKey(): Promise< string | null > {
		try {
			// @ts-ignore
			const key = window?.tryAura?.apiKey;
			if ( key && key.length > 0 ) {
				return key;
			}
			// @ts-ignore
			const rest = window?.tryAura?.restUrl;
			// @ts-ignore
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

	const stopCamera = () => {
		try {
			streamRef.current?.getTracks().forEach( ( t ) => t.stop() );
		} catch {}
		streamRef.current = null;
		setCameraActive( false );
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
				'Camera not ready yet. Please wait a moment and try again.'
			);
			return;
		}
		const w = video.videoWidth || 640;
		const h = video.videoHeight || 480;
		if ( ! w || ! h ) {
			setError(
				'Camera not ready yet. Please wait a moment and try again.'
			);
			return;
		}
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
		const dataUrl = canvas.toDataURL( 'image/jpeg', 0.95 );
		setUserImages( [ dataUrl ] );
		setMessage( 'Photo captured. Click Try to generate.' );
		stopCamera();
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
				setUserImages( results );
				setMessage( 'Photo(s) selected. Click Try to generate.' );
			} )
			.catch( () => {
				setError( 'Failed to read one or more files.' );
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
		const resp = await fetch( img, { credentials: 'same-origin' } );
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
			setError( 'Please select or capture your photo first.' );
			return;
		}
		if ( selectedProductImages.length === 0 ) {
			setError( 'Please select at least one product image.' );
			return;
		}
		try {
			setError( null );
			setStatus( 'fetching' );
			setMessage( 'Preparing images…' );
			const apiKey = await resolveApiKey();
			if ( ! apiKey ) {
				throw new Error(
					'Missing API key. Please configure TryAura settings.'
				);
			}

			const primaryUserImage = userImages[ 0 ]; // Use first selected/captured photo as the user image
			const userInline = await toInlineData( primaryUserImage );
			const productInlineList = await Promise.all(
				selectedProductImages.map( toInlineData )
			);

			setStatus( 'generating' );
			setMessage( 'Generating try-on preview…' );

			const promptText =
				'Create a realistic virtual try-on image. The first image is the user/customer photo. The subsequent image(s) are the product to wear/use. Put the product on the person naturally with correct proportions, lighting, and perspective. Keep a neutral background suitable for eCommerce.';
			const contents: any[] = [
				{ text: promptText },
				{
					inlineData: {
						mimeType: userInline.mimeType,
						data: userInline.data,
					},
				},
			];
			for ( const p of productInlineList ) {
				contents.push( {
					inlineData: { mimeType: p.mimeType, data: p.data },
				} );
			}

			const ai = new GoogleGenAI( { apiKey } );
			const response: any = await ( ai as any ).models.generateContent( {
				model: 'gemini-2.5-flash-image-preview',
				contents,
			} );

			setStatus( 'parsing' );
			setMessage( 'Processing result…' );
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
		} catch ( e: any ) {
			setError( e?.message || 'Generation failed.' );
			setStatus( 'error' );
			setMessage( 'Generation failed.' );
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
						<h2 className="mt-0 font-[700] font-bold text-[18px] text-[#25252D] font-[Inter]">
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

						<div className="w-1/3">
							<div style={ { fontWeight: 600, marginBottom: 8 } }>
								Generated
							</div>
							{ generatedUrl ? (
								<img
									src={ generatedUrl }
									alt="Generated try-on"
									style={ {
										maxWidth: '100%',
										height: 'auto',
										display: 'block',
									} }
								/>
							) : (
								<div
									style={ {
										border: '1px solid #eee',
										borderRadius: 4,
										minHeight: 220,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										padding: 12,
									} }
								>
									<span>{ message }</span>
								</div>
							) }
							{ generatedUrl ? (
								<div
									style={ {
										display: 'flex',
										gap: 8,
										marginTop: 8,
										justifyContent: 'flex-end',
									} }
								>
									<a
										className="button"
										href={
											isBusy ? undefined : generatedUrl
										}
										download={
											isBusy ? undefined : 'tryon.png'
										}
										aria-disabled={ isBusy }
										style={ {
											pointerEvents: isBusy
												? 'none'
												: 'auto',
											opacity: isBusy ? 0.6 : 1,
										} }
									>
										Download
									</a>
								</div>
							) : null }
						</div>
					</div>
					{ /* Actions */ }
					<div className="mt-[24px] border-t-[1px] border-t-[#E9E9E9] flex flex-row justify-end p-[16px_24px] gap-[12px]">
						<button
							className="button button-primary"
							onClick={ doTry }
							disabled={
								isBusy ||
								userImages.length === 0 ||
								selectedProductImages.length === 0
							}
						>
							{ isBusy ? 'Trying…' : 'Try' }
						</button>
					</div>
				</div>
			</div>
		</>
	);
};

export default TryOnModal;
