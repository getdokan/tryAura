import { __ } from '@wordpress/i18n';
import {
	Wallpaper,
	RectangleHorizontal,
	ZoomIn,
} from 'lucide-react';
import { Button, CrownIcon, ModernSelect } from '../../../components';

function DummyVideoConfigInputs() {
	return (
		<>
			{ /* Controls */ }
			<ModernSelect
				value={ 'studio' }
				onChange={ () => {} }
				label={ __( 'Styles', 'try-aura-pro' ) }
				options={ [
					{
						label: __( 'Studio', 'try-aura-pro' ),
						value: 'studio',
						icon: <Wallpaper />,
					},
				] }
				disabled={ true }
			/>

			<ModernSelect
				value={ 'zoom in' }
				onChange={ () => {} }
				label={ __( 'Camera Motion', 'try-aura-pro' ) }
				options={ [
					{
						label: __( 'Zoom In', 'try-aura-pro' ),
						value: 'zoom in',
						icon: <ZoomIn />,
					},
				] }
				disabled={ true }
			/>

			<ModernSelect
				variant="list"
				value={ '16:9' }
				onChange={ () => {} }
				label={ __( 'Aspect Ratio', 'try-aura-pro' ) }
				options={ [
					{
						label: __( 'Landscape (16:9)', 'try-aura-pro' ),
						value: '16:9',
						icon: <RectangleHorizontal />,
					},
				] }
				disabled={ true }
			/>

			<label
				style={ {
					display: 'flex',
					flexDirection: 'column',
					gap: 4,
				} }
				htmlFor="try-aura-video-optional-prompt"
			>
				<span className="w-[500] text-[14px] mb-[8px]">
					{ __( 'Prompt (Optional)', 'try-aura-pro' ) }
				</span>
				<textarea
					className="border border-[#E9E9E9]"
					value={ '' }
					onChange={ () => {} }
					rows={ 3 }
					placeholder={ __(
						'Add any specific instructions (optional)',
						'try-aura-pro'
					) }
					id="try-aura-video-optional-prompt"
				/>
			</label>

			<div>
				<Button className="bg-[rgba(241,241,244,1)] text-[rgba(165,165,170,1)]">
					<div className="flex flex-row items-center justify-center gap-2">
						<span>{ __( 'Generate Video', 'try-aura' ) }</span>
						<CrownIcon className="text-[15px]" />
					</div>
				</Button>

			</div>
		</>
	);
}

export default DummyVideoConfigInputs;
