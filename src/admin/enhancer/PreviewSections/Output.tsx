import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect, useRef } from '@wordpress/element';
import { STORE_NAME } from '../store';
import { __ } from '@wordpress/i18n';
import { Button } from '../../../components';
import Star from '../../../images/star.gif';
import Congrats from '../../../images/congrats.gif';

function Output( { supportsVideo, className = '' } ) {
	const [ showCongrats, setShowCongrats ] = useState( false );
	const {
		generatedUrl,
		activeTab,
		message,
		videoUrl,
		videoMessage,
		videoError,
		error,
		isBusy,
		isVideoBusy,
		status,
		videoStatus,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			generatedUrl: store.getGeneratedUrl(),
			activeTab: store.getActiveTab(),
			message: store.getMessage(),
			videoUrl: store.getVideoUrl(),
			videoMessage: store.getVideoMessage(),
			videoError: store.getVideoError(),
			error: store.getError(),
			isBusy: store.isBusy(),
			isVideoBusy: store.isVideoBusy(),
			status: store.getStatus(),
			videoStatus: store.getVideoStatus(),
		};
	}, [] );

	const { setActiveTab } = useDispatch( STORE_NAME );

	const prevIsBusy = useRef( isBusy );
	const prevIsVideoBusy = useRef( isVideoBusy );

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
		let timer: any;
		if (
			prevIsVideoBusy.current &&
			! isVideoBusy &&
			videoStatus === 'done'
		) {
			setShowCongrats( true );
			timer = setTimeout( () => setShowCongrats( false ), 2200 );
		}
		prevIsVideoBusy.current = isVideoBusy;
		return () => {
			if ( timer ) {
				clearTimeout( timer );
			}
		};
	}, [ isVideoBusy, videoStatus ] );

	useEffect( () => {
		if ( isBusy || isVideoBusy ) {
			setShowCongrats( false );
		}
	}, [ isBusy, isVideoBusy ] );

	return (
		<div className={ className }>
			<div className="w-[500] text-[14px] mb-[8px]">
				{ __( 'Generated Output', 'try-aura' ) }
			</div>
			{ /* eslint-disable-next-line no-nested-ternary */ }
			{ activeTab === 'image' ? (
				generatedUrl && ! isBusy ? (
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
						{ supportsVideo && (
							<div className="flex justify-center">
								<Button
									variant="solid"
									className="border border-primary text-primary bg-white"
									onClick={ () => setActiveTab( 'video' ) }
								>
									{ __( 'Generate Video', 'tryaura' ) }
								</Button>
							</div>
						) }
					</div>
				) : (
					<div className="bg-[#F3F4F6] text-[#67686B] text-[14px] font-[400] rounded-[8px] min-h-[316px] flex flex-col gap-1 items-center justify-center">
						{ isBusy && (
							<img
								src={ Star }
								className="w-8 h-8"
								alt={ __( 'Image loading', 'try-aura' ) }
							/>
						) }
						<span>{ message }</span>
					</div>
				)
			) : (
				<div>
					{ videoUrl && ! isVideoBusy ? (
						<div className="relative w-full h-auto">
							<video
								src={ videoUrl }
								controls
								className="w-full h-auto block rounded-[8px] bg-[#000]"
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
					) : (
						<div className="bg-[#F3F4F6] text-[#67686B] text-[14px] font-[400] rounded-[8px] min-h-[316px] flex flex-col gap-1  items-center justify-center">
							{ isVideoBusy && (
								<img
									src={ Star }
									className="w-8 h-8"
									alt={ __( 'Video loading', 'try-aura' ) }
								/>
							) }
							<span>{ videoMessage }</span>
						</div>
					) }
					{ videoError && (
						<div style={ { color: 'red', marginTop: 8 } }>
							{ videoError }
						</div>
					) }
				</div>
			) }
			{ error ? (
				<div style={ { color: 'red', marginTop: 8 } }>{ error }</div>
			) : null }
		</div>
	);
}

export default Output;
