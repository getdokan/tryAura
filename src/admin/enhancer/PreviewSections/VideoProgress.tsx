import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { Button } from '../../../components';
import apiFetch from '@wordpress/api-fetch';

interface VideoProgressProps {
	status: string;
	videoUrl: string | null;
	error: string | null;
	onCancel: () => void;
	onRetry: () => void;
}

const STATUS_MESSAGES: Record<string, string> = {
	submitting: __('Submitting video generation request…', 'tryaura'),
	pending: __('Video generation queued…', 'tryaura'),
	in_progress: __(
		'Generating video — this may take a few minutes…',
		'tryaura'
	),
	completed: __('Video generation complete!', 'tryaura'),
	failed: __('Video generation failed.', 'tryaura'),
};

function VideoProgress({
	status,
	videoUrl,
	error,
	onCancel,
	onRetry,
}: VideoProgressProps) {
	const [saving, setSaving] = useState(false);
	const [savedUrl, setSavedUrl] = useState<string | null>(null);

	const isGenerating =
		status === 'submitting' ||
		status === 'pending' ||
		status === 'in_progress';

	const aura = (window as any).tryAura;

	const handleSaveToLibrary = async () => {
		if (!videoUrl) {
			return;
		}

		setSaving(true);
		try {
			const response = await apiFetch<{
				attachment_id: number;
				url: string;
			}>({
				path: '/tryaura/v1/video/save',
				method: 'POST',
				data: {
					nonce: aura?.nonce || '',
					video_url: videoUrl,
					object_id: aura?.postId?.toString() || '',
					object_type: aura?.postType || '',
				},
			});

			setSavedUrl(response.url);
		} catch (err: any) {
			// Let user know the save failed but don't block the UI.
			console.error('Failed to save video:', err);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="flex flex-col gap-4 items-center py-4">
			{/* Status message */}
			<p className="text-[14px] m-0 text-center">
				{error && status === 'failed'
					? error
					: STATUS_MESSAGES[status] || ''}
			</p>

			{/* Spinner for in-progress states */}
			{isGenerating && (
				<div className="w-8 h-8 border-3 border-gray-200 border-t-primary rounded-full animate-spin" />
			)}

			{/* Video preview on completion */}
			{status === 'completed' && videoUrl && !savedUrl && (
				<>
					<video
						src={videoUrl}
						controls
						className="w-full max-w-[400px] rounded-lg"
						autoPlay
						muted
						loop
					/>
					<Button
						onClick={handleSaveToLibrary}
						loading={saving}
						disabled={saving}
					>
						{__('Add to Media Library', 'tryaura')}
					</Button>
				</>
			)}

			{/* Saved confirmation */}
			{savedUrl && (
				<div className="flex flex-col items-center gap-2">
					<video
						src={savedUrl}
						controls
						className="w-full max-w-[400px] rounded-lg"
						autoPlay
						muted
						loop
					/>
					<p className="text-green-600 text-[14px] m-0">
						{__('Video saved to Media Library!', 'tryaura')}
					</p>
				</div>
			)}

			{/* Action buttons */}
			<div className="flex gap-2">
				{isGenerating && (
					<Button variant="outline" onClick={onCancel}>
						{__('Cancel', 'tryaura')}
					</Button>
				)}

				{status === 'failed' && (
					<Button onClick={onRetry}>
						{__('Try Again', 'tryaura')}
					</Button>
				)}

				{(status === 'completed' || savedUrl) && (
					<Button variant="outline" onClick={onRetry}>
						{__('Generate Another', 'tryaura')}
					</Button>
				)}
			</div>
		</div>
	);
}

export default VideoProgress;
