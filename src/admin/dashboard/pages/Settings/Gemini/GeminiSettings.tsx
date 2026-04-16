import { ArrowLeft } from 'lucide-react';
import geminiLogo from '../assets/geminiLogo.svg';
import openrouterLogo from '../assets/openrouterLogo.svg';
import ApiKeyInput from '../components/ApiKeyInput';
import { ModernSelect, Button } from '../../../../../components';
import { toast } from '@tryaura/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from 'react-router-dom';
import { useSelect, useDispatch } from '@wordpress/data';
import { Slot } from '@wordpress/components';
// @ts-ignore
import { STORE_NAME } from '@tryaura/settings';
import SettingDetailsContainer from '../components/SettingDetailsContainer';

const PROVIDER_OPTIONS = [
	{ label: __( 'Gemini', 'tryaura' ), value: 'google' },
	{ label: __( 'OpenRouter', 'tryaura' ), value: 'openrouter' },
];

/**
 * Validate an API key against the selected provider's API.
 */
async function validateApiKey(
	provider: string,
	key: string
): Promise< boolean > {
	try {
		if ( provider === 'openrouter' ) {
			const res = await fetch(
				'https://openrouter.ai/api/v1/models',
				{
					method: 'GET',
					headers: { Authorization: `Bearer ${ key }` },
				}
			);
			return res.ok;
		}

		// Gemini: lightweight model list call.
		const res = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models?key=${ encodeURIComponent(
				key
			) }`
		);
		return res.ok;
	} catch {
		return false;
	}
}

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

const GeminiSettings = () => {
	const {
		videoModels,
		imageModels,
		defaultImageModel,
		defaultVideoModel,
		settings,
		fetching,
		saving,
	} = useSelect( ( select ) => {
		const providerKey =
			select( STORE_NAME ).getSettings()?.[ window.tryAura?.optionKey ?? '' ]
				?.google?.provider || 'google';

		const models =
			select( 'tryaura/ai-models' ).getProviderModels( providerKey ) || {};

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
				select( 'tryaura/ai-models' ).getDefaultImageModel(),
			defaultVideoModel:
				select( 'tryaura/ai-models' ).getDefaultVideoModel(),
			settings: select( STORE_NAME ).getSettings(),
			fetching: select( STORE_NAME ).isFetchingSettings(),
			saving: select( STORE_NAME ).isSavingSettings(),
		};
	}, [] );

	const { updateSettings } = useDispatch( STORE_NAME );

	const navigate = useNavigate();
	const data = window.tryAura!;
	const [ apiKey, setApiKey ] = useState< string >( '' );
	const [ selectedProvider, setSelectedProvider ] = useState< string >( 'google' );

	const [ selectedImageModel, setSelectedImageModel ] =
		useState< string >( '' );
	const [ selectedVideoModel, setSelectedVideoModel ] =
		useState< string >( '' );

	const isOpenRouter = selectedProvider === 'openrouter';

	// On mount or when settings change, update local state
	useEffect( () => {
		const current = settings[ data.optionKey ];
		if ( current && typeof current === 'object' && current.google ) {
			setApiKey( current.google.apiKey || '' );
			setSelectedProvider( current.google.provider || 'google' );
			setSelectedImageModel(
				current.google.imageModel || defaultImageModel
			);
			setSelectedVideoModel(
				current.google.videoModel || defaultVideoModel
			);
		} else {
			setSelectedImageModel( defaultImageModel );
			setSelectedVideoModel( defaultVideoModel );
		}
	}, [ settings, data.optionKey, defaultImageModel, defaultVideoModel ] );

	const onSave = async () => {
		if ( ! apiKey ) {
			toast.error( __( 'API key is required', 'tryaura' ) );
			return;
		}

		// Validate API key against selected provider.
		const isValid = await validateApiKey( selectedProvider, apiKey );
		if ( ! isValid ) {
			toast.error(
				isOpenRouter
					? __( 'Invalid OpenRouter API key.', 'tryaura' )
					: __( 'Invalid Gemini API key.', 'tryaura' )
			);
			return;
		}

		try {
			const googleSettings: Record< string, string > = {
				provider: selectedProvider,
				apiKey,
				imageModel: selectedImageModel,
			};

			// Preserve the video model; include it for both providers.
			if ( selectedVideoModel ) {
				googleSettings.videoModel = selectedVideoModel;
			}

			const newSettings = {
				...settings,
				[ data.optionKey ]: {
					...settings[ data.optionKey ],
					google: googleSettings,
				},
			};

			const res = await updateSettings( newSettings );

			const newValue = ( res as Record< string, any > )[ data.optionKey ];
			if ( newValue && newValue.google ) {
				// Update window.tryAura so enhancer/tryon pick up changes without reload.
				window.tryAura!.provider = newValue.google.provider || 'google';
				window.tryAura!.imageModel = newValue.google.imageModel;
				window.tryAura!.videoModel = newValue.google.videoModel;

				// Only expose API key for Gemini; OpenRouter calls go through PHP REST.
				window.tryAura!.apiKey =
					newValue.google.provider === 'openrouter'
						? ''
						: newValue.google.apiKey;

				const providerLabel = isOpenRouter ? 'OpenRouter' : 'Gemini';
				toast.success(
					/* translators: %s: provider name */
					__(
						`${ providerLabel } API settings saved successfully!`,
						'tryaura'
					)
				);
			}
		} catch ( e: unknown ) {
			const msg =
				e && typeof e === 'object' && 'message' in e
					? String( ( e as any ).message )
					: __( 'Something went wrong', 'tryaura' );

			toast.error( msg );
		}
	};

	const logo = isOpenRouter ? openrouterLogo : geminiLogo;
	const titleText = isOpenRouter
		? __( 'OpenRouter Integration', 'tryaura' )
		: __( 'Gemini Integration', 'tryaura' );
	const helpUrl = isOpenRouter
		? 'https://openrouter.ai/settings/keys'
		: 'https://aistudio.google.com/api-keys';
	const helpText = isOpenRouter
		? __( 'API key ?', 'tryaura' )
		: __( 'API key ?', 'tryaura' );

	return (
		<SettingDetailsContainer
			footer={
				! fetching && (
					<>
						<Button
							className="py-3 px-7"
							onClick={ onSave }
							disabled={ saving }
							loading={ saving }
						>
							{ __( 'Connect', 'tryaura' ) }
						</Button>
						<Button
							className="py-3 px-7"
							variant="outline"
							onClick={ () => {
								navigate( '/settings' );
							} }
						>
							{ __( 'Cancel', 'tryaura' ) }
						</Button>
					</>
				)
			}
		>
			{ fetching ? (
				<InitialLoader />
			) : (
				<div className="flex flex-col w-full md:w-[550px]">
					<div className="flex flex-col gap-[24px] mb-[36px]">
						<div>
							<img src={ logo } alt={ `${ titleText } logo` } />
						</div>
						<div>
							<div className="font-semibold text-[20px] leading-[28px] tracking-normal align-middle mb-[8px]">
								{ titleText }
							</div>
							<div className="text-[14px] font-[400] leading-[18.67px] text-[rgba(99,99,99,1)]">
								{ __(
									'Connect your account with an API key. Need help finding your',
									'tryaura'
								) }
								&nbsp;
								<a
									href={ helpUrl }
									className="text-primary underline hover:text-primary-dark"
									target="_blank"
									rel="noreferrer"
								>
									{ helpText }
								</a>
							</div>
						</div>
					</div>
					<div className="flex flex-col gap-[24px]">
						<ModernSelect
							value={ selectedProvider }
							label={ __( 'AI Engine', 'tryaura' ) }
							onChange={ ( val: string ) => {
								setSelectedProvider( val );
								// Reset models when switching providers.
								setSelectedImageModel( '' );
								setSelectedVideoModel( '' );
							} }
							options={ PROVIDER_OPTIONS }
							variant="list"
						/>

						<ApiKeyInput
							apiKey={ apiKey }
							setApiKey={ setApiKey }
						/>
						{ apiKey && (
							<>
								<div>
									<ModernSelect
										value={ selectedImageModel }
										label={ __( 'Select Image Model', 'tryaura' ) }
										onChange={ ( val: string ) => {
											setSelectedImageModel( val );
										} }
										options={ imageModels }
										variant="list"
									/>
								</div>
								<Slot
									name="tryaura-choose-video-model"
									fillProps={ {
										ModernSelect,
										selectedVideoModel,
										setSelectedVideoModel,
										videoModels,
										selectedProvider,
									} }
								/>
							</>
						) }
					</div>
				</div>
			) }
		</SettingDetailsContainer>
	);
};
export default GeminiSettings;
