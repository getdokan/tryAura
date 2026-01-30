import { Button, Toggle } from '../../../../../../components';
import { toast } from '@tryaura/components';
import { RawHTML, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from 'react-router-dom';
import { useSelect, useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
// @ts-ignore
import { STORE_NAME } from '@tryaura/settings';
import ScanFace from './ScanFace';
import SettingDetailsContainer from '../../components/SettingDetailsContainer';
import { Modal } from '@wordpress/components';
import { X } from 'lucide-react';

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
	const [ confirmOpen, setConfirmOpen ] = useState( false );
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
				path: '/tryaura/v1/settings/bulk-try-on',
				method: 'POST',
				data: { enabled },
			} );

			toast.success( response.message || __( 'Success', 'tryaura' ) );
		} catch ( error: any ) {
			toast.error(
				error.message || __( 'Something went wrong', 'tryaura' )
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

			setConfirmOpen( false );
		} catch ( e: unknown ) {
			const msg =
				e && typeof e === 'object' && 'message' in e
					? String( ( e as any ).message )
					: __( 'Something went wrong', 'tryaura' );

			toast.error( msg );
		}
	};

	return (
		<>
			{ confirmOpen && (
				<Modal
					onRequestClose={ () => setConfirmOpen( false ) }
					className="tryaura tryaura-bulk-tryon-confirm-modal"
					__experimentalHideHeader
					size="medium"
					style={ {
						maxHeight: '90vh',
						maxWidth: '512px',
						overflowY: 'auto',
					} }
					shouldCloseOnClickOutside={ false }
				>
					<div>
						<div className="flex justify-end items-center">
							<button
								onClick={ ( e ) => {
									e.preventDefault();
									setConfirmOpen( false );
								} }
								className="cursor-pointer text-[rgba(130,130,130,1)] hover:bg-red-50 hover:text-red-400 p-1.25 m-3.5 rounded-md"
							>
								<X size={ 20 } />
							</button>
						</div>

						<div className="flex flex-col">
							<div className="flex flex-col gap-5 px-8">
								<h2 className="p-0 m-0">
									{ __(
										'Are you sure you want to Enable Bulk Try-On?',
										'tryaura'
									) }
								</h2>
								<span>
									{ __(
										'This setting will apply try-on functionality to all products.',
										'tryaura'
									) }
								</span>
							</div>
							<div className="flex justify-end gap-3 p-[20px_32px] mt-3">
								<Button
									className="py-3 px-7"
									variant="outline"
									onClick={ () => setConfirmOpen( false ) }
								>
									{ __( 'No, Go Back', 'tryaura' ) }
								</Button>
								<Button
									className="py-3 px-7"
									onClick={ onSave }
									disabled={ saving }
									loading={ saving }
								>
									{ checked
										? __( 'Yes, Enable', 'tryaura' )
										: __( 'Yes, Disable', 'tryaura' ) }
								</Button>
							</div>
						</div>
					</div>
				</Modal>
			) }
			<SettingDetailsContainer
				footer={
					! fetching && (
						<>
							<Button
								className="py-3 px-7"
								onClick={ () => setConfirmOpen( true ) }
							>
								{ __( 'Save', 'tryaura' ) }
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
							<div className="w-15.75 h-15.5 bg-primary rounded-2xl flex justify-center items-center">
								<ScanFace color="white" />
							</div>
							<div>
								<div className="font-semibold text-[20px] leading-[28px] tracking-normal align-middle mb-[8px]">
									{ __( 'Bulk Try-On Control', 'tryaura' ) }
								</div>
								<div className="text-[14px] font-[400] leading-[18.67px] text-[rgba(99,99,99,1)]">
									{ __(
										'Enable or disable try-on for all products in your store.',
										'tryaura'
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
											'tryaura'
										) }
									</span>
									<span className="text-[rgba(130,130,130,1)] font-normal text-[12px]">
										{ __(
											'This setting will apply try-on functionality to all products.',
											'tryaura'
										) }
									</span>
								</div>
							</div>
						</div>
					</div>
				) }
			</SettingDetailsContainer>
		</>
	);
};
export default TryOnControlSettings;
