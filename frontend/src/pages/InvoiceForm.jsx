import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, Receipt, Calculator } from 'lucide-react';
import api from '../api/client';
import AppDatePicker from '../components/AppDatePicker';
import { SearchableSelect } from '../components/UI';
import { useToast } from '../components/ToastProvider';

const statusLabel = {
  draft: 'Brouillon',
  sent: 'Envoyee',
  unpaid: 'Impayee',
  paid: 'Payee',
  overdue: 'En retard',
};

const InvoiceForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [invoiceMeta, setInvoiceMeta] = useState(null);
  const [paymentInput, setPaymentInput] = useState({ amount: '', method: 'Other', reference: '' });
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    client: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ product: '', description: '', quantity: 1, price: 0, taxRate: 20 }],
    notes: '',
    terms: 'Paiement par virement bancaire.',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, productsRes] = await Promise.all([
          api.get('/clients'),
          api.get('/products'),
        ]);

        setClients(clientsRes.data.data || []);
        setProducts(productsRes.data.data || []);

        if (isEdit) {
          const invoiceRes = await api.get(`/invoices/${id}`);
          const invoice = invoiceRes.data.data;
          setInvoiceMeta(invoice);
          setFormData({
            client: invoice.client._id,
            date: new Date(invoice.date).toISOString().split('T')[0],
            dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
            items: invoice.items,
            notes: invoice.notes || '',
            terms: invoice.terms || '',
          });
        }
      } catch (error) {
        console.error('Error fetching data', error);
      }
    };

    fetchData();
  }, [id, isEdit]);

  const reloadInvoice = async () => {
    if (!isEdit) return;
    const invoiceRes = await api.get(`/invoices/${id}`);
    setInvoiceMeta(invoiceRes.data.data);
  };

  const runInvoiceAction = async (action, payload, successMessage) => {
    if (!isEdit) return;

    try {
      setActionLoading(true);
      await api.post(`/invoices/${id}/${action}`, payload || {});
      pushToast(successMessage, 'success');
      if (action === 'payments') {
        setPaymentInput({ amount: '', method: 'Other', reference: '' });
      }
      await reloadInvoice();
    } catch (error) {
      pushToast(error.response?.data?.error || 'Action impossible', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormData((current) => ({
      ...current,
      items: [...current.items, { product: '', description: '', quantity: 1, price: 0, taxRate: 20 }],
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((current) => {
      const nextItems = [...current.items];

      if (field === 'product' && value) {
        const product = products.find((item) => item._id === value);
        if (product) {
          nextItems[index] = {
            ...nextItems[index],
            product: value,
            description: product.name,
            price: product.price,
            taxRate: product.taxRate || 20,
          };
        }
      } else {
        nextItems[index] = { ...nextItems[index], [field]: value };
      }

      return { ...current, items: nextItems };
    });
  };

  const totals = useMemo(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const tax = formData.items.reduce((sum, item) => sum + (item.quantity * item.price * (item.taxRate / 100)), 0);
    return { subtotal, tax, total: subtotal + tax };
  }, [formData.items]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    pushToast('Enregistrement en cours...', 'info');

    if (!formData.client) {
      pushToast('Veuillez selectionner un client.', 'error');
      return;
    }

    if (!Array.isArray(formData.items) || formData.items.length === 0) {
      pushToast('Ajoutez au moins une ligne a la facture.', 'error');
      return;
    }

    for (let i = 0; i < formData.items.length; i += 1) {
      const item = formData.items[i];
      if (!item.product) {
        pushToast(`La ligne ${i + 1} doit avoir un produit selectionne.`, 'error');
        return;
      }

      if (!item.quantity || Number(item.quantity) <= 0) {
        pushToast(`Quantite invalide sur la ligne ${i + 1}.`, 'error');
        return;
      }

      if (item.price === '' || Number.isNaN(Number(item.price)) || Number(item.price) < 0) {
        pushToast(`Prix invalide sur la ligne ${i + 1}.`, 'error');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        items: formData.items.map((item) => ({
          ...item,
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0,
          taxRate: Number(item.taxRate) || 0,
          product: item.product,
        })),
      };

      if (isEdit) {
        await api.put(`/invoices/${id}`, payload);
        pushToast('Facture mise a jour', 'success');
      } else {
        await api.post('/invoices', payload);
        pushToast('Facture creee', 'success');
      }
      navigate('/invoices');
    } catch (error) {
      console.error('Error saving invoice', error);
      pushToast(error.response?.data?.message || error.response?.data?.error || 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate('/invoices')}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand-200 hover:text-brand-600"
            >
              <ArrowLeft size={16} />
              Retour
            </button>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              {isEdit ? 'Modifier la facture' : 'Nouvelle facture'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">Créez une facture claire, rapide et prête à être envoyée.</p>
          </div>
        </div>

        <form noValidate onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <div className="rounded-[2.5rem] border border-slate-70 bg-white p-8 shadow-sm">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900">Lignes de facture</h2>
                  <p className="mt-1 text-sm text-slate-500">Ajoutez les produits, services et détails personnalisés.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Plus size={16} />
                  Ajouter une ligne
                </button>
              </div>

              <div className="space-y-6">
                {formData.items.map((item, index) => (
                  <div key={index} className="group rounded-[2rem] border border-slate-100 bg-slate-50 p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-widest text-slate-500">
                        <Receipt size={14} />
                        Ligne {index + 1}
                      </div>
                      {formData.items.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Supprimer la ligne"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                      <div className="space-y-3 md:col-span-6">
                        <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Produit / Service</label>
                        <SearchableSelect
                          items={products}
                          value={item.product}
                          onChange={(product) => handleItemChange(index, 'product', product?._id)}
                          placeholder="Sélectionner un produit..."
                          searchPlaceholder="Rechercher un produit..."
                          noResultsText="Aucun produit trouvé."
                          getLabel={(product) => product.name}
                          getSearchText={(product) => `${product.name || ''} ${product.description || ''} ${product.unit || ''}`}
                          getDescription={(product) => `${Number(product.price || 0).toLocaleString()} DH • ${product.unit || ''}`}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-3 md:col-span-2">
                        <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Quantité</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full rounded-2xl border-none bg-white px-6 py-4 text-sm font-black text-slate-900 shadow-sm outline-none transition focus:ring-2 focus:ring-brand-500/10"
                          value={item.quantity}
                          onChange={(event) => handleItemChange(index, 'quantity', Number(event.target.value))}
                        />
                      </div>

                      <div className="space-y-3 md:col-span-4">
                        <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Prix unitaire (DH)</label>
                        <div className="relative">
                          <input
                            type="number"
                            className="w-full rounded-2xl border-none bg-white py-4 pl-6 pr-12 text-sm font-black text-slate-900 shadow-sm outline-none transition focus:ring-2 focus:ring-brand-500/10"
                            value={item.price}
                            onChange={(event) => handleItemChange(index, 'price', Number(event.target.value))}
                          />
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-slate-300">HT</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Description personnalisée</label>
                      <textarea
                        className="min-h-[100px] w-full resize-none rounded-[1.5rem] border-none bg-white px-6 py-4 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:ring-2 focus:ring-brand-500/10"
                        placeholder="Détails spécifiques pour cette ligne..."
                        value={item.description}
                        onChange={(event) => handleItemChange(index, 'description', event.target.value)}
                      />
                    </div>

                    <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Sous-total :</span>
                        <span className="text-sm font-black text-slate-900">{(item.quantity * item.price).toLocaleString()} DH</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
              <h2 className="mb-8 text-xl font-black tracking-tight text-slate-900">Notes & Conditions</h2>
              <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                <div className="space-y-3">
                  <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Notes (visibles sur la facture)</label>
                  <textarea
                    className="mimin-h-[80px] w-full resize-none rounded-[1rem] border-none bg-slate-50 px-6 py-3 text-sm font-medium text-slate-900 shadow-inner outline-none transition focus:ring-2 focus:ring-brand-500/10n-h-[150px] w-full resize-none rounded-[2rem] border-none bg-slate-50 px-8 py-6 text-sm font-medium text-slate-900 shadow-inner outline-none transition focus:ring-2 focus:ring-brand-500/10"
                    placeholder="Informations complémentaires..."
                    value={formData.notes}
                    onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Conditions & Coordonnées bancaires</label>
                  <textarea
                    className="minmin-h-[80px] w-full resize-none rounded-[1rem] border-none bg-slate-50 px-6 py-3 text-sm font-medium text-slate-900 shadow-inner outline-none transition focus:ring-2 focus:ring-brand-500/10-h-[150px] w-full resize-none rounded-[2rem] border-none bg-slate-50 px-8 py-6 text-sm font-medium text-slate-900 shadow-inner outline-none transition focus:ring-2 focus:ring-brand-500/10"
                    value={formData.terms}
                    onChange={(event) => setFormData({ ...formData, terms: event.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 lg:col-span-4">
            <div className="sticky top-24 rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
              <div className="space-y-6">
                <SearchableSelect
                  label="Client Destinataire"
                  items={clients}
                  value={formData.client}
                  onChange={(client) => setFormData((current) => ({ ...current, client: client?._id || '' }))}
                  placeholder="Choisir un client..."
                  searchPlaceholder="Rechercher un client..."
                  noResultsText="Aucun client trouvé."
                  getLabel={(client) => client.name}
                  getSearchText={(client) => `${client.name || ''} ${client.email || ''} ${client.phone || ''}`}
                  getDescription={(client) => client.email || client.phone || 'Client'}
                  className="w-full"
                />

                <div className="grid grid-cols-1 gap-6">
                  <AppDatePicker
                    label="Date d'émission"
                    value={formData.date}
                    onChange={(date) => setFormData((current) => ({
                      ...current,
                      date: date ? date.toISOString().split('T')[0] : current.date,
                    }))}
                  />
                  <AppDatePicker
                    label="Date d'échéance"
                    value={formData.dueDate}
                    onChange={(date) => setFormData((current) => ({
                      ...current,
                      dueDate: date ? date.toISOString().split('T')[0] : current.dueDate,
                    }))}
                    allowFutureDates
                  />
                </div>

                <div className="pt-8 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between text-sm font-bold text-slate-500">
                    <span className="text-[10px] uppercase tracking-widest">Sous-total HT</span>
                    <span>{totals.subtotal.toLocaleString()} DH</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold text-slate-500">
                    <span className="text-[10px] uppercase tracking-widest">TVA ({formData.items[0]?.taxRate || 20}%)</span>
                    <span>{totals.tax.toLocaleString()} DH</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                    <span className="text-sm font-black uppercase tracking-widest text-slate-900">Total TTC</span>
                    <span className="text-2xl font-black text-brand-600">{totals.total.toLocaleString()} DH</span>
                  </div>
                </div>

                <button
                  disabled={loading}
                  type="submit"
                  className="flex w-full items-center justify-center rounded-2xl bg-brand-600 py-4 text-base font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? 'Enregistrement...' : (
                    <>
                      <Save size={20} className="mr-2" />
                      {isEdit ? 'Mettre à jour' : 'Générer la facture'}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/invoices')}
                  className="w-full rounded-2xl border border-slate-200 py-4 text-base font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Annuler
                </button>
              </div>
            </div>

            

            {isEdit && invoiceMeta ? (
              <div className="space-y-4 rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Workflow facture</p>
                <p className="text-sm font-semibold text-slate-700">Statut actuel: {statusLabel[invoiceMeta.status] || invoiceMeta.status}</p>
                <p className="text-sm text-slate-500">Paye: {Number(invoiceMeta.paidAmount ?? invoiceMeta.amountPaid ?? 0).toLocaleString()} DH - Reste: {Number(invoiceMeta.remainingAmount ?? 0).toLocaleString()} DH</p>

                <div className="grid grid-cols-1 gap-2">
                  {invoiceMeta.status === 'draft' ? (
                    <button type="button" disabled={actionLoading} onClick={() => runInvoiceAction('send', null, 'Facture envoyee')} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-70">Envoyer facture</button>
                  ) : null}
                  {invoiceMeta.status !== 'paid' ? (
                    <button type="button" disabled={actionLoading} onClick={() => runInvoiceAction('mark-paid', null, 'Facture marquee payee')} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-70">Marquer payee</button>
                  ) : null}
                  {(invoiceMeta.status === 'sent' || invoiceMeta.status === 'unpaid' || invoiceMeta.status === 'overdue') ? (
                    <button type="button" disabled={actionLoading} onClick={() => runInvoiceAction('remind', null, 'Relance envoyee')} className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-70">Relance</button>
                  ) : null}
                </div>

                <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Ajouter un paiement</p>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentInput.amount}
                    onChange={(event) => setPaymentInput((current) => ({ ...current, amount: event.target.value }))}
                    placeholder="Montant"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={paymentInput.reference}
                    onChange={(event) => setPaymentInput((current) => ({ ...current, reference: event.target.value }))}
                    placeholder="Reference"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={actionLoading || !paymentInput.amount}
                    onClick={() => runInvoiceAction('payments', { amount: Number(paymentInput.amount), method: paymentInput.method, reference: paymentInput.reference }, 'Paiement ajoute')}
                    className="w-full rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-70"
                  >
                    Ajouter paiement
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Historique paiements</p>
                  <div className="max-h-40 overflow-auto space-y-1">
                    {(invoiceMeta.payments || []).length === 0 ? (
                      <p className="text-sm text-slate-500">Aucun paiement enregistre.</p>
                    ) : (invoiceMeta.payments || []).map((payment) => (
                      <div key={payment._id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                        {new Date(payment.paidAt).toLocaleDateString('fr-FR')} - {Number(payment.amount || 0).toLocaleString()} DH {payment.reference ? `(${payment.reference})` : ''}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
