import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Users } from 'lucide-react'
import { SkeletonUserRow } from '@renderer/components/UI/display/SkeletonGrid'
import { formatNumber } from '@renderer/utils/numberUtils'
import { useHorizontalScroll } from '@renderer/hooks/useHorizontalScroll'

interface Group {
  id: number
  name: string
  memberCount: number
}

interface Role {
  name: string
}

interface GroupItem {
  group: Group
  role: Role
  thumbnail: string
}

interface GroupsSectionProps {
  groups: GroupItem[]
  isLoading: boolean
  groupMemberCount: number
  onSelectGroup?: (groupId: number) => void
}

export const GroupsSection: React.FC<GroupsSectionProps> = ({
  groups,
  isLoading,
  groupMemberCount: _groupMemberCount,
  onSelectGroup
}) => {
  const { scrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll([groups])

  if (!isLoading && groups.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.22 }}
      className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5"
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">Groups</h3>
      </div>

      <div className="relative overflow-visible">
        {/* Left scroll button */}
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={() => scroll('left')}
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 rounded-full shadow-lg transition-colors border border-neutral-700"
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} className="text-white" />
            </motion.button>
          )}
        </AnimatePresence>
        {/* Right scroll button */}
        <AnimatePresence>
          {canScrollRight && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={() => scroll('right')}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 rounded-full shadow-lg transition-colors border border-neutral-700"
              aria-label="Scroll right"
            >
              <ChevronRight size={24} className="text-white" />
            </motion.button>
          )}
        </AnimatePresence>
        {/* Left fade gradient */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[rgb(16,16,16)] to-transparent z-10 pointer-events-none" />
        )}
        {/* Right fade gradient */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[rgb(16,16,16)] to-transparent z-10 pointer-events-none" />
        )}
        <div ref={scrollRef} className="overflow-x-auto pb-2 pt-2 scrollbar-hide">
          <div className="flex gap-4 pl-3 pr-3">
            {isLoading ? (
              <SkeletonUserRow count={5} variant="group" />
            ) : groups.length > 0 ? (
              groups.map((groupItem, index) => {
                const group = groupItem.group
                const role = groupItem.role
                return (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="group w-28 flex flex-col items-center gap-2 cursor-pointer shrink-0"
                    onClick={() => onSelectGroup?.(group.id)}
                  >
                    <div className="relative w-26 h-26 rounded-xl bg-neutral-800 shadow-md ring-1 ring-white/5 group-hover:ring-white/10 transition-all overflow-hidden">
                      <img
                        src={groupItem.thumbnail}
                        alt={group.name}
                        className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="text-center w-full px-1">
                      <div className="text-sm font-bold text-white truncate" title={group.name}>
                        {group.name}
                      </div>
                      <div
                        className="text-xs font-medium text-neutral-400 truncate mt-0.5"
                        title={role.name}
                      >
                        {role.name}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-[12px] font-semibold text-neutral-500 mt-0.5">
                        <Users size={14} />
                        <span className="truncate">{formatNumber(group.memberCount)} Members</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <div className="text-neutral-500 text-sm py-4 pl-2">No groups found.</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
