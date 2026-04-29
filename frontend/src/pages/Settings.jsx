import React, { useEffect, useState } from 'react';
import { Building2, Hash, Mail, MapPin, Percent, Phone, Save, ShieldCheck, User, Lock, Eye, EyeOff } from 'lucide-react';
import { CircularProgress } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../store/authStore';
import api from '../api/client';

const adminSchema = z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  email: z.string().email("Format d'email invalide"),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'Minimum 8 caractères').optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) return false;
  return true;
}, { message: 'Les mots de passe ne correspondent pas', path: ['confirmPassword'] });

const companySchema = z.object({
  name: z.string().min(2, 'Raison sociale requise'),
  taxId: z.string().min(5, 'ICE invalide'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(10, 'Téléphone invalide'),
  address: z.string().min(5, 'Adresse trop courte'),
  currency: z.string().default('DH'),
  defaultVat: z.number().min(0).max(100),
  quotePrefix: z.string().min(1),
  invoicePrefix: z.string().min(1),
});

const cardClass = 'rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white p-5 shadow-sm md:p-6';
const inputClass = 'w-full rounded-[var(--pf-radius-md)] border border-[var(--pf-border)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--pf-primary)] focus:ring-4 focus:ring-[var(--pf-primary-bg)]';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--pf-neutral-600)]';

function FieldError({ error }) {
  if (!error) return null;
  return <p className="mt-1 text-xs font-medium text-[var(--pf-danger)]">{error.message}</p>;
}

function SaveButton({ isSaving, label = 'Enregistrer', form }) {
  return (
    <button
      type="submit"
      form={form}
      disabled={isSaving}
      className="inline-flex items-center gap-2 rounded-[var(--pf-radius-md)] bg-[var(--pf-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[color-mix(in_oklab,var(--pf-primary),black_10%)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSaving ? <CircularProgress size={16} className="!text-current" thickness={6} /> : <Save size={16} />}
      {isSaving ? 'Enregistrement...' : label}
    </button>
  );
}

