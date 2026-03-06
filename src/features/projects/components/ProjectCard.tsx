import type { Project } from '@/entities/project/model'
import { Badge } from '@/shared/ui/Badge/Badge'
import { Button } from '@/shared/ui/Button/Button'
import { formatCurrency } from '@/shared/lib/formatters'
import { Select } from '@/shared/ui/Select/Select'

const STATUS_LABEL: Record<string, string> = { offer: 'Oferta', active: 'Aktywny', done: 'Zakończony', cancelled: 'Anulowany' }
function variant(status: Project['status']) { if (status === 'done') return 'success'; if (status === 'cancelled') return 'danger'; if (status === 'active') return 'warning'; return 'default' }

export function ProjectCard({ project, onStatusChange, onDelete, onOpen, onEdit, onCreateInvoice, canAdvance = true, canDelete = true }: { project: Project; onStatusChange: (id: string, status: Project['status']) => void; onDelete: (id: string) => void; onOpen: (project: Project) => void; onEdit?: (project: Project) => void; onCreateInvoice?: (id: string) => void; canAdvance?: boolean; canDelete?: boolean }) {
  return (
    <div className="ecard" onClick={() => onOpen(project)} style={{ cursor: 'pointer' }}>
      <div className="ecard__head"><span className="ecard__title">{project.number} — {project.name}</span><Badge variant={variant(project.status)}>{STATUS_LABEL[project.status] || project.status}</Badge></div>
      {project.address ? <p className="ecard__client">{project.address}</p> : null}
      <p className="ecard__amount">{project.budget ? formatCurrency(project.budget) : '—'}</p>
      <p className="ecard__client">Koszty: {project.costs ? formatCurrency(project.costs) : '0,00 zł'}</p>
      {canAdvance ? <div onClick={(e) => e.stopPropagation()}><Select label="Status" value={project.status} onChange={(e) => onStatusChange(project.id, e.target.value as Project['status'])} options={[{ value: 'offer', label: 'W ofercie' }, { value: 'active', label: 'Aktywny' }, { value: 'done', label: 'Zakończony' }, { value: 'cancelled', label: 'Anulowany' }]} /></div> : null}
      <div className="ecard__actions" onClick={(e) => e.stopPropagation()}>{onEdit ? <Button size="sm" variant="ghost" onClick={() => onEdit(project)}>Edytuj</Button> : null}{onCreateInvoice ? <Button size="sm" variant="ghost" onClick={() => onCreateInvoice(project.id)}>Generuj FV</Button> : null}{canDelete ? <Button size="sm" variant="danger" onClick={() => onDelete(project.id)}>Usuń</Button> : null}</div>
    </div>
  )
}
