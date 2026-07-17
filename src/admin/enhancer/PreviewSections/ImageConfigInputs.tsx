import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import { STORE_NAME } from '../store';
import { CrownIcon, ModernSelect } from '../../../components';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import {
	Shirt,
	User,
	Image,
	Square,
	RectangleHorizontal,
	RectangleVertical,
} from 'lucide-react';
import ConfigFooter from './ConfigFooter';
import LockedTemplateTeaser from './LockedTemplateTeaser';
import { getBackgroundOptions } from '../sceneStaging';
import { getApparelModes } from '../apparelModes';
import { getCleanupPresets } from '../cleanupPresets';
import { getUpgradeToProUrl, hasPro } from '../../../utils/tryaura';
import { twMerge } from 'tailwind-merge';
import ProUpgradePopover from '../../../components/ProUpgradePopover';

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
	const [ promptPopoverAnchor, setPromptPopoverAnchor ] =
		useState< SVGSVGElement | null >( null );
	const [ isPromptPopoverOpen, setIsPromptPopoverOpen ] = useState( false );
	const promptHoverTimeout = useRef< ReturnType< typeof setTimeout > | null >(
		null
	);
	const proFeaturePopoverMessage = __(
		'Unlock advanced features like landscape and portrait image sizes plus custom prompts with a pro account.',
		'tryaura'
	);

	const clearPromptPopoverTimeout = () => {
		if ( promptHoverTimeout.current ) {
			clearTimeout( promptHoverTimeout.current );
			promptHoverTimeout.current = null;
		}
	};

	const handlePromptPopoverEnter = () => {
		clearPromptPopoverTimeout();
		setIsPromptPopoverOpen( true );
	};

	const handlePromptPopoverLeave = () => {
		clearPromptPopoverTimeout();
		promptHoverTimeout.current = setTimeout( () => {
			setIsPromptPopoverOpen( false );
		}, 150 );
	};

	// #27: expanded background / scene staging options (Plain, Studio, Natural,
	// Lifestyle, Marble, Wood table, Outdoor, Interior). Shared with the prompt
	// builder via sceneStaging so options and their scene text stay in sync.
	const allBackgroundPrefrences = getBackgroundOptions();

	// #33: apparel output. "On model" was already the default behaviour when no
	// instruction was typed — this makes it explicit. Ghost mannequin is Pro.
	const apparelOptions = [
		{ label: __( 'Default', 'tryaura' ), value: '' },
		...getApparelModes().map( ( mode ) => ( {
			label: mode.label,
			value: mode.id,
			locked: !! mode.pro && ! hasPro(),
		} ) ),
	];

	// #34: one-click cleanup. Clicking a chip applies the fix and generates;
	// clicking the active chip again turns it off so Generate behaves normally.
	const cleanupPresets = getCleanupPresets();
	const activeCleanup = imageConfigData?.cleanupPreset || '';
	const [ cleanupTick, setCleanupTick ] = useState( 0 );

	useEffect( () => {
		if ( cleanupTick > 0 ) {
			doGenerate();
		}
		// Only fire when a cleanup is actually requested. By this point the store
		// already holds the new preset, so doGenerate reads it.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ cleanupTick ] );

	const onCleanupClick = ( id: string ) => {
		if ( activeCleanup === id ) {
			setImageConfigData( { cleanupPreset: '' } );
			return;
		}
		setImageConfigData( { cleanupPreset: id } );
		setCleanupTick( ( tick ) => tick + 1 );
	};

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

	// Only the aspect ratios documented as supported by @google/genai
	// ImageConfig.aspectRatio. 4:5 was dropped (not on the documented list).
	const allAspectRatios = applyFilters( 'tryaura.enhancer.aspect_ratios', [
		{
			label: __( 'Square (1:1)', 'tryaura' ),
			value: '1:1',
			icon: <Square />,
		},
		{
			label: __( 'Portrait (2:3)', 'tryaura' ),
			value: '2:3',
			icon: <RectangleVertical />,
			locked: ! hasPro(),
		},
		{
			label: __( 'Portrait (3:4)', 'tryaura' ),
			value: '3:4',
			icon: <RectangleVertical />,
			locked: ! hasPro(),
		},
		{
			label: __( 'Portrait (9:16)', 'tryaura' ),
			value: '9:16',
			icon: <RectangleVertical />,
			locked: ! hasPro(),
		},
		{
			label: __( 'Landscape (3:2)', 'tryaura' ),
			value: '3:2',
			icon: <RectangleHorizontal />,
			locked: ! hasPro(),
		},
		{
			label: __( 'Landscape (4:3)', 'tryaura' ),
			value: '4:3',
			icon: <RectangleHorizontal />,
			locked: ! hasPro(),
		},
		{
			label: __( 'Landscape (16:9)', 'tryaura' ),
			value: '16:9',
			icon: <RectangleHorizontal />,
			locked: ! hasPro(),
		},
		{
			label: __( 'Landscape (21:9)', 'tryaura' ),
			value: '21:9',
			icon: <RectangleHorizontal />,
			locked: ! hasPro(),
		},
	] );

	return (
		<>
			{ /* #26: "Start from a look" — a Pro feature. The real template row is
			   injected by the Pro plugin via this filter; non-Pro users see a
			   locked teaser that drives upgrades. Hidden in thumbnail mode. */ }
			{ ! isThumbnailMode &&
				applyFilters(
					'tryaura.enhancer.image_template_row',
					hasPro() ? null : <LockedTemplateTeaser />,
					{ imageConfigData, setImageConfigData }
				) }

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

						{ /* #33: apparel output — on model / ghost mannequin. */ }
						<ModernSelect
							value={ imageConfigData?.apparelMode ?? '' }
							onChange={ ( val ) =>
								setImageConfigData( { apparelMode: val } )
							}
							label={ __( 'Apparel Output', 'tryaura' ) }
							options={ apparelOptions }
							disabled={ isBusy }
							showLockedPopover={ ! hasPro() }
							lockedPopoverMessage={ __(
								'Generate invisible-mannequin (ghost mannequin) product shots with a pro account.',
								'tryaura'
							) }
							lockedPopoverUpgradeUrl={ getUpgradeToProUrl() }
						/>
						{ imageConfigData?.apparelMode === 'ghost-mannequin' && (
							<span className="text-[12px] text-[#828282] -mt-4">
								{ __(
									'The garment keeps its worn shape with no visible person or mannequin.',
									'tryaura'
								) }
							</span>
						) }
					</>
				) }
			</>

			<ModernSelect
				value={ imageConfigData?.aspectRatio ?? '' }
				variant="list"
				onChange={ ( val ) =>
					setImageConfigData( {
						aspectRatio: val,
					} )
				}
				label={ __( 'Aspect Ratio', 'tryaura' ) }
				options={ allAspectRatios }
				disabled={ isBusy }
				showLockedPopover={ ! hasPro() }
				lockedPopoverMessage={ proFeaturePopoverMessage }
				lockedPopoverUpgradeUrl={ getUpgradeToProUrl() }
			/>

			{ /* #29: output resolution. 4K renders on Nano Banana Pro. */ }
			<ModernSelect
				value={ imageConfigData?.resolution ?? '1K' }
				variant="list"
				onChange={ ( val ) =>
					setImageConfigData( {
						resolution: val,
					} )
				}
				label={ __( 'Resolution', 'tryaura' ) }
				options={ [
					{ label: __( '1K', 'tryaura' ), value: '1K' },
					{ label: __( '2K', 'tryaura' ), value: '2K' },
					{ label: __( '4K', 'tryaura' ), value: '4K' },
				] }
				disabled={ isBusy }
			/>
			{ imageConfigData?.resolution === '4K' && (
				<span className="text-[12px] text-[#828282] -mt-4">
					{ __(
						'4K renders with Nano Banana Pro (gemini-3-pro-image).',
						'tryaura'
					) }
				</span>
			) }

			<label
				style={ {
					display: 'flex',
					flexDirection: 'column',
					gap: 4,
				} }
				htmlFor="tryaura-image-optional-prompt"
			>
				<div className="flex flex-row gap-2 justify-between mb-2">
					<span
						className={ twMerge(
							'w-[500] text-[14px]',
							! hasPro() ? 'text-[#929296]' : ''
						) }
					>
						{ isBlockEditorPage && ! isWoocommerceProductPage
							? __( 'Prompt', 'tryaura' )
							: __( 'Prompt (Optional)', 'tryaura' ) }
					</span>
					{ ! hasPro() && (
						<CrownIcon
							// @ts-ignore
							ref={ setPromptPopoverAnchor }
							className="text-[14px] cursor-pointer"
							onMouseEnter={ handlePromptPopoverEnter }
							onMouseLeave={ handlePromptPopoverLeave }
							onFocus={ handlePromptPopoverEnter }
							onBlur={ handlePromptPopoverLeave }
							role="button"
							tabIndex={ 0 }
							aria-label={ __( 'Upgrade to Pro', 'tryaura' ) }
						/>
					) }
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
					id="tryaura-image-optional-prompt"
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

			<label
				style={ {
					display: 'flex',
					flexDirection: 'column',
					gap: 4,
				} }
				htmlFor="tryaura-image-negative-prompt"
			>
				<span
					className={ twMerge(
						'w-[500] text-[14px] mb-2',
						! hasPro() ? 'text-[#929296]' : ''
					) }
				>
					{ __( 'Negative Prompt (Optional)', 'tryaura' ) }
				</span>
				<textarea
					className="border border-[#E9E9E9] placeholder-[#A5A5AA] max-h-44 focus:shadow-none focus:ring-1 focus:ring-primary"
					value={ imageConfigData?.negativePrompt ?? '' }
					onChange={ ( e: any ) =>
						hasPro() &&
						setImageConfigData( {
							negativePrompt: e.target.value,
						} )
					}
					disabled={ isBusy || ! hasPro() }
					rows={ 2 }
					id="tryaura-image-negative-prompt"
					placeholder={ __(
						'Things to avoid, e.g. people, text, reflections',
						'tryaura'
					) }
				/>
			</label>

			{ /* #34: one-click cleanup on the source photo. Edit mode (#32) is not
			   shipped, so these apply to the whole image — the fix is scoped by
			   wording, with everything but the named defect pinned. */ }
			{ ! isThumbnailMode && (
				<div className="flex flex-col gap-2">
					<span className="text-[14px] w-[500]">
						{ __( 'Quick cleanup', 'tryaura' ) }
					</span>
					<span className="text-[11px] text-[#828282] leading-snug -mt-1">
						{ __(
							'Fix small defects in the source photo. Runs straight away.',
							'tryaura'
						) }
					</span>
					<div className="flex flex-row flex-wrap gap-2 mt-1">
						{ cleanupPresets.map( ( preset ) => (
							<button
								key={ preset.id }
								type="button"
								onClick={ () => onCleanupClick( preset.id ) }
								disabled={ isBusy }
								title={ preset.instruction }
								className={ twMerge(
									'inline-flex items-center px-3 py-1.5 text-[13px] rounded-full border cursor-pointer transition-colors',
									activeCleanup === preset.id
										? 'border-primary bg-[#EEF0FF] text-primary'
										: 'border-[#E9E9E9] bg-white text-[#333] hover:border-primary',
									isBusy ? 'opacity-60 pointer-events-none' : ''
								) }
							>
								{ preset.label }
							</button>
						) ) }
					</div>
					{ activeCleanup && (
						<span className="text-[11px] text-[#828282]">
							{ __(
								'Cleanup is on — Generate re-runs it. Click the active chip to turn it off.',
								'tryaura'
							) }
						</span>
					) }
				</div>
			) }

			<ProUpgradePopover
				anchor={ promptPopoverAnchor }
				isOpen={ ! hasPro() && isPromptPopoverOpen }
				onClose={ () => setIsPromptPopoverOpen( false ) }
				onMouseEnter={ handlePromptPopoverEnter }
				onMouseLeave={ handlePromptPopoverLeave }
				message={ proFeaturePopoverMessage }
				upgradeUrl={ getUpgradeToProUrl() }
			/>

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
				bypassPromptRequirement={ !! imageConfigData?.apparelMode }
			/>
		</>
	);
}

export default ImageConfigInputs;
