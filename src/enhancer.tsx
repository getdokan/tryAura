import { createRoot, useEffect, useRef, useState } from '@wordpress/element';
import { GoogleGenAI } from '@google/genai';

/**
 * Lightweight UI that injects an "Enhance with AI" button into the
 * WordPress Featured Image media modal toolbar. This implementation focuses
 * only on the UI using @wordpress/element, without any REST/AI backend.
 */

declare const wp: any;

declare global {
	interface Window { // eslint-disable-line @typescript-eslint/consistent-type-definitions
		tryAura?: {
			apiKey?: string;
			restUrl?: string;
			nonce?: string;
		};
	}
}

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

type PreviewProps = {
	imageUrls: string[];
	attachmentIds: number[];
	onClose: () => void;
};

const overlayStyle: any = {
	position: 'fixed',
	inset: '0',
	background: 'rgba(0,0,0,0.5)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	zIndex: 200000,
};

const contentStyle: any = {
	background: '#fff',
	padding: '20px',
	borderRadius: '6px',
	maxWidth: '680px',
	width: '90vw',
	boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
};

const PreviewModal = ({ imageUrls, attachmentIds, onClose }: PreviewProps) => {
	const [ status, setStatus ] = useState<'idle'|'fetching'|'generating'|'parsing'|'done'|'error'>('idle');
	const [ message, setMessage ] = useState<string>('Ready to generate');
	const [ generatedUrl, setGeneratedUrl ] = useState<string | null>(null);
	const [ error, setError ] = useState<string | null>(null);
	const [ backgroundType, setBackgroundType ] = useState<string>('studio');
	const [ styleType, setStyleType ] = useState<string>('photo-realistic');
	const [ optionalPrompt, setOptionalPrompt ] = useState<string>('');
	const [ uploading, setUploading ] = useState<boolean>(false);
	// Video generation state
	const [ videoStatus, setVideoStatus ] = useState<'idle'|'generating'|'polling'|'downloading'|'done'|'error'>('idle');
	const [ videoMessage, setVideoMessage ] = useState<string>('Ready to generate video');
	const [ videoUrl, setVideoUrl ] = useState<string | null>(null);
	const [ videoError, setVideoError ] = useState<string | null>(null);
	const [ videoUploading, setVideoUploading ] = useState<boolean>(false);
	const [ activeTab, setActiveTab ] = useState<'image'|'video'>('image');
	const multiple = imageUrls.length > 1;

	useEffect(() => {
		document.body.classList.add('ai-enhancer-modal-open');
		return () => document.body.classList.remove('ai-enhancer-modal-open');
	}, []);

	// Reset state when image changes
	useEffect(() => {
		setStatus('idle');
		setMessage('Ready to generate');
		setGeneratedUrl(null);
		setError(null);
		// Reset video state too when images change
		setVideoStatus('idle');
		setVideoMessage('Ready to generate video');
		if (videoUrl && videoUrl.startsWith('blob:')) {
			try { URL.revokeObjectURL(videoUrl); } catch {}
		}
		setVideoUrl(null);
		setVideoError(null);
		setActiveTab('image');
	}, [ imageUrls ]);

	// Revoke video blob URL on unmount/change to free memory
	useEffect(() => {
		return () => {
			if (videoUrl && videoUrl.startsWith('blob:')) {
				try { URL.revokeObjectURL(videoUrl); } catch {}
			}
		};
	}, [ videoUrl ]);

	const doGenerate = async () => {
		try {
			const apiKey = await resolveApiKey();
			if (!apiKey) {
				throw new Error('Missing Google AI API key. Please set it on the TryAura settings page.');
			}

			setStatus('fetching');
			setMessage('Fetching images…');
			const encodedImages = await Promise.all(
				imageUrls.map(async (url) => {
					const resp = await fetch(url, { credentials: 'same-origin' });
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
					return { mimeType, base64 };
				})
			);

			setStatus('generating');
			setMessage('Thinking and generating…');
			const ai = new GoogleGenAI({ apiKey });

			const extras = optionalPrompt && optionalPrompt.trim().length ? `\n\nAdditional instruction from user: ${optionalPrompt.trim()}` : '';
			const multiHint = imageUrls.length > 1 ? '\n\nNote: Multiple input images provided. If a person/model photo and separate product images are present, compose the result with the model wearing/using the product(s) while keeping the background as requested.' : '';
			const promptText = `Generate a high-quality AI product try-on image where the product from the provided image(s) is naturally worn or used by a suitable human model.\n\nPreferences:\n- Background preference: ${backgroundType}\n- Output style: ${styleType}\n\nRequirements: Automatically determine an appropriate model. Ensure the product fits perfectly with accurate lighting, proportions, and textures preserved. Maintain professional composition and a brand-safe output.${extras}${multiHint}`;
			const prompt = [
				{ text: promptText },
				...encodedImages.map(img => ({ inlineData: { mimeType: img.mimeType, data: img.base64 } }))
			];

			const response: any = await (ai as any).models.generateContent({
				model: 'gemini-2.5-flash-image-preview',
				contents: prompt,
			});

			setStatus('parsing');
			setMessage('Processing results…');
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

			if (!data64) {
				throw new Error('Model did not return an image.');
			}

			const dataUrl = `data:${outMime};base64,${data64}`;
			setGeneratedUrl(dataUrl);
			setStatus('done');
			setMessage('Done');
			setError(null);
		} catch (e: any) {
			setError(e?.message || 'Generation failed.');
			setStatus('error');
			setMessage('Generation failed.');
		}
	};

	const setInMediaSelection = async () => {
		if (!generatedUrl) return;
		try {
			setUploading(true);
			const rest = window?.tryAura?.restUrl;
			const nonce = window?.tryAura?.nonce;
			if (!rest || !nonce) {
				throw new Error('Missing WordPress REST configuration.');
			}
			const restBase = rest.replace(/\/?$/, '/');

			// Convert data URL to Blob by fetching it (works for data: URLs too)
			const blob = await fetch(generatedUrl).then(r => r.blob());
			const mime = blob.type || 'image/png';
			const ext = (mime.split('/')?.[1] || 'png').split('+')?.[0];
			const primaryAttachmentId = (attachmentIds && attachmentIds.length > 0) ? attachmentIds[0] : null;
			const filename = primaryAttachmentId ? `enhanced-${primaryAttachmentId}-${Date.now()}.${ext}` : `enhanced-${Date.now()}.${ext}`;

			const uploadRes = await fetch(restBase + 'wp/v2/media', {
				method: 'POST',
				headers: {
					'X-WP-Nonce': nonce,
					'Content-Disposition': `attachment; filename="${filename}"`,
					'Content-Type': mime,
				},
				credentials: 'same-origin',
				body: blob,
			});
			if (!uploadRes.ok) {
				const text = await uploadRes.text();
				throw new Error(text || 'Upload failed.');
			}
			const json = await uploadRes.json();
			const newId = json?.id;
			if (!newId) {
				throw new Error('Upload succeeded but no attachment ID returned.');
			}

			// Select it in the media frame. Only set featured image if we're in the featured image modal.
			try {
				const frameObj = (wp?.media?.frame) || (wp?.media?.featuredImage?.frame ? wp.media.featuredImage.frame() : null);
				let isFeaturedContext = false;
				if (frameObj) {
					// Detect context via frame options/state id when possible.
					const state = typeof frameObj.state === 'function' ? frameObj.state() : null;
					const stateId = (state && (state.id || (state.get && state.get('id')) || (state.attributes && state.attributes.id))) || (frameObj.options && frameObj.options.state);
					if (stateId === 'featured-image') {
						isFeaturedContext = true;
					}
					// Update current selection to the newly uploaded attachment so it can be inserted or set.
					const selection = state?.get?.('selection');
					if (selection) {
						const att = wp?.media?.model?.Attachment?.get ? wp.media.model.Attachment.get(newId) : null;
						if (att?.fetch) {
							try { await att.fetch(); } catch {}
						}
						if (att) {
							selection.reset([ att ]);
						}
					}
				}
				// Only set the featured image when the current frame is the featured image modal.
				if (isFeaturedContext && wp?.media?.featuredImage?.set) {
					wp.media.featuredImage.set(newId);
				}
			} catch (e) {
				// ignore UI sync errors
			}

  	onClose();
		} catch (e: any) {
			setError(e?.message || 'Failed to set image.');
		} finally {
			setUploading(false);
		}
	};

	const doGenerateVideo = async () => {
		try {
			if (!generatedUrl) {
				setVideoError('Please generate an image first.');
				return;
			}
			setVideoError(null);
			setVideoStatus('generating');
			setVideoMessage('Starting video generation…');

			const apiKey = await resolveApiKey();
			if (!apiKey) {
				throw new Error('Missing Google AI API key. Please set it on the TryAura settings page.');
			}

			const extras = optionalPrompt && optionalPrompt.trim().length ? `\n\nAdditional instruction from user: ${optionalPrompt.trim()}` : '';
			const videoPromptText = `Create a short 3–5 second smooth product showcase video based on the generated try-on image. Use gentle camera motion and keep the scene aligned with preferences. make the model walk relaxed.`;
			// Extract base64 from the generated data URL to avoid stack overflow from large buffers
			let generatedImageByteBase64 = '';
			let generatedImageMime = 'image/png';
			if (generatedUrl.startsWith('data:')) {
				const commaIdx = generatedUrl.indexOf(',');
				const header = generatedUrl.substring(0, Math.max(0, commaIdx));
				const match = /^data:([^;]+)/.exec(header);
				generatedImageMime = match && match[1] ? match[1] : 'image/png';
				generatedImageByteBase64 = commaIdx >= 0 ? generatedUrl.substring(commaIdx + 1) : generatedUrl;
			} else {
				const blob = await fetch(generatedUrl).then(r => r.blob());
				generatedImageMime = blob.type || 'image/png';
				const dataUrl: string = await new Promise((resolve, reject) => {
					const reader = new FileReader();
					reader.onloadend = () => resolve(reader.result as string);
					reader.onerror = reject;
					reader.readAsDataURL(blob);
				});
				const commaIdx2 = dataUrl.indexOf(',');
				generatedImageByteBase64 = commaIdx2 >= 0 ? dataUrl.substring(commaIdx2 + 1) : dataUrl;
			}
            // Start long-running video generation operation via REST API
			const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
			const startRes = await fetch(`${BASE_URL}/models/veo-3.0-fast-generate-001:predictLongRunning`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-goog-api-key': apiKey,
				},
				body: JSON.stringify({
					instances: [
 					{
						prompt: videoPromptText,
						image: {bytesBase64Encoded: generatedImageByteBase64, mimeType: generatedImageMime},
					}
					]
				}),
			});
			if (!startRes.ok) {
				const t = await startRes.text();
				throw new Error(t || 'Failed to start video generation.');
			}
			const startJson = await startRes.json();
			const operationName = startJson?.name;
			if (!operationName) {
				throw new Error('No operation name returned from video generation.');
			}

			setVideoStatus('polling');
			setVideoMessage('Rendering video… This can take up to a minute.');
			let finalJson: any = null;
			for (let i = 0; i < 60; i++) { // up to ~10 minutes
				await new Promise((r) => setTimeout(r, 10000));
				const statusRes = await fetch(`${BASE_URL}/${operationName}`, {
					headers: { 'x-goog-api-key': apiKey },
				});
				if (!statusRes.ok) {
					const t = await statusRes.text();
					throw new Error(t || 'Failed to check video generation status.');
				}
				const json = await statusRes.json();
				if (json?.done) {
					finalJson = json;
					break;
				}
			}
			if (!finalJson) {
				throw new Error('Timed out waiting for video generation.');
			}

			const uri =
				finalJson?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
				finalJson?.response?.generatedVideos?.[0]?.video?.uri ||
				finalJson?.response?.generatedVideos?.[0]?.uri;

			if (!uri) {
				throw new Error('No downloadable video URI was returned.');
			}

			setVideoStatus('downloading');
			setVideoMessage('Downloading video…');

			const dlRes = await fetch(uri, {
				headers: { 'x-goog-api-key': apiKey },
				redirect: 'follow',
			} as RequestInit);
			if (!dlRes.ok) {
				const t = await dlRes.text();
				throw new Error(t || 'Failed to download generated video.');
			}
			const videoBlob = await dlRes.blob();

			const objectUrl = URL.createObjectURL(videoBlob);
			if (videoUrl && videoUrl.startsWith('blob:')) {
				try { URL.revokeObjectURL(videoUrl); } catch {}
			}
			setVideoUrl(objectUrl);
			setVideoStatus('done');
			setVideoMessage('Done');
			setVideoError(null);
		} catch (e: any) {
			setVideoError(e?.message || 'Video generation failed.');
			setVideoStatus('error');
			setVideoMessage('Video generation failed.');
		}
	};

	const setVideoInMediaSelection = async () => {
		if (!videoUrl) return;
		try {
			setVideoUploading(true);
			const rest = window?.tryAura?.restUrl;
			const nonce = window?.tryAura?.nonce;
			if (!rest || !nonce) {
				throw new Error('Missing WordPress REST configuration.');
			}
			const restBase = rest.replace(/\/?$/, '/');

			const blob = await fetch(videoUrl).then(r => r.blob());
			const mime = blob.type || 'video/mp4';
			const ext = (mime.split('/')?.[1] || 'mp4').split('+')?.[0];
			const primaryAttachmentId = (attachmentIds && attachmentIds.length > 0) ? attachmentIds[0] : null;
			const filename = primaryAttachmentId ? `enhanced-video-${primaryAttachmentId}-${Date.now()}.${ext}` : `enhanced-video-${Date.now()}.${ext}`;

			const uploadRes = await fetch(restBase + 'wp/v2/media', {
				method: 'POST',
				headers: {
					'X-WP-Nonce': nonce,
					'Content-Disposition': `attachment; filename="${filename}"`,
					'Content-Type': mime,
				},
				credentials: 'same-origin',
				body: blob,
			});
			if (!uploadRes.ok) {
				const text = await uploadRes.text();
				throw new Error(text || 'Upload failed.');
			}
			const json = await uploadRes.json();
			const newId = json?.id;
			if (!newId) {
				throw new Error('Upload succeeded but no attachment ID returned.');
			}

			// Select it in the media frame (do not set featured image for videos)
			try {
				const frameObj = (wp?.media?.frame) || (wp?.media?.featuredImage?.frame ? wp.media.featuredImage.frame() : null);
				if (frameObj) {
					const state = typeof frameObj.state === 'function' ? frameObj.state() : null;
					const selection = state?.get?.('selection');
					if (selection) {
						const att = wp?.media?.model?.Attachment?.get ? wp.media.model.Attachment.get(newId) : null;
						if (att?.fetch) {
							try { await att.fetch(); } catch {}
						}
						if (att) {
							selection.reset([ att ]);
						}
					}
				}
			} catch {}

			onClose();
		} catch (e: any) {
			setVideoError(e?.message || 'Failed to add video to Media Library.');
		} finally {
			setVideoUploading(false);
		}
	};

	const isBusy = uploading || status === 'fetching' || status === 'generating' || status === 'parsing';
	const isVideoBusy = videoUploading || videoStatus === 'generating' || videoStatus === 'polling' || videoStatus === 'downloading';

	return (
		<div className="ai-enhancer-modal" style={overlayStyle}>
			<div className="ai-enhancer-modal__content" style={contentStyle}>
				<h2 style={{ marginTop: 0 }}>AI Product Image Generation</h2>

				{/* Controls */}
				<div style={{ display: 'flex', gap: '12px', marginBottom: 12 }}>
					<label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
						<span style={{ fontWeight: 600 }}>Background preference</span>
						<select value={backgroundType} onChange={(e: any) => setBackgroundType(e.target.value)}>
							<option value="plain white">Plain white</option>
							<option value="studio">Studio</option>
							<option value="natural">Natural</option>
						</select>
					</label>
					<label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
						<span style={{ fontWeight: 600 }}>Output style</span>
						<select value={styleType} onChange={(e: any) => setStyleType(e.target.value)}>
							<option value="photo-realistic">Photo-realistic</option>
							<option value="studio mockup">Studio mockup</option>
							<option value="model shoot">Model shoot</option>
						</select>
					</label>
				</div>
				<div style={{ marginBottom: 12 }}>
					<label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
						<span style={{ fontWeight: 600 }}>Optional prompt</span>
						<textarea value={optionalPrompt} onChange={(e: any) => setOptionalPrompt(e.target.value)} rows={3} placeholder="Add any specific instructions (optional)" />
					</label>
				</div>

				<div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
 				<div style={{ flex: 1 }}>
 					<div style={{ fontWeight: 600, marginBottom: 8 }}>{multiple ? 'Originals' : 'Original'}</div>
 					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
 						{imageUrls.map((url, idx) => (
 							<img key={idx} src={url} alt={`Original ${idx + 1}`} style={{ width: '100%', height: 'auto', display: 'block', border: '1px solid #eee', borderRadius: 4 }} />
 						))}
 					</div>
 				</div>
					<div style={{ flex: 1 }}>
						<div style={{ fontWeight: 600, marginBottom: 8 }}>Generated</div>
						{/* Tabs for Generated content */}
						<div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #eee', marginBottom: 8 }}>
							<button className="button" onClick={() => setActiveTab('image')} aria-pressed={activeTab==='image'} style={{ borderBottom: activeTab==='image' ? '2px solid #2271b1' : '2px solid transparent' }}>Image</button>
							<button className="button" onClick={() => setActiveTab('video')} disabled={!generatedUrl} aria-pressed={activeTab==='video'} style={{ borderBottom: activeTab==='video' ? '2px solid #2271b1' : '2px solid transparent', opacity: !generatedUrl ? 0.6 : 1, pointerEvents: !generatedUrl ? 'none' : 'auto' }}>Video</button>
						</div>
						{activeTab === 'image' ? (
							generatedUrl ? (
								<img src={generatedUrl} alt="Generated" style={{ width: '100%', height: 'auto', display: 'block' }} />
							) : (
								<div style={{ border: '1px solid #eee', borderRadius: 4, minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
									<span>{message}</span>
								</div>
							)
						) : (
							<div>
								<div style={{ fontWeight: 600, marginBottom: 8 }}>Generated video</div>
								{videoUrl ? (
									<video src={videoUrl} controls style={{ width: '100%', height: 'auto', maxHeight: 200, background: '#000', borderRadius: 4 }} />
								) : (
									<div style={{ border: '1px solid #eee', borderRadius: 4, minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
										<span>{videoMessage}</span>
									</div>
								)}
								{videoError ? <div style={{ color: 'red', marginTop: 8 }}>{videoError}</div> : null}
								<div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: 8 }}>
									{videoUrl ? (
										<>
											<button className="button" onClick={doGenerateVideo} disabled={isVideoBusy}>
												{isVideoBusy ? 'Regenerating video…' : 'Regenerate video'}
											</button>
											<a
												className="button"
												href={isVideoBusy ? undefined : videoUrl}
												download={isVideoBusy ? undefined : 'enhanced-video.mp4'}
												aria-disabled={isVideoBusy}
												style={{ pointerEvents: isVideoBusy ? 'none' : 'auto', opacity: isVideoBusy ? 0.6 : 1 }}
											>
												Download video
											</a>
											<button className="button button-primary" onClick={setVideoInMediaSelection} disabled={isVideoBusy || videoUploading || !videoUrl}>
												{videoUploading ? 'Adding…' : 'Add to Media'}
											</button>
										</>
									) : (
										<button className="button" onClick={doGenerateVideo} disabled={isVideoBusy}>
											{isVideoBusy ? 'Generating video…' : 'Generate video'}
										</button>
									)}
								</div>
							</div>
						)}
						{error ? <div style={{ color: 'red', marginTop: 8 }}>{error}</div> : null}
					</div>
				</div>


				{/* Actions */}
				<div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: 16 }}>
					{generatedUrl ? (
  				<>
						<button className="button" onClick={doGenerate} disabled={isBusy}>
							{isBusy ? 'Regenerating…' : 'Regenerate'}
						</button>
						<a
							className="button"
							href={isBusy ? undefined : generatedUrl}
							download={isBusy ? undefined : 'enhanced.png'}
							aria-disabled={isBusy}
							style={{ pointerEvents: isBusy ? 'none' : 'auto', opacity: isBusy ? 0.6 : 1 }}
						>
							Download
						</a>
						<button className="button button-primary" onClick={setInMediaSelection} disabled={isBusy || uploading || !generatedUrl}>
							{uploading ? 'Setting image…' : 'Set image'}
						</button>
					</>
					) : (
						<button className="button button-primary" onClick={doGenerate} disabled={isBusy}>{isBusy ? 'Generating…' : 'Generate'}</button>
					)}
					<button className="button" onClick={onClose} disabled={isBusy || isVideoBusy}>Close</button>
				</div>
			</div>
		</div>
	);
};

