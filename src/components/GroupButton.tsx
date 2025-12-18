import { twMerge } from "tailwind-merge";

export interface GroupButtonProps {
  options: {label: string; value: string; disabled?: boolean}[];
  onClick: (value: string) => void;
  value: string;
}

const GroupButton = ({ options, onClick, value }: GroupButtonProps) => {
  let classNames = "bg-black px-3 py-2 text-[14px] text-white hover:bg-bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 cursor-pointer";
  let normalButtonCLass = "bg-white px-3 py-2 text-[14px] text-gray-900 inset-ring inset-ring-gray-300 hover:bg-gray-50 cursor-pointer";

  return (
    <div>
      {
        options.map( (option, index) => {
          return <button
            className={ twMerge( value === option?.value ? classNames : normalButtonCLass, index === 0 ? 'rounded-l-[5px]' : '', index === options.length - 1 ? 'rounded-r-[5px]' : '', option?.disabled ? 'opacity-50 cursor-not-allowed' : '' ) }
            onClick={ () => onClick( option?.value ) }
            key={ option?.value }
            disabled={option?.disabled ?? false}
          >
            {option?.label ?? ''}
          </button>
        } )
      }
    </div>
  );
}

export default GroupButton;