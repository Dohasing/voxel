import React, { useState, useEffect } from 'react'
import Color from 'color'
import { ColorPicker } from '@renderer/components/UI/inputs/ColorPicker'
import { Button } from '@renderer/components/UI/buttons/Button'
import { Account } from '@renderer/types'
import { useNotification } from '@renderer/features/system/stores/useSnackbarStore'
import { useSetBodyColors } from '../api/useAvatar'

interface SkinColorEditorProps {
  account: Account
  currentBodyColors: Record<string, any> | null
  onUpdate: () => void
}

const BODY_PARTS = [
  { id: 'all', label: 'All' },
  { id: 'headColor3', label: 'Head' },
  { id: 'torsoColor3', label: 'Torso' },
  { id: 'leftArmColor3', label: 'Left Arm' },
  { id: 'rightArmColor3', label: 'Right Arm' },
  { id: 'leftLegColor3', label: 'Left Leg' },
  { id: 'rightLegColor3', label: 'Right Leg' }
]

const SkinColorEditor: React.FC<SkinColorEditorProps> = ({
  account,
  currentBodyColors,
  onUpdate
}) => {
  const [selectedPart, setSelectedPart] = useState('all')
  const [color, setColor] = useState<string>('#FFFFFF')
  const { showNotification } = useNotification()
  const setBodyColorsMutation = useSetBodyColors(account)

  useEffect(() => {
    if (!currentBodyColors) return

    if (selectedPart === 'all') {
      if (currentBodyColors.headColor3) {
        setColor(currentBodyColors.headColor3)
      }
    } else {
      const partColor = currentBodyColors[selectedPart]
      if (partColor) {
        setColor(partColor)
      }
    }
  }, [selectedPart, currentBodyColors])

  const handleColorChange = (rgba: [number, number, number, number]) => {
    const newColor = Color.rgb(rgba[0], rgba[1], rgba[2]).hex()
    setColor(newColor)
  }

  const handleSave = async () => {
    if (!account.cookie) return

    const bodyColors: Record<string, string> = {}

    if (selectedPart === 'all') {
      BODY_PARTS.forEach((part) => {
        if (part.id !== 'all') {
          bodyColors[part.id] = color
        }
      })
    } else {
      if (currentBodyColors) {
        BODY_PARTS.forEach((part) => {
          if (part.id !== 'all') {
            bodyColors[part.id] = currentBodyColors[part.id] || '#FFFFFF'
          }
        })
      }
      bodyColors[selectedPart] = color
    }

    setBodyColorsMutation.mutate(bodyColors, {
      onSuccess: () => {
        showNotification('Skin color updated successfully', 'success')
        onUpdate()
      },
      onError: (error) => {
        console.error('Failed to update skin color:', error)
        showNotification('Error updating skin color', 'error')
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6 h-full w-full max-w-4xl mx-auto overflow-y-auto">
      <div className="flex flex-wrap gap-2 justify-center">
        {BODY_PARTS.map((part) => (
          <Button
            key={part.id}
            variant={selectedPart === part.id ? 'default' : 'secondary'}
            onClick={() => setSelectedPart(part.id)}
            className="min-w-[80px]"
          >
            {part.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 flex-1">
        <div className="w-full max-w-md">
          <ColorPicker value={color} onChange={handleColorChange} className="w-full" />
        </div>
      </div>

      <div className="flex justify-center pt-4 pb-8">
        <Button
          onClick={handleSave}
          disabled={setBodyColorsMutation.isPending}
          className="w-full max-w-xs"
          size="lg"
        >
          {setBodyColorsMutation.isPending ? 'Updating...' : 'Update Skin Color'}
        </Button>
      </div>
    </div>
  )
}

export default SkinColorEditor
