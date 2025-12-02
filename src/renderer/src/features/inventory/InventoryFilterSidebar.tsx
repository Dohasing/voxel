import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, Filter } from 'lucide-react'
import { Button } from '@renderer/components/UI/buttons/Button'
import { InventoryCategory, InventorySubcategory } from './inventoryCategories'

interface InventoryFilterSidebarProps {
  // Categories
  categories: InventoryCategory[]
  selectedCategory: InventoryCategory | null
  selectedSubcategory: InventorySubcategory | null
  onCategoryChange: (category: InventoryCategory | null) => void
  onSubcategoryChange: (subcategory: InventorySubcategory | null) => void

  // Sort
  sortOrder: 'Asc' | 'Desc'
  onSortOrderChange: (sortOrder: 'Asc' | 'Desc') => void

  onClearAll: () => void
  hasActiveFilters: boolean
}

const FilterSection = ({
  title,
  children,
  isOpenDefault = true
}: {
  title: string
  children: React.ReactNode
  isOpenDefault?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault)

  return (
    <div className="border-b border-neutral-800 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full text-sm font-bold text-neutral-200 hover:text-white transition-colors group ${isOpen ? 'mb-2' : ''}`}
      >
        <span>{title}</span>
        <ChevronDown
          size={16}
          className={`text-neutral-500 group-hover:text-white transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-1 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const InventoryFilterSidebar = ({
  categories,
  selectedCategory,
  selectedSubcategory,
  onCategoryChange,
  onSubcategoryChange,
  sortOrder,
  onSortOrderChange,
  onClearAll,
  hasActiveFilters
}: InventoryFilterSidebarProps) => {
  // Category Tree Item
  const CategoryItem = ({ category }: { category: InventoryCategory }) => {
    const isSelected = selectedCategory?.categoryId === category.categoryId && !selectedSubcategory
    const isParentOfSelected = selectedCategory?.categoryId === category.categoryId
    const [isExpanded, setIsExpanded] = useState(isParentOfSelected)

    // Auto-expand if children are selected
    React.useEffect(() => {
      if (isParentOfSelected) setIsExpanded(true)
    }, [isParentOfSelected])

    const handleCategoryClick = () => {
      if (category.subcategories.length > 0) {
        // For categories with subcategories, only toggle expansion (dropdown behavior)
        setIsExpanded(!isExpanded)
      } else {
        // For categories without subcategories, select the category
        onCategoryChange(category)
        onSubcategoryChange(null)
      }
    }

    return (
      <div className="space-y-1">
        <button
          onClick={handleCategoryClick}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors group ${
            isSelected
              ? 'bg-[rgba(var(--accent-color-rgb),0.1)] text-[var(--accent-color)] font-medium'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
          }`}
        >
          {category.subcategories.length > 0 ? (
            <ChevronRight
              size={14}
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            />
          ) : (
            <span className="w-3.5" /> // Spacer
          )}
          <span className="truncate text-left flex-1">{category.name}</span>
        </button>

        <AnimatePresence initial={false}>
          {isExpanded && category.subcategories.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="ml-5 pl-2 border-l border-neutral-800 space-y-0.5 py-1">
                {category.subcategories.map((sub) => (
                  <button
                    key={sub.subcategoryId}
                    onClick={() => {
                      onCategoryChange(category)
                      onSubcategoryChange(sub)
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
                      selectedSubcategory?.subcategoryId === sub.subcategoryId
                        ? 'bg-[rgba(var(--accent-color-rgb),0.1)] text-[var(--accent-color)] font-medium'
                        : 'text-neutral-500 hover:text-white hover:bg-neutral-800/50'
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="w-[260px] shrink-0 flex flex-col h-full border-r border-neutral-800 bg-[#111111]">
      <div className="px-4 flex items-center justify-between border-b border-neutral-800 min-h-[72px]">
        <div className="flex items-center gap-2 text-neutral-200">
          <Filter size={18} />
          <span className="font-bold">Filters</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-7 px-2 text-xs text-neutral-500 hover:text-white"
          >
            Reset
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {/* Categories */}
        <div className="pb-4 border-b border-neutral-800">
          <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
            Categories
          </div>
          <div className="space-y-0.5">
            {categories.map((cat) => (
              <CategoryItem key={cat.categoryId} category={cat} />
            ))}
          </div>
        </div>

        {/* Sort Order */}
        <FilterSection title="Sort Order">
          <div className="space-y-1">
            <button
              onClick={() => onSortOrderChange('Desc')}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${
                sortOrder === 'Desc'
                  ? 'bg-[rgba(var(--accent-color-rgb),0.1)] text-[var(--accent-color)] font-medium'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <span>Newest First</span>
            </button>
            <button
              onClick={() => onSortOrderChange('Asc')}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${
                sortOrder === 'Asc'
                  ? 'bg-[rgba(var(--accent-color-rgb),0.1)] text-[var(--accent-color)] font-medium'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <span>Oldest First</span>
            </button>
          </div>
        </FilterSection>
      </div>
    </div>
  )
}
