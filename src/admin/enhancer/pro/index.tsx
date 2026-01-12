import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
import VideoConfigInputs from './PreviewSections/VideoConfigInputs';
import { useVideoLogic } from './useVideoLogic';
import { Button, ModernSelect } from '../../../components';
import StarIcon from '../../../images/star.gif';
import CongratsIcon from '../../../images/congrats.gif';
import { useSelect, useDispatch } from '@wordpress/data';
import { PRO_STORE_NAME } from './store';

// Original image props filter
addFilter(
	'tryaura.enhancer.original_image_props',
	'tryaura/enhancer-pro/original-image-props',
	( props, { activeTab, videoSource, selectedVideoIndices, setSelectedVideoIndices } ) => {
		if ( activeTab === 'video' ) {
			return {
				...props,
				selectedIndices: selectedVideoIndices,
				setSelectedIndices: setSelectedVideoIndices,
				showSelection: videoSource === 'original-image',
				showGeneratedImage: videoSource === 'generated-image',
				limits: { min: 1, max: 1 },
			};
		}
		return props;
	}
);

declare const wp: any;

// Add the "Generate Video" tab
addFilter(
	'tryaura.enhancer.tabs',
	'tryaura/enhancer-pro/tabs',
	( tabs, { isBusy, isVideoBusy, isThumbnailMode, supportsVideo } ) => {
		if ( supportsVideo && ! isThumbnailMode ) {
			tabs.push( {
				label: __( 'Generate Video', 'tryaura' ),
				value: 'video',
				disabled: isBusy || isVideoBusy,
			} );
		}
		return tabs;
	}
);

// Add the video config inputs
addFilter(
	'tryaura.enhancer.config_inputs',
	'tryaura/enhancer-pro/config-inputs',
	( content, activeTab, { doGenerateVideo } ) => {
		if ( activeTab === 'video' ) {
			return <VideoConfigInputs doGenerateVideo={ doGenerateVideo } />;
		}
		return content;
	}
);

// Add the "Generate Video" button after the image output
addFilter(
	'tryaura.enhancer.after_image_output',
	'tryaura/enhancer-pro/after-image-output',
	( content, { supportsVideo, isThumbnailMode, setActiveTab } ) => {
		if ( supportsVideo && ! isThumbnailMode ) {
			return (
				<div className="flex justify-center">
					<Button
						variant="solid"
						className="border border-primary text-primary bg-white"
						onClick={ () => setActiveTab( 'video' ) }
					>
						{ __( 'Generate Video', 'tryaura' ) }
					</Button>
				</div>
			);
		}
		return content;
	}
);

// Add the video output
const VideoOutput = () => {
	const [ showCongrats, setShowCongrats ] = useState( false );
	const { videoUrl, isVideoBusy, videoMessage, videoError, videoStatus } = useSelect(
		( select ) => {
			const store = select( PRO_STORE_NAME );
			return {
				videoUrl: store.getVideoUrl(),
				isVideoBusy: store.isVideoBusy(),
				videoMessage: store.getVideoMessage(),
				videoError: store.getVideoError(),
				videoStatus: store.getVideoStatus(),
			};
		},
		[]
	);

	const prevIsVideoBusy = useRef( isVideoBusy );

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
		if ( isVideoBusy ) {
			setShowCongrats( false );
		}
	}, [ isVideoBusy ] );

	return (
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
								src={ CongratsIcon }
								className="w-full h-auto"
								alt={ __( 'Congratulations', 'try-aura' ) }
							/>
						</div>
					) }
				</div>
			) : (
				<div className="bg-[#F3F4F6] text-[#67686B] text-[14px] font-[400] rounded-[8px] min-h-[316px] flex flex-col gap-1  items-center justify-center">
					{ isVideoBusy && (
						<img
							src={ StarIcon }
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
	);
};

addFilter(
	'tryaura.enhancer.video_output',
	'tryaura/enhancer-pro/video-output',
	( content, { activeTab } ) => {
		if ( activeTab === 'video' ) {
			return <VideoOutput />;
		}
		return content;
	}
);

// Footer actions for video
const VideoFooterActions = ( {
	activeTab,
	disabledVideoAddToMedia,
	videoUploading,
	setVideoInMediaSelection,
} ) => {
	const { videoUrl } = useSelect( ( select ) => {
		const store = select( PRO_STORE_NAME );
		return {
			videoUrl: store.getVideoUrl(),
		};
	}, [] );

	if ( activeTab !== 'video' || ! videoUrl ) {
		return null;
	}

	return (
		<Button
			onClick={ setVideoInMediaSelection }
			disabled={ disabledVideoAddToMedia }
			loading={ videoUploading }
		>
			{ videoUploading
				? __( 'Adding…' )
				: __( 'Add to Media Library', 'try-aura' ) }
		</Button>
	);
};

addFilter(
	'tryaura.enhancer.footer_actions',
	'tryaura/enhancer-pro/footer-actions',
	(
		actions,
		{
			activeTab,
			disabledVideoAddToMedia,
			videoUploading,
			setVideoInMediaSelection,
		}
	) => {
		actions.push(
			<VideoFooterActions
				key="video-footer-actions"
				activeTab={ activeTab }
				disabledVideoAddToMedia={ disabledVideoAddToMedia }
				videoUploading={ videoUploading }
				setVideoInMediaSelection={ setVideoInMediaSelection }
			/>
		);
		return actions;
	}
);

// Register video logic hook provider
addFilter(
	'tryaura.enhancer.use_video_logic',
	'tryaura/enhancer-pro/use-video-logic',
	() => {
		return useVideoLogic;
	}
);
