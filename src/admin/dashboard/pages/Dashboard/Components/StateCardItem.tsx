import { twMerge } from 'tailwind-merge';
import { Tooltip } from '@wordpress/components';

type Props = {
	Icon: React.ComponentType;
	iconColor: string;
	title: string;
	value: string | number;
	className?: string;
	loading?: boolean;
};

function StateCardItemLoader() {
	return (
		<div className="w-full h-40.75 rounded-2xl border p-6 bg-[rgba(255,255,255,1)] border-[rgba(230,230,230,1)] flex flex-col justify-between col-span-1">
			<div className="w-9 h-9 rounded-[5px] bg-neutral-300 animate-pulse"></div>
			<div className="h-4 w-3/4 rounded-[5px] bg-neutral-300 animate-pulse"></div>
			<div className="h-7 w-2/4 rounded-[5px] bg-neutral-300 animate-pulse"></div>
		</div>
	);
}

function StateCardItem( {
	Icon,
	title,
	value,
	iconColor,
	className = '',
	loading = true,
}: Props ) {
	if ( loading ) {
		return <StateCardItemLoader />;
	}
	return (
		<div
			className={ twMerge(
				'w-full h-40.75 rounded-2xl border p-6 bg-[rgba(255,255,255,1)] border-[rgba(230,230,230,1)] flex flex-col justify-between col-span-1',
				className
			) }
		>
			{ /*@ts-ignore*/ }
			<Icon size={ 36 } color={ iconColor } strokeWidth={ 1 } />
			<p className="font-medium text-[14px] text-[rgba(99,99,99,1)] p-0 m-0">
				{ title }
			</p>
			<Tooltip text={ value.toString() } placement="bottom-start">
				<span className="font-medium text-[24px] leading-8 text-[rgba(51,51,51,1)] p-0 m-0">
					{ value }
				</span>
			</Tooltip>
		</div>
	);
}

export default StateCardItem;
