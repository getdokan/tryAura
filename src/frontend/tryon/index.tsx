import { createRoot, useEffect, useRef, useState } from '@wordpress/element';
import { GoogleGenAI } from '@google/genai';
import './style.scss';
import { __ } from '@wordpress/i18n';
import { Camera, UploadCloud, User, X } from 'lucide-react';
import { Button, GroupButton } from '../../components';

// Minimal frontend Try-On implementation: Adds a "Try on" button next to Add to cart on WooCommerce
// product pages. Clicking it opens a popup to upload or capture a photo and generates an AI try-on
// image using the saved API key (see enhancer.tsx for inspiration).

declare global {
	interface Window {
		// eslint-disable-line @typescript-eslint/consistent-type-definitions
		tryAura?: {
			restUrl?: string;
			nonce?: string;
			apiKey?: string;
		};
	}
}

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

function unique< T >( arr: T[] ): T[] {
	return Array.from( new Set( arr ) );
}

function getProductImageUrls(): string[] {
	const imgs: HTMLImageElement[] = Array.from(
		document.querySelectorAll(
			'.woocommerce-product-gallery__image img, .woocommerce-product-gallery__wrapper img, .product .images img, .woocommerce-main-image, .entry-summary img'
		)
	);
	const urls: string[] = imgs
		.map( ( img ) => {
			const large =
				( img as any ).dataset?.large_image ||
				img.getAttribute( 'data-large_image' );
			const cs = ( img as any ).currentSrc || img.getAttribute( 'src' );
			return large || cs || '';
		} )
		.filter( Boolean ) as string[];
	return unique( urls );
}

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
		setUserImages( ( prev ) => [ ...prev, dataUrl ] );
		setMessage( 'Photo captured. Click Try to generate.' );
		stopCamera();
	};

	const onFileChange = ( e: any ) => {
		const files: FileList | undefined = e?.target?.files;
		console.log( files );
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
				setUserImages( ( prev ) => [ ...prev, ...results ] );
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
		if ( ! productImages.length ) {
			setError( 'No product image found on this page.' );
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
				productImages.slice( 0, 3 ).map( toInlineData )
			);

			setStatus( 'generating' );
			setMessage( 'Generating try-on preview…' );
			const ai = new GoogleGenAI( { apiKey } );

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
					<div className="flex flex-row justify-between border-b-[1px] border-b-[#E9E9E9] pt-[16px] pl-[24px] pr-[24px]">
						<h2 className="mt-0">
							{ __( 'Virtual Try-On', 'try-aura' ) }
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
						<div className="w-1/3 max-h-[533px] overflow-auto">
							<div className="font-[500] text-[14px] text-[#25252D] mb-[20px]">
								{ __( 'Your Image', 'try-aura' ) }
							</div>
							<GroupButton
								options={ [
									{
										label: 'Upload Image',
										value: 'upload',
										icon: <UploadCloud size={ 16 } />,
									},
									{
										label: 'Use Camera',
										value: 'camera',
										icon: <Camera size={ 16 } />,
									},
								] }
								onClick={ ( value ) => {
									setUserImages( [] );
									setActiveTab( value );
								} }
								value={ activeTab }
								className={ 'mb-[20px]' }
							/>
							<div
								style={ {
									display: 'flex',
									gap: 8,
									flexWrap: 'wrap',
								} }
							>
								{ activeTab === 'upload' &&
									userImages.length === 0 && (
										<div>
											<div className="max-w-md mx-auto">
												<label
													htmlFor="image-upload"
													className="block cursor-pointer"
												>
													<div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-100 px-8 py-12 text-center shadow-sm hover:border-gray-400 transition-colors duration-200">
														<input
															type="file"
															id="image-upload"
															accept="image/*"
															multiple={ false }
															onChange={
																onFileChange
															}
															className="hidden"
														/>

														<User
															size={ 24 }
															className="mx-auto text-gray-400"
														/>

														<p className="mt-6 text-xl font-medium text-purple-600">
															Add Your Image
														</p>

														<p className="mt-4 text-sm text-gray-600">
															Supports: jpg, png,
															and img formats.
														</p>

														<p className="mt-2 text-sm text-gray-600">
															File size must be
															under 25 MB.
														</p>
													</div>
												</label>
											</div>
										</div>
									) }

								{ activeTab === 'camera' && (
									<>
										<button
											className="button"
											onClick={ startCamera }
											disabled={ cameraActive || isBusy }
										>
											Start camera
										</button>
										<button
											className="button"
											onClick={ stopCamera }
											disabled={
												! cameraActive || isBusy
											}
										>
											Stop
										</button>

										{ cameraActive && (
											<div>
												<video
													ref={ videoRef }
													autoPlay
													playsInline
													muted
													style={ {
														width: '100%',
														height: '100%',
														background: '#000',
														display: 'block',
													} }
												/>
											</div>
										) }

										<button
											className="button"
											onClick={ capture }
											disabled={
												! cameraActive || isBusy
											}
										>
											Capture
										</button>
									</>
								) }
							</div>

							<div>
								{ userImages.length > 0 && (
									<div className="flex flex-col gap-[8px]">
										{ userImages.map( ( img, idx ) => (
											<div
												key={ idx }
												style={ {
													position: 'relative',
													border: '1px solid #eee',
													borderRadius: 4,
													overflow: 'hidden',
												} }
											>
												<img
													src={ img }
													alt={ `Your ${ idx + 1 }` }
													style={ {
														width: '100%',
														height: 'auto',
														display: 'block',
													} }
												/>
												<button
													type="button"
													className="button"
													onClick={ () =>
														removeUserImage( idx )
													}
													aria-label="Remove photo"
													style={ {
														position: 'absolute',
														top: 4,
														right: 4,
														padding: '2px 6px',
														lineHeight: 1,
														fontSize: 12,
													} }
												>
													×
												</button>
											</div>
										) ) }
									</div>
								) }
							</div>
							{ error ? (
								<div style={ { color: 'red', marginTop: 8 } }>
									{ error }
								</div>
							) : null }
						</div>

						<div className="w-1/3 flex flex-col gap-[32px]">
							<div style={ { fontWeight: 600, marginBottom: 8 } }>
								Product image(s)
							</div>
							<div
								style={ {
									display: 'grid',
									gridTemplateColumns:
										'repeat(auto-fill, minmax(90px, 1fr))',
									gap: 8,
								} }
							>
								{ productImages.map( ( url, i ) => (
									<img
										key={ i }
										src={ url }
										alt={ `Product ${ i + 1 }` }
										style={ {
											width: '100%',
											height: 'auto',
											borderRadius: 4,
											border: '1px solid #eee',
										} }
									/>
								) ) }
							</div>
						</div>

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
								productImages.length === 0
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

function openTryOnModal( productImages: string[] ) {
	const containerId = 'try-aura-tryon-modal-root';
	let container = document.getElementById( containerId );
	if ( ! container ) {
		container = document.createElement( 'div' );
		container.id = containerId;
		container.className = 'tryaura';
		document.body.appendChild( container );
	}
	const root: any = ( createRoot as any )( container );
	const handleClose = () => {
		try {
			root.unmount?.();
		} catch {}
		container?.remove();
	};
	root.render(
		<TryOnModal productImages={ productImages } onClose={ handleClose } />
	);
}

function injectButton() {
	const btnId = 'try-aura-tryon-button';
	if ( document.getElementById( btnId ) ) {
		return;
	}
	const addToCart: HTMLElement | null = document.querySelector(
		'.single_add_to_cart_button'
	);
	if ( ! addToCart ) {
		return;
	}
	const btn = document.createElement( 'button' );
	btn.id = btnId;
	btn.type = 'button';
	btn.textContent = 'Try on';
	btn.className =
		addToCart.className.replace( 'single_add_to_cart_button', '' ).trim() ||
		'button';
	btn.style.marginLeft = '8px';
	addToCart.insertAdjacentElement( 'afterend', btn );

	btn.addEventListener( 'click', () => {
		const images = getProductImageUrls();
		if ( ! images.length ) {
			window.alert( 'No product images found to try on.' );
			return;
		}
		openTryOnModal( images );
	} );
}

function init() {
	injectButton();
	const observer = new MutationObserver( () => injectButton() );
	observer.observe( document.body, { childList: true, subtree: true } );
}

document.addEventListener( 'DOMContentLoaded', init );
