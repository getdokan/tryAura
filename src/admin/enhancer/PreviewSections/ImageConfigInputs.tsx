import { ModernSelect } from '../../../components';
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

function ImageConfigInputs( {
	backgroundType,
	styleType,
	imageSize,
	optionalPrompt,
	setBackgroundType,
	setStyleType,
	setImageSize,
	setOptionalPrompt,
	isBlockEditorPage,
	isWoocommerceProductPage,
} ) {
	return (
		<>
			{ /* Controls */ }
			{ ! isBlockEditorPage && isWoocommerceProductPage && (
				<>
					<ModernSelect
						value={ backgroundType }
						onChange={ ( val ) => setBackgroundType( val ) }
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
						value={ styleType }
						onChange={ ( val ) => setStyleType( val ) }
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
					value={ imageSize }
					variant="list"
					onChange={ ( val ) => setImageSize( val ) }
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
					{ __( 'Prompt (Optional)' ) }
				</span>
				<textarea
					className="border border-[#E9E9E9]"
					value={ optionalPrompt }
					onChange={ ( e: any ) =>
						setOptionalPrompt( e.target.value )
					}
					rows={ 3 }
					placeholder={ __(
						'Add any specific instructions (optional)',
						'tryaura'
					) }
				/>
			</label>
		</>
	);
}

export default ImageConfigInputs;
