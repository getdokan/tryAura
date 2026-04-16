import geminiLogo from '../assets/geminiLogo.svg';
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

type ModelOption = {
	label: string;
	value: string;
};

const DEFAULT_IMAGE_MODEL = 'google/gemini-2.5-flash-image';
const DEFAULT_VIDEO_MODEL = 'google/veo-3.1';

function getModelOptions( payload: any ): ModelOption[] {
	const rows = Array.isArray( payload?.data )
		? payload.data
		: Array.isArray( payload )
		? payload
		: [];

	const modelMap = new Map< string, ModelOption >();

	rows.forEach( ( item: any ) => {
		const id =
			typeof item?.id === 'string'
				? item.id
				: typeof item?.slug === 'string'
				? item.slug
				: '';

		if ( ! id ) {
			return;
		}

		modelMap.set( id, {
			value: id,
			label:
				typeof item?.name === 'string' && item.name.trim().length
					? item.name
					: id,
		} );
	} );

	return Array.from( modelMap.values() );
}

async function fetchOpenRouterJson( url: string, apiKey: string ) {
	const response = await fetch( url, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${ apiKey }`,
			'Content-Type': 'application/json',
		},
	} );

	const payload = await response.json().catch( () => ( {} ) );

	if ( ! response.ok ) {
		const details =
			typeof payload?.error?.message === 'string'
				? payload.error.message
				: typeof payload?.message === 'string'
				? payload.message
				: '';

		throw new Error(
			details ||
				__( 'Failed to fetch models from OpenRouter.', 'tryaura' )
		);
	}

	return payload;
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
	const { settings, fetching, saving } = useSelect( ( select ) => {
		return {
			settings: select( STORE_NAME ).getSettings(),
			fetching: select( STORE_NAME ).isFetchingSettings(),
			saving: select( STORE_NAME ).isSavingSettings(),
		};
	}, [] );

	const { updateSettings } = useDispatch( STORE_NAME );

	const navigate = useNavigate();
	const data = window.tryAura!;
	const [ apiKey, setApiKey ] = useState< string >( '' );
	const [ imageModels, setImageModels ] = useState< ModelOption[] >( [] );
	const [ videoModels, setVideoModels ] = useState< ModelOption[] >( [] );
	const [ isFetchingModels, setIsFetchingModels ] =
		useState< boolean >( false );
	const [ modelsFetched, setModelsFetched ] = useState< boolean >( false );
	const [ modelsError, setModelsError ] = useState< string >( '' );
	const [ lastFetchedKey, setLastFetchedKey ] = useState< string >( '' );

	const [ selectedImageModel, setSelectedImageModel ] =
		useState< string >( '' );
	const [ selectedVideoModel, setSelectedVideoModel ] =
		useState< string >( '' );

	const resetFetchedModels = () => {
		setImageModels( [] );
		setVideoModels( [] );
		setModelsFetched( false );
		setModelsError( '' );
	};

	const onApiKeyChange = ( nextApiKey: string ) => {
		setApiKey( nextApiKey );

		if ( nextApiKey.trim() !== lastFetchedKey.trim() ) {
			resetFetchedModels();
		}
	};

	const onFetchModels = async () => {
		const trimmedKey = apiKey.trim();

		if ( ! trimmedKey ) {
			toast.error( __( 'API key is required', 'tryaura' ) );
			return;
		}

		setIsFetchingModels( true );
		setModelsError( '' );

		try {
			const [ imagePayload, videoPayload ] = await Promise.all( [
				fetchOpenRouterJson(
					'https://openrouter.ai/api/v1/models?output_modalities=image',
					trimmedKey
				),
				fetchOpenRouterJson(
					'https://openrouter.ai/api/v1/videos/models',
					trimmedKey
				).catch( async () =>
					fetchOpenRouterJson(
						'https://openrouter.ai/api/v1/models?output_modalities=video',
						trimmedKey
					)
				),
			] );

			const imageOptions = getModelOptions( imagePayload );
			const videoOptions = getModelOptions( videoPayload );

			if ( ! imageOptions.length ) {
				throw new Error(
					__(
						'No image models were returned for this API key.',
						'tryaura'
					)
				);
			}

			if ( ! videoOptions.length ) {
				throw new Error(
					__(
						'No video models were returned for this API key.',
						'tryaura'
					)
				);
			}

			setImageModels( imageOptions );
			setVideoModels( videoOptions );
			setSelectedImageModel( ( current ) => {
				if ( imageOptions.some( ( item ) => item.value === current ) ) {
					return current;
				}

				const defaultOption = imageOptions.find(
					( item ) => item.value === DEFAULT_IMAGE_MODEL
				);

				return defaultOption
					? defaultOption.value
					: imageOptions[ 0 ].value;
			} );

			setSelectedVideoModel( ( current ) => {
				if ( videoOptions.some( ( item ) => item.value === current ) ) {
					return current;
				}

				const defaultOption = videoOptions.find(
					( item ) => item.value === DEFAULT_VIDEO_MODEL
				);

				return defaultOption
					? defaultOption.value
					: videoOptions[ 0 ].value;
			} );

			setModelsFetched( true );
			setLastFetchedKey( trimmedKey );
		} catch ( e: unknown ) {
			const message =
				e && typeof e === 'object' && 'message' in e
					? String( ( e as any ).message )
					: __( 'Failed to fetch OpenRouter models.', 'tryaura' );

			setModelsError( message );
			setModelsFetched( false );
			toast.error( message );
		} finally {
			setIsFetchingModels( false );
		}
	};

	useEffect( () => {
		const current = settings[ data.optionKey ];
		const providerSettings = current?.openrouter || current?.google;

		if ( current && typeof current === 'object' && providerSettings ) {
			const currentApiKey = providerSettings.apiKey || '';
			setApiKey( currentApiKey );
			setSelectedImageModel(
				providerSettings.imageModel || DEFAULT_IMAGE_MODEL
			);
			setSelectedVideoModel(
				providerSettings.videoModel || DEFAULT_VIDEO_MODEL
			);
		} else {
			setApiKey( '' );
			setSelectedImageModel( DEFAULT_IMAGE_MODEL );
			setSelectedVideoModel( DEFAULT_VIDEO_MODEL );
		}

		setLastFetchedKey( '' );
		resetFetchedModels();
	}, [ settings, data.optionKey ] );

	const onSave = async () => {
		if ( ! apiKey ) {
			toast.error( __( 'API key is required', 'tryaura' ) );
			return;
		}

		if ( ! modelsFetched ) {
			toast.error(
				__(
					'Please fetch available models before connecting.',
					'tryaura'
				)
			);
			return;
		}

		if ( ! selectedImageModel || ! selectedVideoModel ) {
			toast.error(
				__( 'Please select both image and video models.', 'tryaura' )
			);
			return;
		}

		try {
			const newSettings = {
				...settings,
				[ data.optionKey ]: {
					...settings[ data.optionKey ],
					openrouter: {
						apiKey,
						imageModel: selectedImageModel,
						videoModel: selectedVideoModel,
					},
				},
			};

			const res = await updateSettings( newSettings );
			const newValue = ( res as Record< string, any > )[ data.optionKey ];

			if ( newValue && newValue.openrouter ) {
				const aura = window.tryAura as any;
				aura.apiKey = newValue.openrouter.apiKey;
				aura.imageModel = newValue.openrouter.imageModel;
				aura.videoModel = newValue.openrouter.videoModel;

				toast.success(
					__(
						'OpenRouter API settings saved successfully!',
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

	return (
		<SettingDetailsContainer
			footer={
				fetching ? undefined : (
					<>
						<Button
							className="py-3 px-7"
							onClick={ onSave }
							disabled={
								saving || isFetchingModels || ! modelsFetched
							}
							loading={ saving || isFetchingModels }
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
							<img src={ geminiLogo } alt="OpenRouter Logo" />
						</div>
						<div>
							<div className="font-semibold text-[20px] leading-[28px] tracking-normal align-middle mb-[8px]">
								{ __( 'OpenRouter Integration', 'tryaura' ) }
							</div>
							<div className="text-[14px] font-[400] leading-[18.67px] text-[rgba(99,99,99,1)]">
								{ __(
									'Connect your OpenRouter account with an API key. Need help finding your',
									'tryaura'
								) }
								&nbsp;
								<a
									href="https://openrouter.ai/keys"
									className="text-primary underline hover:text-primary-dark"
									target="_blank"
									rel="noreferrer"
								>
									{ __( 'API key ?', 'tryaura' ) }
								</a>
							</div>
						</div>
					</div>

					<div className="flex flex-col gap-[24px]">
						<ApiKeyInput
							apiKey={ apiKey }
							setApiKey={ onApiKeyChange }
						/>

						{ apiKey && (
							<>
								<div className="flex items-center gap-3">
									<Button
										onClick={ onFetchModels }
										disabled={ isFetchingModels }
										loading={ isFetchingModels }
									>
										{ __( 'Fetch Models', 'tryaura' ) }
									</Button>
									<span className="text-[13px] text-[rgba(99,99,99,1)]">
										{ __(
											'After fetching, choose your image and video models, then connect.',
											'tryaura'
										) }
									</span>
								</div>

								{ modelsError && (
									<p className="m-0 text-[13px] text-red-600">
										{ modelsError }
									</p>
								) }

								{ modelsFetched && (
									<>
										<div>
											<ModernSelect
												value={ selectedImageModel }
												label={ __(
													'Select Image Model',
													'tryaura'
												) }
												onChange={ ( val ) => {
													setSelectedImageModel(
														val
													);
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
											} }
										/>
									</>
								) }
							</>
						) }
					</div>
				</div>
			) }
		</SettingDetailsContainer>
	);
};

export default GeminiSettings;
