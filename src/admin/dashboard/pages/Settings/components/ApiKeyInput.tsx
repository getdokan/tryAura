import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function ApiKeyInput( { apiKey, setApiKey } ) {
	const [ isHidden, setIsHidden ] = useState( true );

	return (
		<div className="flex flex-col w-full">
			{ /* Label */ }
			<label
				className="text-[14px] font-[500] text-[rgba(37, 37, 45, 1)] mb-[7px]"
				htmlFor={ 'gemini-api-key' }
			>
				{ __( 'Gemini API KEY', 'tryaura' ) }
			</label>

			{ /* Input + Toggle */ }
			<div className="relative mb-[8px]">
				<input
					type={ isHidden ? 'password' : 'text' }
					value={ apiKey }
					onChange={ ( e ) => setApiKey( e.target.value ) }
					placeholder="Enter your API key"
					className="w-full pr-16 border border-[#E9E9E9] rounded-[5px] px-3 py-1"
					id={ 'gemini-api-key' }
				/>

				{ /* Show/Hide button */ }
				<button
					type="button"
					onClick={ () => setIsHidden( ! isHidden ) }
					className="absolute inset-y-0 right-0 px-3 py-2 text-sm font-medium"
				>
					{ isHidden ? 'Show' : 'Hide' }
				</button>
			</div>
			<p className="font-[400] text-[14px] leading-[18px] text-[rgba(99,99,99,1)] m-0">
				{ __( 'Paste the API key provided by Gemini.', 'tryaura' ) }
			</p>
		</div>
	);
}
