
import { useState, useEffect } from 'react'
import { CheckInData, EmotionType } from '../../types'
import { Heart } from 'lucide-react'

interface CheckInSectionProps {
  checkIn: CheckInData
  onUpdate: (checkIn: CheckInData) => void
}

export function CheckInSection({ checkIn, onUpdate }: CheckInSectionProps) {
  const emotionOptions: { key: EmotionType; label: string }[] = [
    { key: 'happy', label: 'Happy' },
    { key: 'excited', label: 'Excited' },
    { key: 'tender', label: 'Tender' },
    { key: 'sad', label: 'Sad' },
    { key: 'angry', label: 'Angry' },
    { key: 'scared', label: 'Scared' }
  ]

  // Local state for emotions - initialize from props
  const [localEmotions, setLocalEmotions] = useState(checkIn.emotions || [])
  const [localFeeling, setLocalFeeling] = useState(checkIn.feeling || '')

  // Update local state when props change (on page load/navigation)
  useEffect(() => {
    console.log('CheckIn: useEffect for emotions triggered')
    console.log('CheckIn: Received checkIn.emotions:', checkIn.emotions)
    console.log('CheckIn: checkIn.emotions type:', typeof checkIn.emotions)
    console.log('CheckIn: checkIn.emotions isArray:', Array.isArray(checkIn.emotions))
    console.log('CheckIn: Setting localEmotions to:', checkIn.emotions || [])
    setLocalEmotions(checkIn.emotions || [])
  }, [checkIn.emotions])

  useEffect(() => {
    console.log('CheckIn: useEffect for feeling triggered')
    console.log('CheckIn: Received checkIn.feeling:', checkIn.feeling)
    console.log('CheckIn: Setting localFeeling to:', checkIn.feeling || '')
    setLocalFeeling(checkIn.feeling || '')
  }, [checkIn.feeling])

  const handleEmotionToggle = (emotion: EmotionType) => {
    const newEmotions = localEmotions.includes(emotion)
      ? localEmotions.filter(e => e !== emotion)
      : [...localEmotions, emotion]
    
    setLocalEmotions(newEmotions)
    
    console.log('CheckIn: Emotion toggled:', emotion)
    console.log('CheckIn: New emotions:', newEmotions)
    
    // Update parent immediately with new emotions - SIMPLIFIED APPROACH
    onUpdate({ emotions: newEmotions, feeling: localFeeling })
  }

  const handleFeelingChange = (value: string) => {
    setLocalFeeling(value)
    // Update parent immediately on change - SIMPLIFIED APPROACH
    onUpdate({ emotions: localEmotions, feeling: value })
  }

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-700">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Heart className="w-5 h-5 text-slate-400" />
        Check In
      </h3>
      <p className="text-green-200 text-sm mb-6">
        How are you feeling today?
      </p>

      {/* Emotion Checkboxes */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-slate-200 mb-3">
          Select your emotions:
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {emotionOptions.map((emotion) => (
            <label 
              key={emotion.key} 
              className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 hover:bg-slate-700/30 ${
                localEmotions.includes(emotion.key) 
                  ? 'border-slate-400 bg-slate-700/50' 
                  : 'border-slate-600/50 bg-transparent'
              }`}
            >
              <input
                type="checkbox"
                checked={localEmotions.includes(emotion.key)}
                onChange={() => handleEmotionToggle(emotion.key)}
                className="w-4 h-4 text-slate-400 border-2 border-slate-500 rounded focus:ring-slate-400 focus:ring-2"
              />
              <span 
                className={`font-medium ${
                  localEmotions.includes(emotion.key) 
                    ? 'text-white' 
                    : 'text-slate-300'
                }`}
              >
                {emotion.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Feeling Text Area */}
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">
          How are you feeling? (optional)
        </label>
        <textarea
          value={localFeeling}
          onChange={(e) => handleFeelingChange(e.target.value)}
          placeholder="Describe how you're feeling today..."
          className="w-full px-4 py-3 border-2 border-slate-600/50 rounded-lg bg-slate-700/60 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors duration-200 resize-none"
          rows={3}
        />
      </div>
    </div>
  )
}