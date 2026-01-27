import { dispatch, select } from '@wordpress/data';
import { STORE_NAME } from '../store';
import { __ } from '@wordpress/i18n';
import { Button } from '@tryaura/components';
import { hasPro } from '../../../utils/tryaura';

function GenerateVideoBtn() {
	const liteStore = select( STORE_NAME );
	const supportsVideo = liteStore.getSupportsVideo();
	const isThumbnailMode = liteStore.isThumbnailMode();
	const generatedUrl = liteStore.getGeneratedUrl();
	const activeTab = liteStore.getActiveTab();
	let content = null;

	if (
		supportsVideo &&
		! isThumbnailMode &&
		activeTab === 'image' &&
		generatedUrl
	) {
		content = (
			<div className="flex justify-center">
				<Button
					variant="solid"
					className="border border-primary text-primary bg-white"
					onClick={ () =>
						dispatch( STORE_NAME ).setActiveTab( 'video' )
					}
					isPro={ hasPro() }
				>
					{ __( 'Generate Video', 'tryaura' ) }
				</Button>
			</div>
		);
	}
	return content;
}

export default GenerateVideoBtn;
