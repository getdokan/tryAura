import { useSelect } from '@wordpress/data';
import { STORE_NAME } from '../store';
import { Check } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

function OriginalImage( {
	imageUrls,
	multiple = false,
	className = '',
	selectedIndices,
	setSelectedIndices,
	showGeneratedImage = false,
	showSelection = true,
	limits = { min: 1, max: 1 },
	sectionTitle,
	isBusy,
}: {
	imageUrls: string[];
	multiple?: boolean;
	className?: string;
	selectedIndices: number[];
	setSelectedIndices: ( indices: number[] ) => void;
	showGeneratedImage?: boolean;
	showSelection?: boolean;
	limits?: { min: number; max: number };
	sectionTitle?: string;
	isBusy: boolean;
} ) {
	const { generatedUrl } = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			generatedUrl: store.getGeneratedUrl(),
		};
	}, [] );

	useEffect( () => {
		let nextIndices = [ ...selectedIndices ];
		let changed = false;

		if ( nextIndices.length > limits.max ) {
			nextIndices = nextIndices.slice( 0, limits.max );
			changed = true;
		}

		// Ensure all indices are within bounds
		const validIndices = nextIndices.filter(
			( idx ) => idx >= 0 && idx < imageUrls.length
		);
		if ( validIndices.length !== nextIndices.length ) {
			nextIndices = validIndices;
			changed = true;
		}

		// Ensure minimum selection if possible
		if (
			nextIndices.length < limits.min &&
			imageUrls.length >= limits.min
		) {
			for ( let i = 0; i < limits.min; i++ ) {
				if ( ! nextIndices.includes( i ) ) {
					nextIndices.push( i );
				}
			}
			changed = true;
		}

		if ( changed ) {
			setSelectedIndices( nextIndices );
		}
	}, [
		limits.max,
		limits.min,
		selectedIndices,
		setSelectedIndices,
		imageUrls.length,
	] );

	let displayTitle =
		sectionTitle ||
		( multiple
			? __( 'Original Images', 'try-aura' )
			: __( 'Original Image', 'try-aura' ) );

	if ( showGeneratedImage ) {
		displayTitle = __( 'Generated Image', 'try-aura' );
	}

	const toggleSelection = ( index: number ) => {
		if ( ! showSelection ) {
			return;
		}

		let nextIndices = [ ...selectedIndices ];
		if ( nextIndices.includes( index ) ) {
			if ( nextIndices.length > limits.min ) {
				nextIndices = nextIndices.filter( ( i ) => i !== index );
			}
		} else if ( nextIndices.length < limits.max ) {
			nextIndices.push( index );
		} else if ( limits.max === 1 ) {
			nextIndices = [ index ];
		}
		setSelectedIndices( nextIndices );
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
								? 'cursor-pointer hover:opacity-90 transition-opacity '
								: ''
						} ${ isBusy ? 'cursor-not-allowed opacity-50' : '' }` }
						onClick={ () => ! isBusy && toggleSelection( idx ) }
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
									selectedIndices.includes( idx )
										? 'border-2 border-primary'
										: 'border-none'
								}
							` }
						/>
						{ showSelection && selectedIndices.includes( idx ) && (
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
									selectedIndices.includes( 0 )
										? 'border-2 border-primary'
										: 'border-none'
								}
							` }
				/>
				{ showSelection && selectedIndices.includes( 0 ) && (
					<div className="absolute top-2 right-2 bg-primary text-white rounded-full p-0.5">
						<Check size={ 16 } />
					</div>
				) }
			</div>
		);
	}

	return (
		<div className={ className }>
			<div className="text-[14px] mb-[8px]">{ displayTitle }</div>
			{ content }
		</div>
	);
}

export default OriginalImage;
