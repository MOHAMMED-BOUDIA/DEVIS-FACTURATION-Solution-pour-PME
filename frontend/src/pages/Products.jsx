import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Package, Pencil, Trash2 } from 'lucide-react';
import { Button, Card, EmptyState, Table, TableCell, TableRow, TableSkeleton, Badge } from '../components/UI';
import ProductFormModal from '../components/ProductFormModal';
import api from '../api/client';
import useAuthStore from '../store/authStore';
import { useToast } from '../components/ToastProvider';

export default function Products() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const hasCompany = Boolean(
    user?.companyId
    || user?.company?._id
    || (typeof user?.company === 'string' ? user.company : null)
  );
  const { pushToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('new') === '1');
  const [editingId, setEditingId] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({ name: '', description: '', price: 0, taxRate: 20 });

  const fetchProducts = async () => {
    if (!hasCompany) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/products');
      setProducts(response.data.data || []);
    } catch (error) {
      pushToast('Erreur chargement produits', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [hasCompany]);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', description: '', price: 0, taxRate: 20 });
    if (searchParams.get('new') === '1') {
      searchParams.delete('new');
      setSearchParams(searchParams);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, formData);
        pushToast('Produit mis a jour', 'success');
      } else {
        await api.post('/products', formData);
        pushToast('Produit cree', 'success');
      }
      closeModal();
      fetchProducts();
    } catch (error) {
      const apiData = error.response?.data;
      const fieldErrors = apiData?.fieldErrors;
      const message =
        (fieldErrors && Object.values(fieldErrors)[0]) ||
        apiData?.message ||
        apiData?.error ||
        'Erreur lors de l\'enregistrement';
      setSubmitError(message);
      pushToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      taxRate: product.taxRate || 20,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    try {
      await api.delete(`/products/${id}`);
      pushToast('Produit supprime', 'success');
      fetchProducts();
    } catch (error) {
      pushToast(error.response?.data?.message || 'Erreur suppression produit', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Produits</h2>
          <p className="text-sm text-[var(--pf-neutral-600)]">Catalogue des services et produits.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} disabled={!hasCompany}>
          <Plus size={16} /> Nouveau produit
        </Button>
      </div>

      <Card>
        {!hasCompany ? (
          <EmptyState
            icon={Package}
            title="Entreprise non configuree"
            description="Configurez d'abord votre entreprise pour activer le catalogue."
            ctaLabel="Configurer entreprise"
            onCta={() => navigate('/settings?tab=entreprise')}
          />
        ) : products.length === 0 && !loading ? (
          <EmptyState
            icon={Package}
            title="Aucun produit"
            description="Creez votre premier produit pour alimenter vos devis et factures."
            ctaLabel="Creer premier produit"
            onCta={() => setIsModalOpen(true)}
          />
        ) : (
          <Table
            columns={[
              { key: 'name', label: 'Produit' },
              { key: 'price', label: 'Prix HT', align: 'right' },
              { key: 'tax', label: 'TVA', align: 'right' },
              { key: 'actions', label: 'Actions', align: 'right' },
            ]}
          >
            {loading ? (
              <TableSkeleton colSpan={4} rows={5} />
            ) : (
              products.map((product, index) => (
                <TableRow key={product._id} zebra={index % 2 === 1}>
                  <TableCell>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-[var(--pf-neutral-600)]">{product.description || 'Sans description'}</p>
                  </TableCell>
                  <TableCell align="right" className="font-medium">{Number(product.price).toLocaleString()} DH</TableCell>
                  <TableCell align="right"><Badge tone="neutral">{product.taxRate}%</Badge></TableCell>
                  <TableCell align="right">
                    <div className="inline-flex gap-2">
                      <button type="button" className="rounded p-1.5 hover:bg-[var(--pf-neutral-100)]" onClick={() => handleEdit(product)}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="rounded p-1.5 text-[var(--pf-danger)] hover:bg-[var(--pf-danger-bg)]" onClick={() => handleDelete(product._id)}>
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

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        isEditing={Boolean(editingId)}
        formData={formData}
        setFormData={setFormData}
        submitError={submitError}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </div>
  );
}
