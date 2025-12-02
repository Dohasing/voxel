import { useState } from 'react'
import { Account } from '@renderer/types'

interface UseTryOnResult {
  isTryingOn: boolean
  tryOnLoading: boolean
  tryOnImageUrl: string | null
  handleTryOn: () => Promise<void>
  handleRevertTryOn: () => void
}

export function useTryOn(currentAssetId: number | null, account: Account | null): UseTryOnResult {
  const [isTryingOn, setIsTryingOn] = useState(false)
  const [tryOnLoading, setTryOnLoading] = useState(false)
  const [tryOnImageUrl, setTryOnImageUrl] = useState<string | null>(null)

  const handleTryOn = async () => {
    if (!account?.cookie || !currentAssetId || !account.userId) return

    const userId = parseInt(account.userId)
    if (isNaN(userId)) return

    setTryOnLoading(true)
    try {
      // Use the render preview API to generate a preview without modifying the avatar
      const result = await (window as any).api.renderAvatarPreview(
        account.cookie,
        userId,
        currentAssetId
      )

      if (result.imageUrl) {
        setTryOnImageUrl(result.imageUrl)
        setIsTryingOn(true)
      }
    } catch (err) {
      console.error('Failed to generate try-on preview:', err)
    } finally {
      setTryOnLoading(false)
    }
  }

  const handleRevertTryOn = () => {
    // Simply clear the try-on state - no need to revert anything since we didn't modify the avatar
    setIsTryingOn(false)
    setTryOnImageUrl(null)
  }

  return {
    isTryingOn,
    tryOnLoading,
    tryOnImageUrl,
    handleTryOn,
    handleRevertTryOn
  }
}
