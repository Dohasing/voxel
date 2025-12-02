import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  HardDrive,
  Plus,
  Trash2,
  RefreshCw,
  Play,
  FolderOpen,
  Box,
  Laptop,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  Calendar,
  Clock3
} from 'lucide-react'
import { RobloxInstallation, BinaryType } from '@renderer/types'
import CustomDropdown from '@renderer/components/UI/menus/CustomDropdown'
import ConfirmModal from '@renderer/components/UI/dialogs/ConfirmModal'
import { useNotification } from '@renderer/features/system/stores/useSnackbarStore'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/UI/display/Tooltip'
import {
  useInstallationsStore,
  useInstallations,
  useSelectedInstallationId,
  useSelectedInstallation,
  useDeployHistory,
  getApiType
} from './stores/useInstallationsStore'

const InstallTab: React.FC = () => {
  const { showNotification } = useNotification()

  // Zustand store state and actions
  const installations = useInstallations()
  const selectedId = useSelectedInstallationId()
  const selectedInstall = useSelectedInstallation()
  const history = useDeployHistory()
  const {
    addInstallation,
    updateInstallation,
    removeInstallation,
    setSelectedId,
    setDeployHistory
  } = useInstallationsStore()

  // Local form state (not persisted)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<BinaryType>(BinaryType.WindowsPlayer)
  const [newVersion, setNewVersion] = useState('')
  const [newChannel, setNewChannel] = useState('live')
  const [isInstalling, setIsInstalling] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [installProgress, setInstallProgress] = useState({ status: '', percent: 0, detail: '' })

  // FFlags State
  const [fflags, setFFlags] = useState<Record<string, any>>({})
  const [newFlagKey, setNewFlagKey] = useState('')
  const [newFlagValue, setNewFlagValue] = useState('')

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    isDangerous?: boolean
    confirmText?: string
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDangerous: false
  })

  // Load deploy history on mount
  useEffect(() => {
    // @ts-ignore
    window.api.getDeployHistory().then(setDeployHistory).catch(console.error)
  }, [setDeployHistory])

  // Load FFlags when selectedInstall changes
  useEffect(() => {
    if (selectedInstall) {
      loadFFlags()
    } else {
      setFFlags({})
    }
  }, [selectedInstall])

  const loadFFlags = async () => {
    if (!selectedInstall) return
    try {
      // @ts-ignore
      const flags = await window.api.getFFlags(selectedInstall.path)
      setFFlags(flags || {})
    } catch (e) {
      console.error('Failed to load FFlags', e)
    }
  }

  const handleSaveFFlags = async () => {
    if (!selectedInstall) return
    try {
      // @ts-ignore
      await window.api.setFFlags(selectedInstall.path, fflags)
      showNotification('FFlags saved successfully', 'success')
    } catch (e) {
      showNotification('Failed to save FFlags', 'error')
    }
  }

  const addFlag = () => {
    if (!newFlagKey) return
    let val: any = newFlagValue
    // Simple type inference
    if (val === 'true') val = true
    if (val === 'false') val = false
    if (!isNaN(Number(val)) && val.trim() !== '') val = Number(val)

    setFFlags((prev) => ({ ...prev, [newFlagKey]: val }))
    setNewFlagKey('')
    setNewFlagValue('')
  }

  const removeFlag = (key: string) => {
    const newFlags = { ...fflags }
    delete newFlags[key]
    setFFlags(newFlags)
  }

  const availableVersions = history[getApiType(newType)] || []

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    const versionToInstall = newVersion || availableVersions[0]

    if (!versionToInstall) {
      showNotification('No version selected or available', 'error')
      return
    }

    setIsInstalling(true)
    setInstallProgress({ status: 'Starting...', percent: 0, detail: '' })

    const apiType = getApiType(newType)

    const onProgress = (_: any, { status, progress, detail }: any) => {
      setInstallProgress({ status, percent: progress, detail: detail || '' })
    }

    // @ts-ignore
    window.electron.ipcRenderer.on('install-progress', onProgress)

    try {
      // @ts-ignore
      const path = await window.api.installRobloxVersion(apiType, versionToInstall)

      if (path) {
        const newInstall: RobloxInstallation = {
          id: Math.random().toString(36).slice(2, 11),
          name: newName,
          binaryType: newType,
          version: versionToInstall,
          channel: newChannel,
          path: path,
          lastUpdated: new Date().toISOString().split('T')[0],
          status: 'Ready'
        }
        addInstallation(newInstall)
        setNewName('')
        setNewVersion('')
        setNewChannel('live')
        showNotification('Installation created successfully', 'success')
      } else {
        showNotification('Installation failed. Check console for details.', 'error')
      }
    } catch (err) {
      console.error(err)
      showNotification('Installation error: ' + err, 'error')
    } finally {
      // @ts-ignore
      window.electron.ipcRenderer.removeListener('install-progress', onProgress)
      setIsInstalling(false)
    }
  }

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Installation',
      message: 'Are you sure you want to delete this installation? This action cannot be undone.',
      isDangerous: true,
      confirmText: 'Delete',
      onConfirm: async () => {
        const install = installations.find((i) => i.id === id)
        if (install) {
          try {
            // @ts-ignore
            await window.api.uninstallRobloxVersion(install.path)
            showNotification('Installation deleted', 'success')
          } catch (e) {
            console.error('Uninstall failed', e)
            showNotification('Failed to delete installation files', 'error')
          }
        }
        removeInstallation(id)
      }
    })
  }

  const handleLaunch = async () => {
    if (!selectedInstall) return
    showNotification('Launching Roblox...', 'info')
    try {
      // @ts-ignore
      await window.api.launchRobloxInstall(selectedInstall.path)
      showNotification('Roblox launched successfully', 'success')
    } catch (e) {
      showNotification('Failed to launch: ' + e, 'error')
    }
  }

  const handleOpenLocation = async () => {
    if (!selectedInstall) return
    try {
      // @ts-ignore
      await window.api.openRobloxFolder(selectedInstall.path)
    } catch (e) {
      showNotification('Failed to open folder: ' + e, 'error')
    }
  }

  const handleVerify = () => {
    if (!selectedInstall) return

    setConfirmModal({
      isOpen: true,
      title: 'Verify Files',
      message:
        'This will reinstall the current version to verify and fix any missing files. This process may take a few minutes. Continue?',
      isDangerous: false,
      confirmText: 'Verify',
      onConfirm: async () => {
        setIsVerifying(true)
        setInstallProgress({ status: 'Verifying...', percent: 0, detail: '' })

        const onProgress = (_: any, { status, progress, detail }: any) => {
          setInstallProgress({ status, percent: progress, detail: detail || '' })
        }

        // @ts-ignore
        window.electron.ipcRenderer.on('install-progress', onProgress)

        try {
          // @ts-ignore
          await window.api.verifyRobloxFiles(
            getApiType(selectedInstall.binaryType),
            selectedInstall.version,
            selectedInstall.path
          )

          updateInstallation(selectedInstall.id, {
            lastUpdated: new Date().toISOString().split('T')[0],
            status: 'Ready'
          })
          showNotification('Verification complete!', 'success')
        } catch (e) {
          showNotification('Verification failed: ' + e, 'error')
        } finally {
          // @ts-ignore
          window.electron.ipcRenderer.removeListener('install-progress', onProgress)
          setIsVerifying(false)
        }
      }
    })
  }

  const handleCheckUpdates = async () => {
    if (!selectedInstall) return
    try {
      const apiType = getApiType(selectedInstall.binaryType)
      // @ts-ignore
      const result = await window.api.checkForUpdates(apiType, selectedInstall.version)
      if (result.hasUpdate) {
        setConfirmModal({
          isOpen: true,
          title: 'Update Available',
          message: `New version available: ${result.latestVersion}. Would you like to create a new installation with this version?`,
          confirmText: 'Got it',
          onConfirm: () => {
            // Just informational for now as per previous alert behavior, or we could switch to "New" tab and prefill
            showNotification(
              `You can now create a new installation for version ${result.latestVersion}`,
              'info'
            )
          }
        })
      } else {
        showNotification('Version is up to date.', 'success')
      }
    } catch (e) {
      showNotification('Failed to check updates: ' + e, 'error')
    }
  }

  const isFormActive =
    newName.trim().length > 0 ||
    newVersion.trim().length > 0 ||
    newChannel.trim() !== 'live' ||
    newType !== BinaryType.WindowsPlayer

  const parseDateOnly = (value?: string) => {
    if (!value) return null
    const [year, month, day] = value.split('-').map(Number)
    if ([year, month, day].some((num) => Number.isNaN(num))) return null
    return new Date(year, month - 1, day)
  }

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const formatGroupLabel = (date: Date, today: Date, yesterday: Date) => {
    if (isSameDay(date, today)) return 'Today'
    if (isSameDay(date, yesterday)) return 'Yesterday'
    return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const groupedInstallations = useMemo(() => {
    if (installations.length === 0) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const grouped = installations.reduce(
      (acc, inst) => {
        const dateObj = parseDateOnly(inst.lastUpdated)
        const sortValue = dateObj ? dateObj.getTime() : 0
        const key = dateObj ? dateObj.toISOString().split('T')[0] : `unknown-${inst.id}`
        const label = dateObj ? formatGroupLabel(dateObj, today, yesterday) : 'Earlier'

        if (!acc[key]) {
          acc[key] = { label, installations: [], sortValue }
        }

        acc[key].label = label
        acc[key].installations.push(inst)
        return acc
      },
      {} as Record<
        string,
        { label: string; installations: RobloxInstallation[]; sortValue: number }
      >
    )

    return Object.values(grouped)
      .sort((a, b) => b.sortValue - a.sortValue)
      .map((group) => ({
        label: group.label,
        installations: group.installations.sort((a, b) =>
          b.lastUpdated.localeCompare(a.lastUpdated)
        )
      }))
  }, [installations])

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col h-full bg-neutral-950 overflow-hidden"
      >
        <div className="flex flex-col w-full h-full">
          {/* Toolbar */}
          <div className="shrink-0 h-[72px] bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-6 z-20">
            <h1 className="text-xl font-bold text-white">Install</h1>
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={async () => {
                      try {
                        // @ts-ignore
                        await window.api.getDeployHistory().then(setHistory).catch(console.error)
                        showNotification('Installation history refreshed', 'success')
                      } catch (e) {
                        showNotification('Failed to refresh history', 'error')
                      }
                    }}
                    className="pressable flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-xs font-medium border bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700"
                  >
                    <RefreshCw size={14} />
                    Refresh
                  </button>
                </TooltipTrigger>
                <TooltipContent>Refresh installation history</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar List */}
            <div className="w-80 bg-[#111111] border-r border-neutral-800 flex flex-col shrink-0">
              <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6">
                <button
                  onClick={() => setSelectedId('new')}
                  className={`pressable w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    selectedId === 'new'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-neutral-400 hover:bg-neutral-800 border border-transparent'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-md ${selectedId === 'new' ? 'bg-emerald-500/20' : 'bg-neutral-800'}`}
                  >
                    <Plus size={16} />
                  </div>
                  <span className="font-medium text-sm">New Installation</span>
                </button>

                {groupedInstallations.length > 0 && (
                  <>
                    {groupedInstallations.map((group) => (
                      <div key={group.label}>
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                          <Calendar size={12} />
                          {group.label}
                        </h3>
                        <div className="space-y-1">
                          {group.installations.map((inst, index) => {
                            const isSelected = selectedId === inst.id
                            const dateObj = parseDateOnly(inst.lastUpdated)
                            const timeStr = dateObj
                              ? dateObj.toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric'
                                })
                              : inst.lastUpdated || 'Unknown'

                            return (
                              <motion.button
                                key={inst.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.4, delay: index * 0.03 }}
                                onClick={() => setSelectedId(inst.id)}
                                whileTap={{ scale: 0.97 }}
                                className={`pressable w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left group ${
                                  isSelected
                                    ? 'bg-neutral-800 shadow-sm border border-neutral-700'
                                    : 'hover:bg-neutral-800/50 border border-transparent'
                                }`}
                              >
                                <div
                                  className={`mt-0.5 ${isSelected ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-400'}`}
                                >
                                  {inst.binaryType === BinaryType.WindowsStudio ? (
                                    <Box size={18} />
                                  ) : (
                                    <Laptop size={18} />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div
                                    className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-neutral-300'}`}
                                  >
                                    {inst.name}
                                  </div>
                                  <div className="flex items-center justify-between mt-1.5">
                                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                                      <Clock3 size={10} /> {timeStr}
                                    </span>
                                  </div>
                                  <div
                                    className={`text-[10px] mt-0.5 font-mono ${isSelected ? 'text-neutral-400' : 'text-neutral-500'}`}
                                  >
                                    {inst.version}
                                  </div>
                                </div>
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0 bg-neutral-950">
              {selectedId === 'new' ? (
                <motion.div
                  key="new"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex-1 overflow-y-auto"
                >
                  <div className="min-h-full flex items-center justify-center p-8">
                    <div className="w-full max-w-lg">
                      <div
                        className={`text-center overflow-hidden transition-all duration-500 ease-in-out ${
                          isFormActive
                            ? 'opacity-0 max-h-0 mb-0'
                            : 'opacity-0 max-h-0 mb-0 md:opacity-100 md:max-h-60 md:mb-8'
                        }`}
                      >
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mb-4 border border-emerald-500/20">
                          <Plus size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Create Installation</h2>
                        <p className="text-neutral-400 mt-2 hidden md:block">
                          Download and configure a specific version of the Roblox client or Studio.
                        </p>
                      </div>

                      <form
                        onSubmit={handleCreate}
                        className="space-y-6 bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl"
                      >
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-neutral-300">
                            Installation Name
                          </label>
                          <input
                            type="text"
                            required
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. My Custom Version"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-neutral-300">
                            Binary Type
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setNewType(BinaryType.WindowsPlayer)}
                              className={`pressable flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                                newType === BinaryType.WindowsPlayer
                                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                              }`}
                            >
                              <Laptop size={24} />
                              <span className="text-sm font-medium">Player</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewType(BinaryType.WindowsStudio)}
                              className={`pressable flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                                newType === BinaryType.WindowsStudio
                                  ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                              }`}
                            >
                              <Box size={24} />
                              <span className="text-sm font-medium">Studio</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300">
                              Target Version{' '}
                              <span className="text-neutral-500 text-xs">(Hash)</span>
                            </label>
                            <CustomDropdown
                              options={
                                availableVersions.length > 0
                                  ? availableVersions.map((v) => ({
                                      value: v,
                                      label: v,
                                      subLabel: v === availableVersions[0] ? '(Latest)' : undefined
                                    }))
                                  : [{ value: '', label: 'Loading or No Versions Available' }]
                              }
                              value={newVersion}
                              onChange={setNewVersion}
                              placeholder={
                                availableVersions.length > 0 ? 'Select a version...' : 'Loading...'
                              }
                              buttonClassName="bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300">
                              Deploy Channel
                            </label>
                            <input
                              type="text"
                              value={newChannel}
                              onChange={(e) => setNewChannel(e.target.value)}
                              placeholder="live"
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder-neutral-600"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isInstalling || !newName}
                          className={`pressable w-full flex items-center justify-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-muted)] text-[var(--accent-color-foreground)] font-bold rounded-lg transition-all border border-[var(--accent-color-border)] shadow-[0_10px_30px_var(--accent-color-shadow)] disabled:opacity-50 disabled:cursor-not-allowed mt-2 ${
                            isInstalling ? 'h-20' : 'py-3'
                          }`}
                        >
                          {isInstalling ? (
                            <div className="w-full flex flex-col items-center gap-1 px-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Loader2 size={16} className="animate-spin" />
                                <span>
                                  {installProgress.status} ({installProgress.percent}%)
                                </span>
                              </div>
                              {installProgress.detail && (
                                <span className="text-[10px] text-neutral-600 truncate max-w-full">
                                  {installProgress.detail}
                                </span>
                              )}
                              <div className="w-full h-1 bg-neutral-200 rounded-full overflow-hidden mt-1">
                                <div
                                  className="h-full bg-emerald-500 transition-all duration-300"
                                  style={{ width: `${installProgress.percent}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <HardDrive size={20} />
                              <span>Start Installation</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                </motion.div>
              ) : selectedInstall ? (
                <motion.div
                  key={selectedInstall.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex-1 flex flex-col h-full"
                >
                  <div className="p-8 border-b border-neutral-800 bg-neutral-900/20">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-16 h-16 rounded-xl bg-neutral-800 flex items-center justify-center border border-neutral-700 shadow-inner shrink-0">
                          {selectedInstall.binaryType === BinaryType.WindowsStudio ? (
                            <Box size={32} className="text-blue-400" />
                          ) : (
                            <Laptop size={32} className="text-emerald-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h1 className="text-3xl font-bold text-white truncate">
                            {selectedInstall.name}
                          </h1>
                          <div className="flex items-center gap-2 mt-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-sm font-mono text-neutral-500 truncate max-w-full">
                                  {selectedInstall.path}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>{selectedInstall.path}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={handleOpenLocation}
                                  className="pressable text-neutral-500 hover:text-white transition-colors p-1 hover:bg-neutral-800 rounded shrink-0"
                                >
                                  <FolderOpen size={14} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Open in Explorer</TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                selectedInstall.status === 'Ready'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : selectedInstall.status === 'Updating'
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}
                            >
                              {selectedInstall.status === 'Updating' && (
                                <RefreshCw size={10} className="animate-spin" />
                              )}
                              {selectedInstall.status}
                            </span>
                            <span className="text-neutral-500 text-sm font-mono bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                              {selectedInstall.channel}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0 ml-4">
                        <button
                          onClick={handleLaunch}
                          className="pressable flex items-center gap-2 px-4 py-2 bg-[var(--accent-color)] text-[var(--accent-color-foreground)] rounded-lg font-bold hover:bg-[var(--accent-color-muted)] transition-colors border border-[var(--accent-color-border)] shadow-[0_10px_30px_var(--accent-color-shadow)]"
                        >
                          <Play size={16} fill="currentColor" />
                          Launch
                        </button>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleDelete(selectedInstall.id)}
                              className="pressable p-2.5 bg-neutral-900 text-red-400 hover:bg-red-900/20 hover:text-red-300 border border-neutral-800 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Delete Installation</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 space-y-8 overflow-y-auto">
                    <div className="flex flex-col gap-6">
                      <div className="p-6 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-4">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                          Version Information
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-neutral-800/50">
                            <span className="text-neutral-400">Current Version</span>
                            <span className="font-mono text-white text-sm">
                              {selectedInstall.version}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-neutral-800/50">
                            <span className="text-neutral-400">Last Updated</span>
                            <span className="text-white text-sm">
                              {selectedInstall.lastUpdated}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-neutral-400">Type</span>
                            <span className="text-white text-sm">{selectedInstall.binaryType}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <button
                            onClick={handleCheckUpdates}
                            className="pressable py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <RefreshCw size={14} />
                            Check for Updates
                          </button>
                          <button
                            className="pressable py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleVerify}
                            disabled={isVerifying}
                          >
                            {isVerifying ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle size={14} />
                            )}
                            {isVerifying ? 'Verifying...' : 'Verify Files'}
                          </button>
                        </div>
                        {isVerifying && (
                          <div className="w-full mt-2">
                            <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                              <span>{installProgress.status}</span>
                              <span>{installProgress.percent}%</span>
                            </div>
                            <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${installProgress.percent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* FFlags Section */}
                      <div className="p-6 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                            Client Settings (FFlags)
                          </h3>
                          <button
                            onClick={handleSaveFFlags}
                            className="pressable flex items-center gap-2 text-emerald-500 hover:text-emerald-400 transition-colors text-xs font-medium bg-emerald-500/10 px-3 py-1.5 rounded border border-emerald-500/20"
                          >
                            <Save size={14} />
                            Save Changes
                          </button>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin pr-2">
                          {Object.keys(fflags).length === 0 && (
                            <div className="text-neutral-500 text-sm text-center py-4">
                              No flags configured
                            </div>
                          )}
                          {Object.entries(fflags).map(([key, val]) => (
                            <div
                              key={key}
                              className="flex items-center gap-2 bg-neutral-950 p-2 rounded border border-neutral-800 group"
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="flex-1 font-mono text-xs text-neutral-300 truncate">
                                    {key}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>{key}</TooltipContent>
                              </Tooltip>
                              <span className="font-mono text-xs text-emerald-400">
                                {String(val)}
                              </span>
                              <button
                                onClick={() => removeFlag(key)}
                                className="pressable opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-neutral-800 pt-4">
                          <div className="flex gap-2">
                            <input
                              className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono placeholder:font-sans"
                              placeholder="Flag Name"
                              value={newFlagKey}
                              onChange={(e) => setNewFlagKey(e.target.value)}
                            />
                            <input
                              className="w-32 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono placeholder:font-sans"
                              placeholder="Value"
                              value={newFlagValue}
                              onChange={(e) => setNewFlagValue(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && addFlag()}
                            />
                            <button
                              onClick={addFlag}
                              disabled={!newFlagKey}
                              className="pressable p-2 bg-neutral-800 hover:bg-emerald-600 rounded text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <p className="text-[10px] text-neutral-500 mt-2">
                            Values 'true'/'false' are converted to booleans. Numbers are converted
                            to numbers.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-4">
                        Recent Activity
                      </h3>
                      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 font-mono text-xs space-y-2 text-neutral-400">
                        <div className="flex gap-4">
                          <span className="text-neutral-600">
                            {selectedInstall.lastUpdated} 14:02:11
                          </span>
                          <span className="text-emerald-500">[INFO]</span>
                          <span>Installation verified successfully.</span>
                        </div>
                        <div className="flex gap-4">
                          <span className="text-neutral-600">
                            {selectedInstall.lastUpdated} 14:01:45
                          </span>
                          <span className="text-blue-500">[UPDATE]</span>
                          <span>Downloading version manifest...</span>
                        </div>
                        <div className="flex gap-4">
                          <span className="text-neutral-600">
                            {selectedInstall.lastUpdated} 14:00:00
                          </span>
                          <span className="text-neutral-500">[SYSTEM]</span>
                          <span>Bootstrapper initialized.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex-1 flex items-center justify-center text-neutral-500"
                >
                  <div className="text-center">
                    <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Select an installation to manage</p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isDangerous={confirmModal.isDangerous}
        confirmText={confirmModal.confirmText}
      />
    </>
  )
}

export default InstallTab
