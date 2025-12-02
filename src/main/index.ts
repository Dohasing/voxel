/// <reference types="electron-vite/node" />
import { app, shell, BrowserWindow, ipcMain, session, netLog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/build/icons/icon.ico?asset'
import { registerRobloxHandlers } from './modules/core/RobloxHandler'
import { registerStorageHandlers } from './modules/system/StorageController'
import { registerLogsHandlers } from './modules/system/LogsController'
import { storageService } from './modules/system/StorageService'
import { pinService } from './modules/system/PinService'

// Handle EPIPE errors globally to prevent crashes when writing to closed streams
process.on('uncaughtException', (error) => {
  if (error.message === 'write EPIPE' || (error as any).code === 'EPIPE') {
    return
  }
  console.error('Uncaught exception:', error)
})

const netLogPath = join(app.getPath('userData'), 'net-logs')
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const logFile = join(netLogPath, `network-log-${timestamp}.json`)

netLog
  .startLogging(logFile, {
    captureMode: 'everything', // Capture all network events
    maxFileSize: 100 * 1024 * 1024 // 100MB max file size
  })
  .then(() => {})
  .catch((err) => {
    console.error('Failed to start net-log:', err)
  })

// Stop logging when app is about to quit
app.on('will-quit', async (event) => {
  if (netLog.currentlyLogging) {
    event.preventDefault()
    await netLog.stopLogging()

    app.quit()
  }
})

function createWindow(): void {
  // Get saved window size or use defaults
  const savedWidth = storageService.getWindowWidth()
  const savedHeight = storageService.getWindowHeight()
  const defaultWidth = 1400
  const defaultHeight = 900

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: savedWidth ?? defaultWidth,
    height: savedHeight ?? defaultHeight,
    show: false,
    autoHideMenuBar: true,
    icon,
    backgroundColor: '#111111',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: '#ffffff',
      height: 45
    },
    ...(process.platform === 'linux' ? {} : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Save window size when it's resized
  let resizeTimeout: NodeJS.Timeout | null = null
  mainWindow.on('resized', () => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }
    resizeTimeout = setTimeout(() => {
      const [width, height] = mainWindow.getSize()
      storageService.setWindowWidth(width)
      storageService.setWindowHeight(height)
    }, 500) // Debounce: save 500ms after resize stops
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.voxel.app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => {})

  // Network interceptor for Roblox Game Join
  // This bypasses net::ERR_BLOCKED_BY_CLIENT when setting Referer in net.request
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['https://gamejoin.roblox.com/*'] },
    (details, callback) => {
      const headers = { ...details.requestHeaders }

      // Check if we have our custom header indicating the Place ID
      if (headers['X-Roblox-Place-Id']) {
        const placeId = headers['X-Roblox-Place-Id']
        headers['Referer'] = `https://www.roblox.com/games/${placeId}/`
        headers['Origin'] = 'https://www.roblox.com'

        // Remove the custom header so it's not sent to Roblox
        delete headers['X-Roblox-Place-Id']
      }

      callback({ requestHeaders: headers })
    }
  )

  registerRobloxHandlers()
  registerStorageHandlers()
  registerLogsHandlers()

  // Initialize PIN service (loads persisted lockout state)
  pinService.initialize()

  // Net-log IPC handlers
  ipcMain.handle('net-log:get-status', () => {
    return {
      isLogging: netLog.currentlyLogging,
      logPath: netLog.currentlyLogging ? logFile : null
    }
  })

  ipcMain.handle('net-log:get-log-path', () => {
    return logFile
  })

  ipcMain.handle('net-log:stop', async () => {
    if (netLog.currentlyLogging) {
      await netLog.stopLogging()

      return { success: true, message: 'Logging stopped' }
    }
    return { success: false, message: 'Net-log was not running' }
  })

  ipcMain.handle('net-log:start', async () => {
    if (!netLog.currentlyLogging) {
      const newTimestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const newLogFile = join(netLogPath, `network-log-${newTimestamp}.json`)

      try {
        await netLog.startLogging(newLogFile, {
          captureMode: 'everything',
          maxFileSize: 100 * 1024 * 1024
        })

        return { success: true, message: 'Logging started', path: newLogFile }
      } catch (err) {
        console.error('Failed to start net-log:', err)
        return { success: false, message: `Failed to start: ${err}` }
      }
    }
    return { success: false, message: 'Net-log is already running' }
  })

  // Helper for CORS headers
  const UpsertKeyValue = (obj: Record<string, any>, keyToChange: string, value: any) => {
    const keyToChangeLower = keyToChange.toLowerCase()
    for (const key of Object.keys(obj)) {
      if (key.toLowerCase() === keyToChangeLower) {
        obj[key] = value
        return
      }
    }
    obj[keyToChange] = value
  }

  // CORS bypass for Avatar rendering
  const avatarUrls = ['https://thumbnails.roblox.com/*', 'https://*.rbxcdn.com/*']

  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: avatarUrls },
    (details, callback) => {
      const { requestHeaders } = details
      // Using '*' string for request headers as they are Record<string, string>
      UpsertKeyValue(requestHeaders, 'Access-Control-Allow-Origin', '*')
      callback({ requestHeaders })
    }
  )

  session.defaultSession.webRequest.onHeadersReceived({ urls: avatarUrls }, (details, callback) => {
    const { responseHeaders } = details
    if (responseHeaders) {
      UpsertKeyValue(responseHeaders, 'Access-Control-Allow-Origin', ['*'])
      UpsertKeyValue(responseHeaders, 'Access-Control-Allow-Headers', ['*'])
    }
    callback({ responseHeaders })
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
