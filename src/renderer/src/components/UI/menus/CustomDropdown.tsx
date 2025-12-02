import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useClickOutside } from '../../../hooks/useClickOutside'
import { motion, AnimatePresence } from 'framer-motion'

export interface DropdownOption {
  value: string
  label: string
  subLabel?: string
  icon?: React.ReactNode
}

interface CustomDropdownProps {
  options: DropdownOption[]
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  buttonClassName?: string
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  buttonClassName
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<'left' | 'right'>('left')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useClickOutside(dropdownRef, () => setIsOpen(false))

  // Calculate dropdown position to prevent overflow
  useEffect(() => {
    if (isOpen && dropdownRef.current && menuRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect()
      const menuWidth = 300 // max-w-[300px]
      const viewportWidth = window.innerWidth

      // Check if dropdown would overflow on the right
      if (rect.left + menuWidth > viewportWidth - 16) {
        // Check if there's more space on the left
        if (rect.right - menuWidth < 16) {
          // Not enough space on either side, keep left but constrain width
          setDropdownPosition('left')
        } else {
          // Flip to right alignment
          setDropdownPosition('right')
        }
      } else {
        setDropdownPosition('left')
      }
    }
  }, [isOpen])

  const selectedOption = options.find((opt) => opt.value === value)

  const defaultButtonClasses = `px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm transition-all hover:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-700 ${
    isOpen ? 'border-neutral-700 ring-1 ring-neutral-700' : ''
  }`

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`pressable w-full flex items-center justify-between ${buttonClassName || defaultButtonClasses}`}
      >
        <div className="flex items-center gap-2 truncate pr-4">
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
              <span className="text-neutral-200 font-bold truncate">{selectedOption.label}</span>
            </div>
          ) : (
            <span className="text-neutral-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-neutral-500 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute top-full mt-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-[70] overflow-hidden min-w-full w-max max-w-[300px] ${
              dropdownPosition === 'right' ? 'right-0' : 'left-0'
            }`}
            style={{
              maxWidth: 'min(300px, calc(100vw - 32px))'
            }}
          >
            <div className="p-1.5 max-h-60 overflow-y-auto">
              {options.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`pressable w-full text-left px-3 py-2.5 text-sm flex items-center justify-between rounded-lg transition-colors ${
                    value === option.value
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <div className="flex flex-col items-start min-w-0 flex-1 overflow-hidden">
                      <span className="font-medium truncate w-full">{option.label}</span>
                      {option.subLabel && (
                        <span
                          className={`text-xs truncate w-full ${value === option.value ? 'text-neutral-400' : 'text-neutral-500'}`}
                        >
                          {option.subLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  {value === option.value && (
                    <Check size={14} className="shrink-0 ml-2 text-neutral-400" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CustomDropdown
