import { Button, ModernSelect } from "../../../components";
import { __ } from '@wordpress/i18n';
import {
	Leaf,
	Wallpaper,
	Square,
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
	Clock9,
} from 'lucide-react';
import ConfigFooter from "./ConfigFooter";

function VideoConfigInputs( {
	videoConfigData,
	setVideoConfigData,
															videoUrl,
															doGenerateVideo,
															isVideoBusy,
															videoUploading,
} ) {
	return (
		<>
			{ /* Controls */ }
			<ModernSelect
				value={ videoConfigData.styles }
				onChange={ ( val ) =>
					setVideoConfigData( { ...videoConfigData, styles: val } )
				}
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
						...videoConfigData,
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

			<div className="flex flex-row gap-[12px] w-full">
				<ModernSelect
					className="w-1/2"
					variant="list"
					value={ videoConfigData.aspectRatio }
					onChange={ ( val ) =>
						setVideoConfigData( {
							...videoConfigData,
							aspectRatio: val,
						} )
					}
					label={ __( 'Aspect Ratio', 'try-aura' ) }
					options={ [
						{
							label: __( '1:1', 'try-aura' ),
							value: '1:1',
							icon: <Square />,
						},
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
				<ModernSelect
					className="w-1/2"
					value={ videoConfigData.duration }
					onChange={ ( val ) =>
						setVideoConfigData( {
							...videoConfigData,
							duration: val,
						} )
					}
					variant="list"
					label={ __( 'Duration', 'try-aura' ) }
					options={ [
						{
							label: __( '5 Sec', 'try-aura' ),
							value: '5 sec',
							icon: <Clock9 />,
						},
						{
							label: __( '10 Sec', 'try-aura' ),
							value: '10 sec',
							icon: <Clock9 />,
						},
					] }
				/>
			</div>

			<label
				style={ {
					display: 'flex',
					flexDirection: 'column',
					gap: 4,
				} }
				htmlFor="try-aura-video-optional-prompt"
			>
				<span className="w-[500] text-[14px] mb-[8px]">
					{ __( 'Prompt (Optional)' ) }
				</span>
				<textarea
					className="border border-[#E9E9E9]"
					value={ videoConfigData.optionalPrompt }
					onChange={ ( e ) =>
						setVideoConfigData( {
							...videoConfigData,
							optionalPrompt: e.target.value,
						} )
					}
					rows={ 3 }
					placeholder={ __(
						'Add any specific instructions (optional)',
						'tryaura'
					) }
					id="try-aura-video-optional-prompt"
				/>
			</label>

			<ConfigFooter
				generatedUrl={ videoUrl }
				doGenerate={ doGenerateVideo }
				isBusy={ isVideoBusy }
				uploading={ videoUploading }
				downloadName="enhanced-video.mp4"
			/>
		</>
	);
}

export default VideoConfigInputs;
