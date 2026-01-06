import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import geminiLogo from './assets/geminiLogo.svg';
import {Button} from '../../../components'
import GeminiIntegrationSettings from './components/GeminIntegrationSettings';
import apiFetch from '@wordpress/api-fetch';

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

const Settings = () => {

    const data = window.tryAura!;

	const [ isSettingsMainPage, setIsSettingsMainPage ] = useState< boolean >( true);
	const [ apiKey, setApiKey ]                         = useState< string >( data.apiKey || '' );

	return (
		<>
			{isSettingsMainPage && (
				<div>
					<div className='font-semibold text-[20px] leading-[28px] align-middle mb-[30px]'>
						Settings
					</div>
					<div className='flex justify-between bg-[#FFFFFF] border-2 border-[#FFFFFF] p-7 rounded-[20px]'>
						<div className='flex'>
							<div className='mr-[14px]'>
								<img src={geminiLogo} alt="gemini logo"/>
							</div>
							<div className='flex flex-col justify-center'>
								<div className='flex mb-[10px] items-center'>
									<div className="font-semibold text-base leading-[22.88px] tracking-normal">
										Gemin API
									</div>
									<div className='ml-[12px]'>
										{apiKey && (
											<p className="bg-green-100 text-green-700 rounded m-0 py-1 px-3">
											Connected
											</p>
										)}
									</div>
								</div>

								<div className=' text-[14px] text-gray-600 opacity-70'>
								This key authenticates requests between your store and TryAura services.
								</div>
							</div>
						</div>
						<div className='flex items-center'>
						<Button
							className='py-3 px-7'
							onClick={()=> {
								setIsSettingsMainPage(false);
							}}
						> 
							Configure
						</Button>
						</div>
					</div>
				</div>
			)}

			{!isSettingsMainPage && (
				<div className='bg-[#FFFFFF]'>

					<GeminiIntegrationSettings 
						isSettingsMainPage = {isSettingsMainPage}
						setIsSettingsMainPage = {setIsSettingsMainPage}
						apiKey={ apiKey }
						setApiKey={setApiKey}
					/>
				</div>

			)}
			
		
		</>
		// <Card>
		// 	<CardBody>
		// 		<p>
		// 			{ __(
		// 				'Enter your TryAura API key. This key authenticates requests between your store and TryAura services.',
		// 				'try-aura'
		// 			) }
		// 		</p>
		// 		{ error && (
		// 			<Notice status="error" isDismissible={ false }>
		// 				{ error }
		// 			</Notice>
		// 		) }
		// 		{ saved && (
		// 			<Notice
		// 				status="success"
		// 				isDismissible={ true }
		// 				onRemove={ () => setSaved( false ) }
		// 			>
		// 				{ __( 'API Key saved successfully.', 'try-aura' ) }
		// 			</Notice>
		// 		) }
		// 		<TextControl
		// 			label={ __( 'API Key', 'try-aura' ) }
		// 			value={ apiKey }
		// 			onChange={ setApiKey }
		// 			help={ __(
		// 				'Paste the API key provided by TryAura.',
		// 				'try-aura'
		// 			) }
		// 		/>
		// 		<Button
		// 			variant="primary"
		// 			onClick={ onSave }
		// 			disabled={ saving }
		// 		>
		// 			{ saving ? (
		// 				<>
		// 					<Spinner /> { __( 'Saving…', 'try-aura' ) }
		// 				</>
		// 			) : (
		// 				__( 'Save Changes', 'try-aura' )
		// 			) }
		// 		</Button>
		// 	</CardBody>
		// </Card>
	);
};

export default Settings;
