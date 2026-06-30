import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Download, Plus, Receipt } from 'lucide-react';
import { Badge, Button, Card, EmptyState, SearchableSelect, Table, TableCell, TableRow, TableSkeleton } from '../components/UI';
import api from '../api/client';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastProvider';

const statusTone = {
  draft: 'neutral',
  sent: 'primary',
  unpaid: 'warning',
  paid: 'success',
  overdue: 'danger',
};

const statusLabel = {
  draft: 'Brouillon',
  sent: 'Envoyee',
  unpaid: 'Impayee',
  paid: 'Payee',
  overdue: 'En retard',
};

export default function Invoices() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices');
      setInvoices(response.data.data || []);
    } catch (error) {
      pushToast('Erreur chargement factures', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDownloadPDF = async (id, number) => {
    try {
      const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture-${number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      pushToast('PDF telecharge', 'success');
    } catch (error) {
      pushToast('Erreur telechargement PDF', 'error');
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/invoices/${selectedInvoice._id}/payments`, { amount: paymentAmount });
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      pushToast('Paiement enregistre', 'success');
      fetchInvoices();
    } catch (error) {
      pushToast(error.response?.data?.error || 'Erreur lors du paiement', 'error');
    }
  };

  const runInvoiceAction = async (invoiceId, action, successMessage) => {
    try {
      await api.post(`/invoices/${invoiceId}/${action}`);
      pushToast(successMessage, 'success');
      fetchInvoices();
    } catch (error) {
      pushToast(error.response?.data?.error || 'Action impossible', 'error');
    }
  };

  const clientOptions = useMemo(() => {
    const names = Array.from(new Set(invoices.map((i) => i.client?.name).filter(Boolean)));
    return names;
  }, [invoices]);

  const statusItems = useMemo(
    () => [
      { id: 'all', name: 'Tous les statuts' },
      { id: 'draft', name: 'Brouillon' },
      { id: 'sent', name: 'Envoyee' },
      { id: 'unpaid', name: 'Impayee' },
      { id: 'paid', name: 'Payee' },
      { id: 'overdue', name: 'En retard' },
    ],
    []
  );

  const clientItems = useMemo(
    () => [{ id: 'all', name: 'Tous les clients' }, ...clientOptions.map((name) => ({ id: name, name }))],
    [clientOptions]
  );

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const byStatus = statusFilter === 'all' || invoice.status === statusFilter;
      const byClient = clientFilter === 'all' || invoice.client?.name === clientFilter;
      return byStatus && byClient;
    });
  }, [invoices, statusFilter, clientFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Factures</h2>
          <p className="text-sm text-[var(--pf-neutral-600)]">Suivi des encaissements et echeances.</p>
        </div>
        <Button onClick={() => navigate('/invoices/new')}>
          <Plus size={16} /> Nouvelle facture
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

        {invoices.length === 0 && !loading ? (
          <EmptyState
            icon={Receipt}
            title="Aucune facture"
            description="Creez votre premiere facture pour suivre vos paiements."
            ctaLabel="Creer premiere facture"
            onCta={() => navigate('/invoices/new')}
          />
        ) : filteredInvoices.length === 0 && !loading ? (
          <EmptyState
            icon={Receipt}
            title="Aucun resultat"
            description="Aucune facture ne correspond aux filtres appliques."
          />
        ) : (
          <Table
            columns={[
              { key: 'number', label: 'Reference' },
              { key: 'client', label: 'Client' },
              { key: 'dueDate', label: 'Echeance' },
              { key: 'total', label: 'Total TTC', align: 'right' },
              { key: 'due', label: 'Reste', align: 'right' },
              { key: 'status', label: 'Statut' },
              { key: 'actions', label: 'Actions', align: 'right' },
            ]}
          >
            {loading ? (
              <TableSkeleton colSpan={7} rows={6} />
            ) : (
              filteredInvoices.map((invoice, index) => {
                const remaining = Number(invoice.remainingAmount ?? (Number(invoice.totalAmount || 0) - Number(invoice.paidAmount ?? invoice.amountPaid ?? 0)));
                return (
                  <TableRow key={invoice._id} zebra={index % 2 === 1}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>{invoice.client?.name || '-'}</TableCell>
                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell align="right" className="font-medium">{Number(invoice.totalAmount || 0).toLocaleString()} DH</TableCell>
                    <TableCell align="right" className={remaining > 0 ? 'text-[var(--pf-danger)]' : 'text-[var(--pf-success)]'}>
                      {remaining.toLocaleString()} DH
                    </TableCell>
                    <TableCell><Badge tone={statusTone[invoice.status] || 'neutral'}>{statusLabel[invoice.status] || invoice.status}</Badge></TableCell>
                    <TableCell align="right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => handleDownloadPDF(invoice._id, invoice.number)} className="rounded p-1.5 hover:bg-[var(--pf-neutral-100)]" title="PDF">
                          <Download size={14} />
                        </button>
                        {invoice.status === 'draft' && (
                          <button
                            onClick={() => runInvoiceAction(invoice._id, 'send', 'Facture envoyee')}
                            className="rounded p-1.5 text-[var(--pf-primary)] hover:bg-[var(--pf-primary-bg)]"
                            title="Envoyer facture"
                          >
                            S
                          </button>
                        )}
                        {invoice.status !== 'paid' && (
                          <button
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setIsPaymentModalOpen(true);
                            }}
                            className="rounded p-1.5 text-[var(--pf-primary)] hover:bg-[var(--pf-primary-bg)]"
                            title="Ajouter paiement"
                          >
                            <CreditCard size={14} />
                          </button>
                        )}
                        {invoice.status !== 'paid' && (
                          <button
                            onClick={() => runInvoiceAction(invoice._id, 'mark-paid', 'Facture marquee payee')}
                            className="rounded p-1.5 text-[var(--pf-success)] hover:bg-[var(--pf-success-bg)]"
                            title="Marquer payee"
                          >
                            P
                          </button>
                        )}
                        {(invoice.status === 'unpaid' || invoice.status === 'overdue' || invoice.status === 'sent') && (
                          <button
                            onClick={() => runInvoiceAction(invoice._id, 'remind', 'Relance envoyee')}
                            className="rounded p-1.5 text-[var(--pf-warning)] hover:bg-[var(--pf-warning-bg)]"
                            title="Relance"
                          >
                            R
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </Table>
        )}
      </Card>

      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Enregistrer paiement">
        <form onSubmit={handlePayment} className="space-y-4 p-6">
          <div className="rounded-[var(--pf-radius-md)] bg-[var(--pf-neutral-50)] p-3 text-sm">
            Facture: <strong>{selectedInvoice?.number}</strong> - Reste: <strong>{Number(selectedInvoice?.remainingAmount ?? ((selectedInvoice?.totalAmount || 0) - (selectedInvoice?.paidAmount ?? selectedInvoice?.amountPaid ?? 0))).toLocaleString()} DH</strong>
          </div>
          <input
            className="input-modern"
            type="number"
            min="0"
            step="0.01"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="Montant"
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
