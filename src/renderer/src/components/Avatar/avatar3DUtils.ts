import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'

const textureLoader = new THREE.TextureLoader()

export const hashToServer = (hash: string) => {
  let i = 31
  for (const c of hash) {
    i ^= c.charCodeAt(0)
  }
  return i % 8
}

const buildMaterialMap = async (mtlText: string) => {
  const materialMap: Record<string, THREE.MeshStandardMaterial> = {}
  let currentMaterialName: string | null = null
  const lines = mtlText.split(/\r?\n/)

  const texturePromises: Promise<void>[] = []
  const textureCache: Record<string, THREE.Texture> = {}

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (trimmedLine.startsWith('newmtl ')) {
      currentMaterialName = trimmedLine.substring(7).trim()
    } else if (currentMaterialName && trimmedLine.startsWith('map_Kd ')) {
      const matName = currentMaterialName
      const parts = trimmedLine.split(/\s+/)
      const textureHash = parts[parts.length - 1]
      if (!textureHash) continue

      const promise = new Promise<void>((resolve) => {
        const cached = textureCache[textureHash]
        if (cached) {
          materialMap[matName] = new THREE.MeshStandardMaterial({
            map: cached,
            metalness: 0.1,
            roughness: 0.8,
            alphaTest: 0.5
          })
          resolve()
          return
        }

        const textureUrl = `https://t${hashToServer(textureHash)}.rbxcdn.com/${textureHash}`
        textureLoader.load(
          textureUrl,
          (tex) => {
            tex.flipY = true
            tex.colorSpace = THREE.SRGBColorSpace
            textureCache[textureHash] = tex
            materialMap[matName] = new THREE.MeshStandardMaterial({
              map: tex,
              metalness: 0.1,
              roughness: 0.8,
              alphaTest: 0.5
            })
            resolve()
          },
          undefined,
          () => resolve()
        )
      })

      texturePromises.push(promise)
    }
  }

  await Promise.all(texturePromises)
  return materialMap
}

export const dispose3DObject = (obj: THREE.Object3D | null) => {
  if (!obj) return
  obj.traverse((child: any) => {
    if (child.isMesh) {
      child.geometry?.dispose()
      const materials = Array.isArray(child.material)
        ? child.material
        : child.material
          ? [child.material]
          : []
      materials.forEach((material: any) => {
        if (material.map) {
          material.map.dispose()
        }
        material.dispose?.()
      })
    }
  })
}

// Legacy alias for backward compatibility
export const disposeAvatarObject = dispose3DObject

export type ObjectType = 'avatar' | 'asset'

interface Load3DObjectOptions {
  type: ObjectType
  id: string | number
  cookie: string
  objectName?: string
}

/**
 * Fetches the manifest URL for a 3D object based on type.
 * Uses IPC API for authenticated requests with CSRF support.
 */
const fetchManifestUrl = async (
  type: ObjectType,
  id: string | number,
  cookie: string
): Promise<string> => {
  if (type === 'avatar') {
    const result = await window.api.getAvatar3DManifest(cookie, id)
    if (result.state === 'Pending' || result.state === 'InReview') {
      throw new Error(`Thumbnail ${result.state.toLowerCase()}`)
    }
    if (!result.imageUrl) {
      throw new Error('Thumbnail not ready')
    }
    return result.imageUrl
  } else {
    const result = await window.api.getAsset3DManifest(cookie, id)
    return result.imageUrl
  }
}

/**
 * Loads an OBJ model from a manifest and applies materials
 */
const loadFromManifest = async (
  manifestUrl: string,
  objectName: string
): Promise<THREE.Object3D> => {
  const manifestResponse = await fetch(manifestUrl)
  if (!manifestResponse.ok) throw new Error(`Failed to fetch manifest: ${manifestResponse.status}`)
  const manifest = await manifestResponse.json()

  const mtlHash = manifest.mtl
  const objHash = manifest.obj
  if (!mtlHash || !objHash) throw new Error('MTL or OBJ hash missing in manifest.')

  const mtlUrl = `https://t${hashToServer(mtlHash)}.rbxcdn.com/${mtlHash}`
  const objUrl = `https://t${hashToServer(objHash)}.rbxcdn.com/${objHash}`

  const mtlTextResponse = await fetch(mtlUrl)
  if (!mtlTextResponse.ok) throw new Error(`Failed to load MTL: ${mtlTextResponse.status}`)
  const mtlText = await mtlTextResponse.text()

  const materialMap = await buildMaterialMap(mtlText)

  const objTextResponse = await fetch(objUrl)
  if (!objTextResponse.ok) throw new Error(`Failed to load OBJ: ${objTextResponse.status}`)
  const objText = await objTextResponse.text()

  const objLoader = new OBJLoader()
  const object = objLoader.parse(objText)
  object.name = objectName

  object.traverse((child: any) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
      const requestedMaterialName = child.material?.name || null
      if (requestedMaterialName && materialMap[requestedMaterialName]) {
        child.material = materialMap[requestedMaterialName]
      } else {
        const firstMatKey = Object.keys(materialMap)[0]
        if (firstMatKey) {
          child.material = materialMap[firstMatKey].clone()
        }
      }
    }
  })

  // Calculate the bounding box center of the entire object
  const box = new THREE.Box3().setFromObject(object)
  const center = new THREE.Vector3()
  box.getCenter(center)

  // Center each mesh's geometry so rotation happens around the true center
  object.traverse((child: any) => {
    if (child.isMesh && child.geometry) {
      child.geometry.translate(-center.x, -center.y, -center.z)
    }
  })

  // Reset object position since we moved the geometry
  object.position.set(0, 0, 0)
  object.rotation.y = Math.PI

  return object
}

/**
 * Universal 3D object loader - works for both avatars and assets
 * Requires authentication cookie for API requests
 */
export const load3DObject = async ({
  type,
  id,
  cookie,
  objectName
}: Load3DObjectOptions): Promise<THREE.Object3D> => {
  const name = objectName || `${type}_${id}`
  const manifestUrl = await fetchManifestUrl(type, id, cookie)
  return loadFromManifest(manifestUrl, name)
}

/**
 * Load a 3D object directly from a manifest URL
 */
export const load3DObjectFromUrl = async (
  manifestUrl: string,
  objectName: string = '3d_object'
): Promise<THREE.Object3D> => {
  return loadFromManifest(manifestUrl, objectName)
}

// Legacy interface for backward compatibility
interface LoadAvatarOptions {
  userId: string
  cookie: string
  objectName?: string
}

/**
 * @deprecated Use load3DObject({ type: 'avatar', id: userId, cookie }) instead
 */
export const loadAvatarObject = async ({
  userId,
  cookie,
  objectName = 'avatar'
}: LoadAvatarOptions) => {
  return load3DObject({ type: 'avatar', id: userId, cookie, objectName })
}

/**
 * Load an asset's 3D model
 * Requires authentication cookie for API requests
 */
export const loadAssetObject = async (
  assetId: number | string,
  cookie: string,
  objectName?: string
) => {
  return load3DObject({ type: 'asset', id: assetId, cookie, objectName })
}
