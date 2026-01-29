import VideoDetailsModal from './VideoDetailsModal';

const ProductVideoGallery = ( {
	editingVideo = null,
	onSave = null,
	onClose = null,
	isExternalOpen = false,
	originalImageUrl = null,
}: any ) => {
	if ( ! isExternalOpen ) {
		return null;
	}

	return (
		<div className="tryaura-product-video-gallery mt-3.75">
			<VideoDetailsModal
				initialData={ editingVideo }
				onClose={ onClose }
				onSave={ onSave }
				originalImageUrl={ originalImageUrl }
			/>
		</div>
	);
};

export default ProductVideoGallery;
