import { __ } from '@wordpress/i18n';
import { Wand2 } from 'lucide-react';
import { Link } from 'react-router-dom';

function TryAuraConfiguration( { className = '' }: { className: string } ) {
	return (
		<div className={ className }>
			<div className="w-[80px] h-[80px] rounded-[16px] border border-[rgba(230,230,230,1)] flex items-center justify-center mb-[24px]">
				<svg
					width="32"
					height="32"
					viewBox="0 0 32 32"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M18.9982 8.5L23.4982 13M5.49824 7V13M26.4982 19V25M12.9982 1V4M8.49824 10H2.49824M29.4982 22H23.4982M14.4982 2.5H11.4982M30.4582 3.46L28.5382 1.54C28.3695 1.36948 28.1686 1.2341 27.9471 1.14172C27.7257 1.04933 27.4882 1.00176 27.2482 1.00176C27.0083 1.00176 26.7708 1.04933 26.5493 1.14172C26.3279 1.2341 26.127 1.36948 25.9582 1.54L1.53824 25.96C1.36771 26.1288 1.23234 26.3297 1.13996 26.5511C1.04757 26.7725 1 27.0101 1 27.25C1 27.4899 1.04757 27.7275 1.13996 27.9489C1.23234 28.1703 1.36771 28.3712 1.53824 28.54L3.45824 30.46C3.62597 30.6324 3.82654 30.7694 4.0481 30.8629C4.26967 30.9565 4.50773 31.0047 4.74824 31.0047C4.98874 31.0047 5.2268 30.9565 5.44837 30.8629C5.66993 30.7694 5.87051 30.6324 6.03824 30.46L30.4582 6.04C30.6306 5.87227 30.7676 5.6717 30.8611 5.45013C30.9547 5.22857 31.0029 4.9905 31.0029 4.75C31.0029 4.5095 30.9547 4.27143 30.8611 4.04987C30.7676 3.8283 30.6306 3.62773 30.4582 3.46Z"
						stroke="url(#paint0_linear_12802_230)"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<defs>
						<linearGradient
							id="paint0_linear_12802_230"
							x1="33.9983"
							y1="-4.89025e-07"
							x2="-0.501709"
							y2="26.5"
							gradientUnits="userSpaceOnUse"
						>
							<stop stopColor="#FFFB0A" />
							<stop offset="0.264423" stopColor="#FF373A" />
							<stop offset="1" stopColor="#3889FD" />
						</linearGradient>
					</defs>
				</svg>
			</div>

			<h2 className="text-[18px] font-[600] text-[rgba(51,51,51,1)] mb-[8px] m-0">
				{ __( 'Try Aura Configuration', 'try-aura' ) }
			</h2>
			<p className="text-[14px] text-[rgba(153,153,153,1)] mb-[32px] m-0">
				{ __( 'Configure your Gemini with API', 'try-aura' ) }
			</p>

			<Link
				to="/settings/gemini"
				className="bg-primary text-white px-[32px] py-[12px] rounded-[8px] text-[16px] font-[500] hover:bg-primary-dark transition-colors no-underline"
			>
				{ __( 'Configure', 'try-aura' ) }
			</Link>

			<div className="mt-[40px] text-[14px] text-[rgba(153,153,153,1)]">
				{ __( 'Need help configuring', 'try-aura' ) }{ ' ' }
				<a
					href="https://aistudio.google.com/app/apikey"
					target="_blank"
					rel="noreferrer"
					className="text-primary no-underline hover:underline"
				>
					{ __( 'API Keys', 'try-aura' ) }?
				</a>
			</div>
		</div>
	);
}

export default TryAuraConfiguration;
