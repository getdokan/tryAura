import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../store';
import { Check } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

function OriginalImage( {
	imageUrls,
	multiple = false,
}: {
	imageUrls: string[];
	multiple?: boolean;
} ) {
	const {
		activeTab,
		videoSource,
		selectedImageIndices,
		selectedVideoIndices,
		generatedUrl,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			activeTab: store.getActiveTab(),
			videoSource: store.getVideoSource(),
			selectedImageIndices: store.getSelectedImageIndices(),
			selectedVideoIndices: store.getSelectedVideoIndices(),
			generatedUrl: store.getGeneratedUrl(),
		};
	}, [] );

	const { setSelectedImageIndices, setSelectedVideoIndices } =
		useDispatch( STORE_NAME );

	const selectedOriginalIndices =
		activeTab === 'image' ? selectedImageIndices : selectedVideoIndices;

	const setSelectedOriginalIndices =
		activeTab === 'image'
			? setSelectedImageIndices
			: setSelectedVideoIndices;

	const limits =
		activeTab === 'image' ? { min: 1, max: 3 } : { min: 1, max: 1 };

	useEffect( () => {
		if ( selectedOriginalIndices.length > limits.max ) {
			setSelectedOriginalIndices(
				selectedOriginalIndices.slice( 0, limits.max )
			);
		}
	}, [
		activeTab,
		limits.max,
		selectedOriginalIndices,
		setSelectedOriginalIndices,
	] );

	const showSelection =
		activeTab === 'image' ||
		( activeTab === 'video' && videoSource === 'original-image' );

	const showGeneratedImage =
		activeTab === 'video' && videoSource === 'generated-image';

	let sectionTitle = multiple
		? __( 'Original Images', 'try-aura' )
		: __( 'Original Image', 'try-aura' );

	if ( showGeneratedImage ) {
		sectionTitle = __( 'Generated Image', 'try-aura' );
	}

	const toggleSelection = ( index: number ) => {
		if ( ! showSelection ) {
			return;
		}

		let nextIndices = [ ...selectedOriginalIndices ];
		if ( nextIndices.includes( index ) ) {
			if ( nextIndices.length > limits.min ) {
				nextIndices = nextIndices.filter( ( i ) => i !== index );
			}
		} else if ( nextIndices.length < limits.max ) {
			nextIndices.push( index );
		} else if ( limits.max === 1 ) {
			nextIndices = [ index ];
		}
		setSelectedOriginalIndices( nextIndices );
	};

	let content;
	if ( showGeneratedImage ) {
		content = (
			<div className="relative rounded-[8px] overflow-hidden">
				{ generatedUrl ? (
					<img
						src={ generatedUrl }
						alt="Generated"
						className="w-full h-auto block border-none"
					/>
				) : (
					<div className="w-full h-[200px] bg-gray-100 flex items-center justify-center text-gray-400">
						{ __( 'No generated image available', 'try-aura' ) }
					</div>
				) }
			</div>
		);
	} else if ( multiple ) {
		content = (
			<div className="flex flex-col gap-[8px]">
				{ imageUrls.map( ( url, idx ) => (
					<div
						key={ idx }
						className={ `relative rounded-[8px] overflow-hidden ${
							showSelection
								? 'cursor-pointer hover:opacity-90 transition-opacity'
								: ''
						}` }
						onClick={ () => toggleSelection( idx ) }
						role={ showSelection ? 'button' : undefined }
						tabIndex={ showSelection ? 0 : -1 }
						onKeyDown={ ( e ) => {
							if (
								showSelection &&
								( e.key === 'Enter' || e.key === ' ' )
							) {
								e.preventDefault();
								toggleSelection( idx );
							}
						} }
					>
						<img
							src={ url }
							alt={ `Original ${ idx + 1 }` }
							className={ `w-full h-auto block rounded-[8px]
								${
									showSelection &&
									selectedOriginalIndices.includes( idx )
										? 'border-2 border-primary'
										: 'border-none'
								}
							` }
						/>
						{ showSelection &&
							selectedOriginalIndices.includes( idx ) && (
								<div className="absolute top-2 right-2 bg-primary text-white rounded-full p-0.5">
									<Check size={ 16 } />
								</div>
							) }
					</div>
				) ) }
			</div>
		);
	} else {
		content = (
			<div className="relative rounded-[8px] overflow-hidden">
				<img
					src={ imageUrls[ 0 ] }
					alt={ 'Original' }
					className={ `w-full h-auto block rounded-[8px]
								${
									showSelection &&
									selectedOriginalIndices.includes( 0 )
										? 'border-2 border-primary'
										: 'border-none'
								}
							` }
				/>
				{ showSelection && selectedOriginalIndices.includes( 0 ) && (
					<div className="absolute top-2 right-2 bg-primary text-white rounded-full p-0.5">
						<Check size={ 16 } />
					</div>
				) }
			</div>
		);
	}

	return (
		<div className="w-[500px] max-h-[533px] overflow-auto">
			<div className="text-[14px] mb-[8px]">{ sectionTitle }</div>
			{ content }
		</div>
	);
}

export default OriginalImage;
