import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/ui/Button/Button'
import { EmptyState } from '@/shared/ui/EmptyState/EmptyState'
import { Modal } from '@/shared/ui/Modal/Modal'
import { Spinner } from '@/shared/ui/Spinner/Spinner'
import { useCompanyId } from '@/features/auth/hooks/useAuth'
import { useContracts, useCreateContract, useDeleteContract, useSignContract, useUpdateContract } from '@/features/contracts/hooks/useContracts'
import { ContractCard } from '@/features/contracts/components/ContractCard'
import { ContractForm } from '@/features/contracts/components/ContractModal/ContractForm'
import { ContractDetail } from '@/features/contracts/components/ContractDetail'
import type { Contract } from '@/entities/contract/model'
import { useCan } from '@/features/auth/hooks/usePermissions'

export function ContractsPage() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Contract | null>(null)
  const [editing, setEditing] = useState<Contract | null>(null)
  const companyId = useCompanyId()
  const { data, isLoading } = useContracts()
  const createContract = useCreateContract(); const updateContract = useUpdateContract(); const signContract = useSignContract(); const deleteContract = useDeleteContract()
  const signedCount = useMemo(() => data?.filter((item) => item.status === 'signed').length ?? 0, [data])
  const canCreate = useCan('contracts.create'); const canDelete = useCan('contracts.delete'); const canSign = useCan('contracts.sign')
  async function submit(input: any) { if (editing) await updateContract.mutateAsync({ id: editing.id, input }); else await createContract.mutateAsync(input); setEditing(null); setOpen(false) }

  return (
    <div className="page-list">
      <header className="page-list__head">
        <h1 className="page-list__title">Umowy</h1>
        <p className="page-list__sub">{signedCount} podpisanych · {(data?.length ?? 0) - signedCount} w przygotowaniu</p>
      </header>
      {selected ? <ContractDetail contract={selected} onEdit={(item) => { setEditing(item); setOpen(true) }} onSign={(id) => signContract.mutate(id)} canSign={canSign} /> : null}
      {isLoading ? <Spinner /> : null}
      {!isLoading && !data?.length ? <EmptyState title="Brak umów" description="Dodaj pierwszą umowę klikając +" /> : null}
      <div className="page-list__cards">{data?.map((contract) => <ContractCard key={contract.id} contract={contract} onEdit={(item) => { setEditing(item); setOpen(true) }} onOpen={setSelected} onDelete={(id) => deleteContract.mutate(id)} canDelete={canDelete} />)}</div>
      {canCreate ? <button className="fab" onClick={() => { setEditing(null); setOpen(true) }} aria-label="Nowa umowa"><Plus size={22} /></button> : null}
      {canCreate ? <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edytuj umowę' : 'Nowa umowa'}><ContractForm companyId={companyId} initialContract={editing} onSubmit={submit} /></Modal> : null}
    </div>
  )
}
