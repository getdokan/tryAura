import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
import VideoConfigInputs from './PreviewSections/VideoConfigInputs';
import { useVideoLogic } from './useVideoLogic';
import { Button } from '../../../components';
import StarIcon from '../../../images/star.gif';
import CongratsIcon from '../../../images/congrats.gif';
import { useSelect, select, dispatch } from '@wordpress/data';
import { PRO_STORE_NAME } from './store';
import { STORE_NAME } from '../store';
import domReady from '@wordpress/dom-ready';

domReady( () => {
	// Original image props filter
	addFilter(
		'tryaura.enhancer.original_image_props',
		'tryaura/enhancer-pro/original-image-props',
		( props ) => {
			const activeTab = select( STORE_NAME ).getActiveTab();
			if ( activeTab === 'video' ) {
				const proStore = select( PRO_STORE_NAME );
				return {
					...props,
					selectedIndices: proStore.getSelectedVideoIndices(),
					setSelectedIndices:
						dispatch( PRO_STORE_NAME ).setSelectedVideoIndices,
					showSelection:
						proStore.getVideoSource() === 'original-image',
					showGeneratedImage:
						proStore.getVideoSource() === 'generated-image',
					limits: { min: 1, max: 1 },
				};
			}
			return props;
		}
	);

	// Add the "Generate Video" tab
	addFilter(
		'tryaura.enhancer.tabs',
		'tryaura/enhancer-pro/tabs',
		( tabs ) => {
			const liteStore = select( STORE_NAME );
			const supportsVideo = liteStore.getSupportsVideo();
			const isThumbnailMode = liteStore.isThumbnailMode();

			if ( supportsVideo && ! isThumbnailMode ) {
				const isBusy = liteStore.isBusy();
				const isVideoBusy = select( PRO_STORE_NAME ).isVideoBusy();
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
		( content ) => {
			const activeTab = select( STORE_NAME ).getActiveTab();
			if ( activeTab === 'video' ) {
				return <VideoConfigInputs />;
			}
			return content;
		}
	);

	// Add the "Generate Video" button after the image output
	addFilter(
		'tryaura.enhancer.after_image_output',
		'tryaura/enhancer-pro/after-image-output',
		( content ) => {
			const liteStore = select( STORE_NAME );
			const supportsVideo = liteStore.getSupportsVideo();
			const isThumbnailMode = liteStore.isThumbnailMode();

			if ( supportsVideo && ! isThumbnailMode ) {
				return (
					<div className="flex justify-center">
						<Button
							variant="solid"
							className="border border-primary text-primary bg-white"
							onClick={ () =>
								dispatch( STORE_NAME ).setActiveTab( 'video' )
							}
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
		const {
			videoUrl,
			isVideoBusy,
			videoMessage,
			videoError,
			videoStatus,
			activeTab,
		} = useSelect( ( sel ) => {
			const proStore = sel( PRO_STORE_NAME );
			const liteStore = sel( STORE_NAME );
			return {
				videoUrl: proStore.getVideoUrl(),
				isVideoBusy: proStore.isVideoBusy(),
				videoMessage: proStore.getVideoMessage(),
				videoError: proStore.getVideoError(),
				videoStatus: proStore.getVideoStatus(),
				activeTab: liteStore.getActiveTab(),
			};
		}, [] );

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

		if ( activeTab !== 'video' ) {
			return null;
		}

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
		( content ) => {
			const activeTab = select( STORE_NAME ).getActiveTab();
			if ( activeTab === 'video' ) {
				return <VideoOutput />;
			}
			return content;
		}
	);

	// Footer actions for video
	const VideoFooterActions = () => {
		const { videoUrl, activeTab, videoUploading, isVideoBusy } = useSelect(
			( sel ) => {
				const proStore = sel( PRO_STORE_NAME );
				const liteStore = sel( STORE_NAME );
				return {
					videoUrl: proStore.getVideoUrl(),
					activeTab: liteStore.getActiveTab(),
					videoUploading: proStore.getVideoUploading(),
					isVideoBusy: proStore.isVideoBusy(),
				};
			},
			[]
		);

		const { setVideoInMediaSelection } = useVideoLogic( {
			runEffects: false,
		} );

		if ( activeTab !== 'video' || ! videoUrl ) {
			return null;
		}

		return (
			<Button
				onClick={ setVideoInMediaSelection }
				disabled={ isVideoBusy || videoUploading || ! videoUrl }
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
		( actions ) => {
			actions.push( <VideoFooterActions key="video-footer-actions" /> );
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
} );
