import { twMerge } from 'tailwind-merge';

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
		<div className="w-[276px] h-[163px] rounded-[16px] border p-[24px] bg-[rgba(255,255,255,1)] border-[rgba(230,230,230,1)] flex flex-col justify-between">
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
				'w-[276px] h-[163px] rounded-[16px] border p-[24px] bg-[rgba(255,255,255,1)] border-[rgba(230,230,230,1)] flex flex-col justify-between',
				className
			) }
		>
			<Icon size={ 36 } color={ iconColor } strokeWidth={ 2 } />
			<p className="font-[500] text-[14px] text-[rgba(99,99,99,1)] p-0 m-0">
				{ title }
			</p>
			<p className="font-[500] text-[24px] leading-[32px] text-[rgba(51,51,51,1)] p-0 m-0">
				{ value }
			</p>
		</div>
	);
}

export default StateCardItem;
