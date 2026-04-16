import geminiLogo from '../assets/geminiLogo.svg';
import openrouterLogo from '../assets/openrouterLogo.svg';
import { ModernSelect, Button } from '../../../../../components';
import { toast } from '@tryaura/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from 'react-router-dom';
import { useSelect, useDispatch } from '@wordpress/data';
import { Slot } from '@wordpress/components';
import {
	Settings,
	ThemeProvider,
	type SettingsElement,
} from '@wedevs/plugin-ui';
// @ts-ignore
import { STORE_NAME } from '@tryaura/settings';
import SettingDetailsContainer from '../components/SettingDetailsContainer';

type TryAuraProvider = 'google' | 'openrouter';

const ENGINE_DEPENDENCY_KEY =
	'product_generation.product_image_section.product_info_engine';
const OPENAI_API_KEY_DEPENDENCY_KEY =
	'product_generation.product_image_section.openai_api_info_group.openai_api_key';
const GEMINI_API_KEY_DEPENDENCY_KEY =
	'product_generation.product_image_section.gemini_api_info_group.gemini_api_key';
const OPENAI_IMAGE_MODEL_DEPENDENCY_KEY =
	'product_generation.product_image_section.openai_api_info_group.openai_model';
const GEMINI_IMAGE_MODEL_DEPENDENCY_KEY =
	'product_generation.product_image_section.gemini_api_info_group.gemini_model';

const providerToEngine = ( provider: TryAuraProvider ): string =>
	provider === 'openrouter' ? 'openrouter' : 'gemini';

const engineToProvider = ( engine: string ): TryAuraProvider =>
	engine === 'openrouter' || engine === 'chatgpt' ? 'openrouter' : 'google';

async function validateApiKey(
	provider: TryAuraProvider,
	key: string
): Promise< boolean > {
	try {
		if ( provider === 'openrouter' ) {
			const res = await fetch( 'https://openrouter.ai/api/v1/models', {
				method: 'GET',
				headers: { Authorization: `Bearer ${ key }` },
			} );
			return res.ok;
		}

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
		<div className="flex flex-col gap-7.5 w-full animate-pulse">
			<div className="flex flex-col gap-6">
				<span className="block w-15.75 h-15.5 bg-gray-300 rounded-md"></span>
				<div>
					<span className="block h-7 w-62.5 bg-gray-300 rounded-md mb-2"></span>
					<span className="block h-4.5 w-full bg-gray-300 rounded-md"></span>
				</div>
				<div>
					<span className="block h-5.5 w-37.5 bg-gray-300 rounded-md mb-2"></span>
					<span className="block h-10 w-full bg-gray-300 rounded-md mb-2"></span>
					<span className="block h-3.75 w-62.5 bg-gray-300 rounded-md"></span>
				</div>
			</div>
		</div>
	);
};

