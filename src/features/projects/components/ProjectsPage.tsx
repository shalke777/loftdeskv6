import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/ui/Button/Button'
import { EmptyState } from '@/shared/ui/EmptyState/EmptyState'
import { Modal } from '@/shared/ui/Modal/Modal'
import { Spinner } from '@/shared/ui/Spinner/Spinner'
import { useCompanyId } from '@/features/auth/hooks/useAuth'
import { useCreateInvoiceFromProject, useCreateProject, useDeleteProject, useProjects, useUpdateProject, useUpdateProjectStatus } from '@/features/projects/hooks/useProjects'
import { ProjectCard } from '@/features/projects/components/ProjectCard'
import { ProjectForm } from '@/features/projects/components/ProjectModal/ProjectForm'
import { KanbanBoard } from '@/features/projects/components/KanbanBoard'
import type { Project } from '@/entities/project/model'
import { ProjectDetail } from '@/features/projects/components/ProjectDetail'
import { useCan } from '@/features/auth/hooks/usePermissions'

export function ProjectsPage() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Project | null>(null)
  const [editing, setEditing] = useState<Project | null>(null)
  const companyId = useCompanyId()
  const { data, isLoading } = useProjects()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const updateStatus = useUpdateProjectStatus()
  const createInvoice = useCreateInvoiceFromProject()
  const deleteProject = useDeleteProject()
  const summary = useMemo(() => ({ active: data?.filter((item) => item.status === 'active').length ?? 0, offer: data?.filter((item) => item.status === 'offer').length ?? 0, done: data?.filter((item) => item.status === 'done').length ?? 0 }), [data])
  const canCreate = useCan('projects.create')
  const canDelete = useCan('projects.delete')
  const canUpdateStatus = useCan('projects.updateStatus')

  async function submit(input: any) {
    if (editing) await updateProject.mutateAsync({ id: editing.id, input })
    else await createProject.mutateAsync(input)
    setEditing(null); setOpen(false)
  }

  return (
    <div className="page-list">
      <header className="page-list__head">
        <h1 className="page-list__title">Projekty</h1>
        <p className="page-list__sub">{summary.active} aktywnych · {summary.offer} ofert · {summary.done} gotowych</p>
      </header>
      {selected ? <ProjectDetail project={selected} onEdit={(item) => { setEditing(item); setOpen(true) }} onCreateInvoice={(id) => createInvoice.mutate(id)} /> : null}
      {isLoading ? <Spinner /> : null}
      {!isLoading && !data?.length ? <EmptyState title="Brak projektów" description="Dodaj pierwszy projekt klikając +" /> : null}
      {data?.length ? <KanbanBoard projects={data} /> : null}
      <div className="page-list__cards">{data?.map((project) => <ProjectCard key={project.id} project={project} onOpen={setSelected} onEdit={(item) => { setEditing(item); setOpen(true) }} onStatusChange={(id, status) => updateStatus.mutate({ id, status })} onCreateInvoice={(id) => createInvoice.mutate(id)} onDelete={(id) => deleteProject.mutate(id)} canAdvance={canUpdateStatus} canDelete={canDelete} />)}</div>
      {canCreate ? <button className="fab" onClick={() => { setEditing(null); setOpen(true) }} aria-label="Nowy projekt"><Plus size={22} /></button> : null}
      {canCreate ? <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edytuj projekt' : 'Nowy projekt'}><ProjectForm companyId={companyId} initialProject={editing} onSubmit={submit} /></Modal> : null}
    </div>
  )
}
