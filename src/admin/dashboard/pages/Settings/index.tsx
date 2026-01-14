import { __ } from '@wordpress/i18n';
import Gemini from "./Gemini";
import ProductTryOn from "./Woocommerce/ProductTryOn";

const Index = () => {
	return (
		<div className="flex flex-col">
			<h1 className="font-[600] font-semibold text-[20px] leading-[28px] text-[rgba(51,51,51,0.8)] mb-[20px]">
				{ __( 'Settings', 'try-aura' ) }
			</h1>

			<div className="flex flex-col gap-8">
				<Gemini />
				<ProductTryOn />
			</div>
		</div>
	);
};

export default Index;