const GeminiSettings = () => {
	const data = window.tryAura as any;
	const navigate = useNavigate();

	const [ apiKey, setApiKey ] = useState< string >( '' );
	const [ selectedProvider, setSelectedProvider ] =
		useState< TryAuraProvider >( 'google' );
	const [ selectedImageModel, setSelectedImageModel ] =
		useState< string >( '' );
	const [ selectedVideoModel, setSelectedVideoModel ] =
		useState< string >( '' );

	const {
		videoModels,
		imageModels,
		defaultImageModel,
		defaultVideoModel,
		settings,
		fetching,
		saving,
	} = useSelect(
		( select ) => {
			const models =
				( select( 'tryaura/ai-models' ) as any ).getProviderModels(
					selectedProvider
				) || {};

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
				defaultImageModel: (
					select( 'tryaura/ai-models' ) as any
				 ).getDefaultImageModel(),
				defaultVideoModel: (
					select( 'tryaura/ai-models' ) as any
				 ).getDefaultVideoModel(),
				settings: select( STORE_NAME ).getSettings(),
				fetching: select( STORE_NAME ).isFetchingSettings(),
				saving: select( STORE_NAME ).isSavingSettings(),
			};
		},
		[ selectedProvider ]
	);

	const { updateSettings } = useDispatch( STORE_NAME );
	const isOpenRouter = selectedProvider === 'openrouter';

	useEffect( () => {
		const current = settings?.[ data.optionKey ];
		if ( current && typeof current === 'object' && current.google ) {
			setApiKey( current.google.apiKey || '' );
			setSelectedProvider(
				( current.google.provider as TryAuraProvider ) || 'google'
			);
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

	const saveSettings = async () => {
		if ( ! apiKey ) {
			toast.error( __( 'API key is required', 'tryaura' ) );
			return;
		}

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
				data.provider =
					( newValue.google.provider as TryAuraProvider ) || 'google';
				data.imageModel = newValue.google.imageModel;
				data.videoModel = newValue.google.videoModel;
				data.apiKey =
					newValue.google.provider === 'openrouter'
						? ''
						: newValue.google.apiKey;

				toast.success(
					isOpenRouter
						? __(
								'OpenRouter API settings saved successfully!',
								'tryaura'
						  )
						: __(
								'Gemini API settings saved successfully!',
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

	const schema = [
		{
			id: 'gemini-settings',
			type: 'page',
			label: '',
			is_danger: false,
			children: [
				{
					id: 'product_image_section',
					type: 'section',
					title: '',
					icon: '',
					tooltip: '',
					display: true,
					hook_key:
						'dokan_settings_ai_assist_product_generation_product_image_section',
					children: [
						{
							id: 'product_info_engine',
							type: 'field',
							title: __( 'Engine', 'tryaura' ),
							icon: '',
							tooltip: '',
							display: true,
							hook_key:
								'dokan_settings_ai_assist_product_generation_product_image_section_product_info_engine',
							children: [],
							description: __(
								'Select which AI provider to use for generating content.',
								'tryaura'
							),
							dependency_key: ENGINE_DEPENDENCY_KEY,
							dependencies: [],
							validations: [],
							variant: 'select',
							value: providerToEngine( selectedProvider ),
							default: providerToEngine( selectedProvider ),
							options: [
								{
									value: 'openrouter',
									title: __( 'OpenRouter', 'tryaura' ),
								},
								{
									value: 'gemini',
									title: __( 'Gemini', 'tryaura' ),
								},
							],
						},
						{
							id: 'openai_api_info_group',
							type: 'fieldgroup',
							title: '',
							icon: '',
							tooltip: '',
							display: true,
							hook_key:
								'dokan_settings_ai_assist_product_generation_product_image_section_openai_api_info_group',
							children: [
								{
									id: 'openai_api_info',
									type: 'field',
									title: __( 'OpenAI API', 'tryaura' ),
									icon: 'CircleCheck',
									tooltip: '',
									display: true,
									hook_key:
										'dokan_settings_ai_assist_product_generation_product_image_section_openai_api_info_group_openai_api_info',
									children: [],
									description:
										'Connect to your OpenRouter account with your website. <a href="https://openrouter.ai/settings/keys" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">Get Help</a>',
									dependency_key:
										'product_generation.product_image_section.openai_api_info_group.openai_api_info',
									dependencies: [],
									validations: [],
									variant: 'base_field_label',
									value: '',
									doc_link: '',
								},
								{
									id: 'openai_api_notice',
									type: 'field',
									title: __(
										'You can get your API Keys in your',
										'tryaura'
									),
									icon: '',
									tooltip: '',
									display: true,
									hook_key:
										'dokan_settings_ai_assist_product_generation_product_image_section_openai_api_info_group_openai_api_notice',
									children: [],
									description: '',
									dependency_key:
										'product_generation.product_image_section.openai_api_info_group.openai_api_notice',
									dependencies: [],
									validations: [],
									variant: 'info',
									value: '',
									link_text: __(
										'OpenRouter Account.',
										'tryaura'
									),
									link_url:
										'https://openrouter.ai/settings/keys',
									show_icon: true,
								},
								{
									id: 'openai_api_key',
									type: 'field',
									title: __( 'API Key', 'tryaura' ),
									icon: '',
									tooltip: __(
										'Enter your OpenRouter API key for content generation.',
										'tryaura'
									),
									display: true,
									hook_key:
										'dokan_settings_ai_assist_product_generation_product_image_section_openai_api_info_group_openai_api_key',
									children: [],
									description: '',
									dependency_key:
										OPENAI_API_KEY_DEPENDENCY_KEY,
									dependencies: [],
									validations: [],
									variant: 'show_hide',
									value: apiKey,
									placeholder: __(
										'Enter your OpenRouter API key',
										'tryaura'
									),
								},
							],
							description: '',
							dependency_key:
								'product_generation.product_image_section.openai_api_info_group',
							dependencies: [
								{
									key: ENGINE_DEPENDENCY_KEY,
									value: 'openrouter',
									to_self: true,
									attribute: 'display',
									effect: 'show',
									comparison: '===',
									self: 'product_generation.product_image_section.openai_api_info_group',
								},
								{
									key: ENGINE_DEPENDENCY_KEY,
									value: 'openrouter',
									to_self: true,
									attribute: 'display',
									effect: 'hide',
									comparison: '!==',
									self: 'product_generation.product_image_section.openai_api_info_group',
								},
							],
							validations: [],
							content_class: '',
						},
						{
							id: 'openai_model',
							type: 'field',
							title: __( 'Image Model', 'tryaura' ),
							icon: '',
							tooltip: '',
							display: true,
							hook_key:
								'dokan_settings_ai_assist_product_generation_product_image_section_openai_api_info_group_openai_model',
							children: [],
							description: __(
								'More advanced models provide higher quality output but may cost more per generation.',
								'tryaura'
							),
							dependency_key: OPENAI_IMAGE_MODEL_DEPENDENCY_KEY,
							dependencies: [
								{
									key: ENGINE_DEPENDENCY_KEY,
									value: 'openrouter',
									to_self: true,
									attribute: 'display',
									effect: 'show',
									comparison: '===',
									self: 'product_generation.product_image_section.openai_api_info_group',
								},
								{
									key: ENGINE_DEPENDENCY_KEY,
									value: 'openrouter',
									to_self: true,
									attribute: 'display',
									effect: 'hide',
									comparison: '!==',
									self: 'product_generation.product_image_section.openai_api_info_group',
								},
							],
							validations: [],
							variant: 'select',
							value: selectedImageModel,
							options: imageModels,
						},
						{
							id: 'gemini_api_info_group',
							type: 'fieldgroup',
							title: '',
							icon: '',
							tooltip: '',
							display: true,
							hook_key:
								'dokan_settings_ai_assist_product_generation_product_image_section_gemini_api_info_group',
							children: [
								{
									id: 'gemini_api_info',
									type: 'field',
									title: __( 'Gemini API', 'tryaura' ),
									icon: '',
									tooltip: '',
									display: true,
									hook_key:
										'dokan_settings_ai_assist_product_generation_product_image_section_gemini_api_info_group_gemini_api_info',
									children: [],
									description:
										'Connect to your Gemini account with your website. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Get Help</a>',
									dependency_key:
										'product_generation.product_image_section.gemini_api_info_group.gemini_api_info',
									dependencies: [],
									validations: [],
									variant: 'base_field_label',
									value: '',
									doc_link: '',
								},
								{
									id: 'gemini_api_notice',
									type: 'field',
									title: __(
										'You can get your API Keys in your Gemini Account.',
										'tryaura'
									),
									icon: '',
									tooltip: '',
									display: true,
									hook_key:
										'dokan_settings_ai_assist_product_generation_product_image_section_gemini_api_info_group_gemini_api_notice',
									children: [],
									description: '',
									dependency_key:
										'product_generation.product_image_section.gemini_api_info_group.gemini_api_notice',
									dependencies: [],
									validations: [],
									variant: 'info',
									value: '',
									link_text: __(
										'Gemini Account',
										'tryaura'
									),
									link_url:
										'https://aistudio.google.com/app/apikey',
									show_icon: true,
								},
								{
									id: 'gemini_api_key',
									type: 'field',
									title: __( 'API Key', 'tryaura' ),
									icon: '',
									tooltip: __(
										'Enter your Gemini API key for content generation.',
										'tryaura'
									),
									display: true,
									hook_key:
										'dokan_settings_ai_assist_product_generation_product_image_section_gemini_api_info_group_gemini_api_key',
									children: [],
									description: '',
									dependency_key:
										GEMINI_API_KEY_DEPENDENCY_KEY,
									dependencies: [],
									validations: [],
									variant: 'show_hide',
									value: apiKey,
									placeholder: __(
										'Enter your Gemini API key',
										'tryaura'
									),
								},
							],
							description: '',
							dependency_key:
								'product_generation.product_image_section.gemini_api_info_group',
							dependencies: [
								{
									key: ENGINE_DEPENDENCY_KEY,
									value: 'gemini',
									to_self: true,
									attribute: 'display',
									effect: 'show',
									comparison: '===',
									self: 'product_generation.product_image_section.gemini_api_info_group',
								},
								{
									key: ENGINE_DEPENDENCY_KEY,
									value: 'gemini',
									to_self: true,
									attribute: 'display',
									effect: 'hide',
									comparison: '!==',
									self: 'product_generation.product_image_section.gemini_api_info_group',
								},
							],
							validations: [],
							content_class: '',
						},
						{
							id: 'gemini_model',
							type: 'field',
							title: __( 'Image Model', 'tryaura' ),
							icon: '',
							tooltip: '',
							display: true,
							hook_key:
								'dokan_settings_ai_assist_product_generation_product_image_section_gemini_api_info_group_gemini_model',
							children: [],
							description: __(
								'More advanced models provide higher quality output but may cost more per generation.',
								'tryaura'
							),
							dependency_key: GEMINI_IMAGE_MODEL_DEPENDENCY_KEY,
							dependencies: [
								{
									key: ENGINE_DEPENDENCY_KEY,
									value: 'gemini',
									to_self: true,
									attribute: 'display',
									effect: 'show',
									comparison: '===',
									self: 'product_generation.product_image_section.gemini_api_info_group',
								},
								{
									key: ENGINE_DEPENDENCY_KEY,
									value: 'gemini',
									to_self: true,
									attribute: 'display',
									effect: 'hide',
									comparison: '!==',
									self: 'product_generation.product_image_section.gemini_api_info_group',
								},
							],
							validations: [],
							variant: 'select',
							value: selectedImageModel,
							options: imageModels,
						},
					],
					description: '',
					dependency_key: 'product_generation.product_image_section',
					dependencies: [],
					validations: [],
					doc_link: '',
				},
			],
		},
	] as unknown as SettingsElement[];

	const settingsValues = {
		[ ENGINE_DEPENDENCY_KEY ]: providerToEngine( selectedProvider ),
		[ OPENAI_API_KEY_DEPENDENCY_KEY ]: apiKey,
		[ GEMINI_API_KEY_DEPENDENCY_KEY ]: apiKey,
		[ OPENAI_IMAGE_MODEL_DEPENDENCY_KEY ]: selectedImageModel,
		[ GEMINI_IMAGE_MODEL_DEPENDENCY_KEY ]: selectedImageModel,
	};

	const handleSettingChange = (
		_scopeId: string,
		key: string,
		value: string
	) => {
		if ( key === ENGINE_DEPENDENCY_KEY ) {
			setSelectedProvider( engineToProvider( value ) );
			setSelectedImageModel( '' );
			setSelectedVideoModel( '' );
			return;
		}

		if (
			key === OPENAI_API_KEY_DEPENDENCY_KEY ||
			key === GEMINI_API_KEY_DEPENDENCY_KEY
		) {
			setApiKey( value );
			return;
		}

		if (
			key === OPENAI_IMAGE_MODEL_DEPENDENCY_KEY ||
			key === GEMINI_IMAGE_MODEL_DEPENDENCY_KEY
		) {
			setSelectedImageModel( value );
		}
	};

	const logo = isOpenRouter ? openrouterLogo : geminiLogo;
	const titleText = isOpenRouter
		? __( 'OpenRouter Integration', 'tryaura' )
		: __( 'Gemini Integration', 'tryaura' );
	const helpUrl = isOpenRouter
		? 'https://openrouter.ai/settings/keys'
		: 'https://aistudio.google.com/api-keys';
	const helpText = __( 'API key ?', 'tryaura' );

	return (
		<SettingDetailsContainer
			fullWidthContent={ true }
			footer={
				! fetching && (
					<Button
						className="py-3 px-7"
						variant="outline"
						onClick={ () => {
							navigate( '/settings' );
						} }
					>
						{ __( 'Cancel', 'tryaura' ) }
					</Button>
				)
			}
		>
			{ fetching ? (
				<InitialLoader />
			) : (
				<div className="flex flex-col w-full">
					<div className="flex flex-col gap-6 mb-9">
						<div>
							<img src={ logo } alt={ `${ titleText } logo` } />
						</div>
						<div>
							<div className="font-semibold text-[20px] leading-7 tracking-normal align-middle mb-2">
								{ titleText }
							</div>
							<div className="text-[14px] font-normal leading-[18.67px] text-[rgba(99,99,99,1)]">
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
					<div className="flex flex-col gap-6">
						<div className="pui-root w-full">
							<ThemeProvider pluginId="tryaura">
								<Settings
									schema={ schema }
									values={ settingsValues }
									onChange={ handleSettingChange }
									onSave={ async () => {
										await saveSettings();
									} }
									renderSaveButton={ ( {
										dirty,
										hasErrors,
										onSave,
									} ) => (
										<Button
											className="py-3 px-7"
											onClick={ onSave }
											disabled={
												! dirty || hasErrors || saving
											}
											loading={ saving }
										>
											{ __( 'Save Changes', 'tryaura' ) }
										</Button>
									) }
								/>
							</ThemeProvider>
						</div>
						{ apiKey && (
							<div className="w-full rounded-[10px] border border-[#e8e8e8] p-4 bg-white">
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
							</div>
						) }
					</div>
				</div>
			) }
		</SettingDetailsContainer>
	);
};

export default GeminiSettings;
