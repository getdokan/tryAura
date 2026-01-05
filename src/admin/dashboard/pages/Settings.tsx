import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import geminiLogo from './assets/geminiLogo.svg';
import {Button} from '../../../components'
import GeminiIntegrationSettings from './components/GeminIntegrationSettings';
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

	useEffect( () => {
		// Attach REST middlewares: root + nonce for admin context.
		apiFetch.use( apiFetch.createRootURLMiddleware( data.restUrl ) );
		apiFetch.use( apiFetch.createNonceMiddleware( data.nonce ) );
	}, [] );

	const [ apiKey, setApiKey ] = useState< string >( data.apiKey || '' );
	const [ saving, setSaving ] = useState< boolean >( false );
	const [ saved, setSaved ] = useState< boolean >( false );
	const [ error, setError ] = useState< string | null >( null );

	const [ isSettingsMainPage, setIsSettingsMainPage ] = useState< boolean >( true);


	// On mount, fetch the current saved value to ensure persistence across reloads.
	useEffect( () => {
		let cancelled = false;
		( async () => {
			try {
				const res = await apiFetch( { path: '/try-aura/v1/settings' } );
				const current = ( res as Record< string, unknown > )[
					data.optionKey
				];
				if ( ! cancelled && typeof current === 'string' ) {
					setApiKey( current );
				}
			} catch ( e ) {
				// Ignore fetch errors here; the field will fallback to localized value.
			}
		} )();
		return () => {
			cancelled = true;
		};
	}, [ data.optionKey ] );

	const onSave = async () => {
		setSaving( true );
		setSaved( false );
		setError( null );
		try {
			// Update via WP Settings REST endpoint; our option is exposed via register_setting.
			const res = await apiFetch( {
				path: '/try-aura/v1/settings',
				method: 'POST',
				data: { [ data.optionKey ]: apiKey },
			} );
			// Update local state with returned value (mirrors saved setting)
			const newValue = ( res as Record< string, unknown > )[
				data.optionKey
			];
			setApiKey(
				( typeof newValue === 'string' ? newValue : apiKey ) as string
			);
			setSaved( true );
		} catch ( e: unknown ) {
			const msg =
				e && typeof e === 'object' && 'message' in e
					? String( ( e as any ).message )
					: __( 'Something went wrong', 'try-aura' );
			setError( msg );
		} finally {
			setSaving( false );
		}
	};

	return (
		<>
			{isSettingsMainPage && (
				<div>
					<div className='font-inter font-semibold text-[20px] leading-[28px] align-middle mb-[30px]'>
						Settings
					</div>

					<div className='flex justify-between bg-[#FFFFFF] border-2 border-[#FFFFFF] p-7 rounded-[20px]'>
						<div className='flex'>
							<div className='mr-[14px]'>
								<img src={geminiLogo} alt="alt text" srcset="" />
							</div>
							<div className='flex flex-col justify-center'>
								<div className='flex mb-[10px]'>
									<div className="font-sans font-semibold text-base leading-[22.88px] tracking-normal">
										Gemin API
									</div>
									<div className='ml-[12px]'>
										<p className="bg-green-100 text-green-700 rounded m-0">
											Connected

										</p>
									</div>
								</div>

								<div>
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
