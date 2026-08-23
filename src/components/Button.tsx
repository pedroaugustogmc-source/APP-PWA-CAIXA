import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950',
  secondary: 'border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100',
  danger: 'border border-red-200 text-loss hover:bg-red-50 active:bg-red-100',
  ghost: 'text-slate-500 hover:text-slate-700',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  fullWidth,
  className = '',
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    />
  )
}
