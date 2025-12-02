import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Shield, X, ChevronRight, Gamepad2 } from 'lucide-react'
import Avatar3DThumbnail from '@renderer/components/Avatar/Avatar3DThumbnail'
import { Avatar, AvatarFallback, AvatarImage } from '@renderer/components/UI/display/Avatar'
import { SlidingNumber } from '@renderer/components/UI/specialized/SlidingNumber'
import { getStatusColor } from '@renderer/utils/statusUtils'
import RobloxPremiumIcon from '@assets/svg/Premium.svg'
import { ProfileData } from '../hooks/useProfileData'
import { formatNumber } from '@renderer/utils/numberUtils'
import { RolimonsBadges } from './RolimonsBadges'
import { useRolimonsPlayer, ROLIMONS_BADGES } from '@renderer/features/avatar/api/useRolimons'

interface ProfileHeaderProps {
  userId: number
  profile: ProfileData
  cookie?: string
  showCloseButton?: boolean
  onClose?: () => void
  onAvatarClick: () => void
  onSocialStatClick: (type: 'friends' | 'followers' | 'following') => void
  hasRawDescription: boolean
  rawDescription: string
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userId,
  profile,
  cookie,
  showCloseButton,
  onClose,
  onAvatarClick,
  onSocialStatClick,
  hasRawDescription,
  rawDescription
}) => {
  const [isAvatarHovered, setIsAvatarHovered] = useState(false)

  // Fetch rolimons data to know if badges exist
  const { data: rolimonsPlayer } = useRolimonsPlayer(userId, true)
  const hasBadges = useMemo(() => {
    if (!rolimonsPlayer?.rolibadges) return false
    return Object.keys(rolimonsPlayer.rolibadges).some((key) => ROLIMONS_BADGES[key])
  }, [rolimonsPlayer?.rolibadges])

  // Calculate badge count for dynamic spacing
  const badgeCount = useMemo(() => {
    if (!rolimonsPlayer?.rolibadges) return 0
    return Object.keys(rolimonsPlayer.rolibadges).filter((key) => ROLIMONS_BADGES[key]).length
  }, [rolimonsPlayer?.rolibadges])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0 }}
      className={`relative w-full bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 flex flex-col ${hasBadges ? 'min-h-[280px]' : 'min-h-[240px]'}`}
    >
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-950 to-black opacity-80" />

      {/* Animated Floor Grid */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent)',
          backgroundSize: '60px 60px',
          transform: 'perspective(800px) rotateX(60deg) translateY(0) scale(1.5)',
          transformOrigin: 'top center'
        }}
      />

      {/* Main 3D Render - Centered/Right */}
      <div className="absolute inset-0 flex items-center justify-end pointer-events-none pb-0 pr-0 avatar-wrapper">
        {userId ? (
          <div
            className="w-[30%] h-[140%] mr-0 pointer-events-auto cursor-pointer relative bg-transparent z-20"
            onPointerEnter={() => setIsAvatarHovered(true)}
            onPointerLeave={(e) => {
              if (e.buttons === 0) {
                setIsAvatarHovered(false)
              }
            }}
            onClick={onAvatarClick}
          >
            <motion.div
              className="w-full h-full"
              animate={
                isAvatarHovered
                  ? { x: '10%', y: '-15%', scale: 1.2 }
                  : { x: '10%', y: '0%', scale: 1 }
              }
              transition={{ type: 'spring', stiffness: 240, damping: 24, mass: 0.8 }}
              style={{ originX: 0.5, originY: 0.5 }}
            >
              <Avatar3DThumbnail
                userId={userId.toString()}
                cookie={cookie}
                className="w-full h-full drop-shadow-[0_24px_60px_rgba(0,0,0,0.65)]"
                autoRotateSpeed={0.008}
                cameraDistanceFactor={1.4}
                manualRotationEnabled={isAvatarHovered}
                manualZoomEnabled={isAvatarHovered}
              />
            </motion.div>
          </div>
        ) : (
          <img
            src={profile.avatarUrl}
            alt=""
            className="h-[80%] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-700 ease-in-out group-hover:scale-105 mr-10"
          />
        )}
      </div>

      {/* Close Button if requested */}
      {showCloseButton && onClose && (
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={onClose}
            className="pressable p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-md cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>
      )}

      {/* Profile Info Overlay */}
      <div
        className={`absolute left-0 right-0 p-6 flex flex-col md:flex-row items-center gap-6 z-10 pointer-events-none ${hasBadges ? 'top-0' : 'top-1/2 -translate-y-1/2'}`}
      >
        {/* Profile Picture */}
        <div className="shrink-0 relative pointer-events-auto">
          <div className="relative flex items-center justify-center">
            <Avatar className="w-32 h-32 md:w-40 md:h-40 shadow-2xl bg-neutral-900">
              <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
              <AvatarFallback className="text-xl font-bold text-white bg-neutral-800">
                {profile.displayName?.slice(0, 2)?.toUpperCase() || 'RB'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-2 right-6 translate-x-[32%] translate-y-[32%]">
              <span
                className={`block w-6 h-6 md:w-7 md:h-7 rounded-full border-[4px] border-neutral-950 shadow-[0_0_12px_rgba(0,0,0,0.45)] ${getStatusColor(profile.status)}`}
              />
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 pointer-events-auto">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3 drop-shadow-lg mb-0">
                <span className="truncate max-w-[400px]">{profile.displayName}</span>
              </h1>
              <div className="flex items-center gap-1">
                {profile.isPremium && (
                  <img
                    src={RobloxPremiumIcon}
                    alt="Roblox Premium"
                    className="w-5 h-5 object-contain drop-shadow-sm select-none"
                    draggable={false}
                  />
                )}
                {profile.isAdmin && (
                  <Shield size={20} className="text-red-500 fill-red-500 drop-shadow-sm" />
                )}
              </div>
            </div>

            <p className="text-base md:text-lg text-neutral-400 drop-shadow-md leading-none">
              @{profile.username}
            </p>

            {/* Social Stats Row */}
            <div className="flex items-center gap-6">
              <button
                type="button"
                className="flex items-center gap-2 group/stat cursor-pointer hover:bg-white/5 px-2 py-1 -mx-2 rounded-lg transition-colors"
                onClick={() => onSocialStatClick('friends')}
                aria-label={`View ${profile.friendCount} friends`}
              >
                <SlidingNumber
                  number={profile.friendCount}
                  formatter={formatNumber}
                  className="text-white font-bold font-mono text-lg transition-colors"
                />
                <span className="text-neutral-400 text-sm font-medium tracking-wide group-hover/stat:text-neutral-300 group-hover/stat:underline underline-offset-2 transition-colors">
                  Friends
                </span>
                <ChevronRight
                  size={14}
                  className="text-neutral-500 opacity-0 -ml-1 group-hover/stat:opacity-100 group-hover/stat:ml-0 transition-all"
                />
              </button>
              <button
                type="button"
                className="flex items-center gap-2 group/stat cursor-pointer hover:bg-white/5 px-2 py-1 -mx-2 rounded-lg transition-colors"
                onClick={() => onSocialStatClick('followers')}
                aria-label={`View ${profile.followerCount} followers`}
              >
                <SlidingNumber
                  number={profile.followerCount}
                  formatter={formatNumber}
                  className="text-white font-bold font-mono text-lg transition-colors"
                />
                <span className="text-neutral-400 text-sm font-medium tracking-wide group-hover/stat:text-neutral-300 group-hover/stat:underline underline-offset-2 transition-colors">
                  Followers
                </span>
                <ChevronRight
                  size={14}
                  className="text-neutral-500 opacity-0 -ml-1 group-hover/stat:opacity-100 group-hover/stat:ml-0 transition-all"
                />
              </button>
              <button
                type="button"
                className="flex items-center gap-2 group/stat cursor-pointer hover:bg-white/5 px-2 py-1 -mx-2 rounded-lg transition-colors"
                onClick={() => onSocialStatClick('following')}
                aria-label={`View ${profile.followingCount} following`}
              >
                <SlidingNumber
                  number={profile.followingCount}
                  formatter={formatNumber}
                  className="text-white font-bold font-mono text-lg transition-colors"
                />
                <span className="text-neutral-400 text-sm font-medium tracking-wide group-hover/stat:text-neutral-300 group-hover/stat:underline underline-offset-2 transition-colors">
                  Following
                </span>
                <ChevronRight
                  size={14}
                  className="text-neutral-500 opacity-0 -ml-1 group-hover/stat:opacity-100 group-hover/stat:ml-0 transition-all"
                />
              </button>
            </div>

            {/* Game Activity - shown above bio when in game */}
            {profile.gameActivity && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg max-w-fit">
                <Gamepad2 size={14} className="text-emerald-400 shrink-0" />
                <span className="text-sm text-emerald-300 font-medium truncate max-w-[300px]">
                  Playing {profile.gameActivity.name}
                </span>
              </div>
            )}

            {/* Description Preview */}
            {hasRawDescription && (
              <div className="max-w-md">
                <p className="text-sm text-neutral-400 leading-relaxed line-clamp-2 drop-shadow-md">
                  {rawDescription}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`flex-1 ${
          !hasBadges
            ? 'min-h-[5px]'
            : badgeCount <= 4
              ? 'min-h-[160px]'
              : badgeCount <= 8
                ? 'min-h-[170px]'
                : 'min-h-[180px]'
        }`}
      />

      {/* Rolimons Badges */}
      <RolimonsBadges userId={userId} />
    </motion.div>
  )
}
