import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderKanban, CheckSquare, FileText, Library } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { ProjectForm } from '@/features/projects/components/ProjectForm'
import { TaskForm } from '@/features/tasks/components/TaskForm'
import { useProjectStore } from '@/features/projects/store/projectStore'
import { LibraryItemForm } from '@/features/library/components/LibraryItemForm'

export function QuickCreate() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [showProject, setShowProject] = useState(false)
  const [showTask, setShowTask] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const projects = useProjectStore(s => s.projects)
  const defaultProjectId = projects[0]?.id || ''

  const handleMenuClick = (action: () => void) => {
    setOpen(false)
    action()
  }

  return (
    <>
      <div className="relative">
        <Button 
          size="sm" 
          leftIcon={<Plus size={14} />} 
          onClick={() => setOpen(!open)}
          className="shadow-sm"
        >
          Create
        </Button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface-2 border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
              <button 
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-text-1 hover:bg-surface-3 transition-colors text-left"
                onClick={() => handleMenuClick(() => setShowProject(true))}
              >
                <FolderKanban size={14} className="text-primary" /> Project
              </button>
              <button 
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-text-1 hover:bg-surface-3 transition-colors text-left"
                onClick={() => handleMenuClick(() => setShowTask(true))}
              >
                <CheckSquare size={14} className="text-success" /> Task
              </button>
              <button 
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-text-1 hover:bg-surface-3 transition-colors text-left"
                onClick={() => handleMenuClick(() => navigate('/notes?new=true'))}
              >
                <FileText size={14} className="text-info" /> Note
              </button>
              <button 
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-text-1 hover:bg-surface-3 transition-colors text-left"
                onClick={() => handleMenuClick(() => setShowLibrary(true))}
              >
                <Library size={14} className="text-warning" /> Library Item
              </button>
            </div>
          </>
        )}
      </div>

      <ProjectForm open={showProject} onClose={() => setShowProject(false)} />
      <TaskForm open={showTask} onClose={() => setShowTask(false)} projectId={defaultProjectId} />
      <LibraryItemForm open={showLibrary} onClose={() => setShowLibrary(false)} />
    </>
  )
}
