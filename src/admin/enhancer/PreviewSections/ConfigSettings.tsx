import GroupButton from '../../../components/GroupButton';
import { __ } from '@wordpress/i18n';
import { Button } from '../../../components';
import ImageConfigInputs from './ImageConfigInputs';
import VideoConfigInputs from './VideoConfigInputs';

function ConfigSettings( {
	supportsVideo,
	activeTab,
	setActiveTab,
	isBlockEditorPage,
	isWoocommerceProductPage,
	generatedUrl,
	videoUrl,
	doGenerate,
	isBusy,
	doGenerateVideo,
	isVideoBusy,
	uploading,
	videoUploading,
	videoConfigData,
	setVideoConfigData,
	imageConfigData,
	setImageConfigData,
} ) {
	return (
		<div className="w-full flex flex-col gap-[32px]">
			{ /* Tabs for Generated content */ }
			{ supportsVideo && (
				<GroupButton
					options={ [
						{
							label: __( 'Generate Image', 'tryaura' ),
							value: 'image',
						},
						{
							label: __( 'Generate Video', 'tryaura' ),
							value: 'video',
							disabled: ! generatedUrl,
						},
					] }
					value={ activeTab }
					onClick={ ( tab ) => setActiveTab( tab ) }
				/>
			) }

			<div className="flex flex-col gap-[12px]">
				{ activeTab === 'image' ? (
					<ImageConfigInputs
						isBlockEditorPage={ isBlockEditorPage }
						isWoocommerceProductPage={ isWoocommerceProductPage }
						imageConfigData={ imageConfigData }
						setImageConfigData={ setImageConfigData }
					/>
				) : (
					<VideoConfigInputs
						videoConfigData={ videoConfigData }
						setVideoConfigData={ setVideoConfigData }
					/>
				) }

				<div className="flex flex-row gap-[12px]">
					{ generatedUrl ? (
						<>
							<Button
								onClick={
									activeTab === 'image'
										? doGenerate
										: doGenerateVideo
								}
								disabled={
									activeTab === 'image'
										? isBusy || uploading
										: isVideoBusy || videoUploading
								}
							>
								{ isBusy
									? __( 'Regenerating…', 'tryaura' )
									: __( 'Regenerate', 'tryaura' ) }
							</Button>

							<Button
								type="link"
								variant="outline"
								href={
									activeTab === 'image'
										? isBusy
											? undefined
											: generatedUrl
										: isVideoBusy
										? undefined
										: videoUrl
								}
								download={
									activeTab === 'image'
										? isBusy
											? undefined
											: 'enhanced.png'
										: isVideoBusy
										? undefined
										: 'enhanced-video.mp4'
								}
								aria-disabled={
									activeTab === 'image' ? isBusy : isVideoBusy
								}
								style={ {
									pointerEvents:
										isBusy || isVideoBusy ? 'none' : 'auto',
									opacity: isBusy || isVideoBusy ? 0.6 : 1,
								} }
								disabled={
									activeTab === 'image' ? isBusy : isVideoBusy
								}
							>
								{ __( 'Download', 'try-aura' ) }
							</Button>
						</>
					) : (
						<Button
							onClick={
								activeTab === 'image'
									? doGenerate
									: doGenerateVideo
							}
							disabled={
								activeTab === 'image'
									? isBusy || uploading
									: isVideoBusy || videoUploading
							}
						>
							{ ( activeTab === 'image' ? isBusy : isVideoBusy )
								? __( 'Generating…', 'try-aura' )
								: __( 'Generate', 'try-aura' ) }
						</Button>
					) }
				</div>
			</div>
		</div>
	);
}

export default ConfigSettings;
