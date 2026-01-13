import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../store';
import { ModernSelect } from '../../../components';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
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
import ConfigFooter from './ConfigFooter';

function ImageConfigInputs( { doGenerate } ) {
	const {
		isBlockEditorPage,
		isWoocommerceProductPage,
		imageConfigData,
		generatedUrl,
		isBusy,
		uploading,
		isThumbnailMode,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			isBlockEditorPage: store.getIsBlockEditorPage(),
			isWoocommerceProductPage: store.getIsWoocommerceProductPage(),
			imageConfigData: store.getImageConfigData(),
			generatedUrl: store.getGeneratedUrl(),
			isBusy: store.isBusy(),
			uploading: store.getUploading(),
			isThumbnailMode: store.isThumbnailMode(),
		};
	}, [] );

	const { setImageConfigData } = useDispatch( STORE_NAME );

	return (
		<>
			{ /* Controls */ }
			{ isThumbnailMode && (
				<ModernSelect
					label={ __( 'Video Platforms', 'try-aura' ) }
					value={ imageConfigData?.videoPlatform ?? 'youtube' }
					onChange={ ( val: any ) =>
						setImageConfigData( {
							videoPlatform: val,
						} )
					}
					options={ [ { label: 'Youtube', value: 'youtube' } ] }
					variant="list"
				/>
			) }

			{ isWoocommerceProductPage && (
				<>
					{ applyFilters(
						'tryaura.enhancer.image_config_extra_inputs',
						null,
						{ imageConfigData, setImageConfigData }
					) || (
						<>
							<ModernSelect
								value={ imageConfigData?.backgroundType ?? '' }
								onChange={ ( val ) =>
									setImageConfigData( {
										backgroundType: val,
									} )
								}
								label={ __(
									'Background preference',
									'try-aura'
								) }
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
										styleType: val,
									} )
								}
								label={ __( 'Output style', 'try-aura' ) }
								options={ [
									{
										label: __(
											'Photo realistic',
											'try-aura'
										),
										value: 'photo-realistic',
										icon: <Image />,
									},
									{
										label: __(
											'Studio mockup',
											'try-aura'
										),
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
				</>
			) }

			{/* This should be in product */}
			{ isBlockEditorPage && ! isWoocommerceProductPage && (
				<ModernSelect
					value={ imageConfigData?.imageSize ?? '' }
					variant="list"
					onChange={ ( val ) =>
						setImageConfigData( {
							imageSize: val,
						} )
					}
					label={ __( 'Image Size', 'try-aura' ) }
					options={ [
						{
							label: __( 'Square (1:1)', 'try-aura' ),
							value: '1:1',
							icon: <Square />,
						},
						{
							label: __( 'Landscape (16:9)', 'try-aura' ),
							value: '16:9',
							icon: <RectangleHorizontal />,
						},
						{
							label: __( 'Portrait (9:16)', 'try-aura' ),
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
					{ isBlockEditorPage && ! isWoocommerceProductPage
						? __( 'Prompt', 'try-aura' )
						: __( 'Prompt (Optional)', 'try-aura' ) }
				</span>
				<textarea
					className="border border-[#E9E9E9] placeholder-[#A5A5AA]"
					required
					value={ imageConfigData?.optionalPrompt ?? '' }
					onChange={ ( e: any ) =>
						setImageConfigData( {
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
				/>
			</label>

			<ConfigFooter
				generatedUrl={ generatedUrl }
				doGenerate={ doGenerate }
				isBusy={ isBusy }
				uploading={ uploading }
				downloadName="enhanced.png"
				isBlockEditorPage={
					isBlockEditorPage && ! isWoocommerceProductPage
				}
				optionalPrompt={ imageConfigData?.optionalPrompt ?? '' }
			/>
		</>
	);
}

export default ImageConfigInputs;
