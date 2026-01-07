import { __ } from '@wordpress/i18n';
import geminiLogo from './assets/geminiLogo.svg';
import { Button } from '../../../../components';
import { useNavigate } from "react-router-dom";

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

const Index = () => {
	const navigate = useNavigate();
	return (
		<div>
			<h1 className="font-[600] font-semibold text-[20px] leading-[28px] text-[rgba(51,51,51,0.8)]">
				{ __( 'Settings', 'try-aura' ) }
			</h1>
			<div className="mt-[20px] flex justify-between bg-[#FFFFFF] border-2 border-[#FFFFFF] p-7 rounded-[16px]">
				<div className="flex">
					<div className="mr-[14px]">
						<img src={ geminiLogo } alt="gemini logo" />
					</div>
					<div className="flex flex-col justify-center">
						<div className="flex mb-[10px] items-center">
							<div className="font-semibold text-base leading-[22.88px] tracking-normal">
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

						<div className=" text-[14px] text-gray-600 opacity-70">
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
		</div>
	);
};

export default Index;
