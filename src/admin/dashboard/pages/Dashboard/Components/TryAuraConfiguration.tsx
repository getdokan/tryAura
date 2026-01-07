import { __ } from '@wordpress/i18n';
import { Wand2 } from 'lucide-react';
import { Link } from 'react-router-dom';

function TryAuraConfiguration() {
	return (
		<div className="bg-white rounded-[16px] border border-[rgba(230,230,230,1)] p-[24px] flex flex-col items-center justify-center text-center h-full w-full">
			<div className="w-[80px] h-[80px] rounded-[16px] border border-[rgba(230,230,230,1)] flex items-center justify-center mb-[24px]">
				<Wand2
					size={ 40 }
					className="text-[#7047EB]"
					strokeWidth={ 1.5 }
				/>
			</div>

			<h2 className="text-[18px] font-[600] text-[rgba(51,51,51,1)] mb-[8px] m-0">
				{ __( 'Try Aura Configuration', 'try-aura' ) }
			</h2>
			<p className="text-[14px] text-[rgba(153,153,153,1)] mb-[32px] m-0">
				{ __( 'Configure your Gemini with API', 'try-aura' ) }
			</p>

			<Link
				to="/settings/gemini"
				className="bg-[#7047EB] text-white px-[32px] py-[12px] rounded-[8px] text-[16px] font-[500] hover:bg-[#5f3bc7] transition-colors no-underline"
			>
				{ __( 'Configure', 'try-aura' ) }
			</Link>

			<div className="mt-[40px] text-[14px] text-[rgba(153,153,153,1)]">
				{ __( 'Need help configuring', 'try-aura' ) }{ ' ' }
				<a
					href="https://aistudio.google.com/app/apikey"
					target="_blank"
					rel="noreferrer"
					className="text-[#7047EB] no-underline hover:underline"
				>
					{ __( 'API Keys', 'try-aura' ) }?
				</a>
			</div>
		</div>
	);
}

export default TryAuraConfiguration;
