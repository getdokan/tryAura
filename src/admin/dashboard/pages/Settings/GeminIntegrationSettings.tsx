import { ArrowLeft } from 'lucide-react';
import geminiLogo from './assets/geminiLogo.svg';
import ApiKeyInput from './components/ApiKeyInput';
import { ModernSelect, Button } from "../../../../components";
import { toast } from "@tryaura/components";
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from 'react-router-dom';
import { useSelect } from '@wordpress/data';

const InitialLoader = () => {
	return (
		<div className="flex flex-col gap-[30px] w-full md:w-[550px] animate-pulse">
			<div className="flex flex-col gap-[24px]">
				<span className="block w-[63px] h-[62px] bg-gray-300 rounded-md"></span>
				<div>
					<span className="block h-[28px] w-[250px] bg-gray-300 rounded-md mb-[8px]"></span>
					<span className="block h-[18px] w-full bg-gray-300 rounded-md"></span>
				</div>
				<div>
					<span className="block h-[22px] w-[150px] bg-gray-300 rounded-md mb-[8px]"></span>
					<span className="block h-[40px] w-full bg-gray-300 rounded-md mb-[8px]"></span>
					<span className="block h-[15px] w-[250px] bg-gray-300 rounded-md"></span>
				</div>
			</div>
		</div>
	);
};

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
	const [ fetching, setFetching ] = useState< boolean >( false );

	// On mount, fetch the current saved value to ensure persistence across reloads.
	useEffect( () => {
		let cancelled = false;
		( async () => {
			try {
				setFetching( true );
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
				setFetching( false );
			} catch ( e ) {
				// Ignore fetch errors here; the field will fallback to localized value.
				setFetching( false );
			}
		} )();
		return () => {
			cancelled = true;
		};
	}, [ data.optionKey, defaultImageModel, defaultVideoModel ] );

	const onSave = async () => {
		if ( ! apiKey ) {
			toast.error( __( 'API key is required', 'try-aura' ) );
			return;
		}
		setSaving( true );
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

				window.tryAura.apiKey = newValue.google.apiKey;
				window.tryAura.imageModel = newValue.google.imageModel;
				window.tryAura.videoModel = newValue.google.videoModel;

				toast.success(
					__( 'Gemini API settings saved successfully!', 'try-aura' )
				);
			}
		} catch ( e: unknown ) {
			const msg =
				e && typeof e === 'object' && 'message' in e
					? String( ( e as any ).message )
					: __( 'Something went wrong', 'try-aura' );

			toast.error( msg );
		} finally {
			setSaving( false );
		}
	};

	return (
		<div className="bg-white rounded-[16px]">
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
			<div className="flex flex-col items-center justify-center m-[22px] sm:my-[100px]">
				{ fetching ? (
					<InitialLoader />
				) : (
					<div className="flex flex-col w-full md:w-[550px]">
						<div className="flex flex-col gap-[24px] mb-[36px]">
							<div>
								<img src={ geminiLogo } />
							</div>
							<div>
								<div className="font-semibold text-[20px] leading-[28px] tracking-normal align-middle mb-[8px]">
									{ __( 'Gemini Integration', 'try-aura' ) }
								</div>
								<div className="text-[14px] font-[400] leading-[18.67px] text-[rgba(99,99,99,1)]">
									{ __(
										'Connect your Gemini account with an API key. Need help finding your',
										'try-aura'
									) }
									&nbsp;
									<a
										href="https://aistudio.google.com/api-keys"
										className="text-blue-600 underline hover:text-blue-700"
										target="_blank"
										rel="noreferrer"
									>
										{ __( 'API key ?', 'try-aura' ) }
									</a>
								</div>
							</div>
						</div>
						<div className="flex flex-col gap-[24px]">
							<ApiKeyInput
								apiKey={ apiKey }
								setApiKey={ setApiKey }
							/>
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
				) }
			</div>

			<div className="flex gap-[10px] justify-end border-t border-solid border-[#f0e5e5] p-[22px]">
				{ ! fetching && (
					<>
						<Button
							className="py-3 px-7"
							onClick={ onSave }
							disabled={ saving }
							loading={ saving }
						>
							{ __( 'Connect', 'try-aura' ) }
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
					</>
				) }
			</div>
		</div>
	);
};
export default GeminiIntegrationSettings;
