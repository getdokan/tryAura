import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { Button } from '../../../../../components';
import { toast } from '@tryaura/components';
import Toggle from '../../../../../components/Toggle';

function ProductTryOn() {
	const [ enabling, setEnabling ] = useState( false );
	const [ disabling, setDisabling ] = useState( false );
	const [ checked, setChecked ] = useState( false );

	const handleBulkAction = async ( enabled: boolean ) => {
		if ( enabled ) {
			setEnabling( true );
		} else {
			setDisabling( true );
		}

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
		} finally {
			setEnabling( false );
			setDisabling( false );
		}
	};

	return (
		<div className="flex flex-col bg-[#FFFFFF] border-2 border-[#FFFFFF] p-6 rounded-2xl gap-4">
			<h2 className="font-semibold text-lg">
				{ __( 'Bulk Try-On Control', 'try-aura' ) }
			</h2>
			<p className="text-gray-600">
				{ __(
					'Enable or disable try-on for all products in your store.',
					'try-aura'
				) }
			</p>
			<div className="flex gap-4">
				<Button
					onClick={ () => handleBulkAction( true ) }
					loading={ enabling }
					disabled={ disabling }
				>
					{ __( 'Enable for all products', 'try-aura' ) }
				</Button>
				<Button
					onClick={ () => handleBulkAction( false ) }
					loading={ disabling }
					disabled={ enabling }
				>
					{ __( 'Disable for all products', 'try-aura' ) }
				</Button>

				<Toggle checked={checked} onChange={setChecked} />
			</div>
		</div>
	);
}

export default ProductTryOn;
