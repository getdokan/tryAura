import { ArrowLeft } from 'lucide-react';
import geminiLogo from '../assets/geminiLogo.svg';
import ApiKeyInput from './ApiKeyInput';
import { ModernSelect, Button } from '../../../../../components';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from 'react-router-dom';
import { useSelect } from '@wordpress/data';

const GeminiIntegrationSettings = () => {
	const { videoModels, imageModels, defaultImageModel, defaultVideoModel } =
		useSelect( ( select ) => {
			const models =
				select( 'try-aura/ai-models' ).getProviderModels( 'google' ) ||
				{};

			const vModels: any[] = [];
			const iModels: any[] = [];

			Object.keys( models ).forEach( ( key ) => {
				const model = {
					label: models[ key ].label,
					value: key,
				};

				if ( models[ key ].identity === 'video' ) {
					vModels.push( model );
				} else if ( models[ key ].identity === 'image' ) {
					iModels.push( model );
				}
			} );

			return {
				videoModels: vModels,
				imageModels: iModels,
				defaultImageModel:
					select( 'try-aura/ai-models' ).getDefaultImageModel(),
				defaultVideoModel:
					select( 'try-aura/ai-models' ).getDefaultVideoModel(),
			};
		}, [] );

	const navigate = useNavigate();
	const data = window.tryAura!;
	const [ apiKey, setApiKey ] = useState< string >( '' );

	useEffect( () => {
		// Attach REST middlewares: root + nonce for admin context.
		apiFetch.use( apiFetch.createRootURLMiddleware( data.restUrl ) );
		apiFetch.use( apiFetch.createNonceMiddleware( data.nonce ) );
	}, [] );
	const [ selectedImageModel, setSelectedImageModel ] =
		useState< string >( '' );
	const [ selectedVideoModel, setSelectedVideoModel ] =
		useState< string >( '' );

	const [ saving, setSaving ] = useState< boolean >( false );
	const [ saved, setSaved ] = useState< boolean >( false );
	const [ error, setError ] = useState< string | null >( null );

	// On mount, fetch the current saved value to ensure persistence across reloads.
	useEffect( () => {
		let cancelled = false;
		( async () => {
			try {
				const res = await apiFetch( { path: '/try-aura/v1/settings' } );
				const current = ( res as Record< string, any > )[
					data.optionKey
				];
				if (
					! cancelled &&
					current &&
					typeof current === 'object' &&
					current.google
				) {
					setApiKey( current.google.apiKey || '' );
					setSelectedImageModel(
						current.google.imageModel || defaultImageModel
					);
					setSelectedVideoModel(
						current.google.videoModel || defaultVideoModel
					);
				} else if ( ! cancelled ) {
					setSelectedImageModel( defaultImageModel );
					setSelectedVideoModel( defaultVideoModel );
				}
			} catch ( e ) {
				// Ignore fetch errors here; the field will fallback to localized value.
			}
		} )();
		return () => {
			cancelled = true;
		};
	}, [ data.optionKey, defaultImageModel, defaultVideoModel ] );

	const onSave = async () => {
		setSaving( true );
		setSaved( false );
		setError( null );
		try {
			// Update via WP Settings REST endpoint; our option is exposed via register_setting.
			const res = await apiFetch( {
				path: '/try-aura/v1/settings',
				method: 'POST',
				data: {
					[ data.optionKey ]: {
						google: {
							apiKey,
							imageModel: selectedImageModel,
							videoModel: selectedVideoModel,
						},
					},
				},
			} );
			// Update local state with returned value (mirrors saved setting)
			const newValue = ( res as Record< string, any > )[ data.optionKey ];
			if ( newValue && newValue.google ) {
				setApiKey( newValue.google.apiKey || '' );
				setSelectedImageModel(
					newValue.google.imageModel || defaultImageModel
				);
				setSelectedVideoModel(
					newValue.google.videoModel || defaultVideoModel
				);
			}
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
				<div className="border-b border-solid border-[#f0e5e5]">
					<div
						className="inline-flex items-center gap-1.5 m-[22px] hover:cursor-pointer hover:underline"
						onClick={ () => {
							navigate( '/settings' );
						} }
					>
						<ArrowLeft className="w-4 h-4 rotate-0 opacity-100" />
						<div className="font-medium text-[14px] leading-[20px] tracking-normal text-center align-middle">
							{ __( 'Back to Settings', 'try-aura' ) }
						</div>
					</div>
				</div>
			</div>
			<div className="flex items-center justify-center my-[20px] sm:my-[100px]">
				<div className="flex flex-col gap-[30px]">
					<div className="flex flex-col gap-[19px]">
						<div>
							<img src={ geminiLogo } />
						</div>
						<div>
							<div className="font-semibold text-[20px] leading-[28px] tracking-normal align-middle mb-[5px]">
								Gemini Integration
							</div>
							<div className="text-[14px] text-gray-600/70">
								Connect your Gemini account with an API key.
								Need help finding your{ ' ' }
								<a
									href="https://aistudio.google.com/api-keys"
									className="text-blue-600 underline hover:text-blue-700"
									target="_blank"
									rel="noreferrer"
								>
									API key
								</a>{ ' ' }
								?
							</div>
						</div>
					</div>
					<ApiKeyInput apiKey={ apiKey } setApiKey={ setApiKey } />
					{ apiKey && (
						<>
							<div>
								<ModernSelect
									value={ selectedImageModel }
									label="Select Image Model"
									onChange={ ( val ) => {
										setSelectedImageModel( val );
									} }
									options={ imageModels }
									variant="list"
								/>
							</div>
							<div>
								<ModernSelect
									value={ selectedVideoModel }
									label="Select Video Model"
									onChange={ ( val ) => {
										setSelectedVideoModel( val );
									} }
									options={ videoModels }
									variant="list"
								/>
							</div>
						</>
					) }
				</div>
			</div>

			<div className="flex gap-[10px] justify-end border-t border-solid border-[#f0e5e5] p-[22px]">
				<Button
					className="py-3 px-7"
					onClick={ onSave }
					disabled={ saving }
				>
					Connect
				</Button>
				<Button
					className="py-3 px-7"
					variant="outline"
					onClick={ () => {
						navigate( '/settings' );
					} }
				>
					{ __( 'Cancel', 'try-aura' ) }
				</Button>
			</div>
		</>
	);
};
export default GeminiIntegrationSettings;
