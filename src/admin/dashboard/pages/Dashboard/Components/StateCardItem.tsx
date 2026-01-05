import { twMerge } from 'tailwind-merge';

type Props = {
	Icon: React.ComponentType;
	iconColor: string;
	title: string;
	value: string | number;
	className?: string;
};
function StateCardItem( {
	Icon,
	title,
	value,
	iconColor,
	className = '',
}: Props ) {
	return (
		<div
			className={ twMerge(
				'w-[276px] h-[163px] rounded-[16px] border p-[24px] bg-[rgba(255,255,255,1)] border-[rgba(230,230,230,1)] flex flex-col justify-between',
				className
			) }
		>
			<Icon size={ 36 } color={ iconColor } />
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
