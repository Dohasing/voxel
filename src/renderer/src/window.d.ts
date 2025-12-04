import { ElectronAPI } from '@electron-toolkit/preload'
import type { WindowApi } from './ipc/windowApi'

interface PlatformInfo {
  isMac: boolean
  isWindows: boolean
  isLinux: boolean
  platform: NodeJS.Platform
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: WindowApi
    platform: PlatformInfo
  }
}

export {}
