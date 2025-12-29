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
						generatedUrl={ generatedUrl }
						doGenerate={ doGenerate }
						isBusy={ isBusy }
						uploading={ uploading }
					/>
				) : (
					<VideoConfigInputs
						videoConfigData={ videoConfigData }
						setVideoConfigData={ setVideoConfigData }
						doGenerateVideo={ doGenerateVideo }
						isVideoBusy={ isVideoBusy }
						videoUploading={ videoUploading }
						videoUrl={ videoUrl }
					/>
				) }
			</div>
		</div>
	);
}

export default ConfigSettings;
