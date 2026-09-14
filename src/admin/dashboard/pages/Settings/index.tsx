import { __ } from '@wordpress/i18n';
import { Slot } from '@wordpress/components';
import Gemini from './Gemini';
import TryOnControl from './Woocommerce/TryOnControl';
import LiveTryOnUpsellCard from './LiveTryOn/UpsellCard';
import SettingItemCard from './components/SettingItemCard';
import { hasPro } from '../../../../utils/tryaura';

const Index = () => {
	// @ts-ignore
	const wcExists = window?.tryAura?.wcExists ?? false;

	return (
		<div className="flex flex-col">
			<h1 className="font-[600] font-semibold text-[20px] leading-[28px] text-[rgba(51,51,51,0.8)] mb-[20px]">
				{ __( 'Settings', 'tryaura' ) }
			</h1>

			<div className="flex flex-col gap-8">
				<Gemini />
				{ wcExists && <TryOnControl /> }
				{ wcExists && ! hasPro() && <LiveTryOnUpsellCard /> }
				<Slot
					name="tryaura-settings-cards"
					fillProps={ { SettingItemCard, wcExists } }
				/>
			</div>
		</div>
	);
};

export default Index;
