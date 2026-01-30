import geminiLogo from '../assets/geminiLogo.svg';
import { Button } from '../../../../../components';
import { useNavigate } from 'react-router-dom';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
// @ts-ignore
import { STORE_NAME } from '@tryaura/settings';
import SettingItemCard from '../components/SettingItemCard';

declare global {
	interface Window {
		// eslint-disable-line @typescript-eslint/consistent-type-definitions
		tryAura?: {
			restUrl: string;
			nonce: string;
			apiKey: string;
			optionKey: string;
		};
	}
}

function Index() {
	const { settings, fetching } = useSelect( ( select ) => {
		return {
			settings: select( STORE_NAME ).getSettings(),
			fetching: select( STORE_NAME ).isFetchingSettings(),
		};
	}, [] );

	const data = window.tryAura!;
	const apiKey = settings[ data.optionKey ]?.google?.apiKey;

	return (
		<SettingItemCard
			icon={ <img src={ geminiLogo } alt="gemini logo" /> }
			title={ __( 'Gemini API', 'tryaura' ) }
			badge={
				apiKey ? (
					<p className="bg-green-100 text-green-700 rounded m-0 py-1 px-3">
						{ __( 'Connected', 'tryaura' ) }
					</p>
				) : (
					<p className="bg-red-100 text-red-700 rounded m-0 py-1 px-3">
						{ __( 'Disconnected', 'tryaura' ) }
					</p>
				)
			}
			subTitle={ __(
				'This key authenticates requests between your store and TryAura services.',
				'tryaura'
			) }
			link={ '/settings/gemini' }
			linkText={ __( 'Configure', 'tryaura' ) }
			loading={fetching}
		/>
	);
}

export default Index;
