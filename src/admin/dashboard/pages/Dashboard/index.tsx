import { __ } from '@wordpress/i18n';
import StateCardItem from './Components/StateCardItem';
import { Eye } from 'lucide-react';

function Index() {
	return (
		<div>
			<h1 className="font-[600] text-[20px] leading-[28px] text-[rgba(51,51,51,0.8)]">
				{ __( 'Dashboard', 'try-aura' ) }
			</h1>

			<div className="mt-[16px] flex flex-row gap-[32px] flex-wrap">
				{ Array( 4 )
					.fill( null )
					.map( ( _, index ) => (
						<StateCardItem
							key={ index }
							title={ __( 'Total Products', 'try-aura' ) }
							value={ 100 }
							iconColor="red"
							Icon={ Eye }
						/>
					) ) }
			</div>
		</div>
	);
}

export default Index;
