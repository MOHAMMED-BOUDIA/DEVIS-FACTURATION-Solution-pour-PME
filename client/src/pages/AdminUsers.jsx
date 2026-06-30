import React, { useEffect, useMemo, useState } from 'react';
import { Users, Building2, BarChart3, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button, Card, Table, TableCell, TableRow, TableSkeleton, Badge, SearchableSelect } from '../components/UI';
import api from '../api/client';
import useAuthStore from '../store/authStore';
import Modal from '../components/Modal';
import Input from '../components/ui/Input';

const formatAmount = (value) => `${Number(value || 0).toLocaleString()} DH`;

export default function AdminUsers() {
  const { user, initialized, loading: authLoading } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserLoading, setSelectedUserLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [summary, setSummary] = useState(null);
  const [companyStats, setCompanyStats] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [modalUser, setModalUser] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    companyId: '',
  });

  const isAdmin = user?.role === 'admin';
  const isReady = initialized && !authLoading;

  const refreshUsers = async () => {
    await loadUsersAndCompanyStats();
  };

  const openCreateModal = () => {
    setModalUser(null);
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'user',
      companyId: '',
    });
    setFormError('');
    setModalMode('create');
  };

  const openViewModal = (targetUser) => {
    setModalUser(targetUser);
    setUserForm({
      name: targetUser?.name || '',
      email: targetUser?.email || '',
      password: '',
      role: targetUser?.role || 'user',
      companyId: targetUser?.company?._id || targetUser?.company || '',
    });
    setFormError('');
    setModalMode('view');
  };

  const openEditModal = () => {
    setFormError('');
    setUserForm((current) => ({ ...current, password: '' }));
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setModalUser(null);
    setFormError('');
    setSaving(false);
    setDeleting(false);
  };

  const submitUserForm = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');

    try {
      const payload = {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        companyId: userForm.companyId || undefined,
      };

      if (userForm.password) {
        payload.password = userForm.password;
      }

      if (modalMode === 'create') {
        if (!payload.password) {
          throw new Error('Le mot de passe est requis pour créer un utilisateur.');
        }
        await api.post('/admin/users', payload);
      } else if (modalUser?._id) {
        await api.put(`/admin/users/${modalUser._id}`, payload);
      }

      await refreshUsers();
      closeModal();
    } catch (error) {
      setFormError(error.response?.data?.message || error.message || 'Impossible d\'enregistrer l\'utilisateur.');
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async () => {
    if (!modalUser?._id) return;
    if (!window.confirm(`Supprimer ${modalUser.name} ?`)) return;

    setDeleting(true);
    setFormError('');

    try {
      await api.delete(`/admin/users/${modalUser._id}`);
      await refreshUsers();
      closeModal();
    } catch (error) {
      setFormError(error.response?.data?.message || 'Impossible de supprimer cet utilisateur.');
    } finally {
      setDeleting(false);
    }
  };

  const loadUsersAndCompanyStats = async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const [usersRes, companyStatsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/stats/company'),
      ]);

      const loadedUsers = usersRes.data?.data || usersRes.data?.users || [];
      setUsers(loadedUsers);
      setCompanyStats(companyStatsRes.data?.data || null);

      if (loadedUsers.length > 0) {
        setSelectedUser(loadedUsers[0]);
      }
    } catch (error) {
      setUsers([]);
      setCompanyStats(null);
      setUsersError(error.response?.data?.message || 'Impossible de charger les utilisateurs.');
    } finally {
      setUsersLoading(false);
    }
  };

  const loadUserDetails = async (targetUser) => {
    if (!targetUser?._id) return;

    setDetailsLoading(true);
    try {
      const [clientsRes, summaryRes, userStatsRes] = await Promise.all([
        api.get(`/admin/users/${targetUser._id}/clients`),
        api.get(`/admin/users/${targetUser._id}/summary`),
        api.get(`/admin/users/${targetUser._id}/stats`),
      ]);

      setClients(clientsRes.data?.data || []);
      setSummary(summaryRes.data?.data || null);
      setUserStats(userStatsRes.data?.data || null);
    } catch {
      setClients([]);
      setSummary(null);
      setUserStats(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const viewUser = async (targetUser) => {
    if (!targetUser?._id) return;

    setSelectedUserLoading(true);
    setSelectedUser(targetUser);
    setClients([]);
    setSummary(null);
    setUserStats(null);

    try {
      const response = await api.get(`/admin/users/${targetUser._id}`);
      const loadedUser = response.data?.data || targetUser;
      setSelectedUser(loadedUser);
      openViewModal(loadedUser);
    } catch (error) {
      setUsersError(error.response?.data?.message || 'Impossible de charger la vue utilisateur.');
      openViewModal(targetUser);
    } finally {
      setSelectedUserLoading(false);
    }
  };

  const selectUser = async (targetUser) => {
    if (!targetUser?._id) return;

    setSelectedUser(targetUser);
    setClients([]);
    setSummary(null);
    setUserStats(null);

    await loadUserDetails(targetUser);
  };

  useEffect(() => {
    if (!isReady || !isAdmin) return;
    loadUsersAndCompanyStats();
  }, [isReady, isAdmin]);

  useEffect(() => {
    if (!isReady || !isAdmin || !selectedUser?._id) return;
    loadUserDetails(selectedUser);
  }, [isReady, isAdmin, selectedUser]);

  const perUserCounts = useMemo(() => ({
    clients: summary?.counts?.clients ?? 0,
    products: summary?.counts?.products ?? 0,
    quotes: summary?.counts?.quotes ?? 0,
    invoices: summary?.counts?.invoices ?? 0,
  }), [summary]);

  if (!isReady) {
    return (
      <Card>
        <div className="p-4">
          <h2 className="text-lg font-semibold text-[var(--pf-neutral-900)]">Chargement...</h2>
          <p className="mt-1 text-sm text-[var(--pf-neutral-600)]">Veuillez patienter pendant la récupération de votre session.</p>
        </div>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <div className="p-4">
          <h2 className="text-lg font-semibold text-[var(--pf-neutral-900)]">Accès réservé</h2>
          <p className="mt-1 text-sm text-[var(--pf-neutral-600)]">Cette section est disponible uniquement pour les administrateurs.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--pf-neutral-900)]">Utilisateurs</h2>
            <p className="mt-1 text-sm text-[var(--pf-neutral-600)]">Supervision globale des utilisateurs et de leurs données.</p>
          </div>
          <Button onClick={openCreateModal} className="shrink-0">
            <Plus size={16} />
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-[var(--pf-primary-bg)] p-2 text-[var(--pf-primary)]"><Users size={18} /></div>
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--pf-neutral-600)]">Utilisateurs</p>
              <p className="text-lg font-bold text-[var(--pf-neutral-900)]">{users.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-[var(--pf-primary-bg)] p-2 text-[var(--pf-primary)]"><Building2 size={18} /></div>
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--pf-neutral-600)]">Clients (Société)</p>
              <p className="text-lg font-bold text-[var(--pf-neutral-900)]">{companyStats?.totalClients ?? 0}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-[var(--pf-primary-bg)] p-2 text-[var(--pf-primary)]"><BarChart3 size={18} /></div>
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--pf-neutral-600)]">Impayés (Société)</p>
              <p className="text-lg font-bold text-[var(--pf-neutral-900)]">{formatAmount(companyStats?.totalUnpaid)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-[var(--pf-primary-bg)] p-2 text-[var(--pf-primary)]"><BarChart3 size={18} /></div>
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--pf-neutral-600)]">Retards (Société)</p>
              <p className="text-lg font-bold text-[var(--pf-neutral-900)]">{companyStats?.overdueCount ?? 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4">
          <h3 className="mb-3 text-lg font-semibold text-[var(--pf-neutral-900)]">Liste des utilisateurs</h3>
          {usersError ? (
            <div className="mb-3 rounded-[var(--pf-radius-sm)] border border-[var(--pf-danger)]/20 bg-[var(--pf-danger-bg)] px-3 py-2 text-sm text-[var(--pf-danger)]">
              {usersError}
            </div>
          ) : null}
          <Table
            columns={[
              { key: 'name', label: 'Nom' },
              { key: 'email', label: 'Email' },
              { key: 'company', label: 'Entreprise' },
              { key: 'role', label: 'Role' },
              { key: 'actions', label: 'Actions', align: 'right' },
            ]}
          >
            {usersLoading ? (
              <TableSkeleton colSpan={5} rows={4} />
            ) : users.map((u, index) => (
              <TableRow
                key={u._id}
                zebra={index % 2 === 1}
                onClick={() => viewUser(u)}
              >
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.company?.name || u.company || '-'}</TableCell>
                <TableCell>
                  <Badge tone={u.role === 'admin' ? 'primary' : 'neutral'}>{u.role}</Badge>
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="sm"
                    variant={selectedUser?._id === u._id ? 'primary' : 'secondary'}
                    onClick={() => {
                      // Prevent the row click from firing twice.
                      viewUser(u);
                    }}
                    loading={selectedUserLoading && selectedUser?._id === u._id}
                  >
                    Voir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </div>
      </Card>

      {selectedUser ? (
        <div className="space-y-4">
          <Card>
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--pf-neutral-900)]">Vue utilisateur</h3>
                  <p className="mt-1 text-sm text-[var(--pf-neutral-600)]">Choisissez un utilisateur pour voir ses statistiques et ses clients.</p>
                </div>
              </div>

              <div className="mt-4 max-w-md">
                <SearchableSelect
                  label="Utilisateur"
                  items={users}
                  value={selectedUser?._id || ''}
                  onChange={(item) => selectUser(item)}
                  placeholder="Sélectionner un utilisateur"
                  searchPlaceholder="Rechercher un utilisateur..."
                  noResultsText="Aucun utilisateur trouvé."
                  disabled={selectedUserLoading || usersLoading}
                  getLabel={(item) => item.name}
                  getSearchText={(item) => `${item.name || ''} ${item.email || ''}`}
                  className="w-full"
                />
              </div>

              <p className="mt-3 inline-flex items-center rounded-full border border-[var(--pf-border)] bg-[var(--pf-neutral-50)] px-3 py-1 text-sm font-semibold text-[var(--pf-neutral-800)]">
                {selectedUser.name}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-[var(--pf-radius-md)] border border-[var(--pf-border)] bg-[var(--pf-neutral-50)] p-3">
                  <p className="text-xs font-semibold uppercase text-[var(--pf-neutral-600)]">Clients</p>
                  <p className="text-lg font-bold text-[var(--pf-neutral-900)]">{perUserCounts.clients}</p>
                </div>
                <div className="rounded-[var(--pf-radius-md)] border border-[var(--pf-border)] bg-[var(--pf-neutral-50)] p-3">
                  <p className="text-xs font-semibold uppercase text-[var(--pf-neutral-600)]">Produits</p>
                  <p className="text-lg font-bold text-[var(--pf-neutral-900)]">{perUserCounts.products}</p>
                </div>
                <div className="rounded-[var(--pf-radius-md)] border border-[var(--pf-border)] bg-[var(--pf-neutral-50)] p-3">
                  <p className="text-xs font-semibold uppercase text-[var(--pf-neutral-600)]">Devis</p>
                  <p className="text-lg font-bold text-[var(--pf-neutral-900)]">{perUserCounts.quotes}</p>
                </div>
                <div className="rounded-[var(--pf-radius-md)] border border-[var(--pf-border)] bg-[var(--pf-neutral-50)] p-3">
                  <p className="text-xs font-semibold uppercase text-[var(--pf-neutral-600)]">Factures</p>
                  <p className="text-lg font-bold text-[var(--pf-neutral-900)]">{perUserCounts.invoices}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-[var(--pf-radius-md)] border border-[var(--pf-border)] bg-white p-3">
                  <p className="text-xs font-semibold uppercase text-[var(--pf-neutral-600)]">Impayés (Utilisateur)</p>
                  <p className="text-lg font-bold text-[var(--pf-neutral-900)]">{formatAmount(userStats?.totalUnpaid)}</p>
                </div>
                <div className="rounded-[var(--pf-radius-md)] border border-[var(--pf-border)] bg-white p-3">
                  <p className="text-xs font-semibold uppercase text-[var(--pf-neutral-600)]">Retards (Utilisateur)</p>
                  <p className="text-lg font-bold text-[var(--pf-neutral-900)]">{userStats?.overdueCount ?? 0}</p>
                </div>
                <div className="rounded-[var(--pf-radius-md)] border border-[var(--pf-border)] bg-white p-3">
                  <p className="text-xs font-semibold uppercase text-[var(--pf-neutral-600)]">Paiement Trimestre</p>
                  <p className="text-lg font-bold text-[var(--pf-neutral-900)]">{userStats?.quarterly?.paymentRate ?? 0}%</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <h3 className="mb-3 text-lg font-semibold text-[var(--pf-neutral-900)]">Clients de {selectedUser.name}</h3>
              <Table
                columns={[
                  { key: 'name', label: 'Client' },
                  { key: 'email', label: 'Email' },
                  { key: 'phone', label: 'Téléphone' },
                  { key: 'taxNumber', label: 'ICE' },
                ]}
              >
                {detailsLoading ? (
                  <TableSkeleton colSpan={4} rows={4} />
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-[var(--pf-neutral-600)]">Aucun client pour cet utilisateur.</td>
                  </tr>
                ) : clients.map((client, index) => (
                  <TableRow key={client._id} zebra={index % 2 === 1}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email || '-'}</TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell>{client.taxNumber || '-'}</TableCell>
                  </TableRow>
                ))}
              </Table>
            </div>
          </Card>
        </div>
      ) : null}

      <Modal
        isOpen={Boolean(modalMode)}
        onClose={closeModal}
        title={modalMode === 'create' ? 'Nouvel utilisateur' : modalMode === 'edit' ? 'Modifier utilisateur' : modalUser?.name || 'Utilisateur'}
        maxWidth="max-w-2xl"
      >
        <div className="p-6 space-y-5">
          {formError ? (
            <div className="rounded-[var(--pf-radius-sm)] border border-[var(--pf-danger)]/20 bg-[var(--pf-danger-bg)] px-3 py-2 text-sm text-[var(--pf-danger)]">
              {formError}
            </div>
          ) : null}

          {(modalMode === 'create' || modalMode === 'edit') ? (
            <form className="space-y-4" onSubmit={submitUserForm}>
              <Input
                label="Nom"
                value={userForm.name}
                onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nom complet"
              />
              <Input
                label="Email"
                type="email"
                value={userForm.email}
                onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="email@exemple.com"
              />
              <Input
                label={modalMode === 'create' ? 'Mot de passe' : 'Mot de passe (laisser vide pour garder)'}
                type="password"
                value={userForm.password}
                onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="********"
              />
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--pf-neutral-600)]">Rôle</span>
                <select
                  className="w-full rounded-[var(--pf-radius-md)] border border-[var(--pf-border)] bg-white px-3 py-2.5 text-sm text-[var(--pf-neutral-900)] outline-none focus:ring-2 focus:ring-[var(--pf-primary)]/20"
                  value={userForm.role}
                  onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value }))}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </label>
              <Input
                label="Company ID"
                value={userForm.companyId}
                onChange={(event) => setUserForm((current) => ({ ...current, companyId: event.target.value }))}
                placeholder="Laisser vide pour la société actuelle"
              />

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={closeModal}>
                  Annuler
                </Button>
                <Button type="submit" loading={saving}>
                  {modalMode === 'create' ? 'Créer' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-[var(--pf-radius-md)] border border-[var(--pf-border)] bg-[var(--pf-neutral-50)] p-3">
                  <p className="text-xs font-semibold uppercase text-[var(--pf-neutral-600)]">Nom</p>
                  <p className="font-medium text-[var(--pf-neutral-900)]">{modalUser?.name}</p>
                </div>
                <div className="rounded-[var(--pf-radius-md)] border border-[var(--pf-border)] bg-[var(--pf-neutral-50)] p-3">
                  <p className="text-xs font-semibold uppercase text-[var(--pf-neutral-600)]">Email</p>
                  <p className="font-medium text-[var(--pf-neutral-900)]">{modalUser?.email}</p>
                </div>
                <div className="rounded-[var(--pf-radius-md)] border border-[var(--pf-border)] bg-[var(--pf-neutral-50)] p-3">
                  <p className="text-xs font-semibold uppercase text-[var(--pf-neutral-600)]">Role</p>
                  <p className="font-medium text-[var(--pf-neutral-900)]">{modalUser?.role}</p>
                </div>
                <div className="rounded-[var(--pf-radius-md)] border border-[var(--pf-border)] bg-[var(--pf-neutral-50)] p-3">
                  <p className="text-xs font-semibold uppercase text-[var(--pf-neutral-600)]">Entreprise</p>
                  <p className="font-medium text-[var(--pf-neutral-900)]">{modalUser?.company?.name || modalUser?.company || '-'}</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-between gap-2 pt-2">
                <Button variant="secondary" onClick={openEditModal}>
                  <Pencil size={16} />
                  Modifier
                </Button>
                <div className="flex gap-2">
                  <Button variant="danger" loading={deleting} onClick={removeUser}>
                    <Trash2 size={16} />
                    Supprimer
                  </Button>
                  <Button variant="secondary" onClick={closeModal}>
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
