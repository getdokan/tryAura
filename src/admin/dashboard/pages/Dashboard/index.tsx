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
import { Slot } from '@wordpress/components';
import UsageChart from './Components/UsageChart';


function Index() {
	const today = new Date();
	const startOfMonth = new Date( today.getFullYear(), today.getMonth(), 1 );

	const [ range, setRange ] = useState< DateRange | undefined >( {
		from: startOfMonth,
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
	const [ wcExists, setWcExists ] = useState( false );

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
		apiFetch( {
			path: addQueryArgs( '/try-aura/v1/stats', params ),
			parse: false,
		} )
			.then( ( response: any ) => {
				setWcExists(
					response.headers.get( 'X-Try-Aura-WC-Exists' ) === 'true'
				);
				if ( ! response.ok ) {
					return response.json().then( ( err: any ) => {
						throw err;
					} );
				}
				return response.json();
			} )
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

			<div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
				<StateCardItem
					title={ __( 'Total Images Generated', 'try-aura' ) }
					value={ stats.image_count }
					iconColor="var(--color-primary)"
					Icon={ Image }
					loading={ loading }
				/>
				<Slot
					name="try-aura-generated-video-count-card"
					fillProps={{
						StateCardItem,
						stats,
						Video,
						loading,
					}}
				/>
				{ wcExists && (
					<StateCardItem
						title={ __( 'Virtual Try-Ons', 'try-aura' ) }
						value={ stats.tryon_count?.toLocaleString() || 0 }
						iconColor="#0ea5e9"
						Icon={ Eye }
						loading={ loading }
					/>
				) }
				<StateCardItem
					title={ __( 'API Token Counts', 'try-aura' ) }
					value={ stats.total_tokens.toLocaleString() }
					iconColor="#47BF73"
					Icon={ Sparkles }
					loading={ loading }
				/>
				<Slot
					name="try-aura-generated-video-duration-card"
					fillProps={{
						StateCardItem,
						stats,
						loading,
						Clock

					}}
				/>

			</div>

			<div className="mt-[32px]">
				<UsageChart
					range={ range }
					className="bg-white rounded-2xl border border-[rgba(230,230,230,1)] p-6 h-full w-full flex flex-col"
				/>
			</div>

			<div className="mt-[32px] grid grid-cols-1 lg:grid-cols-3 gap-[32px]">
				<RecentActivity
					wcExists={ wcExists }
					className="bg-white lg:col-span-2 rounded-[16px] border border-[rgba(230,230,230,1)] p-[24px] h-full w-full flex flex-col"
				/>
				<TryAuraConfiguration className="bg-white lg:col-span-1 rounded-[16px] border border-[rgba(230,230,230,1)] p-[24px] flex flex-col items-center justify-center text-center h-full w-full" />
			</div>
		</div>
	);
}

export default Index;
