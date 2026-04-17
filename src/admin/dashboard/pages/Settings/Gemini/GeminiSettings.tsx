import { ArrowLeft } from 'lucide-react';
import geminiLogo from '../assets/geminiLogo.svg';
import openrouterLogo from '../assets/openrouterLogo.svg';
import {
	Settings,
	Button,
	type SettingsElement,
} from '../../../../../utils/plugin-ui';
import { toast } from '@tryaura/components';
import { useMemo, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from 'react-router-dom';
import { useSelect, useDispatch } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';
import './registerModelSelectorField';
// @ts-ignore
import { STORE_NAME } from '@tryaura/settings';

type ProviderId = 'google' | 'openrouter';

type FlatSettingsValues = {
	'credentials.provider': ProviderId;
	'credentials.gemini.api_key': string;
	'credentials.gemini.image_model': string;
	'credentials.gemini.image_model_label': string;
	'credentials.gemini.video_model': string;
	'credentials.gemini.video_model_label': string;
	'credentials.openrouter.api_key': string;
	'credentials.openrouter.image_model': string;
	'credentials.openrouter.image_model_label': string;
	'credentials.openrouter.video_model': string;
	'credentials.openrouter.video_model_label': string;
};

declare global {
	interface Window {
		tryAuraAiProviderModels?: {
			defaultImageModel?: string;
			defaultVideoModel?: string;
			defaultOpenRouterImageModel?: string;
			defaultOpenRouterVideoModel?: string;
		};
	}
}

const PROVIDER_OPTIONS = [
	{ label: __('Gemini', 'tryaura'), value: 'google' },
	{ label: __('OpenRouter', 'tryaura'), value: 'openrouter' },
];

const getDefaultModelsForProvider = (provider: ProviderId) => {
	const providerConfig = window.tryAuraAiProviderModels ?? {};

	if (provider === 'openrouter') {
		return {
			imageModel:
				providerConfig.defaultOpenRouterImageModel ||
				'google/gemini-2.5-flash-preview-05-20:generateImage',
			videoModel:
				providerConfig.defaultOpenRouterVideoModel ||
				'bytedance/seedance-2.0-fast',
		};
	}

	return {
		imageModel:
			providerConfig.defaultImageModel || 'gemini-2.5-flash-image',
		videoModel:
			providerConfig.defaultVideoModel || 'veo-3.1-generate-preview',
	};
};

const getProviderModelSettingKey = (
	provider: ProviderId,
	modelType: 'image' | 'video',
	suffix: '' | 'Label' = ''
) => {
	const providerPrefix = provider === 'google' ? 'gemini' : 'openrouter';
	const modelPrefix = modelType === 'image' ? 'Image' : 'Video';

	return `${providerPrefix}${modelPrefix}Model${suffix}`;
};

const getStoredModelValue = (
	settings: Record<string, any>,
	provider: ProviderId,
	modelType: 'image' | 'video',
	fallback: string
) => {
	const activeKey = modelType === 'image' ? 'imageModel' : 'videoModel';
	const providerKey = getProviderModelSettingKey(provider, modelType);

	return (
		settings?.[providerKey] ||
		(settings?.provider === provider ? settings?.[activeKey] : '') ||
		fallback
	);
};

const getStoredModelLabel = (
	settings: Record<string, any>,
	provider: ProviderId,
	modelType: 'image' | 'video',
	fallback: string
) => {
	const labelKey = getProviderModelSettingKey(provider, modelType, 'Label');

	return settings?.[labelKey] || fallback;
};

async function validateApiKey(
	provider: ProviderId,
	key: string
): Promise<boolean> {
	try {
		if (provider === 'openrouter') {
			const res = await fetch('https://openrouter.ai/api/v1/models', {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${key}`,
				},
			});

			return res.ok;
		}

		const res = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
				key
			)}`
		);

		return res.ok;
	} catch {
		return false;
	}
}

const createModelSelectorField = (
	id: string,
	label: string,
	description: string,
	dependencyKey: string,
	labelKey: string,
	provider: ProviderId,
	modelType: 'image' | 'video',
	apiKey: string,
	savedLabel: string
): SettingsElement => ({
	id,
	type: 'field',
	variant: 'model_selector',
	label,
	description,
	dependency_key: dependencyKey,
	label_key: labelKey,
	value: '',
	provider,
	model_type: modelType,
	api_key: apiKey,
	saved_label: savedLabel,
});

const getSchema = (values: FlatSettingsValues): SettingsElement[] => {
	const geminiChildren = applyFilters(
		'tryaura.admin.ai_provider_fields',
		[
			{
				id: 'gemini_api_info',
				type: 'field',
				variant: 'base_field_label',
				label: __('Gemini API', 'tryaura'),
				description: __(
					'Connect your Gemini account with your website.',
					'tryaura'
				),
				image_url: geminiLogo,
			},
			{
				id: 'gemini_api_notice',
				type: 'field',
				variant: 'info',
				title: __('Need help finding your key?', 'tryaura'),
				link_url: 'https://aistudio.google.com/app/apikey',
				link_title: __('Gemini Account', 'tryaura'),
			},
			{
				id: 'gemini_api_key',
				type: 'field',
				variant: 'show_hide',
				label: __('API Key', 'tryaura'),
				description: __(
					'Paste the API key provided by Gemini.',
					'tryaura'
				),
				placeholder: __('Enter your Gemini API key', 'tryaura'),
				dependency_key: 'credentials.gemini.api_key',
				value: '',
			},
			createModelSelectorField(
				'gemini_image_model',
				__('Image Model', 'tryaura'),
				__(
					'Fetch and select the Gemini image model TryAura should use.',
					'tryaura'
				),
				'credentials.gemini.image_model',
				'credentials.gemini.image_model_label',
				'google',
				'image',
				values['credentials.gemini.api_key'],
				values['credentials.gemini.image_model_label']
			),
		],
		{
			provider: 'google',
			values,
		}
	) as SettingsElement[];

	const openRouterChildren = applyFilters(
		'tryaura.admin.ai_provider_fields',
		[
			{
				id: 'openrouter_api_info',
				type: 'field',
				variant: 'base_field_label',
				label: __('OpenRouter API', 'tryaura'),
				description: __(
					'Connect your OpenRouter account with your website.',
					'tryaura'
				),
				image_url: openrouterLogo,
			},
			{
				id: 'openrouter_api_notice',
				type: 'field',
				variant: 'info',
				title: __('Need help finding your key?', 'tryaura'),
				link_url: 'https://openrouter.ai/settings/keys',
				link_title: __('OpenRouter Account', 'tryaura'),
			},
			{
				id: 'openrouter_api_key',
				type: 'field',
				variant: 'show_hide',
				label: __('API Key', 'tryaura'),
				description: __(
					'Paste the API key provided by OpenRouter.',
					'tryaura'
				),
				placeholder: __('Enter your OpenRouter API key', 'tryaura'),
				dependency_key: 'credentials.openrouter.api_key',
				value: '',
			},
			createModelSelectorField(
				'openrouter_image_model',
				__('Image Model', 'tryaura'),
				__(
					'Fetch and select the OpenRouter image model TryAura should use.',
					'tryaura'
				),
				'credentials.openrouter.image_model',
				'credentials.openrouter.image_model_label',
				'openrouter',
				'image',
				values['credentials.openrouter.api_key'],
				values['credentials.openrouter.image_model_label']
			),
		],
		{
			provider: 'openrouter',
			values,
		}
	) as SettingsElement[];

	return [
		{
			id: 'ai_credentials_page',
			type: 'page',
			label: __('AI Credentials', 'tryaura'),
			description: __(
				'Configure the active provider credential used by TryAura.',
				'tryaura'
			),
			children: [
				{
					id: 'provider',
					type: 'field',
					variant: 'select',
					label: __('AI Engine', 'tryaura'),
					description: __(
						'Choose which provider TryAura should use.',
						'tryaura'
					),
					dependency_key: 'credentials.provider',
					value: 'google',
					options: PROVIDER_OPTIONS,
				},
				{
					id: 'gemini_group',
					type: 'fieldgroup',
					dependencies: [
						{
							key: 'credentials.provider',
							value: 'google',
							to_self: true,
							attribute: 'display',
							effect: 'show',
							comparison: '===',
							self: 'gemini_group',
						},
						{
							key: 'credentials.provider',
							value: 'google',
							to_self: true,
							attribute: 'display',
							effect: 'hide',
							comparison: '!==',
							self: 'gemini_group',
						},
					],
					children: geminiChildren,
				},
				{
					id: 'openrouter_group',
					type: 'fieldgroup',
					dependencies: [
						{
							key: 'credentials.provider',
							value: 'openrouter',
							to_self: true,
							attribute: 'display',
							effect: 'show',
							comparison: '===',
							self: 'openrouter_group',
						},
						{
							key: 'credentials.provider',
							value: 'openrouter',
							to_self: true,
							attribute: 'display',
							effect: 'hide',
							comparison: '!==',
							self: 'openrouter_group',
						},
					],
					children: openRouterChildren,
				},
			],
		},
	];
};

const GeminiSettings = () => {
	const { settings, fetching, saving } = useSelect((select) => {
		return {
			settings: select(STORE_NAME).getSettings(),
			fetching: select(STORE_NAME).isFetchingSettings(),
			saving: select(STORE_NAME).isSavingSettings(),
		};
	}, []);

	const { updateSettings } = useDispatch(STORE_NAME);
	const navigate = useNavigate();
	const data = window.tryAura!;
	const hasVideoModelSettings = !!applyFilters(
		'tryaura.admin.ai_video_settings_enabled',
		false
	);

	const initialFlatValues = useMemo<FlatSettingsValues>(() => {
		const googleSettings = settings?.[data.optionKey]?.google ?? {};
		const geminiDefaults = getDefaultModelsForProvider('google');
		const openrouterDefaults = getDefaultModelsForProvider('openrouter');
		const geminiImageModel = getStoredModelValue(
			googleSettings,
			'google',
			'image',
			geminiDefaults.imageModel
		);
		const geminiVideoModel = getStoredModelValue(
			googleSettings,
			'google',
			'video',
			geminiDefaults.videoModel
		);
		const openrouterImageModel = getStoredModelValue(
			googleSettings,
			'openrouter',
			'image',
			openrouterDefaults.imageModel
		);
		const openrouterVideoModel = getStoredModelValue(
			googleSettings,
			'openrouter',
			'video',
			openrouterDefaults.videoModel
		);

		return {
			'credentials.provider': (googleSettings.provider ||
				'google') as ProviderId,
			'credentials.gemini.api_key':
				googleSettings.geminiApiKey ||
				(googleSettings.provider === 'google'
					? googleSettings.apiKey || ''
					: ''),
			'credentials.gemini.image_model': geminiImageModel,
			'credentials.gemini.image_model_label': getStoredModelLabel(
				googleSettings,
				'google',
				'image',
				geminiImageModel
			),
			'credentials.gemini.video_model': geminiVideoModel,
			'credentials.gemini.video_model_label': getStoredModelLabel(
				googleSettings,
				'google',
				'video',
				geminiVideoModel
			),
			'credentials.openrouter.api_key':
				googleSettings.openrouterApiKey ||
				(googleSettings.provider === 'openrouter'
					? googleSettings.apiKey || ''
					: ''),
			'credentials.openrouter.image_model': openrouterImageModel,
			'credentials.openrouter.image_model_label': getStoredModelLabel(
				googleSettings,
				'openrouter',
				'image',
				openrouterImageModel
			),
			'credentials.openrouter.video_model': openrouterVideoModel,
			'credentials.openrouter.video_model_label': getStoredModelLabel(
				googleSettings,
				'openrouter',
				'video',
				openrouterVideoModel
			),
		};
	}, [settings, data.optionKey]);

	const [values, setValues] = useState<FlatSettingsValues>(initialFlatValues);

	useEffect(() => {
		setValues(initialFlatValues);
	}, [initialFlatValues]);

	const schema = useMemo(() => getSchema(values), [values]);

	const handleSave = async (
		_scopeId: string,
		_treeValues: Record<string, any>,
		flatValues: Record<string, any>
	) => {
		const provider = flatValues['credentials.provider'] as ProviderId;
		const geminiApiKey = flatValues['credentials.gemini.api_key'] || '';
		const openrouterApiKey =
			flatValues['credentials.openrouter.api_key'] || '';
		const apiKey =
			provider === 'openrouter' ? openrouterApiKey : geminiApiKey;
		const geminiDefaults = getDefaultModelsForProvider('google');
		const openrouterDefaults = getDefaultModelsForProvider('openrouter');
		const geminiImageModel =
			flatValues['credentials.gemini.image_model'] ||
			geminiDefaults.imageModel;
		const geminiImageModelLabel =
			flatValues['credentials.gemini.image_model_label'] ||
			geminiImageModel;
		const geminiVideoModel =
			flatValues['credentials.gemini.video_model'] ||
			geminiDefaults.videoModel;
		const geminiVideoModelLabel =
			flatValues['credentials.gemini.video_model_label'] ||
			geminiVideoModel;
		const openrouterImageModel =
			flatValues['credentials.openrouter.image_model'] ||
			openrouterDefaults.imageModel;
		const openrouterImageModelLabel =
			flatValues['credentials.openrouter.image_model_label'] ||
			openrouterImageModel;
		const openrouterVideoModel =
			flatValues['credentials.openrouter.video_model'] ||
			openrouterDefaults.videoModel;
		const openrouterVideoModelLabel =
			flatValues['credentials.openrouter.video_model_label'] ||
			openrouterVideoModel;
		const activeImageModel =
			provider === 'openrouter' ? openrouterImageModel : geminiImageModel;
		const activeVideoModel =
			provider === 'openrouter' ? openrouterVideoModel : geminiVideoModel;

		if (!apiKey) {
			toast.error(
				provider === 'openrouter'
					? __('OpenRouter API key is required.', 'tryaura')
					: __('Gemini API key is required.', 'tryaura')
			);
			return;
		}

		if (!activeImageModel || (hasVideoModelSettings && !activeVideoModel)) {
			toast.error(
				hasVideoModelSettings
					? __(
							'Please fetch and select both image and video models before saving.',
							'tryaura'
						)
					: __(
							'Please fetch and select an image model before saving.',
							'tryaura'
						)
			);
			return;
		}

		const isValid = await validateApiKey(provider, apiKey);
		if (!isValid) {
			toast.error(
				provider === 'openrouter'
					? __('Invalid OpenRouter API key.', 'tryaura')
					: __('Invalid Gemini API key.', 'tryaura')
			);
			return;
		}

		const currentGoogleSettings = settings?.[data.optionKey]?.google ?? {};

		const nextGoogleSettings = {
			...currentGoogleSettings,
			provider,
			apiKey,
			geminiApiKey,
			openrouterApiKey,
			imageModel: activeImageModel,
			videoModel: activeVideoModel,
			geminiImageModel,
			geminiImageModelLabel,
			geminiVideoModel,
			geminiVideoModelLabel,
			openrouterImageModel,
			openrouterImageModelLabel,
			openrouterVideoModel,
			openrouterVideoModelLabel,
		};

		const nextSettings = {
			...settings,
			[data.optionKey]: {
				...settings?.[data.optionKey],
				google: nextGoogleSettings,
			},
		};

		try {
			const response = await updateSettings(nextSettings);
			const savedSettings = response?.[data.optionKey]?.google;

			if (savedSettings) {
				window.tryAura.provider = savedSettings.provider || 'google';
				window.tryAura.apiKey =
					savedSettings.provider === 'openrouter'
						? ''
						: savedSettings.apiKey || '';
				window.tryAura.imageModel = savedSettings.imageModel || '';
				window.tryAura.videoModel = savedSettings.videoModel || '';
			}

			toast.success(
				provider === 'openrouter'
					? __('OpenRouter credential and models saved.', 'tryaura')
					: __('Gemini credential and models saved.', 'tryaura')
			);
		} catch (error: unknown) {
			const message =
				error && typeof error === 'object' && 'message' in error
					? String((error as { message: string }).message)
					: __('Something went wrong.', 'tryaura');

			toast.error(message);
		}
	};

	return (
		<div className="bg-white rounded-2xl min-h-[90vh] overflow-hidden">
			<div className="border-b border-solid border-[#f0e5e5]">
				<button
					type="button"
					className="inline-flex items-center gap-1.5 m-5.5 hover:cursor-pointer hover:underline bg-transparent border-none p-0"
					onClick={() => navigate('/settings')}
				>
					<ArrowLeft className="w-4 h-4" />
					<div className="font-medium text-[14px] leading-5 text-center">
						{__('Back to Settings', 'tryaura')}
					</div>
				</button>
			</div>

			<div className="p-5.5">
				<Settings
					schema={schema}
					values={values}
					loading={fetching}
					title={__('TryAura Settings', 'tryaura')}
					hookPrefix="tryaura"
					applyFilters={applyFilters}
					onChange={(
						_scopeId: string,
						key: string,
						value: string
					) => {
						setValues((previous) => ({
							...previous,
							[key]: value,
						}));
					}}
					onSave={handleSave}
					renderSaveButton={({ dirty, hasErrors, onSave }) => (
						<div className="flex gap-2.5">
							<Button
								onClick={onSave}
								disabled={saving || hasErrors || !dirty}
							>
								{saving
									? __('Saving…', 'tryaura')
									: __('Save Credentials', 'tryaura')}
							</Button>
							<Button
								variant="outline"
								onClick={() => {
									setValues(initialFlatValues);
									navigate('/settings');
								}}
								disabled={saving}
							>
								{__('Cancel', 'tryaura')}
							</Button>
						</div>
					)}
				/>
			</div>
		</div>
	);
};

export default GeminiSettings;
