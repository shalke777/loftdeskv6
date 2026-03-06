import type { Project } from '@/entities/project/model'
import { Badge } from '@/shared/ui/Badge/Badge'
import { Card } from '@/shared/ui/Card/Card'
import { formatCurrency } from '@/shared/lib/formatters'
import { ProjectTimeline } from '@/features/projects/components/ProjectTimeline'
import { ProjectNotes } from '@/features/projects/components/ProjectNotes'
import { ProjectDocuments } from '@/features/projects/components/ProjectDocuments'
import { Button } from '@/shared/ui/Button/Button'
import { useEstimates } from '@/features/estimates/hooks/useEstimates'

export function ProjectDetail({ project, onEdit, onCreateInvoice }: { project: Project | null; onEdit?: (project: Project) => void; onCreateInvoice?: (id: string) => void }) {
  const { data: estimates = [] } = useEstimates()
  if (!project) return null
  const linkedEstimate = estimates.find((item) => item.id === project.estimate_id || item.name === project.name)
  return (
    <div className="grid-3" style={{ alignItems: 'start' }}>
      <Card className="grid-span-2">
        <div className="toolbar"><div><h3>{project.number}</h3><p>{project.name}</p></div><Badge variant={project.status === 'done' ? 'success' : project.status === 'cancelled' ? 'danger' : project.status === 'active' ? 'warning' : 'default'}>{project.status}</Badge></div>
        <p>Powiązana wycena: {linkedEstimate?.number || 'brak'}</p>
        <p>Adres: {project.address || 'brak'}</p>
        <p>Budżet: {project.budget ? formatCurrency(project.budget) : 'nie ustawiono'}</p>
        <p>Koszty: {project.costs ? formatCurrency(project.costs) : '0,00 zł'}</p>
        <p>Marża: {formatCurrency((project.budget || 0) - (project.costs || 0))}</p>
        <p>Start: {project.start_date || 'nie ustawiono'} · Koniec: {project.end_date || 'nie ustawiono'}</p>
        <div className="actions-row">{onEdit ? <Button variant="secondary" onClick={() => onEdit(project)}>Edytuj projekt</Button> : null}{onCreateInvoice ? <Button onClick={() => onCreateInvoice(project.id)}>Generuj fakturę</Button> : null}</div>
        <ProjectTimeline project={project} />
      </Card>
      <div style={{ display: 'grid', gap: 16 }}><ProjectNotes project={project} /><ProjectDocuments project={project} /></div>
    </div>
  )
}
