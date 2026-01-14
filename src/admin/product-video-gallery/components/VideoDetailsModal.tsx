import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Modal } from '@wordpress/components';
import { Button, Checkbox, ModernSelect } from '../../../components';
import { toast } from '@tryaura/components';
import { Youtube, Video, Upload, X } from 'lucide-react';

declare const wp: any;

const VideoDetailsModal = ( { initialData, onClose, onSave } ) => {
	const [ platform, setPlatform ] = useState(
		initialData?.platform || 'youtube'
	);
	const [ url, setUrl ] = useState( initialData?.url || '' );
	const [ useCustomThumbnail, setUseCustomThumbnail ] = useState(
		initialData?.useCustomThumbnail || false
	);
	const [ thumbnailId, setThumbnailId ] = useState(
		initialData?.thumbnailId || null
	);
	const [ thumbnailUrl, setThumbnailUrl ] = useState(
		initialData?.thumbnailUrl || ''
	);

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
		if ( ! thumbnailUrl && useCustomThumbnail ) {
			toast.error( __( 'Please select a video thumbnail.', 'try-aura' ) );
			return;
		}

		onSave( {
			platform,
			url,
			useCustomThumbnail,
			thumbnailId,
			thumbnailUrl,
		} );
	};

	return (
		<Modal
			onRequestClose={ () => {
				return '';
			} }
			className="tryaura tryaura-add-video-modal-url"
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
							onChange={ ( val: any ) => setPlatform( val ) }
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
						<Checkbox
							id="useCustomThumbnail"
							checked={ useCustomThumbnail }
							onChange={ ( e ) =>
								setUseCustomThumbnail(
									( e.target as HTMLInputElement ).checked
								)
							}
						>
							<label
								htmlFor="useCustomThumbnail"
								className="text-sm text-gray-700 cursor-pointer"
							>
								{ __(
									'Use Custom video Thumbnail?',
									'try-aura'
								) }
							</label>
						</Checkbox>

						{ useCustomThumbnail && (
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

								{ thumbnailUrl && (
									<div className="rounded-lg border border-gray-200 w-50 h-50 overflow-hidden mt-8">
										<img
											src={ thumbnailUrl }
											alt="Thumbnail preview"
											className="object-fill h-full w-full"
										/>
									</div>
								) }
							</div>
						) }
					</div>
				</div>

				<div className="flex justify-end gap-3 p-[20px_24px]">
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
		</Modal>
	);
};

export default VideoDetailsModal;
