import { useState, useEffect } from 'react'
import { SOAPData } from '@/types'
import { BibleIntegration } from './BibleIntegration'
import { BookOpen, Target, Heart, Lightbulb } from 'lucide-react'

interface SOAPSectionProps {
  soap: SOAPData
  onUpdate: (soap: SOAPData) => void
  readingPlan?: {
    planId: string
    planName: string
    currentDay: number
    totalDays: number
    startDate: string
    completedDays: number[]
  }
  onStartReadingPlan?: (plan: any, bibleId?: string) => void
  onUpdateReadingPlan?: (updatedReadingPlan: any) => void
  onLoadTodaysDevotion?: (planId: string) => void
  onAdvanceToNextDay?: () => void
  onClosePlan?: () => void
  onStartNewPlan?: () => void
  onRestartPlan?: () => void
}

export function SOAPSection({ 
  soap, 
  onUpdate, 
  readingPlan, 
  onStartReadingPlan, 
  onUpdateReadingPlan, 
  onLoadTodaysDevotion, 
  onAdvanceToNextDay, 
  onClosePlan, 
  onStartNewPlan, 
  onRestartPlan 
}: SOAPSectionProps) {
  const [localSOAP, setLocalSOAP] = useState(soap || {
    scripture: '',
    observation: '',
    application: '',
    prayer: ''
  })

  useEffect(() => {
    setLocalSOAP(soap || {
      scripture: '',
      observation: '',
      application: '',
      prayer: ''
    })
  }, [soap])

  const handleInputChange = (field: keyof SOAPData, value: string) => {
    const newSOAP = { ...localSOAP, [field]: value }
    setLocalSOAP(newSOAP)
    // Update parent component but don't auto-save on every keystroke
    onUpdate(newSOAP)
  }

  const handleInputBlur = (field: keyof SOAPData) => {
    // Update parent component when user finishes typing
    console.log('SOAP: Input blur on field:', field, 'value:', localSOAP[field])
    onUpdate(localSOAP)
    // Auto-save when user moves away from field
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('triggerSave'))
    }, 500)
  }

  const handleVerseSelect = (verse: any) => {
    console.log('SOAP: Received verse selection:', verse);
    const newSOAP = { 
      ...localSOAP, 
      scripture: verse.reference && verse.content ? `${verse.reference} - ${verse.content}` : '' 
    }
    setLocalSOAP(newSOAP)
    onUpdate(newSOAP)
    // Trigger auto-save
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('triggerSave'))
    }, 100)
  }

  const soapSections = [
    {
      key: 'scripture' as keyof SOAPData,
      title: 'Scripture',
      icon: BookOpen,
      subtitle: 'Today\'s Bible passage',
      placeholder: 'Enter the Bible verse or passage you\'re studying today...',
      color: 'green'
    },
    {
      key: 'observation' as keyof SOAPData,
      title: 'Observation',
      icon: Lightbulb,
      subtitle: 'What does the passage say?',
      placeholder: 'What do you notice about this passage? What stands out? What context is important?',
      color: 'blue'
    },
    {
      key: 'application' as keyof SOAPData,
      title: 'Application',
      icon: Target,
      subtitle: 'How does this apply to your life?',
      placeholder: 'How can you apply this passage to your life today? What changes will you make?',
      color: 'purple'
    },
    {
      key: 'prayer' as keyof SOAPData,
      title: 'Prayer',
      icon: Heart,
      subtitle: 'Your response to God',
      placeholder: 'How will you pray based on this passage? What are you asking God for?',
      color: 'orange'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Bible Integration Component */}
      <BibleIntegration 
        onVerseSelect={handleVerseSelect}
        selectedVerse={localSOAP.scripture && localSOAP.scripture.includes(' - ') ? {
          id: 'selected',
          reference: localSOAP.scripture.split(' - ')[0] || '',
          content: localSOAP.scripture.split(' - ')[1] || '',
          copyright: 'Bible'
        } : undefined}
        onStartReadingPlan={onStartReadingPlan}
        currentReadingPlan={readingPlan}
      />

      {/* SOAP Study Form */}
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-700">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-2">
            S.O.A.P. Bible Study
          </h3>
          <p className="text-green-200 text-lg">
            Scripture • Observation • Application • Prayer
          </p>
          <div className="mt-2 text-sm text-green-300">
            "All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness" - 2 Timothy 3:16
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {soapSections.map((section) => {
          const IconComponent = section.icon
          return (
            <div key={section.key} className="border-l-4 border-l-green-500 bg-slate-700/50 rounded-r-lg p-4">
              <h4 className="font-bold text-lg mb-2 text-white flex items-center gap-2">
                {IconComponent && <IconComponent className="w-5 h-5 text-slate-400" />}
                {section.title}
              </h4>
            <p className="text-green-200 text-sm mb-4">
              {section.subtitle}
            </p>
            
            <textarea
              value={localSOAP[section.key] || ''}
              onChange={(e) => handleInputChange(section.key, e.target.value)}
              onBlur={() => handleInputBlur(section.key)}
              onKeyUp={() => {
                // Only auto-save after user stops typing for 3 seconds
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('triggerSave'))
                }, 3000)
              }}
              className="w-full px-4 py-3 border-2 border-slate-600/50 rounded-lg bg-slate-700/60 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors duration-200 resize-none"
              placeholder={section.placeholder}
              rows={4}
            />
          </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}