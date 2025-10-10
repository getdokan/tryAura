import { createRoot, useEffect, useRef, useState } from '@wordpress/element';
import { GoogleGenAI } from '@google/genai';

// Minimal frontend Try-On implementation: Adds a "Try on" button next to Add to cart on WooCommerce
// product pages. Clicking it opens a popup to upload or capture a photo and generates an AI try-on
// image using the saved API key (see enhancer.tsx for inspiration).

declare global {
	interface Window { // eslint-disable-line @typescript-eslint/consistent-type-definitions
		tryAura?: {
			restUrl?: string;
			nonce?: string;
			apiKey?: string;
		};
	}
}

const overlayStyle: any = {
	position: 'fixed',
	inset: 0,
	background: 'rgba(0,0,0,0.55)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	zIndex: 200000,
};

const contentStyle: any = {
	background: '#fff',
	padding: 20,
	borderRadius: 8,
	maxWidth: 820,
	width: '94vw',
	boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
};

async function resolveApiKey(): Promise<string | null> {
	try {
		let key = window?.tryAura?.apiKey;
		if (key && key.length > 0) return key;
		const rest = window?.tryAura?.restUrl;
		const nonce = window?.tryAura?.nonce;
		if (!rest || !nonce) return null;
		const res = await fetch(rest.replace(/\/?$/, '/') + 'try-aura/v1/settings', {
			headers: { 'X-WP-Nonce': nonce },
			credentials: 'same-origin',
		});
		if (!res.ok) return null;
		const data = await res.json();
		const opt = (data && (data as any).try_aura_api_key) as string | undefined;
		return opt && opt.length > 0 ? opt : null;
	} catch {
		return null;
	}
}

function unique<T>(arr: T[]): T[] {
	return Array.from(new Set(arr));
}

function getProductImageUrls(): string[] {
	const imgs: HTMLImageElement[] = Array.from(document.querySelectorAll(
		'.woocommerce-product-gallery__image img, .woocommerce-product-gallery__wrapper img, .product .images img, .woocommerce-main-image, .entry-summary img'
	));
	const urls: string[] = imgs
		.map((img) => {
			const large = (img as any).dataset?.large_image || img.getAttribute('data-large_image');
			const cs = (img as any).currentSrc || img.getAttribute('src');
			return large || cs || '';
		})
		.filter(Boolean) as string[];
	return unique(urls);
}

type TryOnModalProps = {
	productImages: string[];
	onClose: () => void;
};

