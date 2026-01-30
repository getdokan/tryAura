import { ArrowLeft } from 'lucide-react';
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
		const models =
			select( 'tryaura/ai-models' ).getProviderModels( 'google' ) || {};

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

	const [ selectedImageModel, setSelectedImageModel ] =
		useState< string >( '' );
	const [ selectedVideoModel, setSelectedVideoModel ] =
		useState< string >( '' );

	// On mount or when settings change, update local state
	useEffect( () => {
		const current = settings[ data.optionKey ];
		if ( current && typeof current === 'object' && current.google ) {
			setApiKey( current.google.apiKey || '' );
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
		try {
			console.log(settings);
			const newSettings = {
				...settings,
				[ data.optionKey ]: {
					...settings[ data.optionKey ],
					google: {
						apiKey,
						imageModel: selectedImageModel,
						videoModel: selectedVideoModel,
					},
				},
			};

			const res = await updateSettings( newSettings );

			const newValue = ( res as Record< string, any > )[ data.optionKey ];
			if ( newValue && newValue.google ) {
				window.tryAura.apiKey = newValue.google.apiKey;
				window.tryAura.imageModel = newValue.google.imageModel;
				window.tryAura.videoModel = newValue.google.videoModel;

				toast.success(
					__( 'Gemini API settings saved successfully!', 'tryaura' )
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
							<img src={ geminiLogo } alt="Gemini Logo" />
						</div>
						<div>
							<div className="font-semibold text-[20px] leading-[28px] tracking-normal align-middle mb-[8px]">
								{ __( 'Gemini Integration', 'tryaura' ) }
							</div>
							<div className="text-[14px] font-[400] leading-[18.67px] text-[rgba(99,99,99,1)]">
								{ __(
									'Connect your Gemini account with an API key. Need help finding your',
									'tryaura'
								) }
								&nbsp;
								<a
									href="https://aistudio.google.com/api-keys"
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
							setApiKey={ setApiKey }
						/>
						{ apiKey && (
							<>
								<div>
									<ModernSelect
										value={ selectedImageModel }
										label={ __( 'Select Image Model', 'tryaura' ) }
										onChange={ ( val ) => {
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
