import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts';
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { DateRange } from 'react-day-picker';

const CustomTooltip = ( { active, payload } ) => {
	if ( active && payload && payload.length ) {
		const getLabel = ( name ) => {
			switch ( name ) {
				case 'images':
					return __( 'A.I. Images Generated', 'try-aura' );
				case 'videos':
					return __( 'Videos', 'try-aura' );
				case 'tryOns':
					return __( 'Try-Ons', 'try-aura' );
				default:
					return name;
			}
		};

		return (
			<div className="bg-[#1e293b] text-white p-3 rounded-xl shadow-lg border-none outline-none relative mb-2 min-w-[160px]">
				<div className="flex flex-col gap-3">
					{ payload.map( ( entry, index ) => (
						<div key={ index }>
							<p className="text-[10px] font-medium mb-0.5 text-slate-400 uppercase tracking-wider">
								{ getLabel( entry.name ) }
							</p>
							<p className="text-lg font-bold m-0 leading-tight">
								{ entry.value.toLocaleString() }
							</p>
						</div>
					) ) }
				</div>
			</div>
		);
	}
	return null;
};

function UsageChartLoader() {
	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-row flex-wrap justify-between items-center gap-6">
				<div className="h-7 w-48 rounded-[5px] bg-neutral-200 animate-pulse" />
				<div className="flex flex-row gap-6">
					<div className="flex items-center gap-2">
						<div className="h-4 w-20 rounded-[5px] bg-neutral-200 animate-pulse" />
					</div>
					<div className="flex items-center gap-2">
						<div className="h-4 w-20 rounded-[5px] bg-neutral-200 animate-pulse" />
					</div>
					<div className="flex items-center gap-2">
						<div className="h-4 w-20 rounded-[5px] bg-neutral-200 animate-pulse" />
					</div>
				</div>
			</div>
			<div className="h-87.5 w-full bg-neutral-200 rounded-2xl animate-pulse" />
		</div>
	);
}

function UsageChart( {
	className,
	range,
}: {
	className?: string;
	range?: DateRange;
} ) {
	const [ data, setData ] = useState( [] );
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
		apiFetch( {
			path: addQueryArgs( '/try-aura/v1/chart-data', params ),
		} )
			.then( ( response: any ) => {
				setData( response );
				setLoading( false );
			} )
			.catch( () => {
				setLoading( false );
			} );
	}, [ range ] );

	const maxValue = Math.max(
		...data.flatMap( ( item ) => [
			item.images,
			item.videos,
			item.tryOns,
		] ),
		2000
	);

	// Round up to nearest 500
	const chartMax = Math.ceil( maxValue / 500 ) * 500;
	const ticks = Array.from(
		{ length: chartMax / 500 + 1 },
		( _, i ) => i * 500
	);

	return (
		<div
			className={ `bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm ${ className }` }
		>
			{ loading ? (
				<UsageChartLoader />
			) : (
				<>
					<div className="flex flex-row flex-wrap justify-between items-center gap-6 mb-8">
						<h2 className="text-[18px] font-semibold text-[#333333] m-0">
							{ __( 'Content Creation Activity', 'try-aura' ) }
						</h2>
						<div className="flex flex-row gap-6">
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-[rgba(112,71,235,1)]" />
								<span className="text-sm font-medium text-[rgba(99,99,99,1)]">
									{ __( 'Images', 'try-aura' ) }
								</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-[rgba(255,147,69,1)]" />
								<span className="text-sm font-medium text-[rgba(99,99,99,1)]">
									{ __( 'Videos', 'try-aura' ) }
								</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-[rgba(38,176,255,1)]" />
								<span className="text-sm font-medium text-[rgba(99,99,99,1)]">
									{ __( 'Try-Ons', 'try-aura' ) }
								</span>
							</div>
						</div>
					</div>
					<div className="h-[350px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart
								data={ data }
								margin={ {
									top: 10,
									right: 30,
									left: -20,
									bottom: 20,
								} }
							>
								<CartesianGrid stroke="#f1f5f9" />
								<XAxis
									dataKey="name"
									axisLine={ false }
									tickLine={ false }
									tick={ {
										fill: 'rgba(140, 140, 140, 1)',
										fontSize: 12,
									} }
									dy={ 10 }
								/>
								<YAxis
									axisLine={ false }
									tickLine={ false }
									tick={ {
										fill: 'rgba(140, 140, 140, 1)',
										fontSize: 12,
									} }
									ticks={ ticks }
									domain={ [ 0, chartMax ] }
								/>
								<Tooltip
									content={ <CustomTooltip /> }
									cursor={ {
										stroke: '#f1f5f9',
										strokeWidth: 1,
									} }
								/>
								<Line
									type="monotone"
									dataKey="images"
									name="images"
									stroke="rgba(112, 71, 235, 1)"
									strokeWidth={ 2.5 }
									dot={ false }
									activeDot={ {
										r: 6,
										stroke: 'rgba(112, 71, 235, 1)',
										strokeWidth: 2,
										fill: '#fff',
									} }
								/>
								<Line
									type="monotone"
									dataKey="videos"
									name="videos"
									stroke="rgba(255, 147, 69, 1)"
									strokeWidth={ 2 }
									dot={ false }
									activeDot={ {
										r: 6,
										stroke: 'rgba(255, 147, 69, 1)',
										strokeWidth: 2,
										fill: '#fff',
									} }
								/>
								<Line
									type="monotone"
									dataKey="tryOns"
									name="tryOns"
									stroke="rgba(38, 176, 255, 1)"
									strokeWidth={ 2 }
									dot={ false }
									activeDot={ {
										r: 6,
										stroke: 'rgba(38, 176, 255, 1)',
										strokeWidth: 2,
										fill: '#fff',
									} }
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				</>
			) }
		</div>
	);
}

export default UsageChart;
