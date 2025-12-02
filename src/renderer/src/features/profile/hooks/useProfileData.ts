import { useMemo } from 'react'
import { AccountStatus } from '@renderer/types'
import { mapPresenceToStatus } from '@renderer/utils/statusUtils'
import {
  useExtendedUserDetails,
  useFriendStats,
  useDetailedStats,
  useUserPresence
} from '@renderer/hooks/queries'

export interface UseProfileDataProps {
  userId: number
  requestCookie: string
  initialData?: {
    displayName?: string
    username?: string
    avatarUrl?: string
    status?: AccountStatus
    notes?: string
    joinDate?: string
    placeVisits?: number
    friendCount?: number
    followerCount?: number
    followingCount?: number
    isPremium?: boolean
    isAdmin?: boolean
    totalFavorites?: number
    concurrentPlayers?: number
    groupMemberCount?: number
  }
}

export interface ProfileData {
  displayName: string
  username: string
  avatarUrl: string
  status: AccountStatus
  notes: string
  joinDate: string
  placeVisits: number
  friendCount: number
  followerCount: number
  followingCount: number
  isPremium: boolean
  isAdmin: boolean
  totalFavorites: number
  concurrentPlayers: number
  groupMemberCount: number
  gameActivity?: {
    name: string
    placeId: number
  }
}

export const useProfileData = ({ userId, requestCookie, initialData }: UseProfileDataProps) => {
  const { data: extendedDetails } = useExtendedUserDetails(userId, requestCookie)
  const { data: friendStats } = useFriendStats(userId, requestCookie)
  const { data: detailedStats } = useDetailedStats(userId, requestCookie)
  const { data: userPresence } = useUserPresence(userId, requestCookie, true)

  const profile = useMemo(() => {
    const currentStatus = userPresence
      ? mapPresenceToStatus(userPresence.userPresenceType)
      : initialData?.status || AccountStatus.Offline

    // Build game activity if user is in game and has location info
    const gameActivity =
      currentStatus === AccountStatus.InGame && userPresence?.lastLocation && userPresence?.placeId
        ? {
            name: userPresence.lastLocation,
            placeId: userPresence.placeId
          }
        : undefined

    return {
      displayName: friendStats?.displayName || initialData?.displayName || 'Loading...',
      username: friendStats?.username || initialData?.username || '...',
      avatarUrl: extendedDetails?.avatarImageUrl || initialData?.avatarUrl || '',
      status: currentStatus,
      notes: detailedStats?.description || friendStats?.description || initialData?.notes || '',
      joinDate: detailedStats?.joinDate || friendStats?.created || initialData?.joinDate || '-',
      placeVisits: detailedStats?.placeVisits || initialData?.placeVisits || 0,
      friendCount: friendStats?.friendCount || initialData?.friendCount || 0,
      followerCount: friendStats?.followerCount || initialData?.followerCount || 0,
      followingCount: friendStats?.followingCount || initialData?.followingCount || 0,
      isPremium: extendedDetails?.isPremium ?? initialData?.isPremium ?? false,
      isAdmin: extendedDetails?.isAdmin ?? initialData?.isAdmin ?? false,
      totalFavorites: initialData?.totalFavorites || 0,
      concurrentPlayers: initialData?.concurrentPlayers || 0,
      groupMemberCount: detailedStats?.groupCount || initialData?.groupMemberCount || 0,
      gameActivity
    }
  }, [extendedDetails, friendStats, detailedStats, userPresence, initialData])

  return { profile }
}
