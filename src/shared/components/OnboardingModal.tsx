import React, { useState, useEffect, useRef } from 'react'
import { Sparkles, FolderKanban, CheckSquare, Library, FileText, Search, ShieldCheck, Check, ArrowRight, ArrowLeft, X } from 'lucide-react'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { toast } from '@/shared/ui'
import { cn } from '@/shared/utils/cn'

interface OnboardingStepData {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string; size?: number }>
  iconColor: string
  iconBg: string
}

const STEPS: OnboardingStepData[] = [
  {
    title: 'Welcome to VYRA',
    description: 'VYRA is your Visual Workflow & Resource Architecture system — a local-first workspace for managing projects, tasks, notes, inspirations, components, and prompts.',
    icon: Sparkles,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
  },
  {
    title: 'Start with Projects',
    description: 'Every workflow begins with a project. Track status, progress, deadlines, tasks, notes, and resources in one organized workspace.',
    icon: FolderKanban,
    iconColor: 'text-secondary',
    iconBg: 'bg-secondary/10',
  },
  {
    title: 'Plan and Track Work',
    description: 'Create tasks, assign them to projects, set priorities, track due dates, and monitor project progress automatically.',
    icon: CheckSquare,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
  },
  {
    title: 'Save What You Can Reuse',
    description: 'Store inspirations, reusable components, code snippets, prompts, and visual references in one searchable library.',
    icon: Library,
    iconColor: 'text-accent',
    iconBg: 'bg-accent/10',
  },
  {
    title: 'Document Your Process',
    description: 'Write project notes, requirements, revisions, feedback, and ideas. Add images, save notes, and export them as PDF, DOCX, Markdown, or TXT.',
    icon: FileText,
    iconColor: 'text-warning',
    iconBg: 'bg-warning/10',
  },
  {
    title: 'Find Anything Fast',
    description: 'Use global search or press ⌘K (Ctrl + K) to quickly find projects, tasks, notes, and library items across your workspace.',
    icon: Search,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
  },
  {
    title: 'Private by Default',
    description: 'VYRA stores all your data locally using IndexedDB. You can protect your workspace with App Lock and export encrypted backups.',
    icon: ShieldCheck,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
  },
  {
    title: 'Your Workspace Is Ready',
    description: 'Start by creating your first project or exploring the dashboard. You can always restart this tutorial from Settings > Help & Documentation.',
    icon: Check,
    iconColor: 'text-secondary',
    iconBg: 'bg-secondary/10',
  },
]

export function OnboardingModal() {
  const { settings, update } = useSettingsStore()
  const [currentStep, setCurrentStep] = useState(0)
  const modalRef = useRef<HTMLDivElement>(null)

  // Ensure all hooks run before conditionally returning

  useEffect(() => {
    // Focus trapping: focus the modal on mount
    if (modalRef.current) {
      modalRef.current.focus()
    }
  }, [])

  // Keyboard navigation & Escape key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handleBack()
      } else if (e.key === 'Escape') {
        handleSkip()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep])

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      update({ lastTutorialStep: nextStep })
    } else {
      handleFinish()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      update({ lastTutorialStep: prevStep })
    }
  }

  const handleFinish = async () => {
    await update({
      hasCompletedOnboarding: true,
      onboardingCompletedAt: new Date().toISOString(),
    })
    toast.success("Welcome aboard! VYRA is ready to go.")
  }

  const handleSkip = async () => {
    await update({
      hasCompletedOnboarding: true,
      onboardingCompletedAt: new Date().toISOString(),
    })
    toast.info("Tutorial skipped. You can restart it anytime from Settings > Help & Documentation.")
  }

  const step = STEPS[currentStep]
  const IconComponent = step.icon

  // Conditional rendering at the very end ensures all hooks execute first
  if (settings.hasCompletedOnboarding) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div
        ref={modalRef}
        tabIndex={0}
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className={cn(
          "w-full max-w-lg overflow-hidden outline-none",
          "backdrop-blur-lg bg-surface/95 border border-border/50 rounded-2xl shadow-2xl",
          "flex flex-col text-center transition-all duration-300 transform scale-100"
        )}
      >
        {/* Header Close/Skip Button */}
        <div className="flex justify-end p-4 pb-0">
          <button
            onClick={handleSkip}
            className="text-text-3 hover:text-text-1 text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-surface-2 transition-all flex items-center gap-1"
            aria-label="Skip tutorial"
          >
            Skip <X size={14} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 px-6 pb-6 pt-2 flex flex-col items-center">
          {/* Animated Icon Container */}
          <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-border/20 transition-all transform scale-110", step.iconBg)}>
            <IconComponent className={cn("w-8 h-8", step.iconColor)} />
          </div>

          {/* Title */}
          <h2 id="onboarding-title" className="text-xl font-bold text-text-1 mb-3">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-sm text-text-2 max-w-sm leading-relaxed mb-8 min-h-[72px]">
            {step.description}
          </p>

          {/* Progress Indicators */}
          <div className="flex items-center gap-1.5 mb-8" aria-label={`Step ${currentStep + 1} of ${STEPS.length}`}>
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentStep(idx)
                  update({ lastTutorialStep: idx })
                }}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  currentStep === idx ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-border-2"
                )}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="w-full flex items-center justify-between gap-3">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={cn(
                "flex items-center gap-2 px-4 h-10 text-sm font-medium rounded-xl border border-border bg-surface hover:bg-surface-2 transition-all text-text-2 hover:text-text-1",
                currentStep === 0 && "opacity-0 pointer-events-none"
              )}
            >
              <ArrowLeft size={16} /> Back
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-5 h-10 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all hover-magnetic"
              >
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex items-center gap-2 px-5 h-10 text-sm font-semibold rounded-xl bg-success text-white hover:bg-success/90 shadow-md shadow-success/20 hover:shadow-success/30 transition-all hover-magnetic"
              >
                Finish <Check size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
