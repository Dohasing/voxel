import React, { useState, useCallback } from 'react'
import { cn } from '@renderer/lib/utils'

interface PriceInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
  className?: string
}

export const PriceInput = ({ value, onChange, placeholder, label, className }: PriceInputProps) => {
  const [isFocused, setIsFocused] = useState(false)
  const [localValue, setLocalValue] = useState(value)

  // Update local value when prop changes (e.g., when cleared externally)
  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    // Only allow numbers
    if (newValue === '' || /^\d+$/.test(newValue)) {
      setLocalValue(newValue)
    }
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    // Only update parent on blur to reduce re-renders and lag
    onChange(localValue)
  }, [localValue, onChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        onChange(localValue)
        e.currentTarget.blur()
      }
    },
    [localValue, onChange]
  )

  const displayValue = localValue || (isFocused ? '' : placeholder)
  const isPlaceholder = !localValue && !isFocused

  return (
    <div className={cn('relative flex-1', className)}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-[10px] font-medium uppercase tracking-wider pointer-events-none z-10">
        {label}
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          'h-9 w-full rounded-lg border bg-neutral-900/50 backdrop-blur-sm',
          'pl-10 pr-3 py-2',
          'font-mono text-sm tracking-tight',
          'ring-offset-neutral-950',
          'transition-all duration-200',
          'hover:bg-neutral-900 hover:border-neutral-700',
          'focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-color-rgb),0.3)] focus:border-[rgba(var(--accent-color-rgb),0.5)] focus:bg-neutral-900',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isFocused ? 'border-[rgba(var(--accent-color-rgb),0.5)]' : 'border-neutral-800',
          isPlaceholder ? 'text-neutral-600' : 'text-neutral-200'
        )}
      />
    </div>
  )
}
