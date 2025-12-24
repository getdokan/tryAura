function ImagePreview( {
	userImages,
	removeUserImage,
	showRemoveBtn = false,
}: {
	userImages: [];
	removeUserImage: ( idx: number ) => void;
	showRemoveBtn?: boolean;
} ) {
	return (
		<div>
			<div className="flex flex-col gap-[8px]">
				{ userImages.map( ( img, idx ) => (
					<div
						key={ idx }
						style={ {
							position: 'relative',
							border: '1px solid #eee',
							borderRadius: 4,
							overflow: 'hidden',
						} }
					>
						<img
							src={ img }
							alt={ `Your ${ idx + 1 }` }
							style={ {
								width: '100%',
								height: 'auto',
								display: 'block',
							} }
						/>
						{ showRemoveBtn && (
							<button
								type="button"
								className="button"
								onClick={ () => removeUserImage( idx ) }
								aria-label="Remove photo"
								style={ {
									position: 'absolute',
									top: 4,
									right: 4,
									padding: '2px 6px',
									lineHeight: 1,
									fontSize: 12,
								} }
							>
								×
							</button>
						) }
					</div>
				) ) }
			</div>
		</div>
	);
}

export default ImagePreview;
