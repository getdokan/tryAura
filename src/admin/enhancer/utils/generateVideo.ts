import apiFetch from '@wordpress/api-fetch';

interface GenerateVideoParams {
	model: string;
	prompt: string;
	images?: string[];
	duration?: string;
	aspectRatio?: string;
	resolution?: string;
	objectId?: string;
	objectType?: string;
	signal?: AbortSignal;
	onStatusChange: ( status: string ) => void;
}

interface GenerateVideoResult {
	videoUrl: string;
	jobId: string;
}

interface SubmitResponse {
	jobId: string;
	provider: string;
}

interface StatusResponse {
	status: 'pending' | 'in_progress' | 'completed' | 'failed';
	videoUrl?: string;
	error?: string;
}

const POLL_INTERVAL_GOOGLE = 10000; // 10 seconds for Gemini
const POLL_INTERVAL_OPENROUTER = 30000; // 30 seconds for OpenRouter
const MAX_POLL_ATTEMPTS = 120; // ~20 minutes at 10s, ~60 minutes at 30s

/**
 * Submit a video generation job and poll until completion.
 * Works for both Gemini and OpenRouter — the PHP backend handles provider routing.
 */
export async function generateVideo(
	params: GenerateVideoParams
): Promise< GenerateVideoResult > {
	const {
		model,
		prompt,
		images,
		duration,
		aspectRatio,
		resolution,
		objectId,
		objectType,
		signal,
		onStatusChange,
	} = params;

	const aura = ( window as any ).tryAura;

	onStatusChange( 'submitting' );

	// Step 1: Submit the video generation job.
	const submitResponse = await apiFetch< SubmitResponse >( {
		path: '/tryaura/v1/video/generate',
		method: 'POST',
		data: {
			nonce: aura?.nonce || '',
			model,
			prompt,
			images: images || [],
			duration: duration || '',
			resolution: resolution || '',
			aspect_ratio: aspectRatio || '',
			object_id: objectId || '',
			object_type: objectType || '',
		},
		signal,
	} );

	const { jobId, provider } = submitResponse;

	if ( ! jobId ) {
		throw new Error( 'No job ID returned from server.' );
	}

	onStatusChange( 'pending' );

	// Step 2: Poll for status.
	const pollInterval =
		provider === 'openrouter'
			? POLL_INTERVAL_OPENROUTER
			: POLL_INTERVAL_GOOGLE;

	let attempts = 0;

	while ( attempts < MAX_POLL_ATTEMPTS ) {
		if ( signal?.aborted ) {
			throw new DOMException( 'Video generation cancelled.', 'AbortError' );
		}

		await new Promise< void >( ( resolve, reject ) => {
			const timer = setTimeout( resolve, pollInterval );

			if ( signal ) {
				signal.addEventListener(
					'abort',
					() => {
						clearTimeout( timer );
						reject(
							new DOMException(
								'Video generation cancelled.',
								'AbortError'
							)
						);
					},
					{ once: true }
				);
			}
		} );

		const statusResponse = await apiFetch< StatusResponse >( {
			path: `/tryaura/v1/video/status?job_id=${ encodeURIComponent(
				jobId
			) }&provider=${ encodeURIComponent( provider ) }`,
			method: 'GET',
			signal,
		} );

		if ( statusResponse.status === 'completed' && statusResponse.videoUrl ) {
			onStatusChange( 'completed' );
			return {
				videoUrl: statusResponse.videoUrl,
				jobId,
			};
		}

		if ( statusResponse.status === 'failed' ) {
			throw new Error(
				statusResponse.error || 'Video generation failed.'
			);
		}

		onStatusChange( statusResponse.status );
		attempts++;
	}

	throw new Error( 'Video generation timed out.' );
}
