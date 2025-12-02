import { useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

export const avatar3DManifestResponseSchema = z.object({
  imageUrl: z.string()
})

export type Avatar3DManifestResponse = z.infer<typeof avatar3DManifestResponseSchema>

// Query key factory for avatar 3D manifests
export const avatar3DKeys = {
  all: ['avatar3D'] as const,
  manifest: (userId: string | number) => [...avatar3DKeys.all, 'manifest', String(userId)] as const,
  assetManifest: (assetId: string | number) =>
    [...avatar3DKeys.all, 'assetManifest', String(assetId)] as const
}

export const useAvatar3DManifest = (userId: string | number | undefined, cookie?: string) => {
  return useQuery({
    queryKey: avatar3DKeys.manifest(userId ?? ''),
    queryFn: async () => {
      if (!userId) throw new Error('userId is required')
      if (!cookie) throw new Error('cookie is required for authenticated 3D manifest request')

      const result = await window.api.getAvatar3DManifest(cookie, userId)

      // Throw if pending/processing to trigger retry
      if (result.state === 'Pending' || result.state === 'InReview') {
        throw new Error(`Thumbnail ${result.state.toLowerCase()}, retrying...`)
      }

      if (!result.imageUrl) {
        throw new Error('Thumbnail not ready')
      }

      return result.imageUrl
    },
    enabled: !!userId && !!cookie,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 10,
    retryDelay: (attemptIndex) => Math.min(2000 * (attemptIndex + 1), 8000)
  })
}
export const useAsset3DManifest = (
  assetId: string | number | undefined | null,
  cookie?: string
) => {
  return useQuery({
    queryKey: avatar3DKeys.assetManifest(assetId ?? ''),
    queryFn: async () => {
      if (!assetId) throw new Error('assetId is required')
      if (!cookie) throw new Error('cookie is required for authenticated 3D manifest request')

      const result = await window.api.getAsset3DManifest(cookie, assetId)
      return avatar3DManifestResponseSchema.parse(result).imageUrl
    },
    enabled: !!assetId && !!cookie,
    staleTime: 60 * 1000, // 1 minute (assets change less frequently)
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1
  })
}

/**
 * Hook to get query client for manual cache invalidation
 */
export const useInvalidateAvatar3D = () => {
  const queryClient = useQueryClient()

  return {
    invalidateAvatar: (userId?: string | number) => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: avatar3DKeys.manifest(userId) })
      } else {
        queryClient.invalidateQueries({ queryKey: avatar3DKeys.all })
      }
    },
    invalidateAsset: (assetId?: string | number) => {
      if (assetId) {
        queryClient.invalidateQueries({ queryKey: avatar3DKeys.assetManifest(assetId) })
      }
    }
  }
}
