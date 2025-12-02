import { ElectronAPI } from '@electron-toolkit/preload'
import type { WindowApi } from './ipc/windowApi'

declare global {
  interface Window {
    electron: ElectronAPI
    api: WindowApi
  }
}

export {}
