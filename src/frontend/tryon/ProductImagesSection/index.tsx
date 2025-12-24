import { __ } from '@wordpress/i18n';

function Index( { productImages }: { productImages: string[] } ) {
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
				{ productImages.map( ( url, i ) => (
					<img
						key={ i }
						src={ url }
						alt={ `Product ${ i + 1 }` }
						style={ {
							width: '100%',
							height: 'auto',
							borderRadius: 4,
							border: '1px solid #eee',
						} }
					/>
				) ) }
			</div>
		</div>
	);
}

export default Index;
