import React, { useState } from 'react'
import { Users, HardDrive, Palette, Bell, Lock, Shield, Sliders } from 'lucide-react'
import { motion } from 'framer-motion'
import Color from 'color'
import { useQueryClient } from '@tanstack/react-query'
import { Account, Settings } from '../../types'
import { cn } from '../../lib/utils'
import CustomCheckbox from '../../components/UI/buttons/CustomCheckbox'
import CustomDropdown, { DropdownOption } from '../../components/UI/menus/CustomDropdown'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogBody
} from '../../components/UI/dialogs/Dialog'
import {
  ColorPicker,
  ColorPickerSelection,
  ColorPickerHue,
  ColorPickerEyeDropper,
  ColorPickerOutput,
  ColorPickerFormat
} from '../../components/UI/inputs/ColorPicker'
import {
  useNotificationTrayStore,
  useNotifyFriendOnline,
  useNotifyFriendInGame,
  useNotifyFriendRemoved,
  useNotifyServerLocation
} from '../system/stores/useNotificationTrayStore'
import { useSetAppUnlocked } from '../../stores/useUIStore'
import { queryKeys } from '../../../../shared/queryKeys'
import PinSetupDialog from '../../components/UI/security/PinSetupDialog'
import { useInstallations } from '../install/stores/useInstallationsStore'

interface SettingsTabProps {
  accounts: Account[]
  settings: Settings
  onUpdateSettings: (newSettings: Partial<Settings>) => void
}

