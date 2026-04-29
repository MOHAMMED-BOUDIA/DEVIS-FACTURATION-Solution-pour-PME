import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Download, FileText, Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Card, EmptyState, SearchableSelect, Table, TableCell, TableRow, TableSkeleton } from '../components/UI';
import api from '../api/client';
import { useToast } from '../components/ToastProvider';

const statusTone = {
  draft: 'neutral',
  sent: 'primary',
  accepted: 'success',
  rejected: 'danger',
  expired: 'warning',
};

const statusLabel = {
  draft: 'Brouillon',
  sent: 'Envoye',
  accepted: 'Accepte',
  rejected: 'Refuse',
  expired: 'Expire',
};

export default function Quotes() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');

  const fetchQuotes = async () => {
    try {
      const response = await api.get('/quotes');
      setQuotes(response.data.data || []);
    } catch (error) {
      pushToast('Erreur chargement devis', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handleDownloadPDF = async (id, number) => {
    try {
      const response = await api.get(`/quotes/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `devis-${number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      pushToast('PDF telecharge', 'success');
    } catch (error) {
      pushToast('Erreur telechargement PDF', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Etes-vous sur de vouloir supprimer ce devis ?')) return;
    try {
      await api.delete(`/quotes/${id}`);
      pushToast('Devis supprime', 'success');
      fetchQuotes();
    } catch (error) {
      pushToast(error.response?.data?.error || 'Erreur suppression devis', 'error');
    }
  };

  const handleConvertToInvoice = async (id) => {
    if (!window.confirm('Voulez-vous transformer ce devis en facture ?')) return;
    try {
      await api.post(`/quotes/${id}/convert`);
      pushToast('Devis converti en facture', 'success');
      fetchQuotes();
    } catch (error) {
      pushToast(error.response?.data?.error || 'Erreur conversion', 'error');
    }
  };

  const updateStatus = async (id, action, successMessage) => {
    try {
      await api.post(`/quotes/${id}/${action}`);
      pushToast(successMessage, 'success');
      fetchQuotes();
    } catch (error) {
      pushToast(error.response?.data?.error || 'Action impossible', 'error');
    }
  };

  const clientOptions = useMemo(() => {
    const names = Array.from(new Set(quotes.map((q) => q.client?.name).filter(Boolean)));
    return names;
  }, [quotes]);

  const statusItems = useMemo(
    () => [
      { id: 'all', name: 'Tous les statuts' },
      { id: 'draft', name: 'Brouillon' },
      { id: 'sent', name: 'Envoye' },
      { id: 'accepted', name: 'Accepte' },
      { id: 'rejected', name: 'Refuse' },
      { id: 'expired', name: 'Expire' },
    ],
    []
  );

  const clientItems = useMemo(
    () => [{ id: 'all', name: 'Tous les clients' }, ...clientOptions.map((name) => ({ id: name, name }))],
    [clientOptions]
  );

  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const byStatus = statusFilter === 'all' || quote.status === statusFilter;
      const byClient = clientFilter === 'all' || quote.client?.name === clientFilter;
      return byStatus && byClient;
    });
  }, [quotes, statusFilter, clientFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Devis</h2>
          <p className="text-sm text-[var(--pf-neutral-600)]">Suivi des propositions commerciales.</p>
        </div>
        <Button onClick={() => navigate('/quotes/new')}>
          <Plus size={16} /> Nouveau devis
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap gap-2">
          <SearchableSelect
            items={statusItems}
            value={statusFilter}
            onChange={(item) => setStatusFilter(item?.id || 'all')}
            placeholder="Tous les statuts"
            searchPlaceholder="Rechercher un statut..."
            noResultsText="Aucun statut trouve."
            wrapperClassName="w-64"
            getKey={(item) => item?.id}
            getLabel={(item) => item?.name || ''}
            getSearchText={(item) => item?.name || ''}
            renderSelectedBadge={(item) =>
              item?.id && item.id !== 'all' ? (
                <span className="ml-2 inline-flex items-center rounded-full bg-[var(--pf-primary-bg)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--pf-primary)]">
                  {item.id}
                </span>
              ) : null
            }
          />

          <SearchableSelect
            items={clientItems}
            value={clientFilter}
            onChange={(item) => setClientFilter(item?.id || 'all')}
            placeholder="Tous les clients"
            searchPlaceholder="Rechercher un client..."
            noResultsText="Aucun client trouve."
            wrapperClassName="w-72"
            getKey={(item) => item?.id}
            getLabel={(item) => item?.name || ''}
            getSearchText={(item) => item?.name || ''}
          />
        </div>

        {quotes.length === 0 && !loading ? (
          <EmptyState
            icon={FileText}
            title="Aucun devis"
            description="Créez votre premier devis pour demarrer votre cycle de vente."
            ctaLabel="Creer premier devis"
            onCta={() => navigate('/quotes/new')}
          />
        ) : filteredQuotes.length === 0 && !loading ? (
          <EmptyState
            icon={FileText}
            title="Aucun resultat"
            description="Aucun devis ne correspond aux filtres selectionnes."
          />
        ) : (
          <Table
            columns={[
              { key: 'number', label: 'Reference' },
              { key: 'client', label: 'Client' },
              { key: 'date', label: 'Date' },
              { key: 'validUntil', label: 'Valide jusqu\'au' },
              { key: 'total', label: 'Total HT', align: 'right' },
              { key: 'status', label: 'Statut' },
              { key: 'actions', label: 'Actions', align: 'right' },
            ]}
          >
            {loading ? (
              <TableSkeleton colSpan={7} rows={6} />
            ) : (
              filteredQuotes.map((quote, index) => (
                <TableRow key={quote._id} zebra={index % 2 === 1}>
                  <TableCell className="font-medium">{quote.number}</TableCell>
                  <TableCell>{quote.client?.name || '-'}</TableCell>
                  <TableCell>{new Date(quote.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('fr-FR') : '-'}</TableCell>
                  <TableCell align="right" className="font-medium">{Number(quote.totalAmount || 0).toLocaleString()} DH</TableCell>
                  <TableCell>
                    <Badge tone={statusTone[quote.status] || 'neutral'}>{statusLabel[quote.status] || quote.status}</Badge>
                  </TableCell>
                  <TableCell align="right">
                    <div className="inline-flex items-center gap-1">
                      <button onClick={() => handleDownloadPDF(quote._id, quote.number)} className="rounded p-1.5 hover:bg-[var(--pf-neutral-100)]" title="PDF">
                        <Download size={14} />
                      </button>
                      {quote.status === 'draft' && (
                        <button
                          onClick={() => updateStatus(quote._id, 'send', 'Devis envoye')}
                          className="rounded p-1.5 text-[var(--pf-primary)] hover:bg-[var(--pf-primary-bg)]"
                          title="Envoyer devis"
                        >
                          <ArrowRight size={14} />
                        </button>
                      )}
                      {quote.status === 'sent' && (
                        <>
                          <button
                            onClick={() => updateStatus(quote._id, 'accept', 'Devis accepte')}
                            className="rounded p-1.5 text-[var(--pf-success)] hover:bg-[var(--pf-success-bg)]"
                            title="Marquer accepte"
                          >
                            A+
                          </button>
                          <button
                            onClick={() => updateStatus(quote._id, 'reject', 'Devis refuse')}
                            className="rounded p-1.5 text-[var(--pf-danger)] hover:bg-[var(--pf-danger-bg)]"
                            title="Marquer refuse"
                          >
                            R-
                          </button>
                        </>
                      )}
                      {quote.status === 'accepted' && (
                        <button onClick={() => handleConvertToInvoice(quote._id)} className="rounded p-1.5 text-[var(--pf-success)] hover:bg-[var(--pf-success-bg)]" title="Convertir">
                          <ArrowRight size={14} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(quote._id)} className="rounded p-1.5 text-[var(--pf-danger)] hover:bg-[var(--pf-danger-bg)]" title="Supprimer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </Table>
        )}
      </Card>
    </div>
  );
}
