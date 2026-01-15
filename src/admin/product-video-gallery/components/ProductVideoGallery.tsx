import VideoDetailsModal from './VideoDetailsModal';

const ProductVideoGallery = ( {
	editingVideo = null,
	onSave = null,
	onClose = null,
	isExternalOpen = false,
}: any ) => {
	if ( ! isExternalOpen ) {
		return null;
	}

	return (
		<div className="try-aura-product-video-gallery mt-3.75">
			<VideoDetailsModal
				initialData={ editingVideo }
				onClose={ onClose }
				onSave={ onSave }
			/>
		</div>
	);
};

export default ProductVideoGallery;
