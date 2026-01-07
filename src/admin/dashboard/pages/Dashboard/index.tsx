import { __ } from '@wordpress/i18n';
import StateCardItem from './Components/StateCardItem';
import RecentActivity from './Components/RecentActivity';
import TryAuraConfiguration from './Components/TryAuraConfiguration';
import { Image, Video, Sparkles, Clock, Eye } from 'lucide-react';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '../../../../components';

function Index() {
	const today = new Date();
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate( today.getDate() - 30 );

	const [ range, setRange ] = useState< DateRange | undefined >( {
		from: thirtyDaysAgo,
		to: today,
	} );
	const [ stats, setStats ] = useState( {
		image_count: 0,
		video_count: 0,
		tryon_count: 0,
		total_tokens: 0,
		video_seconds: 0,
	} );
	const [ loading, setLoading ] = useState( true );

	const formatDateForApi = ( date?: Date ) => {
		if ( ! date ) {
			return '';
		}
		const year = date.getFullYear();
		const month = String( date.getMonth() + 1 ).padStart( 2, '0' );
		const day = String( date.getDate() ).padStart( 2, '0' );
		return `${ year }-${ month }-${ day }`;
	};

	useEffect( () => {
		const params: any = {};
		if ( range?.from ) {
			params.start_date = formatDateForApi( range.from );
		}
		if ( range?.to ) {
			params.end_date = formatDateForApi( range.to );
		}

		setLoading( true );
		apiFetch( { path: addQueryArgs( '/try-aura/v1/stats', params ) } )
			.then( ( data: any ) => {
				setStats( data );
				setLoading( false );
			} )
			.catch( () => setLoading( false ) );
	}, [ range ] );

	return (
		<div>
			<div className="flex flex-row justify-between flex-wrap mt-5">
				<h1 className="font-[600] text-[20px] leading-[28px] text-[rgba(51,51,51,0.8)]">
					{ __( 'Dashboard', 'try-aura' ) }
				</h1>

				<div>
					<DateRangePicker value={ range } onChange={ setRange } />
				</div>
			</div>

			<div className="mt-[16px] flex flex-col md:flex-row gap-[32px] flex-wrap">
				<StateCardItem
					title={ __( 'Images Generated', 'try-aura' ) }
					value={ stats.image_count }
					iconColor="#7047EB"
					Icon={ Image }
					loading={ loading }
				/>
				<StateCardItem
					title={ __( 'Videos Generated', 'try-aura' ) }
					value={ stats.video_count }
					iconColor="#FF9345"
					Icon={ Video }
					loading={ loading }
				/>
				<StateCardItem
					title={ __( 'Virtual Try-Ons', 'try-aura' ) }
					value={ stats.tryon_count.toLocaleString() }
					iconColor="#0ea5e9"
					Icon={ Eye }
					loading={ loading }
				/>
				<StateCardItem
					title={ __( 'API Token Counts', 'try-aura' ) }
					value={ stats.total_tokens.toLocaleString() }
					iconColor="#47BF73"
					Icon={ Sparkles }
					loading={ loading }
				/>
				<StateCardItem
					title={ __( 'Generated Video Duration', 'try-aura' ) }
					value={ stats.video_seconds.toFixed( 1 ) + 's' }
					iconColor="#f59e0b"
					Icon={ Clock }
					loading={ loading }
				/>
			</div>

			<div className="mt-[32px] grid grid-cols-1 lg:grid-cols-3 gap-[32px]">
				<RecentActivity className="bg-white lg:col-span-2 rounded-[16px] border border-[rgba(230,230,230,1)] p-[24px] h-full w-full flex flex-col" />
				<TryAuraConfiguration className="bg-white lg:col-span-1 rounded-[16px] border border-[rgba(230,230,230,1)] p-[24px] flex flex-col items-center justify-center text-center h-full w-full" />
			</div>
		</div>
	);
}

export default Index;
