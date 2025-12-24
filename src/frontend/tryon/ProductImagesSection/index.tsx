import { __ } from '@wordpress/i18n';

function Index( {
	productImages,
	selectedProductImages,
	onToggleImage,
}: {
	productImages: string[];
	selectedProductImages: string[];
	onToggleImage: ( url: string ) => void;
} ) {
	return (
		<div className="w-1/3">
			<div className="font-[500] text-[14px] text-[#25252D] mb-[20px]">
				{ __( 'Product Images', 'try-aura' ) }
			</div>
			<div
				style={ {
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
					gap: 8,
				} }
			>
				{ productImages.map( ( url, i ) => {
					const isSelected = selectedProductImages.includes( url );
					return (
						<img
							key={ i }
							src={ url }
							alt={ `Product ${ i + 1 }` }
							onClick={ () => onToggleImage( url ) }
							style={ {
								width: '100%',
								height: 'auto',
								borderRadius: 4,
								border: isSelected
									? '2px solid #007cba'
									: '1px solid #eee',
								cursor: 'pointer',
							} }
						/>
					);
				} ) }
			</div>
		</div>
	);
}

export default Index;