const EnhanceButton = () => {
	const [ open, setOpen ] = useState(false);
	const [ previewUrls, setPreviewUrls ] = useState<string[]>([]);
	const [ attachmentIds, setAttachmentIds ] = useState<number[]>([]);
	const [ loading, setLoading ] = useState(false);
	const modalContainerRef = useRef<HTMLDivElement | null>(null);
	const modalRootRef = useRef<any>(null);

	const handleClick = () => {
		setLoading(true);
		try {
			// Prefer the current global media frame if available, otherwise fall back to the Featured Image frame.
			const frameObj = (wp?.media?.frame) || (wp?.media?.featuredImage?.frame ? wp.media.featuredImage.frame() : null);
			const state = typeof frameObj?.state === 'function' ? frameObj.state() : null;
			const collection = state?.get?.('selection');
			const models = collection?.models || (collection?.toArray ? collection.toArray() : []);
			const items = (models || [])
				.map((m: any) => (typeof m?.toJSON === 'function' ? m.toJSON() : m))
				.filter((j: any) => j && j.url && j.id);
			if (!items.length) {
				window.alert('Please select at least one image.');
				return;
			}
			setPreviewUrls(items.map((j: any) => j.url));
			setAttachmentIds(items.map((j: any) => j.id));
			setOpen(true);
		} catch (e) {
			// eslint-disable-next-line no-console
			console.error(e);
			window.alert('Unable to read current selection.');
		} finally {
			setLoading(false);
		}
	};

	// Render the modal into document.body to avoid toolbar overflow/stacking issues.
	useEffect(() => {
		if (!open || previewUrls.length === 0) {
			// cleanup if exists
			if (modalContainerRef.current) {
				try { modalRootRef.current?.unmount?.(); } catch {}
				modalContainerRef.current.remove();
				modalContainerRef.current = null;
				modalRootRef.current = null;
			}
			return;
		}

		if (!modalContainerRef.current) {
			const container = document.createElement('div');
			container.id = 'try-aura-ai-modal-root';
			document.body.appendChild(container);
			modalContainerRef.current = container;
		}

		const container = modalContainerRef.current!;
		if (!modalRootRef.current) {
			modalRootRef.current = (createRoot as any)(container);
		}
		modalRootRef.current.render(
			<PreviewModal
				imageUrls={previewUrls}
				attachmentIds={attachmentIds}
				onClose={() => setOpen(false)}
			/>
		);

		return () => {
			// On deps change or unmount, we re-render on next effect; do not remove here unless closing
		};
	}, [ open, previewUrls, attachmentIds ]);

	useEffect(() => {
		return () => {
			// Ensure cleanup on component unmount
			if (modalContainerRef.current) {
				try { modalRootRef.current?.unmount?.(); } catch {}
				modalContainerRef.current.remove();
				modalContainerRef.current = null;
			}
		};
	}, []);

	return (
		<div>
			<button className="button media-button button-primary button-large" onClick={handleClick} disabled={loading}>
				{loading ? 'Preparing…' : 'Enhance with AI'}
			</button>
		</div>
	);
};

function initEnhancerButton() {
	const interval = setInterval(() => {
		const primary: HTMLElement | null = document.querySelector('.media-frame-toolbar .media-toolbar-primary');
		const secondary: HTMLElement | null = document.querySelector('.media-frame-toolbar .media-toolbar-secondary');
		const toolbar: HTMLElement | null = primary || secondary;
		if ( toolbar && !toolbar.querySelector('#try-aura-ai-enhance') ) {
			const container = document.createElement('span');
			container.id = 'try-aura-ai-enhance';
			container.style.display = 'inline-block';
			container.style.marginLeft = '8px';
            container.style.marginTop = '14px';
			toolbar.appendChild(container);
			const root = (createRoot as any)(container);
			root.render(<EnhanceButton />);
			clearInterval(interval);
		}
	}, 500);
}

function whenMediaModalOpens() {
	initEnhancerButton();
	const observer = new MutationObserver(() => initEnhancerButton());
	observer.observe(document.body, { childList: true, subtree: true });
}

document.addEventListener('DOMContentLoaded', whenMediaModalOpens);
