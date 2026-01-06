import { ArrowLeft } from 'lucide-react';
import geminiLogo from '../assets/geminiLogo.svg';
import ApiKeyInput from './ApiKeyInput';
import { ModernSelect } from '../../../../components';
import {Button} from '../../../../components';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import {
	Spinner,
} from '@wordpress/components';


const GeminiIntegrationSettings = ({ isSettingsMainPage,
    setIsSettingsMainPage
 }) => {

    const data = window.tryAura!;

	useEffect( () => {
		// Attach REST middlewares: root + nonce for admin context.
		apiFetch.use( apiFetch.createRootURLMiddleware( data.restUrl ) );
		apiFetch.use( apiFetch.createNonceMiddleware( data.nonce ) );
	}, [] );
    const [selectedImageModel, setSelectedImageModel] = useState<string>("");
    const [selectedVideoModel, setSelectedVideoModel] = useState<string>("");
	const [ apiKey, setApiKey ] = useState< string >( data.apiKey || '' );

    const [ saving, setSaving ] = useState< boolean >( false );
	const [ saved, setSaved ] = useState< boolean >( false );
	const [ error, setError ] = useState< string | null >( null );


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
        <div>
            <div className='border-b border-solid border-[#f0e5e5]'>
                <div className='inline-flex items-center gap-1.5 m-[22px]'
                onClick={
                    () => {
                        setIsSettingsMainPage(true)
                    }
                }
                >
                    <ArrowLeft 
                        className='w-4 h-4 rotate-0 opacity-100'
                    /> 
                    <div className="font-medium text-[14px] leading-[20px] tracking-normal text-center align-middle">
                        Back to Settings
                </div>
                </div>
            </div>
        </div>
            <div className='flex items-center justify-center my-[20px] sm:my-[100px]'>

                <div className='flex flex-col gap-[30px]'>
                    <div className='flex flex-col gap-[19px]'>
                        <div>
                            <img src={geminiLogo} />
                        </div>
                        <div>
                            <div className="font-semibold text-[20px] leading-[28px] tracking-normal align-middle mb-[5px]">
                                Gemini Integration
                            </div>
                            <div className="text-sm text-gray-600">
                            Connect your Gemini account with an API key. Need help finding your <a 
                            href="#" 
                            className="text-blue-600 underline hover:text-blue-700" >
                                API key
                            </a> ?
                            </div>
                        </div>
                    </div>
                    <ApiKeyInput 
                    apiKey = {apiKey}
                    setApiKey={setApiKey}
                    />
                    <div>
                        <ModernSelect
                            value={selectedImageModel}
                            label="Select Image Model"
                            onChange={(val)=> {
                                console.log(val)
                                setSelectedImageModel(val)
                            }}
                            options={[
                                {label:"gemini-2.0-flash-exp", value:"gemini-2.0-flash-exp"},
                                {label:"gemini", value:"val2"},
                                {label:"label3", value: "val3"}
                            ]}
                            variant='list'
                        />
                    </div>
                    <div>
                        <ModernSelect
                                value={selectedVideoModel}
                                label="Select Video Model"
                                onChange={(val)=> {
                                    setSelectedVideoModel(val);
                                }}
                                options={[
                                    {label:"gemini-2.0-flash-exp", value:"val1"},
                                    {label:"gemini-2.0-flash-thinking-exp-1219", value:"val2"},
                                    {label:"gemini-2.0-flash", value: "val3"},
                                    {label:"gemini-1.5-flash", value:"val3"}
                                ]}
                                variant='list'
                        />
                    </div>

                </div>
            </div>

            <div className='flex gap-[10px] justify-end border-t border-solid border-[#f0e5e5] p-[22px]'>
                <Button
                    className='py-3 px-7'
                    onClick={onSave}
					disabled={ saving }
                    
                >
                    Connect
                </Button>
                <Button
                    className='py-3 px-7'
                    variant='outline'
                    onClick={()=> {
                        setIsSettingsMainPage(true);
                    }}
                >
                    Cancel
                </Button>
            </div>
        </>
    )

}
export default GeminiIntegrationSettings;