export default function Settings() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [companySaving, setCompanySaving] = useState(false);
  const [securitySaving, setSecuritySaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [companyError, setCompanyError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const hasCompany = Boolean(
    user?.companyId
    || user?.company?._id
    || (typeof user?.company === 'string' ? user.company : null)
  );
  const canAccessSecurity = user?.role === 'admin';

  const {
    register: registerCompany,
    handleSubmit: handleCompanySubmit,
    formState: { errors: companyErrors },
    reset: resetCompany,
  } = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      taxId: '',
      email: '',
      phone: '',
      address: '',
      currency: 'DH',
      defaultVat: 20,
      quotePrefix: 'DEVIS-',
      invoicePrefix: 'FACT-',
    },
  });

  const {
    register: registerAdmin,
    handleSubmit: handleAdminSubmit,
    formState: { errors: adminErrors },
    reset: resetAdmin,
  } = useForm({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    resetCompany({
      name: user?.company?.name || '',
      taxId: user?.company?.taxId || '',
      email: user?.company?.email || '',
      phone: user?.company?.phone || '',
      address: user?.company?.address || '',
      currency: user?.company?.settings?.currency || 'DH',
      defaultVat: user?.company?.settings?.defaultVat || 20,
      quotePrefix: user?.company?.settings?.quotePrefix || 'DEVIS-',
      invoicePrefix: user?.company?.settings?.invoicePrefix || 'FACT-',
    });
  }, [resetCompany, user?.company]);

  useEffect(() => {
    resetAdmin({
      name: user?.name || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  }, [resetAdmin, user?.email, user?.name]);

  const companyMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        name: data.name,
        taxId: data.taxId,
        email: data.email,
        phone: data.phone,
        address: data.address,
        settings: {
          currency: data.currency,
          defaultVat: data.defaultVat,
          quotePrefix: data.quotePrefix,
          invoicePrefix: data.invoicePrefix,
        },
      };

      if (hasCompany) {
        const res = await api.put('/company', payload);
        return res.data;
      }

      const res = await api.post('/me/company', payload);
      return res.data;
    },
    onSuccess: async (res) => {
      setCompanyError(null);
      setNotification(hasCompany ? 'Paramètres entreprise mis à jour avec succès !' : 'Entreprise configurée avec succès !');

      if (hasCompany && res.data) {
        useAuthStore.getState().setUser({
          ...useAuthStore.getState().user,
          company: res.data,
        });
      }

      await useAuthStore.getState().fetchMe();
    },
    onError: (error) => {
      const responseData = error.response?.data || {};
      setCompanyError({
        code: responseData.code || 'COMPANY_SAVE_ERROR',
        message: responseData.message || 'Impossible de sauvegarder les paramètres de l\'entreprise.',
      });
    },
    onSettled: () => setCompanySaving(false),
  });

  const adminMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        name: data.name,
        email: data.email,
        ...(data.newPassword ? { password: data.newPassword } : {}),
      };
      const response = await api.put('/auth/profile', payload);
      return response.data;
    },
    onSuccess: async (res) => {
      setNotification('Profil administrateur sécurisé !');
      if (res.data) {
        queryClient.setQueryData(['me'], res.data);
      }
      resetAdmin({
        name: res.data.name,
        email: res.data.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      await useAuthStore.getState().fetchMe();
    },
    onSettled: () => setSecuritySaving(false),
  });

  const onSubmitCompany = (data) => {
    setCompanySaving(true);
    companyMutation.mutate(data);
  };

  const onSubmitAdmin = (data) => {
    setSecuritySaving(true);
    adminMutation.mutate(data);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--pf-neutral-900)]">Paramètres</h2>
        <p className="mt-1 text-sm text-[var(--pf-neutral-600)]">Configurez votre entreprise, vos séquences et la sécurité du compte.</p>
      </div>

      {notification ? (
        <div className="rounded-[var(--pf-radius-md)] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {notification}
        </div>
      ) : null}

      {companyError ? (
        <div className="rounded-[var(--pf-radius-md)] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <p className="font-semibold">{companyError.message}</p>
          {companyError.code === 'USER_HAS_NO_COMPANY' ? (
            <p className="mt-1 text-xs font-medium">Créez d'abord une entreprise pour continuer.</p>
          ) : null}
        </div>
      ) : null}

      {!hasCompany ? (
        <div className="rounded-[var(--pf-radius-md)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Configurez votre société pour activer les clients, produits, devis et factures.
        </div>
      ) : null}

      <form id="company-form" onSubmit={handleCompanySubmit(onSubmitCompany)} className="space-y-6">
        <section className={cardClass}>
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-[var(--pf-neutral-900)]">Entreprise</h3>
            <p className="mt-1 text-sm text-[var(--pf-neutral-600)]">Informations légales et coordonnées de votre société.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={labelClass}><Building2 size={14} className="mr-1 inline" />Raison sociale</label>
              <input className={inputClass} {...registerCompany('name')} placeholder="Ex: Atlas Solutions SARL" />
              <FieldError error={companyErrors.name} />
            </div>

            <div>
              <label className={labelClass}><Mail size={14} className="mr-1 inline" />Email</label>
              <input className={inputClass} {...registerCompany('email')} placeholder="contact@entreprise.com" />
              <FieldError error={companyErrors.email} />
            </div>

            <div>
              <label className={labelClass}><Hash size={14} className="mr-1 inline" />Identifiant fiscal / ICE</label>
              <input className={inputClass} {...registerCompany('taxId')} placeholder="00123XXXXXXXX" />
              <FieldError error={companyErrors.taxId} />
            </div>

            <div>
              <label className={labelClass}><Phone size={14} className="mr-1 inline" />Téléphone</label>
              <input className={inputClass} {...registerCompany('phone')} placeholder="+212 5XX XXX XXX" />
              <FieldError error={companyErrors.phone} />
            </div>

            <div>
              <label className={labelClass}><MapPin size={14} className="mr-1 inline" />Adresse</label>
              <input className={inputClass} {...registerCompany('address')} placeholder="Adresse complète" />
              <FieldError error={companyErrors.address} />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <SaveButton isSaving={companySaving} form="company-form" />
          </div>
        </section>

        <section className={cardClass}>
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-[var(--pf-neutral-900)]">Séquences & Taxes</h3>
            <p className="mt-1 text-sm text-[var(--pf-neutral-600)]">Préférences de facturation et conventions de numérotation.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelClass}>Devise</label>
              <input className={inputClass} {...registerCompany('currency')} />
              <FieldError error={companyErrors.currency} />
            </div>

            <div>
              <label className={labelClass}><Percent size={14} className="mr-1 inline" />TVA (%)</label>
              <input type="number" className={inputClass} {...registerCompany('defaultVat', { valueAsNumber: true })} />
              <FieldError error={companyErrors.defaultVat} />
            </div>

            <div>
              <label className={labelClass}>Préfixe devis</label>
              <input className={inputClass} {...registerCompany('quotePrefix')} />
              <FieldError error={companyErrors.quotePrefix} />
            </div>

            <div>
              <label className={labelClass}>Préfixe facture</label>
              <input className={inputClass} {...registerCompany('invoicePrefix')} />
              <FieldError error={companyErrors.invoicePrefix} />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <SaveButton isSaving={companySaving} form="company-form" />
          </div>
        </section>
      </form>

      {canAccessSecurity ? (
        <form id="security-form" onSubmit={handleAdminSubmit(onSubmitAdmin)}>
          <section className={cardClass}>
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-[var(--pf-neutral-900)]">Sécurité (mot de passe)</h3>
              <p className="mt-1 text-sm text-[var(--pf-neutral-600)]">Mettez à jour vos informations de connexion et votre mot de passe.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}><User size={14} className="mr-1 inline" />Nom administrateur</label>
                <input className={inputClass} {...registerAdmin('name')} placeholder="Nom complet" />
                <FieldError error={adminErrors.name} />
              </div>

              <div>
                <label className={labelClass}><Mail size={14} className="mr-1 inline" />Email de connexion</label>
                <input className={inputClass} {...registerAdmin('email')} placeholder="admin@example.com" />
                <FieldError error={adminErrors.email} />
              </div>

              <div>
                <label className={labelClass}><Lock size={14} className="mr-1 inline" />Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`${inputClass} pr-10`}
                    {...registerAdmin('newPassword')}
                    placeholder="Laisser vide pour conserver"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--pf-neutral-500)]"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <FieldError error={adminErrors.newPassword} />
              </div>

              <div>
                <label className={labelClass}><ShieldCheck size={14} className="mr-1 inline" />Confirmer mot de passe</label>
                <input
                  type="password"
                  className={inputClass}
                  {...registerAdmin('confirmPassword')}
                  placeholder="Répétez le nouveau mot de passe"
                />
                <FieldError error={adminErrors.confirmPassword} />
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <SaveButton isSaving={securitySaving} form="security-form" />
            </div>
          </section>
        </form>
      ) : null}
    </div>
  );
}
