import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Modal } from '@wordpress/components';
import { Button, Checkbox, ModernSelect } from '../../../components';
import { toast } from '@tryaura/components';
import { Youtube, Video, Upload, X } from 'lucide-react';

declare const wp: any;

const VideoDetailsModal = ( {
	initialData,
	onClose,
	onSave,
	originalImageUrl,
} ) => {
	const [ platform, setPlatform ] = useState(
		initialData?.platform || 'youtube'
	);
	const [ url, setUrl ] = useState( initialData?.url || '' );
	const [ useCustomThumbnail, setUseCustomThumbnail ] = useState(
		initialData?.useCustomThumbnail !== undefined
			? initialData.useCustomThumbnail
			: true
	);
	const [ thumbnailId, setThumbnailId ] = useState(
		initialData?.thumbnailId || null
	);
	const [ thumbnailUrl, setThumbnailUrl ] = useState(
		initialData?.thumbnailUrl || ''
	);
	const [ generatedThumbnail, setGeneratedThumbnail ] = useState( '' );

	useEffect( () => {
		if ( ! useCustomThumbnail ) {
			generateFromVideo();
		} else {
			setGeneratedThumbnail( '' );
		}
	}, [ url, platform, useCustomThumbnail ] );

	const getYoutubeId = ( videoUrl: string ) => {
		const pattern =
			/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
		const match = videoUrl.match( pattern );
		return match ? match[ 1 ] : null;
	};

	const generateFromVideo = async () => {
		if ( ! url ) {
			return;
		}

		if ( platform === 'youtube' ) {
			const videoId = getYoutubeId( url );
			if ( videoId ) {
				setGeneratedThumbnail(
					`https://img.youtube.com/vi/${ videoId }/hqdefault.jpg`
				);
			}
		} else if ( platform === 'site_stored' ) {
			try {
				const video = document.createElement( 'video' );
				video.src = url;
				video.crossOrigin = 'anonymous';
				video.currentTime = 1;
				video.onloadeddata = () => {
					const canvas = document.createElement( 'canvas' );
					canvas.width = video.videoWidth;
					canvas.height = video.videoHeight;
					const ctx = canvas.getContext( '2d' );
					if ( ctx ) {
						ctx.drawImage(
							video,
							0,
							0,
							canvas.width,
							canvas.height
						);
						setGeneratedThumbnail( canvas.toDataURL( 'image/jpeg' ) );
					}
				};
			} catch ( e ) {
				// eslint-disable-next-line no-console
				console.error( 'Error generating thumbnail', e );
			}
		}
	};

	const openMediaModal = () => {
		const frame = wp.media( {
			title: __( 'Select Video', 'try-aura' ),
			multiple: false,
			library: { type: 'video' },
		} );

		frame.on( 'select', () => {
			const attachment = frame
				.state()
				.get( 'selection' )
				.first()
				.toJSON();
			setUrl( attachment.url );
		} );

		frame.open();
	};

	const openThumbnailModal = () => {
		const frame = wp.media( {
			title: __( 'Select Video Thumbnail', 'try-aura' ),
			multiple: false,
			library: { type: 'image' },
			tryAuraContext: 'video_thumbnail',
		} );

		frame.on( 'select', () => {
			const attachment = frame
				.state()
				.get( 'selection' )
				.first()
				.toJSON();
			setThumbnailId( attachment.id );
			setThumbnailUrl( attachment.url );
		} );

		frame.open();
	};

	const handleSave = () => {
		if ( ! platform ) {
			toast.error( __( 'Please select a video platform.', 'try-aura' ) );
			return;
		}
		if ( ! url ) {
			toast.error( __( 'Please enter a valid video URL.', 'try-aura' ) );
			return;
		}
		if (
			! thumbnailUrl &&
			! originalImageUrl &&
			useCustomThumbnail
		) {
			toast.error( __( 'Please select a video thumbnail.', 'try-aura' ) );
			return;
		}

		onSave( {
			platform,
			url,
			useCustomThumbnail,
			thumbnailId,
			thumbnailUrl,
			generatedThumbnail,
		} );
	};

	return (
		<Modal
			onRequestClose={ () => {
				return '';
			} }
			className="tryaura tryaura-add-video-modal-url rounded-[3px] [&_.components-modal__content]:p-0 [&_.components-modal__content]:m-0"
			__experimentalHideHeader
			size="medium"
			style={ { maxHeight: '90vh', overflowY: 'auto' } }
			shouldCloseOnClickOutside={ false }
		>
			<div>
				<div className="border-b border-[rgba(233,233,233,1)] p-[16px_24px] flex justify-between items-center gap-1">
					<h2 className="m-0">
						{ initialData
							? __( 'Edit Video', 'try-aura' )
							: __( 'Add Video From URL', 'try-aura' ) }
					</h2>

					<button
						onClick={ ( e ) => {
							e.preventDefault();
							onClose();
						} }
						className="cursor-pointer text-[rgba(130,130,130,1)]"
					>
						<X size={ 20 } />
					</button>
				</div>

				<div className="p-[27px_24px] border-b border-[rgba(233,233,233,1)] flex flex-col gap-3">
					<div>
						<span className="block text-sm font-medium text-gray-700 mb-2">
							{ __( 'Video Platforms', 'try-aura' ) }
						</span>
						<ModernSelect
							value={ platform }
							onChange={ ( val: any ) => {
								setUrl( '' );
								setPlatform( val );
							} }
							options={ [
								{
									label: __( 'Youtube Video', 'try-aura' ),
									value: 'youtube',
									icon: <Youtube size={ 18 } />,
								},
								{
									label: __(
										'Site stored Video',
										'try-aura'
									),
									value: 'site_stored',
									icon: <Video size={ 18 } />,
								},
							] }
							variant="list"
						/>
					</div>

					<div>
						<label
							htmlFor="try-aura-video-url"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							{ __( 'Video URL', 'try-aura' ) }
						</label>
						<div className="flex gap-2">
							<input
								id="try-aura-video-url"
								type="text"
								className="flex-1 border rounded-md p-[10px_16px] leading-0 border-[#E9E9E9]"
								placeholder={
									platform === 'youtube'
										? 'e.g. https://www.youtube.com/watch?v=...'
										: __( 'Video URL', 'try-aura' )
								}
								value={ url }
								onChange={ ( e ) => setUrl( e.target.value ) }
								readOnly={ platform === 'site_stored' }
								disabled={ platform === 'site_stored' }
							/>
							{ platform === 'site_stored' && (
								<Button
									variant="outline-primary"
									onClick={ openMediaModal }
								>
									<Upload size={ 18 } />
								</Button>
							) }
						</div>
					</div>

					<div className="flex flex-col gap-[32px]">
						<div>
							<span className="block text-sm font-medium text-gray-700 mb-2">
								{ __( 'Thumbnail Source', 'try-aura' ) }
							</span>
							<ModernSelect
								value={
									useCustomThumbnail ? 'custom' : 'generate'
								}
								onChange={ ( val: any ) => {
									setUseCustomThumbnail( val === 'custom' );
								} }
								options={ [
									{
										label: __(
											'Select Video Thumbnail (WP Media)',
											'try-aura'
										),
										value: 'custom',
									},
									{
										label: __(
											'Generate from video',
											'try-aura'
										),
										value: 'generate',
									},
								] }
								variant="list"
							/>
						</div>

						{ useCustomThumbnail ? (
							<div className="">
								<Button
									variant="outline-primary"
									className="w-full justify-center"
									onClick={ ( e ) => {
										e.preventDefault();
										openThumbnailModal();
									} }
								>
									{ __(
										'Select Video Thumbnail',
										'try-aura'
									) }
								</Button>

								{ ( thumbnailUrl || originalImageUrl ) && (
									<div className="rounded-lg border border-gray-200 w-50 h-50 overflow-hidden mt-8">
										<img
											src={
												thumbnailUrl || originalImageUrl
											}
											alt="Thumbnail preview"
											className="object-fill h-full w-full"
										/>
									</div>
								) }
							</div>
						) : (
							generatedThumbnail && (
								<div className="">
									<span className="block text-xs font-medium text-gray-500 mb-2">
										{ __(
											'Generated Preview:',
											'try-aura'
										) }
									</span>
									<div className="rounded-lg border border-gray-200 w-50 h-50 overflow-hidden">
										<img
											src={ generatedThumbnail }
											alt="Generated thumbnail preview"
											className="object-fill h-full w-full"
										/>
									</div>
								</div>
							)
						) }
					</div>
				</div>

				<div className="flex justify-between gap-3 p-[20px_24px]">
					<div>
						{ initialData && (
							<Button
								variant="outline"
								className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
								onClick={ () => onSave( {} ) }
							>
								{ __( 'Remove Video', 'try-aura' ) }
							</Button>
						) }
					</div>
					<div className="flex gap-3">
						<Button variant="outline" onClick={ onClose }>
							{ __( 'Cancel', 'try-aura' ) }
						</Button>
						<Button onClick={ handleSave }>
							{ initialData
								? __( 'Update Video', 'try-aura' )
								: __( 'Add Video', 'try-aura' ) }
						</Button>
					</div>
				</div>
			</div>
		</Modal>
	);
};

export default VideoDetailsModal;
