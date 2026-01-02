import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../store';
import { Check } from 'lucide-react';

const MIN_SELECTED_IMAGES = 1;
const MAX_SELECTED_IMAGES = 1;

function OriginalImage( {
	imageUrls,
	multiple = false,
}: {
	imageUrls: string[];
	multiple?: boolean;
} ) {
	const { activeTab, videoSource, selectedOriginalIndices } = useSelect(
		( select ) => {
			const store = select( STORE_NAME );
			return {
				activeTab: store.getActiveTab(),
				videoSource: store.getVideoSource(),
				selectedOriginalIndices: store.getSelectedOriginalIndices(),
			};
		},
		[]
	);

	const { setSelectedOriginalIndices } = useDispatch( STORE_NAME );

	const showSelection =
		activeTab === 'video' && videoSource === 'original-image';

	const toggleSelection = ( index: number ) => {
		if ( ! showSelection ) {
			return;
		}

		let nextIndices = [ ...selectedOriginalIndices ];
		if ( nextIndices.includes( index ) ) {
			if ( nextIndices.length > MIN_SELECTED_IMAGES ) {
				nextIndices = nextIndices.filter( ( i ) => i !== index );
			}
		} else if ( nextIndices.length < MAX_SELECTED_IMAGES ) {
			nextIndices.push( index );
		} else if ( MAX_SELECTED_IMAGES === 1 ) {
			nextIndices = [ index ];
		}
		setSelectedOriginalIndices( nextIndices );
	};

	return (
		<div className="w-[500px] max-h-[533px] overflow-auto">
			<div className="text-[14px] mb-[8px]">
				{ multiple ? 'Original Images' : 'Original Image' }
				{ showSelection && multiple && (
					<span className="text-[12px] text-gray-500 ml-2">
						(Select { MIN_SELECTED_IMAGES }-{ MAX_SELECTED_IMAGES })
					</span>
				) }
			</div>
			{ multiple ? (
				<div className="flex flex-col gap-[8px]">
					{ imageUrls.map( ( url, idx ) => (
						<div
							key={ idx }
							className={ `relative rounded-[8px] overflow-hidden ${
								showSelection
									? 'cursor-pointer hover:opacity-90 transition-opacity'
									: ''
							} ${
								showSelection &&
								selectedOriginalIndices.includes( idx )
									? 'ring-2 ring-[#2271b1]'
									: ''
							}` }
							onClick={ () => toggleSelection( idx ) }
						>
							<img
								src={ url }
								alt={ `Original ${ idx + 1 }` }
								className="w-full h-auto block border-none"
							/>
							{ showSelection &&
								selectedOriginalIndices.includes( idx ) && (
									<div className="absolute top-2 right-2 bg-[#2271b1] text-white rounded-full p-0.5">
										<Check size={ 16 } />
									</div>
								) }
						</div>
					) ) }
				</div>
			) : (
				<div
					className={ `relative rounded-[8px] overflow-hidden ${
						showSelection && selectedOriginalIndices.includes( 0 )
							? 'ring-2 ring-[#2271b1]'
							: ''
					}` }
				>
					<img
						src={ imageUrls[ 0 ] }
						alt="Original"
						className="w-full h-auto block border-none"
					/>
					{ showSelection &&
						selectedOriginalIndices.includes( 0 ) && (
							<div className="absolute top-2 right-2 bg-[#2271b1] text-white rounded-full p-0.5">
								<Check size={ 16 } />
							</div>
						) }
				</div>
			) }
		</div>
	);
}

export default OriginalImage;
