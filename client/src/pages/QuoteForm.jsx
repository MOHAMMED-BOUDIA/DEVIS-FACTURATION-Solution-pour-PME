import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, Package, Calculator, ChevronDown } from 'lucide-react';
import api from '../api/client';
import AppDatePicker from '../components/AppDatePicker';
import { SearchableSelect } from '../components/UI';
import { useToast } from '../components/ToastProvider';

const statusLabel = {
  draft: 'Brouillon',
  sent: 'Envoye',
  accepted: 'Accepte',
  rejected: 'Refuse',
  expired: 'Expire',
};

const QuoteForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [quoteMeta, setQuoteMeta] = useState(null);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    client: '',
    date: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ product: '', description: '', quantity: 1, price: 0, taxRate: 20 }],
    notes: '',
    terms: 'Conditions de règlement : Paiement à réception.',
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
          const quoteRes = await api.get(`/quotes/${id}`);
          const quote = quoteRes.data.data;
          setQuoteMeta(quote);
          setFormData({
            client: quote.client._id,
            date: new Date(quote.date).toISOString().split('T')[0],
            validUntil: new Date(quote.validUntil || quote.expiryDate).toISOString().split('T')[0],
            items: quote.items,
            notes: quote.notes || '',
            terms: quote.terms || '',
          });
        }
      } catch (error) {
        console.error('Error fetching data', error);
      }
    };

    fetchData();
  }, [id, isEdit]);

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
    // Client-side validation
    if (!formData.client) {
      pushToast('Veuillez selectionner un client.', 'error');
      return;
    }

    if (!Array.isArray(formData.items) || formData.items.length === 0) {
      pushToast('Ajoutez au moins une ligne au devis.', 'error');
      return;
    }

    for (let i = 0; i < formData.items.length; i++) {
      const it = formData.items[i];
      if (!it.product) {
        pushToast(`La ligne ${i + 1} doit avoir un produit selectionne.`, 'error');
        return;
      }
      if (!it.quantity || Number(it.quantity) <= 0) {
        pushToast(`Quantite invalide sur la ligne ${i + 1}.`, 'error');
        return;
      }
      if (it.price === '' || Number.isNaN(Number(it.price)) || Number(it.price) < 0) {
        pushToast(`Prix invalide sur la ligne ${i + 1}.`, 'error');
        return;
      }
    }

    console.log('QuoteForm: submit clicked', { formData });
    pushToast('Enregistrement en cours...', 'info');
    setLoading(true);
    try {
      // normalize numeric fields
      const payload = {
        ...formData,
        items: formData.items.map((it) => ({
          ...it,
          quantity: Number(it.quantity) || 0,
          price: Number(it.price) || 0,
          taxRate: Number(it.taxRate) || 0,
          product: it.product,
        })),
      };
      console.log('QuoteForm: payload', payload);
      if (isEdit) {
        await api.put(`/quotes/${id}`, payload);
        pushToast('Devis mis a jour', 'success');
      } else {
        await api.post('/quotes', payload);
        pushToast('Devis cree', 'success');
      }
      navigate('/quotes');
    } catch (error) {
      const apiMessage = error.response?.data?.message || error.response?.data?.error || 'Erreur lors de l\'enregistrement';
      console.error('Error saving quote', error);
      pushToast(apiMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const reloadQuote = async () => {
    if (!isEdit) return;
    const quoteRes = await api.get(`/quotes/${id}`);
    const quote = quoteRes.data.data;
    setQuoteMeta(quote);
    setFormData((current) => ({
      ...current,
      validUntil: new Date(quote.validUntil || quote.expiryDate).toISOString().split('T')[0],
    }));
  };

  const runQuoteAction = async (action, successMessage) => {
    if (!isEdit) return;
    try {
      setActionLoading(true);
      if (action === 'convert') {
        await api.post(`/quotes/${id}/convert`);
        pushToast(successMessage, 'success');
        navigate('/invoices');
        return;
      }
      await api.post(`/quotes/${id}/${action}`);
      pushToast(successMessage, 'success');
      await reloadQuote();
    } catch (error) {
      pushToast(error.response?.data?.error || 'Action impossible', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate('/quotes')}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand-200 hover:text-brand-600"
            >
              <ArrowLeft size={16} />
              Retour
            </button>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              {isEdit ? 'Modifier le devis' : 'Nouveau devis'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">Créez un devis clair, rapide et prêt à être envoyé.</p>
          </div>
        </div>

        <form noValidate onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900">Lignes du devis</h2>
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
                        <Package size={14} />
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
                            getLabel={(p) => p.name}
                            getSearchText={(p) => `${p.name || ''} ${p.description || ''} ${p.unit || ''}`}
                            getDescription={(p) => `${Number(p.price || 0).toLocaleString()} DH • ${p.unit || ''}`}
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
                  <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Notes (visibles sur le devis)</label>
                  <textarea
                    className="min-h-[80px] w-full resize-none rounded-[1rem] border-none bg-slate-50 px-6 py-3 text-sm font-medium text-slate-900 shadow-inner outline-none transition focus:ring-2 focus:ring-brand-500/10"
                    placeholder="Merci pour votre confiance..."
                    value={formData.notes}
                    onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Conditions générales</label>
                  <textarea
                    className="min-h-[80px] w-full resize-none rounded-[1rem] border-none bg-slate-50 px-6 py-3 text-sm font-medium text-slate-900 shadow-inner outline-none transition focus:ring-2 focus:ring-brand-500/10"
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
                    label="Date de validité"
                    value={formData.validUntil}
                    onChange={(date) => setFormData((current) => ({
                      ...current,
                      validUntil: date ? date.toISOString().split('T')[0] : current.validUntil,
                    }))}
                    allowFutureDates
                  />
                </div>

                <div className="h-px bg-slate-100" />

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-500">Sous-total HT</span>
                    <span className="font-bold text-slate-900">{totals.subtotal.toLocaleString()} DH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-500">TVA (20%)</span>
                    <span className="font-bold text-slate-900">{totals.tax.toLocaleString()} DH</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-4 text-xl">
                    <span className="font-black text-slate-900">TOTAL TTC</span>
                    <span className="font-black text-brand-600">{totals.total.toLocaleString()} DH</span>
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
                      {isEdit ? 'Mettre à jour' : 'Générer le devis'}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/quotes')}
                  className="w-full rounded-2xl border border-slate-200 py-4 text-base font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Annuler
                </button>
              </div>
            </div>

            

            {isEdit && quoteMeta ? (
              <div className="space-y-3 rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Workflow devis</p>
                <p className="text-sm font-semibold text-slate-700">Statut actuel: {statusLabel[quoteMeta.status] || quoteMeta.status}</p>
                <div className="grid grid-cols-1 gap-2">
                  {quoteMeta.status === 'draft' ? (
                    <button type="button" disabled={actionLoading} onClick={() => runQuoteAction('send', 'Devis envoye')} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-70">Envoyer devis</button>
                  ) : null}
                  {quoteMeta.status === 'sent' ? (
                    <>
                      <button type="button" disabled={actionLoading} onClick={() => runQuoteAction('accept', 'Devis accepte')} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-70">Marquer accepte</button>
                      <button type="button" disabled={actionLoading} onClick={() => runQuoteAction('reject', 'Devis refuse')} className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-70">Marquer refuse</button>
                    </>
                  ) : null}
                  {quoteMeta.status === 'accepted' ? (
                    <button type="button" disabled={actionLoading} onClick={() => runQuoteAction('convert', 'Devis converti en facture')} className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-70">Convertir en facture</button>
                  ) : null}
                </div>
              </div>
            ) : null}

           
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuoteForm;
