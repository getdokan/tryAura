import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '../../../components';
import VideoDetailsModal from './VideoDetailsModal';
import { VideoIcon, X, Edit2 } from 'lucide-react';

interface VideoItem {
	url?: string;
	platform?: 'youtube' | 'site_stored';
	thumbnailId?: number;
	thumbnailUrl?: string;
	useCustomThumbnail?: boolean;
}

declare const tryAuraVideo: {
	videoData: VideoItem[] | VideoItem | null;
	productId: number;
};

const ProductVideoGallery = () => {
	const [ videos, setVideos ] = useState< VideoItem[] >( () => {
		const initialData = tryAuraVideo.videoData;
		if ( ! initialData ) {
			return [];
		}
		return Array.isArray( initialData ) ? initialData : [ initialData ];
	} );
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ editingIndex, setEditingIndex ] = useState< number | null >( null );

	const handleSave = ( newData ) => {
		if ( editingIndex !== null ) {
			const newVideos = [ ...videos ];
			newVideos[ editingIndex ] = newData;
			setVideos( newVideos );
		} else {
			setVideos( [ ...videos, newData ] );
		}
		setIsModalOpen( false );
		setEditingIndex( null );
	};

	const removeVideo = ( index ) => {
		const newVideos = [ ...videos ];
		newVideos.splice( index, 1 );
		setVideos( newVideos );
	};

	const openModal = ( index = null ) => {
		setEditingIndex( index );
		setIsModalOpen( true );
	};

	return (
		<div className="try-aura-product-video-gallery">
			<input
				type="hidden"
				name="try_aura_video_data"
				value={ JSON.stringify( videos ) }
			/>

			{ videos.length > 0 && (
				<div className="product-video-thumbnail-container mb-4">
					<p className="font-medium mb-2">
						{ __( 'Product Videos', 'try-aura' ) }
					</p>
					<div className="flex flex-wrap gap-2">
						{ videos.map( ( video, index ) => (
							<div
								key={ index }
								className="relative inline-block group"
							>
								<div className="w-20 h-20 border border-gray-300 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
									{ video.thumbnailUrl ? (
										<img
											src={ video.thumbnailUrl }
											alt="Video Thumbnail"
											className="w-full h-full object-cover"
										/>
									) : (
										<VideoIcon
											size={ 32 }
											className="text-gray-400"
										/>
									) }
									<div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
										<button
											type="button"
											onClick={ () => openModal( index ) }
											className="p-1 bg-white rounded-full text-blue-600 hover:text-blue-800"
											title={ __(
												'Edit Video',
												'try-aura'
											) }
										>
											<Edit2 size={ 14 } />
										</button>
										<button
											type="button"
											onClick={ () =>
												removeVideo( index )
											}
											className="p-1 bg-white rounded-full text-red-600 hover:text-red-800"
											title={ __(
												'Remove Video',
												'try-aura'
											) }
										>
											<X size={ 14 } />
										</button>
									</div>
								</div>
							</div>
						) ) }
					</div>
				</div>
			) }

			<Button
				variant="primary"
				className="w-full justify-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-3 rounded-lg flex items-center"
				onClick={ ( e ) => {
					e.preventDefault();
					openModal( null );
				} }
				type="button"
			>
				<VideoIcon size={ 20 } />
				{ __( 'Add video', 'try-aura' ) }
			</Button>

			{ isModalOpen && (
				<VideoDetailsModal
					initialData={
						editingIndex !== null ? videos[ editingIndex ] : null
					}
					onClose={ () => {
						setIsModalOpen( false );
						setEditingIndex( null );
					} }
					onSave={ handleSave }
				/>
			) }
		</div>
	);
};

export default ProductVideoGallery;
