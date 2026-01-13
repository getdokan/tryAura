import { useSelect } from '@wordpress/data';
import { useState, useEffect, useRef } from '@wordpress/element';
import { STORE_NAME } from '../store';
import { __ } from '@wordpress/i18n';
import Star from '../../../images/star.gif';
import Congrats from '../../../images/congrats.gif';
import { applyFilters } from '@wordpress/hooks';
import { Slot } from '@wordpress/components';

function Output( { className = '' } ) {
	const [ showCongrats, setShowCongrats ] = useState( false );
	const {
		generatedUrl,
		activeTab,
		message,
		error,
		isBusy,
		status,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			generatedUrl: store.getGeneratedUrl(),
			activeTab: store.getActiveTab(),
			message: store.getMessage(),
			error: store.getError(),
			isBusy: store.isBusy(),
			status: store.getStatus(),
		};
	}, [] );

	const prevIsBusy = useRef( isBusy );

	useEffect( () => {
		let timer: any;
		if ( prevIsBusy.current && ! isBusy && status === 'done' ) {
			setShowCongrats( true );
			timer = setTimeout( () => setShowCongrats( false ), 2200 );
		}
		prevIsBusy.current = isBusy;
		return () => {
			if ( timer ) {
				clearTimeout( timer );
			}
		};
	}, [ isBusy, status ] );

	useEffect( () => {
		if ( isBusy ) {
			setShowCongrats( false );
		}
	}, [ isBusy ] );

	return (
		<div className={ className }>
			<div className="w-[500] text-[14px] mb-[8px]">
				{ __( 'Generated Output', 'try-aura' ) }
			</div>
			{ /* eslint-disable-next-line no-nested-ternary */ }
			{ isBusy ? (
				<div className="bg-[#F3F4F6] text-[#67686B] text-[14px] font-[400] rounded-[8px] min-h-[316px] flex flex-col gap-1 items-center justify-center">
					<img
						src={ Star }
						className="w-8 h-8"
						alt={ __( 'Loading…', 'try-aura' ) }
					/>
					<span>{ message }</span>
				</div>
			) : activeTab === 'image' ? (
				generatedUrl ? (
					<div className="flex flex-col gap-[20px]">
						<div className="relative w-full h-auto">
							<img
								src={ generatedUrl }
								alt="Generated"
								className="w-full h-auto block rounded-[8px]"
							/>
							{ showCongrats && (
								<div className="absolute inset-0 flex flex-col items-center justify-end pointer-events-none z-10">
									<img
										src={ Congrats }
										className="w-full h-auto"
										alt={ __(
											'Congratulations',
											'try-aura'
										) }
									/>
								</div>
							) }
						</div>
						{ applyFilters(
							'tryaura.enhancer.after_image_output',
							null
						) }
					</div>
				) : (
					<div className="bg-[#F3F4F6] text-[#67686B] text-[14px] font-[400] rounded-[8px] min-h-[316px] flex flex-col gap-1 items-center justify-center">
						<span>{ message }</span>
					</div>
				)
			) : (
				<>
					<Slot name="TryAuraEnhancerOutput" />
				</>
			) }
			{ error ? (
				<div style={ { color: 'red', marginTop: 8 } }>{ error }</div>
			) : null }
		</div>
	);
}

export default Output;
