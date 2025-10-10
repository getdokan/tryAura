import { render, useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { Button, TextControl, Notice, Spinner, Card, CardBody } from '@wordpress/components';

declare global {
    interface Window { // eslint-disable-line @typescript-eslint/consistent-type-definitions
        tryAura?: {
            restUrl: string;
            nonce: string;
            apiKey: string;
            optionKey: string;
        };
    }
}

const App = () => {
    const data = window.tryAura!;

    useEffect(() => {
        // Attach REST middlewares: root + nonce for admin context.
        apiFetch.use( apiFetch.createRootURLMiddleware( data.restUrl ) );
        apiFetch.use( apiFetch.createNonceMiddleware( data.nonce ) );
    }, []);

    const [ apiKey, setApiKey ] = useState<string>( data.apiKey || '' );
    const [ saving, setSaving ] = useState<boolean>( false );
    const [ saved, setSaved ] = useState<boolean>( false );
    const [ error, setError ] = useState<string | null>( null );

    // On mount, fetch the current saved value to ensure persistence across reloads.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await apiFetch( { path: '/try-aura/v1/settings' } );
                const current = (res as Record<string, unknown>)[ data.optionKey ];
                if ( !cancelled && typeof current === 'string' ) {
                    setApiKey( current );
                }
            } catch (e) {
                // Ignore fetch errors here; the field will fallback to localized value.
            }
        })();
        return () => { cancelled = true; };
    }, [ data.optionKey ]);

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
            const newValue = (res as Record<string, unknown>)[ data.optionKey ];
            setApiKey( (typeof newValue === 'string' ? newValue : apiKey) as string );
            setSaved( true );
        } catch ( e: unknown ) {
            const msg = e && typeof e === 'object' && 'message' in e ? String( (e as any).message ) : __('Something went wrong', 'try-aura');
            setError( msg );
        } finally {
            setSaving( false );
        }
    };

    return (
        <Card>
            <CardBody>
                <p>{ __( 'Enter your TryAura API key. This key authenticates requests between your store and TryAura services.', 'try-aura' ) }</p>
                { error && (
                    <Notice status="error" isDismissible={ false }>
                        { error }
                    </Notice>
                ) }
                { saved && (
                    <Notice status="success" isDismissible={ true } onRemove={ () => setSaved(false) }>
                        { __( 'API Key saved successfully.', 'try-aura' ) }
                    </Notice>
                ) }
                <TextControl
                    label={ __( 'API Key', 'try-aura' ) }
                    value={ apiKey }
                    onChange={ setApiKey }
                    help={ __( 'Paste the API key provided by TryAura.', 'try-aura' ) }
                />
                <Button
                    variant="primary"
                    onClick={ onSave }
                    disabled={ saving }
                >
                    { saving ? <><Spinner /> { __( 'Saving…', 'try-aura' ) }</> : __( 'Save Changes', 'try-aura' ) }
                </Button>
            </CardBody>
        </Card>
    );
};

function mount() {
    const root = document.getElementById('try-aura-settings-root');
    if ( root ) {
        render( <App />, root );
    }
}

document.addEventListener('DOMContentLoaded', mount);
