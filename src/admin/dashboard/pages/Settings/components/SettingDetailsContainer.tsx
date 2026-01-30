import { ArrowLeft } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { useNavigate } from 'react-router-dom';

function SettingDetailsContainer( { children = null, footer = null } ) {
	const navigate = useNavigate();
	return (
		<div className="bg-white rounded-2xl min-h-[90vh] flex flex-col justify-between">
			<div>
				<div>
					<div className="border-b border-solid border-[#f0e5e5]">
						<button
							type="button"
							className="inline-flex items-center gap-1.5 m-5.5 hover:cursor-pointer hover:underline bg-transparent border-none p-0"
							onClick={ () => {
								navigate( '/settings' );
							} }
						>
							<ArrowLeft className="w-4 h-4 rotate-0 opacity-100" />
							<div className="font-medium text-[14px] leading-5 tracking-normal text-center align-middle">
								{ __( 'Back to Settings', 'tryaura' ) }
							</div>
						</button>
					</div>
				</div>
				<div className="flex flex-col items-center justify-center m-5.5 sm:my-25">
					{ children }
				</div>
			</div>

			{ footer && (
				<div className="flex gap-2.5 justify-end border-t border-solid border-[#f0e5e5] p-5.5">
					{ footer }
				</div>
			) }
		</div>
	);
}

export default SettingDetailsContainer;
