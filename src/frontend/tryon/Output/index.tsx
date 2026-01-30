import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
import Star from '../../../images/star.gif';
import Congrats from '../../../images/congrats.gif';
import { Button } from '../../../components';

function Index( { generatedUrl, message, isBusy, status } ) {
	const [ showCongrats, setShowCongrats ] = useState( false );
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
		<div className="w-full sm:w-1/3">
			<div className="font-[500] text-[14px] text-[#25252D] mb-[20px]">
				{ __( 'Generated', 'try-aura' ) }
			</div>
			{ generatedUrl && ! isBusy ? (
				<div className="relative w-full h-auto">
					<img
						src={ generatedUrl }
						alt="Generated try-on"
						className="max-w-full h-auto block rounded-[8px]"
					/>
					{ showCongrats && (
						<div className="absolute inset-0 flex flex-col items-center justify-end pointer-events-none z-10">
							<img
								src={ Congrats }
								className="w-full h-auto"
								alt={ __( 'Congratulations', 'try-aura' ) }
							/>
						</div>
					) }
				</div>
			) : (
				<div className="bg-[#F3F4F6] rounded-[8px] min-h-[300px] flex flex-col gap-1 items-center text-center justify-center p-[12px] font-[500] text-[14px] text-[#25252D]">
					{ isBusy && (
						<img
							src={ Star }
							className="w-8 h-8"
							alt={ __( 'Loading', 'try-aura' ) }
						/>
					) }
					<span>{ message }</span>
				</div>
			) }
			{ generatedUrl && ! isBusy ? (
				<div className="flex gap-2 mt-2 justify-center">
					<Button
						type="link"
						className="bg-black hover:bg-black/90"
						disabled={ isBusy }
						href={ isBusy ? undefined : generatedUrl }
						download={ isBusy ? undefined : 'tryon.png' }
					>
						{ __( 'Download', 'try-aura' ) }
					</Button>
				</div>
			) : null }
		</div>
	);
}

export default Index;
