import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '../../../components';
import VideoDetailsModal from './VideoDetailsModal';
import { VideoIcon, X, Edit2 } from 'lucide-react';

declare const tryAuraVideo: {
	videoData: {
		url?: string;
		platform?: 'youtube' | 'site_stored';
		thumbnailId?: number;
		thumbnailUrl?: string;
		useCustomThumbnail?: boolean;
	} | null;
	productId: number;
};

const ProductVideoGallery = () => {
	const [ videoData, setVideoData ] = useState( tryAuraVideo.videoData );
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const handleSave = ( newData ) => {
		setVideoData( newData );
		setIsModalOpen( false );
	};

	const removeVideo = () => {
		setVideoData( null );
	};

	return (
		<div className="try-aura-product-video-gallery">
			<input
				type="hidden"
				name="try_aura_video_data"
				value={ JSON.stringify( videoData ) }
			/>

			{ videoData && (
				<div className="product-video-thumbnail-container mb-4">
					<p className="font-medium mb-2">
						{ __( 'Product Video', 'try-aura' ) }
					</p>
					<div className="relative inline-block group">
						<div className="w-20 h-20 border border-gray-300 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
							{ videoData.thumbnailUrl ? (
								<img
									src={ videoData.thumbnailUrl }
									alt="Video Thumbnail"
									className="w-full h-full object-cover"
								/>
							) : (
								<VideoIcon size={ 32 } className="text-gray-400" />
							) }
							<div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
								<button
									type="button"
									onClick={ () => setIsModalOpen( true ) }
									className="p-1 bg-white rounded-full text-blue-600 hover:text-blue-800"
									title={ __( 'Edit Video', 'try-aura' ) }
								>
									<Edit2 size={ 14 } />
								</button>
								<button
									type="button"
									onClick={ removeVideo }
									className="p-1 bg-white rounded-full text-red-600 hover:text-red-800"
									title={ __( 'Remove Video', 'try-aura' ) }
								>
									<X size={ 14 } />
								</button>
							</div>
						</div>
					</div>
				</div>
			) }

			<Button
				variant="primary"
				className="w-full justify-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-3 rounded-lg flex items-center"
				onClick={ (e) => {
					e.preventDefault();
					setIsModalOpen( true );
				} }
				type="button"
			>
				<VideoIcon size={ 20 } />
				{ videoData
					? __( 'Edit video', 'try-aura' )
					: __( 'Add video', 'try-aura' ) }
			</Button>

			{ isModalOpen && (
				<VideoDetailsModal
					initialData={ videoData }
					onClose={ () => setIsModalOpen( false ) }
					onSave={ handleSave }
				/>
			) }
		</div>
	);
};

export default ProductVideoGallery;
