import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect, useRef } from '@wordpress/element';
import { STORE_NAME } from '../store';
import { __ } from '@wordpress/i18n';
import Star from '../../../images/star.gif';
import Congrats from '../../../images/congrats.gif';
import { Slot } from '@wordpress/components';
import GenerateVideoBtn from './GenerateVideoBtn';

function Output( {
	className = '',
	onRegenerateAltText,
}: {
	className?: string;
	supportsVideo?: boolean;
	onRegenerateAltText?: ( sourceDataUrl?: string ) => void;
} ) {
	const [ showCongrats, setShowCongrats ] = useState( false );
	const {
		generatedUrl,
		message,
		error,
		isBusy,
		status,
		altText,
		generatingAltText,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			generatedUrl: store.getGeneratedUrl(),
			message: store.getMessage(),
			error: store.getError(),
			isBusy: store.isBusy(),
			status: store.getStatus(),
			altText: store.getAltText(),
			generatingAltText: store.getGeneratingAltText(),
		};
	}, [] );

	const { setAltText } = useDispatch( STORE_NAME );

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
				{ __( 'Generated Output', 'tryaura' ) }
			</div>
			{ /* eslint-disable-next-line no-nested-ternary */ }
			{ isBusy ? (
				<div className="bg-[#F3F4F6] text-[#67686B] text-[14px] font-[400] rounded-[8px] min-h-[316px] flex flex-col gap-1 items-center justify-center">
					<img
						src={ Star }
						className="w-8 h-8"
						alt={ __( 'Loading…', 'tryaura' ) }
					/>
					<span>{ message }</span>
				</div>
			) : generatedUrl ? (
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
									alt={ __( 'Congratulations', 'tryaura' ) }
								/>
							</div>
						) }
					</div>

					<GenerateVideoBtn />

					{ /* #25: editable AI alt text */ }
					<div className="flex flex-col gap-1">
						<div className="flex flex-row items-center justify-between">
							<span className="text-[14px]">
								{ __( 'Alt Text', 'tryaura' ) }
							</span>
							<button
								type="button"
								className="text-[12px] text-primary cursor-pointer bg-transparent border-0 p-0 disabled:opacity-50"
								onClick={ () => onRegenerateAltText?.() }
								disabled={ generatingAltText || isBusy }
							>
								{ generatingAltText
									? __( 'Generating…', 'tryaura' )
									: __( 'Regenerate', 'tryaura' ) }
							</button>
						</div>
						<textarea
							className="border border-[#E9E9E9] placeholder-[#A5A5AA] focus:shadow-none focus:ring-1 focus:ring-primary"
							value={ altText }
							onChange={ ( e: any ) => setAltText( e.target.value ) }
							rows={ 2 }
							placeholder={
								generatingAltText
									? __( 'Generating alt text…', 'tryaura' )
									: __(
											'Alt text will appear here after generation',
											'tryaura'
									  )
							}
						/>
					</div>

					<Slot name="TryAuraEnhancerAfterImageOutput" />
				</div>
			) : (
				<div className="bg-[#F3F4F6] text-[#67686B] text-[14px] font-[400] rounded-[8px] min-h-[316px] flex flex-col gap-1 items-center justify-center">
					<span>{ message }</span>
				</div>
			) }

			{ error ? (
				<div
					className="text-red-400 mt-2 max-h-25 overflow-auto"
				>
					{ error }
				</div>
			) : null }
		</div>
	);
}

export default Output;
