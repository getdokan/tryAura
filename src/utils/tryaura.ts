import { applyFilters } from '@wordpress/hooks';

export const hasPro = () => {
	// @ts-ignore
	const hasPro = window?.tryAura?.hasPro;

	if (
		hasPro &&
		(hasPro === true ||
			hasPro === 'true' ||
			hasPro === '1' ||
			hasPro === 1 ||
			hasPro === 'yes')
	) {
		return true;
	}

	return false;
};

export const getUpgradeToProUrl = () => {
	// @ts-ignore
	const upgradeToProUrl = window?.tryAura?.upgradeToProUrl;

	return upgradeToProUrl ?? '';
};

export const getMediaSelectedItems = () => {
	let frameObj =
		wp?.media?.frame ||
		(wp?.media?.featuredImage?.frame
			? wp.media.featuredImage.frame()
			: null);
	frameObj = applyFilters('tryaura.media_frame', frameObj);
	const state =
		typeof frameObj?.state === 'function' ? frameObj.state() : null;
	const collection = state?.get?.('selection');
	const models =
		collection?.models || (collection?.toArray ? collection.toArray() : []);
	const items = (models || [])
		.map((m: any) => (typeof m?.toJSON === 'function' ? m.toJSON() : m))
		.filter((j: any) => j && j.url && j.id);

	return { items, frameObj };
};

export const getYoutubeId = (videoUrl: string) => {
	const pattern =
		/(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
	const match = videoUrl.match(pattern);
	return match ? match[1] : null;
};

const loadImage = (src: string) =>
	new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () =>
			reject(new Error('Failed to load image for optimization.'));
		image.src = src;
	});

const blobToDataUrl = (blob: Blob) =>
	new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve((reader.result as string) || '');
		reader.onerror = () => reject(new Error('Failed to read image data.'));
		reader.readAsDataURL(blob);
	});

const canvasToDataUrl = (
	canvas: HTMLCanvasElement,
	mimeType: string,
	quality: number
) =>
	new Promise<string>((resolve, reject) => {
		const canUseToDataUrl = mimeType !== 'image/webp';

		if (canUseToDataUrl) {
			const dataUrl = canvas.toDataURL(mimeType, quality);
			if (dataUrl) {
				resolve(dataUrl);
				return;
			}
		}

		canvas.toBlob(
			(blob) => {
				if (!blob) {
					reject(new Error('Failed to optimize image.'));
					return;
				}

				blobToDataUrl(blob).then(resolve).catch(reject);
			},
			mimeType,
			quality
		);
	});

export const optimizeImageDataUrl = async (
	dataUrl: string,
	options?: {
		maxDimension?: number;
		quality?: number;
		preferredMimeType?: string;
	}
) => {
	if (!dataUrl.startsWith('data:')) {
		return dataUrl;
	}

	const maxDimension = Number(
		applyFilters(
			'tryaura.image_optimize_max_dimension',
			options?.maxDimension ?? 1600
		)
	);
	const quality = Number(
		applyFilters('tryaura.image_optimize_quality', options?.quality ?? 0.82)
	);
	const preferredMimeType = String(
		applyFilters(
			'tryaura.image_optimize_mime_type',
			options?.preferredMimeType ?? 'image/jpeg'
		)
	);
	const maxDataUrlLength = Number(
		applyFilters(
			'tryaura.image_optimize_max_data_url_length',
			1_500_000
		)
	);
	const image = await loadImage(dataUrl);
	const width = image.naturalWidth || image.width;
	const height = image.naturalHeight || image.height;

	if (!width || !height) {
		return dataUrl;
	}

	const scale = Math.min(1, maxDimension / Math.max(width, height));
	const targetWidth = Math.max(1, Math.round(width * scale));
	const targetHeight = Math.max(1, Math.round(height * scale));
	const sourceMimeType =
		/^data:([^;]+)/.exec(dataUrl)?.[1]?.toLowerCase() || 'image/jpeg';
	const targetMimeType =
		sourceMimeType === 'image/png' ? 'image/png' : preferredMimeType;

	if (
		scale === 1 &&
		sourceMimeType === targetMimeType &&
		dataUrl.length <= maxDataUrlLength
	) {
		return dataUrl;
	}

	const canvas = document.createElement('canvas');
	canvas.width = targetWidth;
	canvas.height = targetHeight;
	const context = canvas.getContext('2d');

	if (!context) {
		return dataUrl;
	}

	context.drawImage(image, 0, 0, targetWidth, targetHeight);

	try {
		return await canvasToDataUrl(canvas, targetMimeType, quality);
	} catch {
		return dataUrl;
	}
};

export const blobToOptimizedInlineData = async (
	blob: Blob,
	options?: {
		maxDimension?: number;
		quality?: number;
		preferredMimeType?: string;
	}
) => {
	const originalDataUrl = await blobToDataUrl(blob);
	const optimizedDataUrl = await optimizeImageDataUrl(originalDataUrl, options);
	const comma = optimizedDataUrl.indexOf(',');
	const header = optimizedDataUrl.substring(0, Math.max(0, comma));
	const mimeType =
		/^data:([^;]+)/.exec(header)?.[1] || blob.type || 'image/jpeg';
	const data =
		comma >= 0 ? optimizedDataUrl.substring(comma + 1) : optimizedDataUrl;

	return {
		mimeType,
		data,
		dataUrl: optimizedDataUrl,
	};
};
