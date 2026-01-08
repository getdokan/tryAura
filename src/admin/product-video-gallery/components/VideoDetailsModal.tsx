import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, ModernSelect } from '../../../components';
import { X, Youtube, Video, Upload, Wand2 } from 'lucide-react';

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
			const attachment = frame.state().get( 'selection' ).first().toJSON();
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
			const attachment = frame.state().get( 'selection' ).first().toJSON();
			setThumbnailId( attachment.id );
			setThumbnailUrl( attachment.url );
		} );

		frame.open();
	};

	const handleSave = () => {
		onSave( {
			platform,
			url,
			useCustomThumbnail,
			thumbnailId,
			thumbnailUrl,
		} );
	};

	return (
		<div className="ai-enhancer-modal fixed inset-[0px] bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-[160000]">
			<div className="bg-white rounded-lg max-w-[500px] w-full shadow-xl">
				<div className="flex items-center justify-between p-4 border-b">
					<h2 className="text-lg font-semibold m-0">
						{ __( 'Add Video From URL', 'try-aura' ) }
					</h2>
					<button
						onClick={ onClose }
						className="text-gray-500 hover:text-gray-700"
					>
						<X size={ 20 } />
					</button>
				</div>

				<div className="p-6 space-y-6">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							{ __( 'Video Platforms', 'try-aura' ) }
						</label>
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
									label: __( 'Site stored Video', 'try-aura' ),
									value: 'site_stored',
									icon: <Video size={ 18 } />,
								},
							] }
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							{ __( 'Video URL', 'try-aura' ) }
						</label>
						<div className="flex gap-2">
							<input
								type="text"
								className="flex-1 border border-gray-300 rounded-md px-3 py-2"
								placeholder={
									platform === 'youtube'
										? 'e.g. https://www.youtube.com/watch?v=...'
										: __( 'Video URL', 'try-aura' )
								}
								value={ url }
								onChange={ ( e ) => setUrl( e.target.value ) }
							/>
							{ platform === 'site_stored' && (
								<Button
									variant="outline"
									onClick={ openMediaModal }
								>
									<Upload size={ 18 } />
								</Button>
							) }
						</div>
					</div>

					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="useCustomThumbnail"
							checked={ useCustomThumbnail }
							onChange={ ( e ) =>
								setUseCustomThumbnail( e.target.checked )
							}
							className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
						/>
						<label
							htmlFor="useCustomThumbnail"
							className="text-sm text-gray-700"
						>
							{ __( 'Use Custom video Thumbnail?', 'try-aura' ) }
						</label>
					</div>

					{ useCustomThumbnail && (
						<div className="space-y-4">
							<Button
								variant="outline"
								className="w-full justify-center border-purple-200 text-purple-600 hover:bg-purple-50"
								onClick={ openThumbnailModal }
							>
								{ __( 'Select Video Thumbnail', 'try-aura' ) }
							</Button>

							{ thumbnailUrl && (
								<div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-200">
									<img
										src={ thumbnailUrl }
										alt="Thumbnail preview"
										className="w-full h-full object-cover"
									/>
								</div>
							) }
						</div>
					) }
				</div>

				<div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
					<Button variant="outline" onClick={ onClose }>
						{ __( 'Cancel', 'try-aura' ) }
					</Button>
					<Button
						className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
						onClick={ handleSave }
					>
						{ initialData ? __( 'Update Video', 'try-aura' ) : __( 'Add Video', 'try-aura' ) }
					</Button>
				</div>
			</div>
		</div>
	);
};

export default VideoDetailsModal;
