import { __ } from '@wordpress/i18n';
import { twMerge } from 'tailwind-merge';
import { CircleCheck } from 'lucide-react';

function Index( {
	productImages,
	selectedProductImages,
	onToggleImage,
	isBusy,
}: {
	productImages: string[];
	selectedProductImages: string[];
	onToggleImage: ( url: string ) => void;
	isBusy: boolean;
} ) {
	return (
		<div className="w-full sm:w-1/3">
			<div className="font-[500] text-[14px] text-[#25252D] mb-[20px]">
				{ __( 'Product Images', 'try-aura' ) }
			</div>
			<div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2">
				{ productImages.map( ( url, i ) => {
					const isSelected = selectedProductImages.includes( url );
					return (
						<div key={ i } className="relative">
							<img
								src={ url }
								alt={ `Product ${ i + 1 }` }
								onClick={ () =>
									! isBusy && onToggleImage( url )
								}
								className={ twMerge(
									'w-full aspect-square object-contain rounded-[4px] cursor-pointer',
									isSelected
										? 'border-2 border-black p-[2px]'
										: 'border border-solid border-[#eee]',
									isBusy && 'cursor-not-allowed'
								) }
							/>
							{ isSelected && (
								<CircleCheck
									size={ 16 }
									className={ twMerge(
										'absolute top-[4px] right-[4px] bg-white rounded-full',
										isSelected && 'text-black'
									) }
								/>
							) }
						</div>
					);
				} ) }
			</div>
		</div>
	);
}

export default Index;
