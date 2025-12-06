import React from 'react'
import { motion } from 'framer-motion'
import { Shirt, Package, Box, Copy, Check } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@renderer/components/UI/display/Tooltip'

interface QuickActionsBarProps {
  onWearingClick: () => void
  onOutfitsClick: () => void
  onInventoryClick: () => void
  onCopyIdClick: () => void
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onWearingClick,
  onOutfitsClick,
  onInventoryClick,
  onCopyIdClick
}) => {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    onCopyIdClick()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const actions = [
    {
      icon: Shirt,
      label: 'Currently Wearing',
      shortLabel: 'Wearing',
      onClick: onWearingClick
    },
    {
      icon: Package,
      label: 'Outfits',
      shortLabel: 'Outfits',
      onClick: onOutfitsClick
    },
    {
      icon: Box,
      label: 'Inventory',
      shortLabel: 'Inventory',
      onClick: onInventoryClick
    },
    {
      icon: copied ? Check : Copy,
      label: copied ? 'Copied!' : 'Copy User ID',
      shortLabel: copied ? 'Copied!' : 'Copy ID',
      onClick: handleCopy
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="flex items-center p-1 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl"
    >
      {actions.map((action, index) => (
        <Tooltip key={index}>
          <TooltipTrigger asChild>
            <button
              onClick={action.onClick}
              className={`
                pressable flex-1 flex items-center justify-center py-2.5 rounded-lg transition-all duration-150
                text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]
                hover:bg-[var(--color-surface-hover)] active:bg-[var(--color-surface-strong)]
                ${action.icon === Check ? 'text-emerald-400' : ''}
              `}
              aria-label={action.label}
            >
              <action.icon size={18} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>
            {action.label}
          </TooltipContent>
        </Tooltip>
      ))}
    </motion.div>
  )
}
