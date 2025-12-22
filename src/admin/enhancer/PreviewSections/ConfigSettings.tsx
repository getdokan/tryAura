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
	backgroundType,
	setBackgroundType,
	generatedUrl,
	videoUrl,
	styleType,
	setStyleType,
	imageSize,
	setImageSize,
	optionalPrompt,
	setOptionalPrompt,
	doGenerate,
	isBusy,
	doGenerateVideo,
	isVideoBusy,
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
						backgroundType={ backgroundType }
						styleType={ styleType }
						imageSize={ imageSize }
						optionalPrompt={ optionalPrompt }
						setBackgroundType={ setBackgroundType }
						setStyleType={ setStyleType }
						setImageSize={ setImageSize }
						setOptionalPrompt={ setOptionalPrompt }
						isBlockEditorPage={ isBlockEditorPage }
						isWoocommerceProductPage={ isWoocommerceProductPage }
					/>
				) : (
					<VideoConfigInputs
						backgroundType={ backgroundType }
						styleType={ styleType }
						imageSize={ imageSize }
						optionalPrompt={ optionalPrompt }
						setBackgroundType={ setBackgroundType }
						setStyleType={ setStyleType }
						setImageSize={ setImageSize }
						setOptionalPrompt={ setOptionalPrompt }
						isBlockEditorPage={ isBlockEditorPage }
						isWoocommerceProductPage={ isWoocommerceProductPage }
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
									activeTab === 'image' ? isBusy : isVideoBusy
								}
							>
								{ isBusy
									? __( 'Regenerating…', 'tryaura' )
									: __( 'Regenerate', 'tryaura' ) }
							</Button>

							<Button
								type="link"
								variant="outline"
								href={ activeTab === 'image' ? ( isBusy ? undefined : generatedUrl ) : ( isVideoBusy ? undefined : videoUrl ) }
								download={ activeTab === 'image' ? ( isBusy ? undefined : 'enhanced.png' ) : ( isVideoBusy ? undefined : 'enhanced-video.mp4' ) }
								aria-disabled={ activeTab === 'image' ? isBusy : isVideoBusy }
								style={ {
									pointerEvents: isBusy || isVideoBusy ? 'none' : 'auto',
									opacity: isBusy || isVideoBusy ? 0.6 : 1,
								} }
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
								activeTab === 'image' ? isBusy : isVideoBusy
							}
						>
							{ isBusy
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
