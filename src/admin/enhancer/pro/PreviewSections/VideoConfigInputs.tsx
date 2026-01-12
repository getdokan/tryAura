import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../../store';
import { PRO_STORE_NAME } from '../store';
import { useVideoLogic } from '../useVideoLogic';
import { ModernSelect } from '../../../../components';
import { __ } from '@wordpress/i18n';
import {
	Leaf,
	Wallpaper,
	RectangleHorizontal,
	RectangleVertical,
	Ban,
	Clapperboard,
	ArrowLeft,
	ArrowRight,
	ArrowUp,
	ArrowDown,
	ZoomIn,
	ZoomOut,
} from 'lucide-react';
import ConfigFooter from '../../PreviewSections/ConfigFooter';

function VideoConfigInputs() {
	const {
		isBlockEditorPage,
		isWoocommerceProductPage,
		generatedImageUrl,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			isBlockEditorPage: store.getIsBlockEditorPage(),
			isWoocommerceProductPage: store.getIsWoocommerceProductPage(),
			generatedImageUrl: store.getGeneratedUrl(),
		};
	}, [] );

	const {
		videoConfigData,
		videoUrl,
		isVideoBusy,
		videoUploading,
		videoSource,
	} = useSelect( ( select ) => {
		const store = select( PRO_STORE_NAME );
		return {
			videoConfigData: store.getVideoConfigData(),
			videoUrl: store.getVideoUrl(),
			isVideoBusy: store.isVideoBusy(),
			videoUploading: store.getVideoUploading(),
			videoSource: store.getVideoSource(),
		};
	}, [] );

	const { setVideoConfigData, setVideoSource } = useDispatch( PRO_STORE_NAME );
	const { doGenerateVideo } = useVideoLogic( { runEffects: false } );

	return (
		<>
			{ /* Controls */ }
			{ generatedImageUrl && (
				<ModernSelect
					value={ videoSource }
					onChange={ ( val ) => setVideoSource( val ) }
					label={ __( 'Video image reference source', 'try-aura' ) }
					options={ [
						{
							label: __( 'Generated Image', 'try-aura' ),
							value: 'generated-image',
						},
						{
							label: __( 'Original Image', 'try-aura' ),
							value: 'original-image',
						},
					] }
					variant="list"
				/>
			) }
			{ /* Controls */ }
			<ModernSelect
				value={ videoConfigData.styles }
				onChange={ ( val ) => setVideoConfigData( { styles: val } ) }
				label={ __( 'Styles', 'try-aura' ) }
				options={ [
					{
						label: __( 'None', 'try-aura' ),
						value: 'none',
						icon: <Ban />,
					},
					{
						label: __( 'Natural', 'try-aura' ),
						value: 'natural',
						icon: <Leaf />,
					},
					{
						label: __( 'Studio', 'try-aura' ),
						value: 'studio',
						icon: <Wallpaper />,
					},
					{
						label: __( 'Cinematic', 'try-aura' ),
						value: 'cinematic',
						icon: <Clapperboard />,
					},
				] }
			/>

			<ModernSelect
				value={ videoConfigData.cameraMotion }
				onChange={ ( val ) =>
					setVideoConfigData( {
						cameraMotion: val,
					} )
				}
				label={ __( 'Camera Motion', 'try-aura' ) }
				options={ [
					{
						label: __( 'None', 'try-aura' ),
						value: 'none',
						icon: <Ban />,
					},
					{
						label: __( 'Move Left', 'try-aura' ),
						value: 'move left',
						icon: <ArrowLeft />,
					},
					{
						label: __( 'Move Right', 'try-aura' ),
						value: 'move right',
						icon: <ArrowRight />,
					},
					{
						label: __( 'Move Up', 'try-aura' ),
						value: 'move up',
						icon: <ArrowUp />,
					},
					{
						label: __( 'Move Down', 'try-aura' ),
						value: 'move down',
						icon: <ArrowDown />,
					},
					{
						label: __( 'Zoom In', 'try-aura' ),
						value: 'zoom in',
						icon: <ZoomIn />,
					},
					{
						label: __( 'Zoom Out', 'try-aura' ),
						value: 'zoom out',
						icon: <ZoomOut />,
					},
				] }
			/>

			<ModernSelect
				variant="list"
				value={ videoConfigData.aspectRatio }
				onChange={ ( val ) =>
					setVideoConfigData( {
						aspectRatio: val,
					} )
				}
				label={ __( 'Aspect Ratio', 'try-aura' ) }
				options={ [
					{
						label: __( '16:9', 'try-aura' ),
						value: '16:9',
						icon: <RectangleHorizontal />,
					},
					{
						label: __( '9:16', 'try-aura' ),
						value: '9:16',
						icon: <RectangleVertical />,
					},
				] }
			/>

			<label
				style={ {
					display: 'flex',
					flexDirection: 'column',
					gap: 4,
				} }
				htmlFor="try-aura-video-optional-prompt"
			>
				<span className="w-[500] text-[14px] mb-[8px]">
					{ isBlockEditorPage && ! isWoocommerceProductPage
						? __( 'Prompt', 'try-aura' )
						: __( 'Prompt (Optional)', 'try-aura' ) }
				</span>
				<textarea
					className="border border-[#E9E9E9]"
					value={ videoConfigData.optionalPrompt }
					onChange={ ( e ) =>
						setVideoConfigData( {
							optionalPrompt: e.target.value,
						} )
					}
					rows={ 3 }
					placeholder={
						isBlockEditorPage && ! isWoocommerceProductPage
							? __( 'Add any specific instructions', 'try-aura' )
							: __(
									'Add any specific instructions (optional)',
									'try-aura'
							  )
					}
					id="try-aura-video-optional-prompt"
				/>
			</label>

			<ConfigFooter
				generatedUrl={ videoUrl }
				doGenerate={ doGenerateVideo }
				isBusy={ isVideoBusy }
				uploading={ videoUploading }
				downloadName="enhanced-video.mp4"
				isBlockEditorPage={ isBlockEditorPage && ! isWoocommerceProductPage }
				optionalPrompt={ videoConfigData?.optionalPrompt ?? '' }
			/>
		</>
	);
}

export default VideoConfigInputs;
