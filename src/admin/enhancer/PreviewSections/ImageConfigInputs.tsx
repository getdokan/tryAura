import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../store';
import { CrownIcon, ModernSelect } from '../../../components';
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
import { hasPro } from '../../../utils/tryaura';

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

	const allBackgroundPrefrences = applyFilters(
		'tryaura.enhancer.background_preferences',
		[
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
		]
	);

	const allOutputStyles = applyFilters( 'tryaura.enhancer.output_styles', [
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
	] );

	const allAspectRatios = applyFilters( 'tryaura.enhancer.aspect_ratios', [
		{
			label: __( 'Square (1:1)', 'try-aura' ),
			value: '1:1',
			icon: <Square />,
		},
		{
			label: __( 'Landscape (16:9)', 'try-aura' ),
			value: '16:9',
			icon: <RectangleHorizontal />,
			locked: ! hasPro(),
		},
		{
			label: __( 'Portrait (9:16)', 'try-aura' ),
			value: '9:16',
			icon: <RectangleVertical />,
			locked: ! hasPro(),
		},
	] );

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
					disabled={ isBusy }
				/>
			) }

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
							label={ __( 'Background preference', 'try-aura' ) }
							options={ allBackgroundPrefrences }
							disabled={ isBusy }
						/>

						<ModernSelect
							value={ imageConfigData?.styleType ?? '' }
							onChange={ ( val ) =>
								setImageConfigData( {
									styleType: val,
								} )
							}
							label={ __( 'Output style', 'try-aura' ) }
							options={ allOutputStyles }
							disabled={ isBusy }
						/>
					</>
				) }
			</>

			<ModernSelect
				value={ imageConfigData?.imageSize ?? '' }
				variant="list"
				onChange={ ( val ) =>
					setImageConfigData( {
						imageSize: val,
					} )
				}
				label={ __( 'Image Size', 'try-aura' ) }
				options={ allAspectRatios }
				disabled={ isBusy }
			/>

			<label
				style={ {
					display: 'flex',
					flexDirection: 'column',
					gap: 4,
				} }
			>
				<div className="flex flex-row gap-2 items-center mb-2">
					<span className="w-[500] text-[14px]">
						{ isBlockEditorPage && ! isWoocommerceProductPage
							? __( 'Prompt', 'try-aura' )
							: __( 'Prompt (Optional)', 'try-aura' ) }
					</span>
					{ ! hasPro() && <CrownIcon className="text-[16px]" /> }
				</div>
				<textarea
					className="border border-[#E9E9E9] placeholder-[#A5A5AA] max-h-44 focus:shadow-none focus:ring-1 focus:ring-primary"
					required={ hasPro() }
					value={ imageConfigData?.optionalPrompt ?? '' }
					onChange={ ( e: any ) =>
						hasPro() &&
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
