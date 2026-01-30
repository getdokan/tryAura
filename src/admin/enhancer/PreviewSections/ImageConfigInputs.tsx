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
import { twMerge } from 'tailwind-merge';

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
				label: __( 'Plain', 'tryaura' ),
				value: 'plain',
				icon: <Circle />,
			},
			{
				label: __( 'Natural', 'tryaura' ),
				value: 'natural',
				icon: <Leaf />,
			},
			{
				label: __( 'Studio', 'tryaura' ),
				value: 'studio',
				icon: <Wallpaper />,
			},
		]
	);

	const allOutputStyles = applyFilters( 'tryaura.enhancer.output_styles', [
		{
			label: __( 'Photo Realistic', 'tryaura' ),
			value: 'photo-realistic',
			icon: <Image />,
		},
		{
			label: __( 'Studio Mockup', 'tryaura' ),
			value: 'studio mockup',
			icon: <Shirt />,
		},
		{
			label: __( 'Model Shoot', 'tryaura' ),
			value: 'model shoot',
			icon: <User />,
		},
	] );

	const allAspectRatios = applyFilters( 'tryaura.enhancer.aspect_ratios', [
		{
			label: __( 'Square (1:1)', 'tryaura' ),
			value: '1:1',
			icon: <Square />,
		},
		{
			label: __( 'Landscape (16:9)', 'tryaura' ),
			value: '16:9',
			icon: <RectangleHorizontal />,
			locked: ! hasPro(),
		},
		{
			label: __( 'Portrait (9:16)', 'tryaura' ),
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
					label={ __( 'Video Platforms', 'tryaura' ) }
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
							label={ __( 'Background Preference', 'tryaura' ) }
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
							label={ __( 'Output Style', 'tryaura' ) }
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
				label={ __( 'Image Size', 'tryaura' ) }
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
					<span
						className={ twMerge(
							'w-[500] text-[14px]',
							!hasPro() ? 'text-[#929296]' : ''
						) }
					>
						{ isBlockEditorPage && ! isWoocommerceProductPage
							? __( 'Prompt', 'tryaura' )
							: __( 'Prompt (Optional)', 'tryaura' ) }
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
					disabled={ isBusy || ! hasPro() }
					rows={ 3 }
					placeholder={
						isBlockEditorPage && ! isWoocommerceProductPage
							? __( 'Add any specific instructions', 'tryaura' )
							: __(
									'Add any specific instructions (optional)',
									'tryaura'
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
