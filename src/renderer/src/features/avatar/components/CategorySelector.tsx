import React from 'react'
import { Button } from '@renderer/components/UI/buttons/Button'
import { cn } from '@renderer/lib/utils'
import { CATEGORIES, CATEGORY_ICONS, type MainCategory } from '../utils/categoryUtils'
import type { LucideProps } from 'lucide-react'

interface CategorySelectorProps {
  mainCategory: MainCategory
  subCategory: string
  onMainCategoryChange: (category: MainCategory) => void
  onSubCategoryChange: (subCategory: string) => void
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  mainCategory,
  subCategory,
  onMainCategoryChange,
  onSubCategoryChange
}) => {
  return (
    <>
      {/* Level 1: Main Categories */}
      <div className="flex items-center gap-1 p-2 overflow-x-auto border-b border-neutral-800/50">
        {(Object.keys(CATEGORIES) as MainCategory[]).map((category) => {
          const Icon = CATEGORY_ICONS[category] as React.FC<LucideProps>
          const isActive = mainCategory === category
          return (
            <Button
              key={category}
              variant={isActive ? 'default' : 'ghost'}
              onClick={() => onMainCategoryChange(category)}
              className={cn(
                'gap-2',
                !isActive &&
                  'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
              )}
            >
              <Icon size={16} />
              {category}
            </Button>
          )
        })}
      </div>

      {/* Level 2: Sub Categories */}
      <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto bg-[var(--color-surface-muted)]">
        {CATEGORIES[mainCategory].map((sub) => (
          <Button
            key={sub}
            variant="ghost"
            size="sm"
            onClick={() => onSubCategoryChange(sub)}
            className={cn(
              'text-sm font-medium whitespace-nowrap border transition-colors',
              subCategory === sub
                ? 'bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] border-[var(--color-border-strong)] shadow-sm'
                : 'bg-transparent text-[var(--color-text-muted)] border-transparent hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'
            )}
          >
            {sub}
          </Button>
        ))}
      </div>
    </>
  )
}
