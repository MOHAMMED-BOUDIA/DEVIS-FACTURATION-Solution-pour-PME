import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Users, Trash2 } from 'lucide-react';
import { Button, Card, EmptyState, Table, TableCell, TableRow, TableSkeleton } from '../components/UI';
import Modal from '../components/Modal';
import api from '../api/client';
import useAuthStore from '../store/authStore';
import { useToast } from '../components/ToastProvider';

export default function Clients() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { pushToast } = useToast();
  const hasCompany = Boolean(
    user?.companyId
    || user?.company?._id
    || (typeof user?.company === 'string' ? user.company : null)
  );
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('new') === '1');
  const [formError, setFormError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: { street: '', city: '' },
    taxNumber: ''
  });

  const selectedClientId = searchParams.get('clientId');
 

  const fetchClients = useCallback(async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data.data || []);
    } catch {
      pushToast('Erreur chargement clients', 'error');
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const closeModal = () => {
    setIsModalOpen(false);
    if (searchParams.get('new') === '1') {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('new');
      setSearchParams(nextParams);
    }
  };

  const selectClient = (clientId) => {
    const nextParams = new URLSearchParams(searchParams);
    if (clientId) {
      nextParams.set('clientId', clientId);
    } else {
      nextParams.delete('clientId');
    }
    setSearchParams(nextParams);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError(null);
    // Client-side validation: require all fields before sending to API
    const { name, email, phone, taxNumber, address } = newClient;
    if (!name || !email || !phone || !taxNumber || !address?.street || !address?.city) {
      const missing = [];
      if (!name) missing.push('Nom');
      if (!email) missing.push('Email');
      if (!phone) missing.push('Telephone');
      if (!taxNumber) missing.push('ICE');
      if (!address?.street) missing.push('Adresse (rue)');
      if (!address?.city) missing.push('Adresse (ville)');
      const message = `Veuillez renseigner les champs obligatoires: ${missing.join(', ')}`;
      setFormError({ message });
      pushToast(message, 'error');
      return;
    }
    try {
      await api.post('/clients', newClient);
      pushToast('Client cree avec succes', 'success');
      closeModal();
      setNewClient({ name: '', email: '', phone: '', address: { street: '', city: '' }, taxNumber: '' });
      fetchClients();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Erreur lors de la creation';
      setFormError({ message });
      pushToast(message, 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Clients</h2>
          <p className="text-sm text-[var(--pf-neutral-600)]">Base contacts de votre entreprise.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Nouveau client
        </Button>
      </div>

      <Card>
        {!hasCompany ? (
          <EmptyState
            icon={Users}
            title="Entreprise non configuree"
            description="Vous devez configurer votre entreprise avant d'ajouter des clients."
            ctaLabel="Configurer entreprise"
            onCta={() => navigate('/settings?tab=entreprise')}
          />
        ) : (
          <>
            
            {clients.length === 0 && !loading ? (
              <EmptyState
                icon={Users}
                title="Aucun client"
                description="Commencez par ajouter votre premier client."
                ctaLabel="Creer premier client"
                onCta={() => setIsModalOpen(true)}
              />
            ) : (
              <Table
                columns={[
                  { key: 'name', label: 'Client' },
                  { key: 'email', label: 'Email' },
                  { key: 'phone', label: 'Telephone' },
                  { key: 'tax', label: 'ICE' },
                  { key: 'actions', label: '' }
                ]}
              >
                {loading ? (
                  <TableSkeleton colSpan={5} rows={5} />
                ) : (
                  clients.map((client, index) => (
                    <TableRow
                      key={client._id}
                      zebra={index % 2 === 1}
                      onClick={() => selectClient(client._id)}
                      className={selectedClientId === client._id ? 'ring-1 ring-[var(--pf-primary)] inset' : ''}
                    >
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.email || '-'}</TableCell>
                      <TableCell>{client.phone || '-'}</TableCell>
                      <TableCell>{client.taxNumber || '-'}</TableCell>
                      <TableCell align="right">
                        {user?.role === 'admin' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(client);
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </Table>
            )}
          </>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Nouveau client">
        <form onSubmit={handleCreate} className="space-y-4 p-6">
          {formError && <div className="rounded-[var(--pf-radius-md)] bg-[var(--pf-danger-bg)] p-3 text-sm text-[var(--pf-danger)]">{formError.message}</div>}
          <input
            className="input-modern"
            placeholder="Nom"
            value={newClient.name}
            onChange={(e) => setNewClient((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <input
            className="input-modern"
            placeholder="Email"
            value={newClient.email}
            onChange={(e) => setNewClient((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <input
            className="input-modern"
            placeholder="Telephone"
            value={newClient.phone}
            onChange={(e) => setNewClient((prev) => ({ ...prev, phone: e.target.value }))}
            required
          />
          <input
            className="input-modern"
            placeholder="ICE"
            value={newClient.taxNumber}
            onChange={(e) => setNewClient((prev) => ({ ...prev, taxNumber: e.target.value }))}
            required
          />
          <input
            className="input-modern"
            placeholder="Adresse - Rue"
            value={newClient.address.street}
            onChange={(e) => setNewClient((prev) => ({ ...prev, address: { ...prev.address, street: e.target.value } }))}
            required
          />
          <input
            className="input-modern"
            placeholder="Adresse - Ville"
            value={newClient.address.city}
            onChange={(e) => setNewClient((prev) => ({ ...prev, address: { ...prev.address, city: e.target.value } }))}
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Modal>
      {/* Delete confirmation modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmer la suppression">
        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-700">Vous êtes sur le point de supprimer le client suivant :</p>
          <p className="text-lg font-bold text-slate-900">{deleteTarget?.name}</p>
          <p className="text-sm text-slate-500">La suppression est temporaire et peut être restaurée par un administrateur.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteLoading}
              onClick={async () => {
                if (!deleteTarget) return;
                setDeleteLoading(true);
                try {
                  await api.delete(`/clients/${deleteTarget._id}`);
                  pushToast('Client supprime', 'success');
                  setDeleteTarget(null);
                  fetchClients();
                } catch (err) {
                  const message = err.response?.data?.message || 'Erreur suppression client';
                  pushToast(message, 'error');
                } finally {
                  setDeleteLoading(false);
                }
              }}
            >
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
