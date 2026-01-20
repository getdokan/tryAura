import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
} from 'recharts';
import { __ } from '@wordpress/i18n';

function UsageChart( { className } ) {
	const data = [
		{
			name: 'Page A',
			uv: 4000,
			pv: 2400,
			amt: 2400,
		},
		{
			name: 'Page B',
			uv: 3000,
			pv: 1398,
			amt: 2210,
		},
		{
			name: 'Page C',
			uv: 2000,
			pv: 9800,
			amt: 2290,
		},
		{
			name: 'Page D',
			uv: 2780,
			pv: 3908,
			amt: 2000,
		},
		{
			name: 'Page E',
			uv: 1890,
			pv: 4800,
			amt: 2181,
		},
		{
			name: 'Page F',
			uv: 2390,
			pv: 3800,
			amt: 2500,
		},
		{
			name: 'Page G',
			uv: 3490,
			pv: 4300,
			amt: 2100,
		},
	];
	return (
		<div className={ className }>
			<div className="flex flex-row flex-wrap justify-between gap-6 mb-6">
				<h2 className="text-[18px] font-semibold text-[rgba(51,51,51,1)] m-0">
					{ __( 'Content Creation Activity', 'try-aura' ) }
				</h2>
				<div className="flex flex-row gap-2">
					jhjhb
				</div>
			</div>
			<div>
				<LineChart
					style={ {
						width: '100%',
						maxWidth: '100%',
						height: '100%',
						maxHeight: '368px',
						aspectRatio: 1.618,
					} }
					responsive
					data={ data }
					margin={ {
						top: 5,
						right: 0,
						left: 0,
						bottom: 5,
					} }
				>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey="name" />
					<YAxis width="auto" />
					<Tooltip />
					<Legend />
					<Line
						type="monotone"
						dataKey="pv"
						stroke="#8884d8"
						activeDot={ { r: 8 } }
					/>
					<Line type="monotone" dataKey="uv" stroke="#82ca9d" />
				</LineChart>
			</div>
		</div>
	);
}

export default UsageChart;
