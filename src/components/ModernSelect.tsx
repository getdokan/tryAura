import { Popover } from "@wordpress/components";
import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
const ModernSelect = ({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  className = '',
  label = ''
  }: {
  value: string;
  label?: string;
  onChange: (val: string) => void;
  options: { label: string; value: string; icon?: any }[];
  placeholder?: string;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const contentRef = useRef< HTMLDivElement >( null );
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const current = options.find((o) => o.value === value);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <label className={`relative flex flex-col gap-[4px] ${className}`} ref={ contentRef } >
      { label && <span className="w-[500] text-[14px] mb-[8px]">{ label }</span> }
      <div>
        <button
          ref={anchorRef}
          type="button"
          className="w-full p-[10px_16px] border border-[#E9E9E9] rounded-[5px] flex items-center justify-between bg-white focus:outline-none"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="truncate">{current ? current.label : placeholder}</span>
          <ChevronDown size={16} className={`w-4 h-4 ml-2 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open ? (
          <Popover
            anchor={anchorRef.current}
            placement="bottom-start"
            onClose={() => setOpen(false)}
            focusOnMount={false}
            noArrow
            flip={true}
            style={ {
              marginTop: '8px',
            } }
            className="tryaura"
          >
            <div
              className="bg-white border border-[#E9E9E9] rounded-[5px] rounded-[5px] shadow flex flex-row flex-wrap"
              style={ {
                width: contentRef?.current?.offsetWidth ?? 'auto',
                padding: '8px'
              } }
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  className={ `text-[#828282] w-[78.25px] p-[12px] h-auto rounded-[3px] flex flex-col items-center justify-center gap-[4px] hover:text-primary border border-transparent hover:border-primary cursor-pointer ${opt.value === value ? 'bg-neutral-100' : 'bg-white'}` }
                  onClick={() => handleSelect(opt.value)}
                >
                  {opt.icon ?? ''}
                  <span className="text-sm">{opt.label}</span>
                </button>
              ))}
            </div>
          </Popover>
        ) : null}
      </div>
    </label>
  );
};

export default ModernSelect;