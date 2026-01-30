import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../store';
import GroupButton from '../../../components/GroupButton';
import { __ } from '@wordpress/i18n';
import ImageConfigInputs from './ImageConfigInputs';
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
			label: __( 'Generate Image', 'tryaura' ),
			value: 'image',
			disabled: isBusy,
		},
		{
			label: __( 'Generate Video', 'tryaura' ),
			value: 'video',
			disabled: isBusy,
			locked: true,
		},
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
