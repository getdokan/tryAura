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
	styleType,
	setStyleType,
	imageSize,
	setImageSize,
	optionalPrompt,
	setOptionalPrompt,
	doGenerate,
	isBusy,
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
							<Button onClick={ doGenerate } disabled={ isBusy }>
								{ isBusy
									? __( 'Regenerating…', 'tryaura' )
									: __( 'Regenerate', 'tryaura' ) }
							</Button>

							<Button
								type="link"
								variant="outline"
								href={ isBusy ? undefined : generatedUrl }
								download={ isBusy ? undefined : 'enhanced.png' }
								aria-disabled={ isBusy }
								style={ {
									pointerEvents: isBusy ? 'none' : 'auto',
									opacity: isBusy ? 0.6 : 1,
								} }
							>
								{ __( 'Download', 'try-aura' ) }
							</Button>
						</>
					) : (
						<Button
							color="primary"
							onClick={ doGenerate }
							disabled={ isBusy }
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
