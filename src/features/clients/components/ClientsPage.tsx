import { useState } from 'react'
import { Plus, Phone, MapPin } from 'lucide-react'
import { Button } from '@/shared/ui/Button/Button'
import { Spinner } from '@/shared/ui/Spinner/Spinner'
import { EmptyState } from '@/shared/ui/EmptyState/EmptyState'
import { useClients, useDeleteClient } from '@/features/clients/hooks/useClients'
import { ClientModal } from '@/features/clients/components/ClientModal'
import { useCan } from '@/features/auth/hooks/usePermissions'
import type { Client } from '@/entities/client/model'

export function ClientsPage() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Client | null>(null)
  const { data, isLoading } = useClients()
  const deleteClient = useDeleteClient()
  const canCreate = useCan('clients.create')
  const canDelete = useCan('clients.delete')

  return (
    <div className="page-list">
      <header className="page-list__head">
        <h1 className="page-list__title">Kontrahenci</h1>
        <p className="page-list__sub">{data?.length ?? 0} klientów</p>
      </header>
      {isLoading ? <Spinner /> : null}
      {!isLoading && !data?.length ? <EmptyState title="Brak kontrahentów" description="Dodaj pierwszego klienta klikając +" /> : null}
      <div className="page-list__cards">
        {data?.map((client) => (
          <div key={client.id} className="ecard">
            <div className="ecard__head"><span className="ecard__title">{client.name}</span>{client.nip ? <span className="ecard__badge" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' }}>NIP {client.nip}</span> : null}</div>
            {client.contact_person ? <p className="ecard__client">{client.contact_person}</p> : null}
            <p className="ecard__client" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {client.phone ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Phone size={14} />{client.phone}</span> : null}
              {(client.city || client.address) ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MapPin size={14} />{`${client.postal_code || ''} ${client.city || ''}, ${client.address || ''}`.trim()}</span> : null}
            </p>
            <div className="ecard__actions">
              <Button size="sm" variant="ghost" onClick={() => { setSelected(client); setOpen(true) }}>Edytuj</Button>
              {canDelete ? <Button size="sm" variant="danger" onClick={() => deleteClient.mutate(client.id)}>Usuń</Button> : null}
            </div>
          </div>
        ))}
      </div>
      {canCreate ? <button className="fab" onClick={() => { setSelected(null); setOpen(true) }} aria-label="Dodaj kontrahenta"><Plus size={22} /></button> : null}
      {canCreate ? <ClientModal open={open} onClose={() => setOpen(false)} initialClient={selected} /> : null}
    </div>
  )
}
