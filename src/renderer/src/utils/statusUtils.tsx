import { AccountStatus } from '../types'
import { Circle } from 'lucide-react'

export const getStatusColor = (status: AccountStatus): string => {
  switch (status) {
    case AccountStatus.Online:
      return 'bg-blue-500'
    case AccountStatus.InGame:
      return 'bg-emerald-500'
    case AccountStatus.InStudio:
      return 'bg-orange-500'
    case AccountStatus.Offline:
      return 'bg-neutral-500'
    case AccountStatus.Banned:
      return 'bg-red-500'
    default:
      return 'bg-neutral-500'
  }
}

export const getStatusIcon = (status: AccountStatus) => {
  const colorClass = {
    [AccountStatus.Online]: 'text-blue-500',
    [AccountStatus.InGame]: 'text-emerald-500',
    [AccountStatus.InStudio]: 'text-orange-500',
    [AccountStatus.Offline]: 'text-neutral-500',
    [AccountStatus.Banned]: 'text-red-500'
  }[status]

  return <Circle size={10} fill="currentColor" className={colorClass} />
}

export const mapPresenceToStatus = (presenceType: number): AccountStatus => {
  switch (presenceType) {
    case 1:
      return AccountStatus.Online
    case 2:
      return AccountStatus.InGame
    case 3:
      return AccountStatus.InStudio
    default:
      return AccountStatus.Offline
  }
}

export const isActiveStatus = (status: AccountStatus): boolean => {
  return (
    status === AccountStatus.Online ||
    status === AccountStatus.InGame ||
    status === AccountStatus.InStudio
  )
}
