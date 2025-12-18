import { forwardRef } from '@wordpress/element';
import { twMerge } from "tailwind-merge";

type Variant = 'solid' | 'outline';
type Color = 'primary';

export interface ButtonProps extends Omit<JSX.IntrinsicElements['button'], 'color'> {
  variant?: Variant;
  color?: Color;
}
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'solid',
    color = 'primary',
    className,
    children,
    type = 'button',
    ...rest
  }, ref
){

  let classNames = "rounded-[5px] bg-primary px-3 py-2 text-[14px] text-white hover:bg-bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 cursor-pointer";

  if (variant === 'outline') {
    classNames = "rounded-[5px] bg-white px-3 py-2 text-[14px] text-gray-900 inset-ring inset-ring-gray-300 hover:bg-gray-50 cursor-pointer"
  }
  const Tag = type === 'link' ? 'a' : 'button';

  return (
    <Tag
      className={ twMerge(classNames, className) }
      {...rest}
    >
      {children ?? ''}
    </Tag>
  );
});

export default Button;