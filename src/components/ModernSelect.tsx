import { Popover } from '@wordpress/components';
import { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { twMerge } from 'tailwind-merge';
const ModernSelect = ( {
	value,
	onChange,
	options,
	placeholder = __( 'Select…', 'try-aura' ),
	className = '',
	label = '',
	variant = 'grid',
}: {
	value: string;
	label?: string;
	onChange: ( val: string ) => void;
	options: { label: string; value: string; icon?: any }[];
	placeholder?: string;
	className?: string;
	variant?: 'grid' | 'list';
} ) => {
	const [ open, setOpen ] = useState( false );
	const contentRef = useRef< HTMLDivElement >( null );
	const [ popoverAnchor, setPopoverAnchor ] = useState();
	const current = options.find( ( o ) => o.value === value );

	if ( variant === 'list' ) {
	}

	const handleSelect = ( val: string ) => {
		onChange( val );
		setOpen( false );
	};

	return (
		<label
			className={ `relative flex flex-col gap-[4px] ${ className }` }
			ref={ contentRef }
		>
			{ label && (
				<span className="w-[500] text-[14px] mb-[8px]">{ label }</span>
			) }
			<div>
				<button
					// @ts-ignore
					ref={ setPopoverAnchor }
					type="button"
					className="w-full p-[10px_16px] border border-[#E9E9E9] rounded-[5px] flex items-center justify-between bg-white focus:outline-none"
					aria-haspopup="listbox"
					aria-expanded={ open }
					onClick={ () => setOpen( ( v ) => ! v ) }
				>
					<span className="truncate">
						{ current ? current.label : placeholder }
					</span>
					<ChevronDown
						size={ 16 }
						className={ `w-4 h-4 ml-2 shrink-0 transition-transform ${
							open ? 'rotate-180' : ''
						}` }
					/>
				</button>

				{ open ? (
					<Popover
						anchor={ popoverAnchor }
						onClose={ () => setOpen( false ) }
						onFocusOutside={ () => setOpen( false ) }
						noArrow
						flip={ true }
						style={ {
							marginTop: '8px',
						} }
						className="tryaura"
					>
						<div
							className={ twMerge(
								'bg-white border border-[#E9E9E9] rounded-[5px] rounded-[5px] shadow flex flex-wrap',
								variant === 'list' ? 'flex-col' : 'flex-row'
							) }
							style={ {
								width:
									contentRef?.current?.offsetWidth ?? 'auto',
								padding: variant === 'list' ? '8px 0px' : '8px',
							} }
						>
							{ options.map( ( opt ) => (
								<button
									key={ opt.value }
									type="button"
									role="option"
									aria-selected={ opt.value === value }
									className={ twMerge(
										'text-[#828282] h-auto rounded-[3px] flex gap-[4px] hover:text-primary hover:bg-[#EFEAFF] cursor-pointer',
										opt.value === value
											? 'bg-neutral-100'
											: 'bg-white',
										variant === 'list'
											? 'w-full flex-row p-[8px_12px]'
											: 'w-[78.25px] p-[12px] flex-col items-center justify-center border border-transparent hover:border-primary'
									) }
									onClick={ () => handleSelect( opt.value ) }
								>
									{ opt.icon ?? '' }
									<span className="text-sm">
										{ opt.label }
									</span>
								</button>
							) ) }
						</div>
					</Popover>
				) : null }
			</div>
		</label>
	);
};

export default ModernSelect;
