import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import {
	Button,
	Notice,
	NoticeTitle,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	useSettings,
} from '../../../../../utils/plugin-ui';

type ProviderId = 'google' | 'openrouter';
type ModelType = 'image' | 'video';

type ModelOption = {
	label: string;
	value: string;
};

type ModelSelectorElement = {
	id: string;
	label?: string;
	description?: string;
	dependency_key: string;
	label_key?: string;
	value?: string;
	provider: ProviderId;
	model_type: ModelType;
	api_key?: string;
	saved_label?: string;
};

type ModelSelectorProps = {
	element: ModelSelectorElement;
};

const normalizeModelName = (modelName = '') =>
	modelName.replace(/^models\//, '').trim();

const sortOptions = (options: ModelOption[]) =>
	[...options].sort((left, right) => left.label.localeCompare(right.label));

const matchesGeminiModelType = (modelId: string, modelType: ModelType) => {
	if (modelType === 'image') {
		return /(?:image|imagen)/i.test(modelId);
	}

	return /(?:veo|video)/i.test(modelId);
};

const matchesOpenRouterModelType = (
	modelId: string,
	modelType: ModelType,
	outputModalities: string[] = []
) => {
	const modalities = outputModalities.map((modality) =>
		String(modality).toLowerCase()
	);

	if (modelType === 'image') {
		return (
			modalities.includes('image') ||
			/(?:image|imagen|flux|recraft|playground)/i.test(modelId)
		);
	}

	return modalities.includes('video') || /(?:veo|video|wan)/i.test(modelId);
};

const getOpenRouterModelsEndpoint = (modelType: ModelType) =>
	modelType === 'video'
		? 'https://openrouter.ai/api/v1/videos/models'
		: 'https://openrouter.ai/api/v1/models?output_modalities=image';

const fetchGeminiModels = async (
	apiKey: string,
	modelType: ModelType
): Promise<ModelOption[]> => {
	const response = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
			apiKey
		)}`
	);

	if (!response.ok) {
		throw new Error(
			__(
				'Unable to fetch Gemini models. Please confirm the API key and try again.',
				'tryaura'
			)
		);
	}

	const data = await response.json();
	const options = Array.isArray(data?.models)
		? data.models
				.map((model: { name?: string; displayName?: string }) => {
					const modelId = normalizeModelName(model.name);

					return {
						label: model.displayName || modelId,
						value: modelId,
					};
				})
				.filter(
					(model: ModelOption) =>
						model.value &&
						matchesGeminiModelType(model.value, modelType)
				)
		: [];

	return sortOptions(options);
};

const fetchOpenRouterModels = async (
	apiKey: string,
	modelType: ModelType
): Promise<ModelOption[]> => {
	const response = await fetch(getOpenRouterModelsEndpoint(modelType), {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
	});

	if (!response.ok) {
		throw new Error(
			__(
				'Unable to fetch OpenRouter models. Please confirm the API key and try again.',
				'tryaura'
			)
		);
	}

	const data = await response.json();
	const options = Array.isArray(data?.data)
		? data.data
				.map(
					(model: {
						id?: string;
						name?: string;
						architecture?: { output_modalities?: string[] };
					}) => {
						const modelId = String(model.id || '').trim();

						return {
							label: String(model.name || modelId).trim(),
							value: modelId,
							outputModalities:
								model.architecture?.output_modalities || [],
						};
					}
				)
				.filter(
					(model: ModelOption & { outputModalities?: string[] }) => {
						if (!model.value) {
							return false;
						}

						// OpenRouter's video endpoint already returns video models,
						// and many valid ids do not include our fallback keywords.
						if (modelType === 'video') {
							return true;
						}

						return matchesOpenRouterModelType(
							model.value,
							modelType,
							model.outputModalities
						);
					}
				)
				.map(
					(model: ModelOption & { outputModalities?: string[] }) => ({
						label: model.label,
						value: model.value,
					})
				)
		: [];

	return sortOptions(options);
};

const fetchProviderModels = async (
	provider: ProviderId,
	apiKey: string,
	modelType: ModelType
) => {
	if (provider === 'openrouter') {
		return fetchOpenRouterModels(apiKey, modelType);
	}

	return fetchGeminiModels(apiKey, modelType);
};

const ModelSelectorField = ({ element }: ModelSelectorProps) => {
	const { updateValue } = useSettings();
	const {
		label,
		description,
		value = '',
		provider,
		model_type: modelType,
		api_key: apiKey = '',
		dependency_key: valueKey,
		label_key: labelKey,
		saved_label: savedLabel = '',
	} = element;
	const [options, setOptions] = useState<ModelOption[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const lastFetchSignature = useRef('');

	const mergedOptions = useMemo(() => {
		if (value && !options.some((option) => option.value === value)) {
			return sortOptions([
				...options,
				{ label: savedLabel || value, value },
			]);
		}

		return options;
	}, [options, value, savedLabel]);
	const selectedOption = mergedOptions.find((option) => option.value === value);
	const selectedLabel = selectedOption?.label || savedLabel || value;

	const runFetch = async (force = false) => {
		const trimmedApiKey = apiKey.trim();

		if (!trimmedApiKey) {
			setErrorMessage(
				__(
					'Add an API key first, then fetch available models.',
					'tryaura'
				)
			);
			setOptions([]);
			lastFetchSignature.current = '';
			return;
		}

		const signature = `${provider}:${modelType}:${trimmedApiKey}`;
		if (!force && lastFetchSignature.current === signature) {
			return;
		}

		setIsLoading(true);
		setErrorMessage('');

		try {
			const fetchedOptions = await fetchProviderModels(
				provider,
				trimmedApiKey,
				modelType
			);

			setOptions(fetchedOptions);
			lastFetchSignature.current = signature;

			if (!fetchedOptions.length) {
				setErrorMessage(
					__(
						'No matching models were returned for this provider.',
						'tryaura'
					)
				);
				return;
			}

			if (value) {
				const selectedOption = fetchedOptions.find(
					(option) => option.value === value
				);

				if (selectedOption && labelKey) {
					updateValue(labelKey, selectedOption.label);
				}
			}
		} catch (error: unknown) {
			setOptions([]);
			lastFetchSignature.current = '';
			setErrorMessage(
				error instanceof Error
					? error.message
					: __(
							'Unable to fetch models right now. Please try again.',
							'tryaura'
						)
			);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (apiKey.trim()) {
			void runFetch();
			return;
		}

		setOptions([]);
		setErrorMessage('');
		lastFetchSignature.current = '';
	}, [apiKey, provider, modelType]);

	return (
		<div
			className="grid grid-cols-12 gap-2 items-start w-full p-4"
			id={element.id}
			data-testid={`settings-field-${element.id}`}
		>
			<div className="sm:col-span-8 col-span-12">
				<div className="flex flex-col gap-1">
					{label ? (
						<span className="text-sm font-semibold text-foreground">
							{label}
						</span>
					) : null}
					{description ? (
						<div className="text-xs leading-relaxed text-muted-foreground">
							{description}
						</div>
					) : null}
				</div>
			</div>

			<div className="sm:col-span-4 col-span-12 flex min-w-0 flex-col gap-2">
				<div className="flex w-full min-w-0 gap-2">
					<Select
						value={value}
						onValueChange={(selectedValue: string) => {
							const selectedOption = mergedOptions.find(
								(option) => option.value === selectedValue
							);

							updateValue(valueKey, selectedValue);

							if (labelKey) {
								updateValue(
									labelKey,
									selectedOption?.label || selectedValue
								);
							}
						}}
						disabled={isLoading || !apiKey.trim()}
					>
						<SelectTrigger className="w-full min-w-0 flex-1 bg-background">
							<SelectValue
								className="min-w-0 truncate"
								placeholder={
									isLoading
										? __('Loading models…', 'tryaura')
										: __('Select a model', 'tryaura')
								}
							>
								{selectedLabel || undefined}
							</SelectValue>
						</SelectTrigger>
						<SelectContent align="end">
							{mergedOptions.map((option) => (
								<SelectItem
									key={option.value}
									value={option.value}
								>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Button
						type="button"
						variant="outline"
						className="shrink-0 whitespace-nowrap"
						onClick={() => void runFetch(true)}
						disabled={isLoading || !apiKey.trim()}
					>
						{isLoading
							? __('Fetching…', 'tryaura')
							: __('Fetch Models', 'tryaura')}
					</Button>
				</div>

				{errorMessage ? (
					<Notice variant="destructive">
						<NoticeTitle>{errorMessage}</NoticeTitle>
					</Notice>
				) : (
					<div className="text-xs leading-relaxed text-muted-foreground">
						{apiKey.trim()
							? __(
									'The saved selection stays visible after refresh, even before you fetch again.',
									'tryaura'
								)
							: __(
									'Enter the provider API key to load available models.',
									'tryaura'
								)}
					</div>
				)}
			</div>
		</div>
	);
};

addFilter(
	'tryaura_settings_model_selector_field',
	'tryaura/settings/model-selector-field',
	(_defaultElement, fieldData: ModelSelectorElement) => (
		<ModelSelectorField element={fieldData} />
	)
);
