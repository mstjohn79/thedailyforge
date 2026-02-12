import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'

interface GratitudeSectionProps {
  gratitude: string[]
  onUpdate: (gratitude: string[]) => void
}

export function GratitudeSection({ gratitude, onUpdate }: GratitudeSectionProps) {
  const [localGratitude, setLocalGratitude] = useState(gratitude || ['', '', ''])

  useEffect(() => {
    console.log('GratitudeSection: Received gratitude prop:', gratitude)
    console.log('GratitudeSection: gratitude type:', typeof gratitude)
    console.log('GratitudeSection: gratitude isArray:', Array.isArray(gratitude))
    console.log('GratitudeSection: gratitude length:', gratitude?.length)
    setLocalGratitude(gratitude || ['', '', ''])
  }, [gratitude])

  const handleInputChange = (index: number, value: string) => {
    const newGratitude = [...localGratitude]
    newGratitude[index] = value
    setLocalGratitude(newGratitude)
  }

  const handleInputBlur = (index: number) => {
    // Only update if there's actually a change
    if (localGratitude[index] !== gratitude[index]) {
      onUpdate(localGratitude)
      // Trigger auto-save
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('triggerSave'))
      }, 100)
    }
  }

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-700">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <Heart className="w-5 h-5 text-slate-400" />
          Daily Gratitude
        </h3>
        <p className="text-green-200">
          "Give thanks in all circumstances" - 1 Thessalonians 5:18
        </p>
      </div>

      <div className="space-y-4">
        {localGratitude.map((item, index) => (
          <div key={index} className="relative">
            <div className="absolute left-4 top-4 text-green-600 font-bold text-sm">
              {index + 1}.
            </div>
            <textarea
              value={item}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onBlur={() => handleInputBlur(index)}
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-600/50 rounded-lg bg-slate-700/60 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors duration-200 resize-none"
              placeholder="I'm grateful for..."
              rows={2}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = target.scrollHeight + 'px'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}