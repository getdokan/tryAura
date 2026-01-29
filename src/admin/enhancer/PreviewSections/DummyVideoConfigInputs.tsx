import { __ } from '@wordpress/i18n';
import { Wallpaper, RectangleHorizontal, ZoomIn, Play } from 'lucide-react';
import { Button, ModernSelect } from '../../../components';
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
				label={ __( 'Styles', 'tryaura' ) }
				labelClassName="text-[#929296]"
				options={ [
					{
						label: __( 'Studio', 'tryaura' ),
						value: 'studio',
						icon: <Wallpaper />,
					},
				] }
				disabled={ true }
			/>

			<ModernSelect
				value={ 'zoom in' }
				onChange={ () => {} }
				label={ __( 'Camera Motion', 'tryaura' ) }
				labelClassName="text-[#929296]"
				options={ [
					{
						label: __( 'Zoom In', 'tryaura' ),
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
				label={ __( 'Aspect Ratio', 'tryaura' ) }
				labelClassName="text-[#929296]"
				options={ [
					{
						label: __( 'Landscape (16:9)', 'tryaura' ),
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
				htmlFor="tryaura-video-optional-prompt"
			>
				<span className="w-[500] text-[14px] mb-2 text-[#929296]">
					{ __( 'Prompt (Optional)', 'tryaura' ) }
				</span>
				<textarea
					className="border border-[#E9E9E9] placeholder-[#929296]"
					value={ '' }
					onChange={ () => {} }
					rows={ 3 }
					disabled={ true }
					placeholder={ __(
						'Add any specific instructions (optional)',
						'tryaura'
					) }
					id="tryaura-video-optional-prompt"
				/>
			</label>

			<div className="relative">
				<Button
					// @ts-ignore
					ref={ setPopoverAnchor }
					onMouseEnter={ handleMouseEnter }
					onMouseLeave={ handleMouseLeave }
					className="bg-[rgba(241,241,244,1)] text-[rgba(165,165,170,1)]"
					isPro={ true }
				>
					{ __( 'Generate Video', 'tryaura' ) }
				</Button>

				{ isHovered && (
					<Popover
						anchor={ popoverAnchor }
						onClose={ () => setIsHovered( false ) }
						placement="top"
						focusOnMount={ false }
						className="tryaura tryaura-tooltip-popover"
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
									'tryaura'
								) }
							</p>
							<Button
								type="link"
								href={ getUpgradeToProUrl() }
								target="_blank"
								className="w-29.75 h-7 text-[12px] leading-none font-medium"
							>
								{ __( 'Upgrade to Pro', 'tryaura' ) }
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
