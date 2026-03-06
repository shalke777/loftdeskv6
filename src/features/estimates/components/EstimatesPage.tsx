import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useCompanyId } from '@/features/auth/hooks/useAuth'
import { useCreateEstimate, useDeleteEstimate, useEstimates, useUpdateEstimate } from '@/features/estimates/hooks/useEstimates'
import { useCreateInvoiceFromEstimate } from '@/features/invoices/hooks/useInvoices'
import { Modal } from '@/shared/ui/Modal/Modal'
import { Spinner } from '@/shared/ui/Spinner/Spinner'
import { EmptyState } from '@/shared/ui/EmptyState/EmptyState'
import { EstimateCard } from '@/features/estimates/components/EstimateCard'
import { EstimateForm } from '@/features/estimates/components/EstimateModal/EstimateForm'
import { useCreateProjectFromEstimate } from '@/features/projects/hooks/useProjects'
import { useEstimateToContract } from '@/workflows/estimate-to-contract/useEstimateToContract'
import { useCan, useFeatureAccess } from '@/features/auth/hooks/usePermissions'
import { PortalLinksCard } from '@/features/portal/components/PortalLinksCard'
import { formatCurrency } from '@/shared/lib/formatters'
import type { Estimate } from '@/entities/estimate/model'

export function EstimatesPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Estimate | null>(null)
  const companyId = useCompanyId()
  const { data, isLoading } = useEstimates()
  const createEstimate = useCreateEstimate()
  const updateEstimate = useUpdateEstimate()
  const deleteEstimate = useDeleteEstimate()
  const estimateToContract = useEstimateToContract()
  const estimateToInvoice = useCreateInvoiceFromEstimate()
  const estimateToProject = useCreateProjectFromEstimate()
  const canCreate = useCan('estimates.create')
  const canDelete = useCan('estimates.delete')
  const canConvert = useCan('estimates.convert')
  const canUsePortal = useFeatureAccess('portal')
  const accepted = data?.filter((item) => item.status === 'accepted') ?? []
  const openEstimates = data?.filter((item) => item.status !== 'rejected') ?? []
  const pipeline = openEstimates.reduce((s, e) => s + e.total_gross, 0)

  async function submit(input: any) {
    if (editing) await updateEstimate.mutateAsync({ id: editing.id, input })
    else await createEstimate.mutateAsync(input)
    setEditing(null)
    setOpen(false)
  }

  return (
    <div className="page-list">
      <header className="page-list__head">
        <h1 className="page-list__title">Wyceny</h1>
        <p className="page-list__sub">{openEstimates.length} otwarte · {formatCurrency(pipeline)} w pipeline</p>
      </header>

      {isLoading ? <Spinner /> : null}
      {!isLoading && !data?.length ? <EmptyState title="Brak wycen" description="Dodaj pierwszą wycenę klikając +" /> : null}

      <div className="page-list__cards">
        {data?.map((estimate) => (
          <EstimateCard
            key={estimate.id}
            estimate={estimate}
            onEdit={(item) => { setEditing(item); setOpen(true) }}
            onDelete={canDelete ? (id) => deleteEstimate.mutate(id) : undefined}
            onCreateContract={canConvert ? (id) => estimateToContract.mutate(id) : undefined}
            onCreateInvoice={canConvert ? (id) => estimateToInvoice.mutate(id) : undefined}
            onCreateProject={canConvert ? (id) => estimateToProject.mutate(id) : undefined}
          />
        ))}
      </div>

      {canUsePortal && accepted.length > 0 ? (
        <details className="collapsible" style={{ marginTop: 12 }}>
          <summary>Portal klienta</summary>
          <div className="collapsible__body">
            <PortalLinksCard estimate={accepted[0]} />
          </div>
        </details>
      ) : null}

      {canCreate ? (
        <button className="fab" onClick={() => { setEditing(null); setOpen(true) }} aria-label="Nowa wycena">
          <Plus size={22} />
        </button>
      ) : null}

      {canCreate ? <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edytuj wycenę' : 'Nowa wycena'}><EstimateForm companyId={companyId} initialEstimate={editing} onSubmit={submit} /></Modal> : null}
    </div>
  )
}
