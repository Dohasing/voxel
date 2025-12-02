import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  MapPin,
  Heart,
  Activity,
  Users,
  History,
  Coins,
  TrendingUp,
  Clock
} from 'lucide-react'
import { StatRow } from './StatRow'
import { SlidingNumber } from '@renderer/components/UI/specialized/SlidingNumber'
import { ProfileData } from '../hooks/useProfileData'
import { formatNumber } from '@renderer/utils/numberUtils'
import { formatDate, formatDateTime, formatRelativeDate } from '@renderer/utils/dateUtils'
import { useRolimonsPlayer } from '@renderer/features/avatar/api/useRolimons'
import { RobuxIcon } from '@renderer/components/UI/icons/RobuxIcon'

interface ProfileStatsProps {
  profile: ProfileData
  userId: number
  onPastNamesClick: () => void
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  profile,
  userId,
  onPastNamesClick
}) => {
  const [showRelativeJoinDate, setShowRelativeJoinDate] = useState(false)
  const { data: rolimonsPlayer } = useRolimonsPlayer(userId, true)
  const lastOnlineDate = rolimonsPlayer?.last_online
    ? new Date(rolimonsPlayer.last_online * 1000)
    : null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 shadow-sm"
    >
      <h3 className="text-lg font-bold text-white flex items-center gap-2">Statistics</h3>

      {/* Separator after header */}
      <div className="h-px bg-neutral-800 mt-3 mb-3 -mx-4" />

      {/* Account Info */}
      <div>
        <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider pb-1">
          Account
        </div>
        {(() => {
          const relative = formatRelativeDate(profile.joinDate, { fallback: '-' })
          const absolute = formatDate(profile.joinDate, { fallback: '-' })
          const value = showRelativeJoinDate ? relative : absolute
          const tooltip = showRelativeJoinDate ? absolute : relative
          return (
            <StatRow
              icon={Calendar}
              label="Join Date"
              value={value}
              onClick={() => setShowRelativeJoinDate((prev) => !prev)}
              title={tooltip}
            />
          )
        })()}
        <StatRow
          icon={Users}
          label="Groups"
          value={
            <SlidingNumber
              number={profile.groupMemberCount}
              formatter={formatNumber}
              className="font-mono text-sm text-white font-semibold"
            />
          }
        />
        {rolimonsPlayer?.last_online !== undefined && rolimonsPlayer.last_online !== null && (
          <StatRow
            icon={Clock}
            label="Last Online"
            value={
              <span className="font-mono text-sm text-white font-semibold">
                {formatRelativeDate(lastOnlineDate)}
              </span>
            }
            title={formatDateTime(lastOnlineDate)}
          />
        )}
        <StatRow
          icon={History}
          label="Past Usernames"
          value={
            <span className="text-xs text-neutral-400 font-medium bg-neutral-800 px-2 py-1 rounded-md hover:bg-neutral-700 hover:text-white transition-colors">
              View
            </span>
          }
          onClick={onPastNamesClick}
        />
      </div>

      {/* Activity Stats */}
      {(profile.placeVisits !== undefined ||
        profile.totalFavorites !== undefined ||
        profile.concurrentPlayers !== undefined) && (
        <>
          {/* Separator */}
          <div className="h-px bg-neutral-800 my-3 -mx-4" />

          <div>
            <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider pb-1">
              Activity
            </div>
            {profile.placeVisits !== undefined && (
              <StatRow
                icon={MapPin}
                label="Place Visits"
                value={
                  <SlidingNumber
                    number={profile.placeVisits}
                    formatter={formatNumber}
                    className="font-mono text-sm text-white font-semibold"
                  />
                }
              />
            )}
            {profile.totalFavorites !== undefined && (
              <StatRow
                icon={Heart}
                label="Favorites"
                value={
                  <SlidingNumber
                    number={profile.totalFavorites}
                    formatter={formatNumber}
                    className="font-mono text-sm text-white font-semibold"
                  />
                }
              />
            )}
            {profile.concurrentPlayers !== undefined && (
              <StatRow
                icon={Activity}
                label="Current Active"
                value={
                  <SlidingNumber
                    number={profile.concurrentPlayers}
                    formatter={formatNumber}
                    className="font-mono text-sm text-white font-semibold"
                  />
                }
              />
            )}
          </div>
        </>
      )}

      {/* Value Stats */}
      {((rolimonsPlayer?.value !== undefined && rolimonsPlayer.value !== null) ||
        (rolimonsPlayer?.rap !== undefined && rolimonsPlayer.rap !== null)) && (
        <>
          {/* Separator */}
          <div className="h-px bg-neutral-800 my-3 -mx-4" />

          <div>
            <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider pb-1">
              Value
            </div>
            {rolimonsPlayer?.value !== undefined && rolimonsPlayer.value !== null && (
              <StatRow
                icon={Coins}
                label="Value"
                value={
                  <span className="flex items-center gap-1.5 font-mono text-sm text-white font-semibold">
                    {formatNumber(rolimonsPlayer.value)}
                    <RobuxIcon className="w-3.5 h-3.5" />
                  </span>
                }
                title="Rolimons Value"
              />
            )}
            {rolimonsPlayer?.rap !== undefined && rolimonsPlayer.rap !== null && (
              <StatRow
                icon={TrendingUp}
                label="RAP"
                value={
                  <span className="flex items-center gap-1.5 font-mono text-sm text-white font-semibold">
                    {formatNumber(rolimonsPlayer.rap)}
                    <RobuxIcon className="w-3.5 h-3.5" />
                  </span>
                }
                title="Recent Average Price"
              />
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}
