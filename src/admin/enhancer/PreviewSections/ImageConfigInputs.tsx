import { Button, ModernSelect } from '../../../components';
import { __ } from '@wordpress/i18n';
import {
	Circle,
	Leaf,
	Settings,
	Shirt,
	User,
	Wallpaper,
	Image,
	Square,
	RectangleHorizontal,
	RectangleVertical,
} from 'lucide-react';
import ConfigFooter from "./ConfigFooter";

function ImageConfigInputs( {
	isBlockEditorPage,
	isWoocommerceProductPage,
	imageConfigData,
	setImageConfigData,
	generatedUrl,
	doGenerate,
	isBusy,
	uploading,
} ) {
	return (
		<>
			{ /* Controls */ }
			{ ! isBlockEditorPage && isWoocommerceProductPage && (
				<>
					<ModernSelect
						value={ imageConfigData?.backgroundType ?? '' }
						onChange={ ( val ) =>
							setImageConfigData( {
								...imageConfigData,
								backgroundType: val,
							} )
						}
						label={ __( 'Background preference', 'try-aura' ) }
						options={ [
							{
								label: __( 'Plain', 'try-aura' ),
								value: 'plain',
								icon: <Circle />,
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
								label: __( 'Custom', 'try-aura' ),
								value: 'custom',
								icon: <Settings />,
							},
						] }
					/>

					<ModernSelect
						value={ imageConfigData?.styleType ?? '' }
						onChange={ ( val ) =>
							setImageConfigData( {
								...imageConfigData,
								styleType: val,
							} )
						}
						label={ __( 'Output style', 'try-aura' ) }
						options={ [
							{
								label: __( 'Photo realistic', 'try-aura' ),
								value: 'photo-realistic',
								icon: <Image />,
							},
							{
								label: __( 'Studio mockup', 'try-aura' ),
								value: 'studio mockup',
								icon: <Shirt />,
							},
							{
								label: __( 'Model shoot', 'try-aura' ),
								value: 'model shoot',
								icon: <User />,
							},
						] }
					/>
				</>
			) }

			{ isBlockEditorPage && ! isWoocommerceProductPage && (
				<ModernSelect
					value={ imageConfigData?.imageSize ?? '' }
					variant="list"
					onChange={ ( val ) =>
						setImageConfigData( {
							...imageConfigData,
							imageSize: val,
						} )
					}
					label={ __( 'Image Size', 'try-aura' ) }
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
			) }

			<label
				style={ {
					display: 'flex',
					flexDirection: 'column',
					gap: 4,
				} }
			>
				<span className="w-[500] text-[14px] mb-[8px]">
					{ __(
						isBlockEditorPage
							? 'Prompt'
							: 'Prompt (Optional)'
						) }
				</span>
				<textarea
					className="border border-[#E9E9E9] placeholder-[#A5A5AA]"
					required
					value={ imageConfigData?.optionalPrompt ?? '' }
					onChange={ ( e: any ) =>
						setImageConfigData( {
							...imageConfigData,
							optionalPrompt: e.target.value,
						} )
					}
					rows={ 3 }
					placeholder={ __(
						isBlockEditorPage
							? 'Add any specific instructions'
							: 'Add any specific instructions (optional)',
						'tryaura'
					) }
				/>
			</label>

			<ConfigFooter
				generatedUrl={ generatedUrl }
				doGenerate={ doGenerate }
				isBusy={ isBusy }
				uploading={ uploading }
				downloadName="enhanced.png"
				isBlockEditorPage = {isBlockEditorPage}
				optionalPrompt = {imageConfigData?.optionalPrompt ?? ''}
			/>
		</>
	);
}

export default ImageConfigInputs;