const TryOnModal = ({ productImages, onClose }: TryOnModalProps) => {
	const [userImage, setUserImage] = useState<string | null>(null);
	const [status, setStatus] = useState<'idle'|'fetching'|'generating'|'parsing'|'done'|'error'>('idle');
	const [message, setMessage] = useState<string>('Select or capture your photo, then click Try');
	const [error, setError] = useState<string | null>(null);
	const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

	// Camera
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		document.body.classList.add('try-aura-tryon-open');
		return () => {
			document.body.classList.remove('try-aura-tryon-open');
			stopCamera();
		};
	}, []);

	const startCamera = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
			streamRef.current = stream;
			if (videoRef.current) {
				(videoRef.current as any).srcObject = stream;
				await videoRef.current.play();
			}
			setMessage('Camera active — click Capture when ready');
			setError(null);
		} catch (e: any) {
			setError(e?.message || 'Unable to access camera.');
		}
	};

	const stopCamera = () => {
		try {
			streamRef.current?.getTracks().forEach((t) => t.stop());
		} catch {}
		streamRef.current = null;
		if (videoRef.current) {
			(videoRef.current as any).srcObject = null;
		}
	};

	const capture = () => {
		if (!videoRef.current) return;
		const video = videoRef.current;
		const w = video.videoWidth || 640;
		const h = video.videoHeight || 480;
		if (!canvasRef.current) {
			canvasRef.current = document.createElement('canvas');
		}
		const canvas = canvasRef.current;
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.drawImage(video, 0, 0, w, h);
		const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
		setUserImage(dataUrl);
		setMessage('Photo captured. Click Try to generate.');
		stopCamera();
	};

	const onFileChange = (e: any) => {
		const file: File | undefined = e?.target?.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onloadend = () => setUserImage(reader.result as string);
		reader.readAsDataURL(file);
		setMessage('Photo selected. Click Try to generate.');
	};

	const toInlineData = async (img: string): Promise<{ mimeType: string; data: string; }> => {
		if (img.startsWith('data:')) {
			const comma = img.indexOf(',');
			const header = img.substring(0, Math.max(0, comma));
			const match = /^data:([^;]+)/.exec(header);
			const mimeType = match && match[1] ? match[1] : 'image/png';
			const data = comma >= 0 ? img.substring(comma + 1) : img;
			return { mimeType, data };
		}
		const resp = await fetch(img, { credentials: 'same-origin' });
		const blob = await resp.blob();
		const mimeType = blob.type || 'image/png';
		const base64 = await new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => {
				const result = reader.result as string;
				const comma = result.indexOf(',');
				resolve(comma >= 0 ? result.substring(comma + 1) : result);
			};
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
		return { mimeType, data: base64 };
	};

	const doTry = async () => {
		if (!userImage) {
			setError('Please select or capture your photo first.');
			return;
		}
		if (!productImages.length) {
			setError('No product image found on this page.');
			return;
		}
		try {
			setError(null);
			setStatus('fetching');
			setMessage('Preparing images…');
			const apiKey = await resolveApiKey();
			if (!apiKey) throw new Error('Missing API key. Please configure TryAura settings.');

			const userInline = await toInlineData(userImage);
			const productInlineList = await Promise.all(productImages.slice(0, 3).map(toInlineData));

			setStatus('generating');
			setMessage('Generating try-on preview…');
			const ai = new GoogleGenAI({ apiKey });

			const promptText = 'Create a realistic virtual try-on image. The first image is the user/customer photo. The subsequent image(s) are the product to wear/use. Put the product on the person naturally with correct proportions, lighting, and perspective. Keep a neutral background suitable for eCommerce.';
			const contents: any[] = [ { text: promptText }, { inlineData: { mimeType: userInline.mimeType, data: userInline.data } } ];
			for (const p of productInlineList) {
				contents.push({ inlineData: { mimeType: p.mimeType, data: p.data } });
			}

			const response: any = await (ai as any).models.generateContent({
				model: 'gemini-2.5-flash-image-preview',
				contents,
			});

			setStatus('parsing');
			setMessage('Processing result…');
			const parts = response?.candidates?.[0]?.content?.parts || [];
			let data64: string | null = null;
			let outMime: string = 'image/png';
			for (const part of parts) {
				if (part.inlineData) {
					data64 = part.inlineData.data;
					outMime = part.inlineData.mimeType || outMime;
					break;
				}
			}

			if (!data64) throw new Error('Model did not return an image.');
			const dataUrl = `data:${outMime};base64,${data64}`;
			setGeneratedUrl(dataUrl);
			setStatus('done');
			setMessage('Done');
		} catch (e: any) {
			setError(e?.message || 'Generation failed.');
			setStatus('error');
			setMessage('Generation failed.');
		}
	};

	const isBusy = status === 'fetching' || status === 'generating' || status === 'parsing';

	return (
		<div style={overlayStyle}>
			<div style={contentStyle}>
				<h2 style={{ marginTop: 0 }}>Try on product</h2>
				<div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
					<div style={{ flex: 1, minWidth: 260 }}>
						<div style={{ fontWeight: 600, marginBottom: 8 }}>Your photo</div>
						<div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
							<input type="file" accept="image/*" onChange={onFileChange} />
							<button className="button" onClick={startCamera} disabled={!!streamRef.current || isBusy}>Start camera</button>
							<button className="button" onClick={stopCamera} disabled={!streamRef.current || isBusy}>Stop</button>
							<button className="button" onClick={capture} disabled={!streamRef.current || isBusy}>Capture</button>
						</div>
						<div style={{ border: '1px solid #eee', borderRadius: 4, minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
							{userImage ? (
								<img src={userImage} alt="Your selected" style={{ maxWidth: '100%', height: 'auto', display: 'block' }} />
							) : (
								<video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', background: '#000' }} />
							)}
						</div>
						{error ? <div style={{ color: 'red', marginTop: 8 }}>{error}</div> : null}
					</div>

					<div style={{ flex: 1, minWidth: 260 }}>
						<div style={{ fontWeight: 600, marginBottom: 8 }}>Product image(s)</div>
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
							{productImages.map((url, i) => (
								<img key={i} src={url} alt={`Product ${i+1}`} style={{ width: '100%', height: 'auto', borderRadius: 4, border: '1px solid #eee' }} />
							))}
						</div>
					</div>

					<div style={{ flex: 1, minWidth: 260 }}>
						<div style={{ fontWeight: 600, marginBottom: 8 }}>Generated</div>
						{generatedUrl ? (
							<img src={generatedUrl} alt="Generated try-on" style={{ maxWidth: '100%', height: 'auto', display: 'block' }} />
						) : (
							<div style={{ border: '1px solid #eee', borderRadius: 4, minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
								<span>{message}</span>
							</div>
						)}
						{generatedUrl ? (
							<div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
								<a className="button" href={isBusy ? undefined : generatedUrl} download={isBusy ? undefined : 'tryon.png'} aria-disabled={isBusy} style={{ pointerEvents: isBusy ? 'none' : 'auto', opacity: isBusy ? 0.6 : 1 }}>Download</a>
							</div>
						) : null}
					</div>
				</div>

				<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
					<button className="button" onClick={onClose} disabled={isBusy}>Close</button>
					<button className="button button-primary" onClick={doTry} disabled={isBusy || !userImage || productImages.length === 0}>
						{isBusy ? 'Trying…' : 'Try'}
					</button>
				</div>
			</div>
		</div>
	);
};

function openTryOnModal(productImages: string[]) {
	const containerId = 'try-aura-tryon-modal-root';
	let container = document.getElementById(containerId);
	if (!container) {
		container = document.createElement('div');
		container.id = containerId;
		document.body.appendChild(container);
	}
	const root: any = (createRoot as any)(container);
	const handleClose = () => {
		try { root.unmount?.(); } catch {}
		container?.remove();
	};
	root.render(<TryOnModal productImages={productImages} onClose={handleClose} />);
}

function injectButton() {
	const btnId = 'try-aura-tryon-button';
	if (document.getElementById(btnId)) return;
	const addToCart: HTMLElement | null = document.querySelector('.single_add_to_cart_button');
	if (!addToCart) return;
	const btn = document.createElement('button');
	btn.id = btnId;
	btn.type = 'button';
	btn.textContent = 'Try on';
	btn.className = addToCart.className.replace('single_add_to_cart_button', '').trim() || 'button';
	btn.style.marginLeft = '8px';
	addToCart.insertAdjacentElement('afterend', btn);

	btn.addEventListener('click', () => {
		const images = getProductImageUrls();
		if (!images.length) {
			window.alert('No product images found to try on.');
			return;
		}
		openTryOnModal(images);
	});
}

function init() {
	injectButton();
	const observer = new MutationObserver(() => injectButton());
	observer.observe(document.body, { childList: true, subtree: true });
}

document.addEventListener('DOMContentLoaded', init);
