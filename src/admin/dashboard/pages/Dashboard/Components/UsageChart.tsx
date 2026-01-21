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
import { useState } from '@wordpress/element';

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

function UsageChart( { className } ) {
	const [ data, setData ] = useState( [
		{ name: 'Oct 2', images: 200, videos: 1750, tryOns: 750 },
		{ name: 'Oct 3', images: 250, videos: 800, tryOns: 1300 },
		{ name: 'Oct 4', images: 800, videos: 200, tryOns: 900 },
		{ name: 'Oct 5', images: 1500, videos: 600, tryOns: 800 },
		{ name: 'Oct 6', images: 1000, videos: 700, tryOns: 1600 },
		{ name: 'Oct 7', images: 600, videos: 100, tryOns: 1300 },
		{ name: 'Oct 8', images: 1400, videos: 200, tryOns: 1000 },
		{ name: 'Oct 31', images: 1800, videos: 550, tryOns: 850 },
	] );
	return (
		<div
			className={ `bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm ${ className }` }
		>
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
							ticks={ [ 0, 500, 1000, 1500, 2000 ] }
							domain={ [ 0, 2000 ] }
						/>
						<Tooltip
							content={ <CustomTooltip /> }
							cursor={ { stroke: '#f1f5f9', strokeWidth: 1 } }
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
		</div>
	);
}

export default UsageChart;