const SettingsTab: React.FC<SettingsTabProps> = ({ accounts, settings, onUpdateSettings }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security'>('general')
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false)
  const queryClient = useQueryClient()
  const setAppUnlocked = useSetAppUnlocked()

  // Use shared installations store instead of local state + localStorage
  const installations = useInstallations()

  // Notification settings from store
  const notifyFriendOnline = useNotifyFriendOnline()
  const notifyFriendInGame = useNotifyFriendInGame()
  const notifyFriendRemoved = useNotifyFriendRemoved()
  const notifyServerLocation = useNotifyServerLocation()
  const setNotifyFriendOnline = useNotificationTrayStore((state) => state.setNotifyFriendOnline)
  const setNotifyFriendInGame = useNotificationTrayStore((state) => state.setNotifyFriendInGame)
  const setNotifyFriendRemoved = useNotificationTrayStore((state) => state.setNotifyFriendRemoved)
  const setNotifyServerLocation = useNotificationTrayStore((state) => state.setNotifyServerLocation)

  const handlePrimaryAccountChange = (value: string) => {
    onUpdateSettings({ primaryAccountId: value === '' ? null : value })
  }

  const handleDefaultInstallChange = (value: string) => {
    onUpdateSettings({ defaultInstallationPath: value === '' ? undefined : value })
  }

  const handleMultiInstanceChange = () => {
    onUpdateSettings({ allowMultipleInstances: !settings.allowMultipleInstances })
  }

  const handleAccentColorChange = (rgba: [number, number, number, number]) => {
    try {
      const color = Color.rgb(rgba[0], rgba[1], rgba[2], rgba[3])
      const hex = color.hex()
      onUpdateSettings({ accentColor: hex })
    } catch (e) {
      console.error('Failed to convert color:', e)
    }
  }

  const handleProfileCardToggle = () => {
    onUpdateSettings({ showSidebarProfileCard: !settings.showSidebarProfileCard })
  }

  const handlePinSave = async (newPin: string | null, currentPin?: string) => {
    // Use secure setPin API - requires current PIN if one is already set
    const result = await window.api.setPin(newPin, currentPin)
    if (result.success) {
      // If PIN is set, mark app as unlocked so user isn't immediately locked out
      if (newPin) {
        setAppUnlocked(true)
      }
      // Invalidate settings query to update UI (pinCode: 'SET')
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.snapshot() })
    }
    return result
  }

  const accountOptions: DropdownOption[] = [
    { value: '', label: 'None' },
    ...accounts.map((account) => ({
      value: account.id,
      label: account.displayName,
      subLabel: `@${account.username}`
    }))
  ]

  const installationOptions: DropdownOption[] = [
    { value: '', label: 'System Default' },
    ...installations.map((inst) => ({
      value: inst.path,
      label: inst.name,
      subLabel: inst.version.substring(0, 15) + '...'
    }))
  ]

  return (
    <div className="flex flex-col h-full bg-neutral-950">
      <div className="shrink-0 h-[72px] bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-6 z-20">
        <h2 className="text-xl font-bold text-white">Settings</h2>
      </div>

      {/* Tabs Header */}
      <div className="shrink-0 border-b border-neutral-800 bg-neutral-950">
        <div className="max-w-2xl mx-auto">
          <div className="relative flex">
            {/* Animated sliding indicator */}
            <motion.div
              className="absolute bottom-0 h-0.5 bg-[var(--accent-color)] z-20"
              initial={false}
              animate={{
                left:
                  activeTab === 'general'
                    ? '0%'
                    : activeTab === 'notifications'
                      ? '33.333%'
                      : '66.666%',
                width: '33.333%'
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />

            <button
              onClick={() => setActiveTab('general')}
              className={cn(
                'flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 relative z-10 hover:bg-neutral-900/50 active:bg-neutral-900',
                activeTab === 'general' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
              )}
            >
              <Sliders size={16} />
              General
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={cn(
                'flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 relative z-10 hover:bg-neutral-900/50 active:bg-neutral-900',
                activeTab === 'notifications'
                  ? 'text-white'
                  : 'text-neutral-500 hover:text-neutral-300'
              )}
            >
              <Bell size={16} />
              Notifications
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={cn(
                'flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 relative z-10 hover:bg-neutral-900/50 active:bg-neutral-900',
                activeTab === 'security' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
              )}
            >
              <Shield size={16} />
              Security
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
        <div className="max-w-2xl mx-auto pb-8">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">General Settings</h3>
                <p className="text-sm text-neutral-400 mb-6">
                  Manage your account and application preferences.
                </p>

                <div className="space-y-6">
                  {/* Primary Account Setting */}
                  <div className="flex flex-col space-y-2">
                    <label
                      htmlFor="primary-account"
                      className="text-sm font-medium text-neutral-400 flex items-center"
                    >
                      <Users size={16} className="mr-2" />
                      Primary Account
                    </label>
                    <p className="text-xs text-neutral-500 mb-2">
                      This account will be automatically selected when the application starts.
                    </p>
                    <CustomDropdown
                      options={accountOptions}
                      value={settings.primaryAccountId || ''}
                      onChange={handlePrimaryAccountChange}
                      placeholder="Select Primary Account"
                    />
                  </div>

                  {/* Accent Color Setting */}
                  <div className="flex flex-col space-y-2">
                    <label
                      htmlFor="accent-color"
                      className="text-sm font-medium text-neutral-400 flex items-center"
                    >
                      <Palette size={16} className="mr-2" />
                      Accent Color
                    </label>
                    <p className="text-xs text-neutral-500 mb-2">
                      Customize the highlight color used for buttons, indicators, and focus rings.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsColorPickerOpen(true)}
                        className="h-12 w-12 rounded-lg border border-neutral-800 bg-transparent cursor-pointer hover:border-neutral-700 transition-colors flex-shrink-0"
                        style={{ backgroundColor: settings.accentColor }}
                        aria-label="Select accent color"
                      />
                      <div className="flex-1 flex flex-col justify-center">
                        <label
                          htmlFor="accent-color-hex"
                          className="text-xs text-neutral-500 uppercase tracking-wide"
                        >
                          Hex Value
                        </label>
                        <input
                          id="accent-color-hex"
                          type="text"
                          value={settings.accentColor}
                          readOnly
                          placeholder="#ffffff"
                          spellCheck={false}
                          className="mt-1 w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--accent-color)] focus:outline-none cursor-pointer"
                          onClick={() => setIsColorPickerOpen(true)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Default Installation Setting */}
                  <div className="flex flex-col space-y-2">
                    <label
                      htmlFor="default-install"
                      className="text-sm font-medium text-neutral-400 flex items-center"
                    >
                      <HardDrive size={16} className="mr-2" />
                      Default Installation
                    </label>
                    <p className="text-xs text-neutral-500 mb-2">
                      Select the specific Roblox version to use when launching games. If not set,
                      you will be prompted to choose.
                    </p>
                    <CustomDropdown
                      options={installationOptions}
                      value={settings.defaultInstallationPath || ''}
                      onChange={handleDefaultInstallChange}
                      placeholder="Select Installation"
                    />
                  </div>

                  {/* Multi-Instance Setting */}
                  <div className="flex items-start space-x-3 p-4 bg-neutral-900/30 rounded-lg border border-neutral-800/50 hover:border-neutral-700/50 transition-colors">
                    <div className="mt-1">
                      <CustomCheckbox
                        checked={settings.allowMultipleInstances}
                        onChange={handleMultiInstanceChange}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-300 block mb-1">
                        Allow Multiple Instances
                      </label>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        Enable launching multiple Roblox clients simultaneously.
                        <span className="block mt-1 text-yellow-600/80">
                          Note: This feature is considered to be against the Roblox Terms of
                          Service. Use at your own risk.
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Sidebar Profile Card Setting */}
                  <div className="flex items-start space-x-3 p-4 bg-neutral-900/30 rounded-lg border border-neutral-800/50 hover:border-neutral-700/50 transition-colors">
                    <div className="mt-1">
                      <CustomCheckbox
                        checked={settings.showSidebarProfileCard}
                        onChange={handleProfileCardToggle}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-300 block mb-1">
                        Show Sidebar Profile Card
                      </label>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        Display the selected account's quick profile card to see your profile
                        faster.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Notifications</h3>
                <p className="text-sm text-neutral-400 mb-6">
                  Configure how and when you want to be notified.
                </p>

                <div className="space-y-4">
                  {/* Friend Online Notifications */}
                  <div className="flex items-start space-x-3 p-4 bg-neutral-900/30 rounded-lg border border-neutral-800/50 hover:border-neutral-700/50 transition-colors">
                    <div className="mt-1">
                      <CustomCheckbox
                        checked={notifyFriendOnline}
                        onChange={() => setNotifyFriendOnline(!notifyFriendOnline)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-300 block mb-1">
                        Friend Online Notifications
                      </label>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        Get notified when your friends come online.
                      </p>
                    </div>
                  </div>

                  {/* Friend In-Game Notifications */}
                  <div className="flex items-start space-x-3 p-4 bg-neutral-900/30 rounded-lg border border-neutral-800/50 hover:border-neutral-700/50 transition-colors">
                    <div className="mt-1">
                      <CustomCheckbox
                        checked={notifyFriendInGame}
                        onChange={() => setNotifyFriendInGame(!notifyFriendInGame)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-300 block mb-1">
                        Friend In-Game Notifications
                      </label>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        Get notified when your friends start playing a game.
                      </p>
                    </div>
                  </div>

                  {/* Friend Removed Notifications */}
                  <div className="flex items-start space-x-3 p-4 bg-neutral-900/30 rounded-lg border border-neutral-800/50 hover:border-neutral-700/50 transition-colors">
                    <div className="mt-1">
                      <CustomCheckbox
                        checked={notifyFriendRemoved}
                        onChange={() => setNotifyFriendRemoved(!notifyFriendRemoved)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-300 block mb-1">
                        Friend Removed Notifications
                      </label>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        Get notified when someone unfriends you.
                      </p>
                    </div>
                  </div>

                  {/* Server Location Notifications */}
                  <div className="flex items-start space-x-3 p-4 bg-neutral-900/30 rounded-lg border border-neutral-800/50 hover:border-neutral-700/50 transition-colors">
                    <div className="mt-1">
                      <CustomCheckbox
                        checked={notifyServerLocation}
                        onChange={() => setNotifyServerLocation(!notifyServerLocation)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-300 block mb-1">
                        Server Location Notifications
                      </label>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        Get notified of the server location when joining a Roblox game.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Security</h3>
                <p className="text-sm text-neutral-400 mb-6">
                  Manage security settings and access controls.
                </p>

                <div className="space-y-6">
                  {/* PIN Lock Setting */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-neutral-400 flex items-center">
                      <Lock size={16} className="mr-2" />
                      PIN Lock
                    </label>
                    <p className="text-xs text-neutral-500 mb-2">
                      Protect your app with a 6-digit PIN code that must be entered on startup.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsPinDialogOpen(true)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          settings.pinCode
                            ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20'
                            : 'text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700'
                        }`}
                      >
                        {settings.pinCode ? 'PIN Enabled - Click to Manage' : 'Set Up PIN'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog isOpen={isColorPickerOpen} onClose={() => setIsColorPickerOpen(false)}>
        <DialogContent className="max-w-md overflow-visible">
          <DialogHeader>
            <DialogTitle>Pick Accent Color</DialogTitle>
            <DialogClose />
          </DialogHeader>
          <DialogBody>
            <ColorPicker
              value={settings.accentColor}
              onChange={handleAccentColorChange}
              className="w-full"
            >
              <div className="flex flex-col gap-4">
                <div className="flex gap-3 items-stretch">
                  <div className="flex-1 h-64 rounded-lg overflow-hidden border border-neutral-800">
                    <ColorPickerSelection className="h-full" />
                  </div>
                  <div className="w-8 h-64 rounded-lg border border-neutral-800 bg-neutral-900 p-1 flex items-center justify-center">
                    <ColorPickerHue orientation="vertical" className="h-full w-full rounded-full" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2 items-end">
                    <div>
                      <ColorPickerEyeDropper />
                    </div>
                    <div className="flex-1">
                      <ColorPickerFormat />
                    </div>
                    <div>
                      <ColorPickerOutput />
                    </div>
                  </div>
                </div>
              </div>
            </ColorPicker>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <PinSetupDialog
        isOpen={isPinDialogOpen}
        onClose={() => setIsPinDialogOpen(false)}
        onSave={handlePinSave}
        currentPin={settings.pinCode}
      />
    </div>
  )
}

export default SettingsTab
