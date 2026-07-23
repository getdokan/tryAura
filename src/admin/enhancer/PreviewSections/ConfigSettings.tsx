import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../store';
import GroupButton from '../../../components/GroupButton';
import { __ } from '@wordpress/i18n';
import ImageConfigInputs from './ImageConfigInputs';
import EditConfigInputs from './EditConfigInputs';
import { applyFilters } from '@wordpress/hooks';
import ConfigFooter from './ConfigFooter';

import { Slot } from '@wordpress/components';
import { hasPro } from '../../../utils/tryaura';
import DummyVideoConfigInputs from './DummyVideoConfigInputs';

function ConfigSettings( { doGenerate, className = '' } ) {
	const { activeTab, isBusy, isThumbnailMode } = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			activeTab: store.getActiveTab(),
			isBusy: store.isBusy(),
			isThumbnailMode: store.isThumbnailMode(),
		};
	}, [] );

	const { setActiveTab } = useDispatch( STORE_NAME );

	const tabs = applyFilters( 'tryaura.enhancer.tabs', [
		{
			label: __( 'Image', 'tryaura' ),
			value: 'image',
			disabled: isBusy,
		},
		{
			label: __( 'Video', 'tryaura' ),
			value: 'video',
			disabled: isBusy,
			locked: true,
		},
		// #32: Edit tab. Open to everyone (it advertises the feature) but the panel
		// inside is Pro-gated, so the tab shows the Pro crown for non-Pro users —
		// same as the Generate Video tab. Hidden in single-purpose thumbnail mode.
		...( isThumbnailMode
			? []
			: [
					{
						label: __( 'Edit', 'tryaura' ),
						value: 'edit',
						disabled: isBusy,
						locked: ! hasPro(),
					},
			  ] ),
	] );

	return (
		<div className={ className }>
			{ /* Tabs for Generated content */ }
			{ tabs.length > 1 && ! isThumbnailMode && (
				<GroupButton
					options={ tabs }
					value={ activeTab }
					onClick={ ( tab ) => setActiveTab( tab ) }
				/>
			) }

			<div className="flex flex-col gap-[12px]">
				{ activeTab === 'image' && (
					<ImageConfigInputs doGenerate={ doGenerate } />
				) }

				{ activeTab === 'edit' && (
					<EditConfigInputs doGenerate={ doGenerate } />
				) }

				{ activeTab === 'video' && ! hasPro() && (
					<DummyVideoConfigInputs />
				) }

				{ hasPro() && (
					<>
						<Slot
							name="TryAuraEnhancerConfig"
							fillProps={ {
								ConfigFooter,
							} }
						/>
					</>
				) }
			</div>
		</div>
	);
}

export default ConfigSettings;
