import { __ } from '@wordpress/i18n';

function Index( { generatedUrl, message, isBusy } ) {
	return (
		<div className="w-full sm:w-1/3">
			<div className="font-[500] text-[14px] text-[#25252D] mb-[20px]">
				{ __( 'Generated', 'try-aura' ) }
			</div>
			{ generatedUrl ? (
				<img
					src={ generatedUrl }
					alt="Generated try-on"
					className="max-w-full h-auto block rounded-[8px]"
				/>
			) : (
				<div className="bg-[#F3F4F6] rounded-[8px] min-h-[300px] flex items-center text-center justify-center p-[12px] font-[500] text-[14px] text-[#25252D]">
					<span>{ message }</span>
				</div>
			) }
			{ generatedUrl ? (
				<div className="flex gap-2 mt-2 justify-end">
					<a
						className={ `bg-[#000000] text-white px-[50px] py-[10px] cursor-pointer mx-auto ${
							isBusy ? 'opacity-60 cursor-not-allowed' : ''
						}` }
						href={ isBusy ? undefined : generatedUrl }
						download={ isBusy ? undefined : 'tryon.png' }
						aria-disabled={ isBusy }
					>
						{ __( 'Download', 'try-aura' ) }
					</a>
				</div>
			) : null }
		</div>
	);
}

export default Index;
