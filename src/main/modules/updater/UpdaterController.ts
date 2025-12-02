import { ipcMain, BrowserWindow } from 'electron'
import { updaterService } from './UpdaterService'

export function registerUpdaterHandlers(mainWindow: BrowserWindow): void {
  // Set the main window for sending status updates
  updaterService.setMainWindow(mainWindow)

  // Check for updates
  ipcMain.handle('updater:check', async () => {
    return await updaterService.checkForUpdates()
  })

  // Download update
  ipcMain.handle('updater:download', async () => {
    await updaterService.downloadUpdate()
    return { success: true }
  })

  // Quit and install
  ipcMain.handle('updater:install', () => {
    updaterService.quitAndInstall()
    return { success: true }
  })

  // Get current state
  ipcMain.handle('updater:get-state', () => {
    return updaterService.getState()
  })
}
