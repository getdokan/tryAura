import { __ } from '@wordpress/i18n';
import { Wallpaper, RectangleHorizontal, ZoomIn, Play } from 'lucide-react';
import { Button, CrownIcon, ModernSelect } from '../../../components';
import { Popover } from '@wordpress/components';
import { useState, useRef } from '@wordpress/element';
import { getUpgradeToProUrl } from '../../../utils/tryaura';

function DummyVideoConfigInputs() {
	const [ isHovered, setIsHovered ] = useState( false );
	const [ popoverAnchor, setPopoverAnchor ] = useState();
	const hoverTimeout = useRef( null );

	const handleMouseEnter = () => {
		if ( hoverTimeout.current ) {
			clearTimeout( hoverTimeout.current );
		}
		setIsHovered( true );
	};

	const handleMouseLeave = () => {
		hoverTimeout.current = setTimeout( () => {
			setIsHovered( false );
		}, 150 );
	};
	return (
		<>
			{ /* Controls */ }
			<ModernSelect
				value={ 'studio' }
				onChange={ () => {} }
				label={ __( 'Styles', 'try-aura' ) }
				labelClassName="text-[#929296]"
				options={ [
					{
						label: __( 'Studio', 'try-aura' ),
						value: 'studio',
						icon: <Wallpaper />,
					},
				] }
				disabled={ true }
			/>

			<ModernSelect
				value={ 'zoom in' }
				onChange={ () => {} }
				label={ __( 'Camera Motion', 'try-aura' ) }
				labelClassName="text-[#929296]"
				options={ [
					{
						label: __( 'Zoom In', 'try-aura' ),
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
				label={ __( 'Aspect Ratio', 'try-aura' ) }
				labelClassName="text-[#929296]"
				options={ [
					{
						label: __( 'Landscape (16:9)', 'try-aura' ),
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
				<span className="w-[500] text-[14px] mb-[8px] text-[#929296]">
					{ __( 'Prompt (Optional)', 'try-aura' ) }
				</span>
				<textarea
					className="border border-[#E9E9E9]"
					value={ '' }
					onChange={ () => {} }
					rows={ 3 }
					placeholder={ __(
						'Add any specific instructions (optional)',
						'try-aura'
					) }
					id="try-aura-video-optional-prompt"
				/>
			</label>

			<div className="relative">
				<Button
					// @ts-ignore
					ref={ setPopoverAnchor }
					onMouseEnter={ handleMouseEnter }
					onMouseLeave={ handleMouseLeave }
					className="bg-[rgba(241,241,244,1)] text-[rgba(165,165,170,1)]"
				>
					<div className="flex flex-row items-center justify-center gap-2">
						<span>{ __( 'Generate Video', 'try-aura' ) }</span>
						<CrownIcon className="text-[15px]" />
					</div>
				</Button>

				{ isHovered && (
					<Popover
						anchor={ popoverAnchor }
						onClose={ () => setIsHovered( false ) }
						placement="top"
						focusOnMount={ false }
						className="tryaura try-aura-tooltip-popover"
						style={ {
							top: '-10px !important',
						} }
					>
						<div
							className="bg-black text-white p-4 rounded-[5px] flex flex-col items-center gap-3 w-46.25 text-center"
							onMouseEnter={ handleMouseEnter }
							onMouseLeave={ handleMouseLeave }
						>
							<p className="m-0 text-[12px] leading-[1.4] font-normal">
								{ __(
									'Unlock advanced features and create stunning videos with a pro account.',
									'try-aura'
								) }
							</p>
							<Button
								type="link"
								href={ getUpgradeToProUrl() }
								target="_blank"
								className="w-29.75 h-7 text-[12px] leading-none font-medium"
							>
								{ __( 'Upgrade to Pro', 'try-aura' ) }
							</Button>

							<Play
								color="black"
								className="fill-black absolute rotate-90 top-[90%]"
							/>
						</div>
					</Popover>
				) }
			</div>
		</>
	);
}

export default DummyVideoConfigInputs;
