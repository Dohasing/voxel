import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../../lib/utils'

const buttonVariants = cva(
  'pressable inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--accent-color)] text-[var(--accent-color-foreground)] hover:bg-[var(--accent-color-muted)] shadow-sm shadow-[0_5px_15px_var(--accent-color-shadow)] border border-[var(--accent-color-border)]',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        outline:
          'border border-neutral-800 bg-transparent hover:bg-neutral-900 hover:text-white text-neutral-400',
        secondary: 'bg-neutral-800 text-white hover:bg-neutral-700',
        ghost: 'hover:bg-neutral-900 hover:text-white text-neutral-400',
        link: 'text-primary underline-offset-4 hover:underline',
        filter:
          'text-neutral-400 hover:text-white hover:bg-neutral-900 data-[state=open]:bg-neutral-800 data-[state=open]:text-white',
        filterItem:
          'text-neutral-300 hover:text-white hover:bg-neutral-800 justify-start !font-medium',
        filterItemActive:
          'bg-[var(--accent-color)] text-[var(--accent-color-foreground)] justify-start !font-bold'
      },
      size: {
        default: 'h-10 px-4 py-2.5',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10 p-2.5',
        iconSm: 'h-8 w-8 p-1.5'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
