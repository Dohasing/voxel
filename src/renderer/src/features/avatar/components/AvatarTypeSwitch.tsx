import React from 'react'
import { Account } from '@renderer/types'
import { useSetPlayerAvatarType } from '../api/useAvatar'
import { useNotification } from '@renderer/features/system/stores/useSnackbarStore'
import { cn } from '@renderer/lib/utils'

interface AvatarTypeSwitchProps {
  account: Account | null
  currentAvatarType: 'R6' | 'R15' | null
}

export const AvatarTypeSwitch: React.FC<AvatarTypeSwitchProps> = ({
  account,
  currentAvatarType
}) => {
  const { showNotification } = useNotification()
  const setPlayerAvatarType = useSetPlayerAvatarType(account)

  const handleTypeChange = async (newType: 'R6' | 'R15') => {
    if (!account || currentAvatarType === newType) return

    try {
      await setPlayerAvatarType.mutateAsync(newType)
      showNotification(`Avatar type changed to ${newType}`, 'success')
    } catch (error) {
      console.error('Failed to update avatar type:', error)
      showNotification('Failed to update avatar type', 'error')
    }
  }

  if (!account || !currentAvatarType) return null

  const isR15 = currentAvatarType === 'R15'

  return (
    <div className="bg-black/60 backdrop-blur rounded-lg border border-neutral-800 p-1">
      <div className="relative flex items-center">
        {/* Background track */}
        <div className="relative w-[100px] h-8 bg-neutral-800 rounded-md overflow-hidden">
          {/* Sliding indicator */}
          <div
            className={cn(
              'absolute top-1 bottom-1 w-[46px] rounded transition-all duration-200 ease-in-out',
              isR15 ? 'left-[50px] bg-[var(--accent-color)]' : 'left-1 bg-[var(--accent-color)]'
            )}
          />

          {/* Labels */}
          <button
            onClick={() => handleTypeChange('R6')}
            disabled={setPlayerAvatarType.isPending}
            className={cn(
              'absolute left-0 top-0 bottom-0 w-[50px] flex items-center justify-center text-xs font-semibold transition-colors z-10',
              !isR15 ? 'text-[var(--accent-color-foreground)]' : 'text-neutral-400'
            )}
          >
            R6
          </button>
          <button
            onClick={() => handleTypeChange('R15')}
            disabled={setPlayerAvatarType.isPending}
            className={cn(
              'absolute right-0 top-0 bottom-0 w-[50px] flex items-center justify-center text-xs font-semibold transition-colors z-10',
              isR15 ? 'text-[var(--accent-color-foreground)]' : 'text-neutral-400'
            )}
          >
            R15
          </button>
        </div>
      </div>
    </div>
  )
}
