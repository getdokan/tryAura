import geminiLogo from '../assets/geminiLogo.svg';
import { Button } from '../../../../../components';
import { useNavigate } from "react-router-dom";
import { __ } from "@wordpress/i18n";

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
	const navigate = useNavigate();
	return (
		<div className="flex justify-between flex-wrap bg-[#FFFFFF] border-2 border-[#FFFFFF] p-[24px] rounded-[16px]">
			<div className="flex">
				<div className="mr-[14px]">
					<img src={ geminiLogo } alt="gemini logo" />
				</div>
				<div className="flex flex-col justify-center">
					<div className="flex mb-[10px] items-center">
						<div className="font-[600] text-[16px] leading-[22px] text-[rgba(37,37,45,1)]">
							{ __( 'Gemini API', 'try-aura' ) }
						</div>
						<div className="ml-[12px]">
							{ window.tryAura?.apiKey ? (
								<p className="bg-green-100 text-green-700 rounded m-0 py-1 px-3">
									{ __( 'Connected', 'try-aura' ) }
								</p>
							) : (
								<p className="bg-red-100 text-red-700 rounded m-0 py-1 px-3">
									{ __( 'Disconnected', 'try-aura' ) }
								</p>
							) }
						</div>
					</div>

					<div className="font-[400] text-[14px] leading-[18px] text-[rgba(99,99,99,1)]">
						{ __(
							'This key authenticates requests between your store and TryAura services.',
							'try-aura'
						) }
					</div>
				</div>
			</div>
			<div className="flex items-center">
				<Button
					className="py-3 px-7"
					onClick={ () => {
						navigate( '/settings/gemini' );
					} }
				>
					Configure
				</Button>
			</div>
		</div>
	);
}

export default Index;
