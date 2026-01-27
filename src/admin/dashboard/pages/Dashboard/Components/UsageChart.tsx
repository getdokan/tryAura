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
import { applyFilters } from '@wordpress/hooks';

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
	// @ts-ignore
	const wcExists = window?.tryAura?.wcExists ?? false;

	const chartLineItemLabels = applyFilters(
		'tryaura.dashboard.usage-chart.line-item-labels',
		[
			{
				value: 'images',
				label: __( 'Images', 'try-aura' ),
				color: 'var(--color-primary)',
			},
			...( wcExists
				? [
						{
							value: 'tryOns',
							label: __( 'Try-Ons', 'try-aura' ),
							color: 'rgba(38,176,255,1)',
						},
				  ]
				: [] ),
		]
	);
	const lines: Array< object > = applyFilters(
		'tryaura.dashboard.usage-chart.lines',
		[
			{
				type: 'monotone',
				dataKey: 'images',
				name: 'images',
				stroke: 'var(--color-primary)',
				strokeWidth: 2.5,
				dot: false,
				activeDot: {
					r: 6,
					stroke: 'var(--color-primary)',
					strokeWidth: 2,
					fill: '#fff',
				},
			},
			...( wcExists
				? [
						{
							type: 'monotone',
							dataKey: 'tryOns',
							name: 'tryOns',
							stroke: 'rgba(38, 176, 255, 1)',
							strokeWidth: 2,
							dot: false,
							activeDot: {
								r: 6,
								stroke: 'rgba(38, 176, 255, 1)',
								strokeWidth: 2,
								fill: '#fff',
							},
						},
				  ]
				: [] ),
		]
	);

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

	const realMax = Math.max(
		...data.flatMap( ( item ) => {
			return applyFilters(
				'tryaura.dashboard.usage-chart.data-value',
				[ item.images || 0, item.tryOns || 0 ],
				item
			);
		} ),
		0
	);

	// Determine a suitable maximum and step based on the data
	let chartMax;
	let step;

	if ( realMax <= 10 ) {
		chartMax = 10;
		step = 2;
	} else if ( realMax <= 50 ) {
		chartMax = Math.ceil( realMax / 10 ) * 10;
		step = 10;
	} else if ( realMax <= 100 ) {
		chartMax = Math.ceil( realMax / 20 ) * 20;
		step = 20;
	} else if ( realMax <= 500 ) {
		chartMax = Math.ceil( realMax / 100 ) * 100;
		step = 100;
	} else if ( realMax <= 2000 ) {
		chartMax = Math.ceil( realMax / 500 ) * 500;
		step = 500;
	} else if ( realMax <= 5000 ) {
		chartMax = Math.ceil( realMax / 1000 ) * 1000;
		step = 1000;
	} else {
		chartMax = Math.ceil( realMax / 2500 ) * 2500;
		step = 2500;
	}

	const ticks = Array.from(
		{ length: Math.floor( chartMax / step ) + 1 },
		( _, i ) => i * step
	);

	const CustomTooltip = ( { active, payload } ) => {
		if ( active && payload && payload.length ) {
			const getLabel = ( name ) => {
				return (
					chartLineItemLabels.find( ( item ) => item.value === name )
						?.label || ''
				);
			};

			return (
				<div className="bg-[rgba(37,51,78,1)] text-white p-3 rounded-xl shadow-lg border-none outline-none relative mb-2 min-w-[160px]">
					<div className="flex flex-col gap-3">
						{ payload.map( ( entry, index ) => (
							<div key={ index }>
								<p className="text-[10px] font-medium mb-0.5 text-white tracking-wider">
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
							{ chartLineItemLabels.map( ( item, index ) => {
								return (
									<div
										className="flex items-center gap-2"
										key={ index }
									>
										<div
											className="w-2 h-2 rounded-full"
											style={ {
												backgroundColor: item.color,
											} }
										/>
										<span className="text-sm font-medium text-[rgba(99,99,99,1)]">
											{ item.label }
										</span>
									</div>
								);
							} ) }
						</div>
					</div>
					<div className="h-87.5 w-full">
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
								<CartesianGrid
									stroke="rgba(230, 230, 230, 1)"
									strokeWidth={ 0.5 }
								/>
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
										stroke: 'rgba(230, 230, 230, 1)',
										strokeWidth: 1,
									} }
								/>
								{ lines.map( ( line, index ) => (
									<Line key={ index } { ...line } />
								) ) }
							</LineChart>
						</ResponsiveContainer>
					</div>
				</>
			) }
		</div>
	);
}

export default UsageChart;
