import { Button, Toggle } from '../../../../../../components';
import { toast } from '@tryaura/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from 'react-router-dom';
import { useSelect, useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
// @ts-ignore
import { STORE_NAME } from '@tryaura/settings';
import ScanFace from './ScanFace';
import SettingDetailsContainer from '../../components/SettingDetailsContainer';

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

const TryOnControlSettings = () => {
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

	const [ checked, setChecked ] = useState( false );

	// On mount or when settings change, update local state
	useEffect( () => {
		const current = settings[ data.optionKey ];
		setChecked( !! current?.woocommerce?.bulkTryOnEenabled );
	}, [ settings, data.optionKey ] );

	const handleBulkAction = async ( enabled: boolean ) => {
		try {
			const response: any = await apiFetch( {
				path: '/try-aura/v1/settings/bulk-try-on',
				method: 'POST',
				data: { enabled },
			} );

			toast.success( response.message || __( 'Success', 'try-aura' ) );
		} catch ( error: any ) {
			toast.error(
				error.message || __( 'Something went wrong', 'try-aura' )
			);
		}
	};

	const onSave = async () => {
		try {
			const newSettings = {
				...settings,
				[ data.optionKey ]: {
					...settings[ data.optionKey ],
					woocommerce: {
						...settings[ data.optionKey ]?.woocommerce,
						bulkTryOnEenabled: checked,
					},
				},
			};

			await updateSettings( newSettings );
			await handleBulkAction( checked );
		} catch ( e: unknown ) {
			const msg =
				e && typeof e === 'object' && 'message' in e
					? String( ( e as any ).message )
					: __( 'Something went wrong', 'try-aura' );

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
							{ __( 'Save', 'try-aura' ) }
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
				)
			}
		>
			{ fetching ? (
				<InitialLoader />
			) : (
				<div className="flex flex-col w-full md:w-[550px]">
					<div className="flex flex-col gap-[24px] mb-[36px]">
						<div className="w-15.75 h-15.5 bg-primary rounded-2xl flex justify-center items-center">
							<ScanFace color="white" />
						</div>
						<div>
							<div className="font-semibold text-[20px] leading-[28px] tracking-normal align-middle mb-[8px]">
								{ __( 'Bulk Try-On Control', 'try-aura' ) }
							</div>
							<div className="text-[14px] font-[400] leading-[18.67px] text-[rgba(99,99,99,1)]">
								{ __(
									'Enable or disable try-on for all products in your store.',
									'try-aura'
								) }
							</div>
						</div>
					</div>
					<div className="flex flex-col gap-6">
						<div className="flex flex-row gap-3">
							<Toggle
								checked={ checked }
								onChange={ ( val ) => setChecked( val ) }
							/>
							<div className="flex flex-col gap-2">
								<span className="text-[rgba(37,37,45,1)] font-semibold text-[14px]">
									{ __(
										'Enable for All Products',
										'try-aura'
									) }
								</span>
								<span className="text-[rgba(130,130,130,1)] font-normal text-[12px]">
									{ __(
										'This setting will apply try-on functionality to all products.',
										'try-aura'
									) }
								</span>
							</div>
						</div>
					</div>
				</div>
			) }
		</SettingDetailsContainer>
	);
};
export default TryOnControlSettings;
