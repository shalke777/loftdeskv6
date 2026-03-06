import type { Project } from '@/entities/project/model'
import { Card } from '@/shared/ui/Card/Card'

export function ProjectDocuments({ project }: { project: Project }) {
  return (
    <Card>
      <h4>Dokumenty</h4>
      <ul>
        <li>Umowa · {project.number}</li>
        <li>Kosztorys powiązany · {project.name}</li>
        <li>Raport dzienny / odbiór · placeholder v4.4</li>
      </ul>
    </Card>
  )
}
