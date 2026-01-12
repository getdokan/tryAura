import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../store';
import GroupButton from '../../../components/GroupButton';
import { __ } from '@wordpress/i18n';
import ImageConfigInputs from './ImageConfigInputs';
import VideoConfigInputs from './VideoConfigInputs';

function ConfigSettings( {
	supportsVideo,
	doGenerate,
	doGenerateVideo,
	className = '',
} ) {
	const { activeTab, isBusy, isVideoBusy, isThumbnailMode } = useSelect(
		( select ) => {
			const store = select( STORE_NAME );
			return {
				activeTab: store.getActiveTab(),
				isBusy: store.isBusy(),
				isVideoBusy: store.isVideoBusy(),
				isThumbnailMode: store.isThumbnailMode(),
			};
		},
		[]
	);

	const { setActiveTab } = useDispatch( STORE_NAME );

	return (
		<div className={ className }>
			{ /* Tabs for Generated content */ }
			{ supportsVideo && ! isThumbnailMode && (
				<GroupButton
					options={ [
						{
							label: __( 'Generate Image', 'tryaura' ),
							value: 'image',
							disabled: isBusy || isVideoBusy,
						},
						{
							label: __( 'Generate Video', 'tryaura' ),
							value: 'video',
							disabled: isBusy || isVideoBusy,
						},
					] }
					value={ activeTab }
					onClick={ ( tab ) => setActiveTab( tab ) }
				/>
			) }

			<div className="flex flex-col gap-[12px]">
				{ activeTab === 'image' ? (
					<ImageConfigInputs doGenerate={ doGenerate } />
				) : (
					<VideoConfigInputs doGenerateVideo={ doGenerateVideo } />
				) }
			</div>
		</div>
	);
}

export default ConfigSettings;
