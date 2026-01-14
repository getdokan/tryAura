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
								<div
									className="w-20 h-20 border border-gray-300 rounded overflow-hidden bg-gray-100 flex items-center justify-center"
								>
									{ video.thumbnailUrl && (
										<img
											src={ video.thumbnailUrl }
											alt="Video Thumbnail"
											className="w-full h-full object-cover"
										/>
									) }

									<VideoIcon
										size={ 32 }
										className="text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer bg-indigo-200 rounded-full p-2"
										onClick={ () => openModal( index ) }
									/>

									<button
										type="button"
										onClick={ () => removeVideo( index ) }
										className="p-1 bg-red-50 rounded-full text-red-600 hover:text-red-800 absolute -top-2 -right-1 group-hover:bg-red-100 transition-colors z-20 cursor-pointer"
										title={ __(
											'Remove Video',
											'try-aura'
										) }
									>
										<X size={ 10 } />
									</button>
								</div>
							</div>
						) ) }
					</div>
				</div>
			) }

			<Button
				variant="primary"
				className="w-full"
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
						console.log('closing....');
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
