import React from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, User, ArrowRight, ShieldCheck, BarChart3, Clock, CheckCircle2, Building2, Hash } from 'lucide-react';
import { Input, Button } from '../components/UI';
import useAuthStore from '../store/authStore';

const registerSchema = z.object({
  name: z.string().min(2, 'Le nom est trop court'),
  companyName: z.string().min(2, "Le nom de l'entreprise est requis"),
  companyTaxId: z.string().min(3, "L'identifiant fiscal est requis"),
  email: z.string().min(1, "L'email est requis").email('Format invalide'),
  password: z.string().min(6, 'Minimum 6 caracteres'),
  terms: z.literal(true, {
    errorMap: () => ({ message: 'Vous devez accepter les conditions' }),
  }),
});

const Register = () => {
  const { register: signup, loading, isAuthenticated, initialized } = useAuthStore();
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (initialized && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [initialized, isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    const result = await signup(data.name, data.email, data.password, data.companyName, data.companyTaxId);

    if (result.success) {
      setSuccessMessage(result.message || 'Votre compte a ete cree. Verifiez votre boite mail pour activer le compte.');
    } else {
      const errorMessage = result.error?.message || 'Une erreur est survenue';

      if (errorMessage.toLowerCase().includes('email')) {
        setError('email', { type: 'manual', message: 'Cet email est deja utilise' });
      } else {
        setError('root', { type: 'server', message: errorMessage });
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      <div className="flex-1 flex flex-col justify-center px-8 md:px-20 lg:px-32 py-12">
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center space-x-2 mb-16">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-brand-100 border border-slate-200/70">
              <img src="/logo.png" alt="CRM" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-black font-display tracking-tight">CRM</span>
          </div>

          <h1 className="text-4xl font-black text-slate-900 mb-2 leading-tight tracking-tight">
            Commencez maintenant.
          </h1>
          <p className="text-slate-500 font-medium mb-10 text-lg">
            Creez votre compte en moins de 2 minutes.
          </p>

          {successMessage ? (
            <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-black">
                  ✓
                </div>
                <div>
                  <h2 className="text-lg font-black text-emerald-900">Code de verification envoyé</h2>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-emerald-700">
                    {successMessage}
                  </p>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-emerald-700">
                    Ouvrez votre boîte mail, récupérez le code à 6 chiffres, puis ouvrez l’écran de vérification.
                    Vérifiez aussi le dossier spam si vous ne voyez rien.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link to="/verify-email" className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-emerald-700">
                      Entrer le code
                    </Link>
                    <button
                      type="button"
                      onClick={() => setSuccessMessage('')}
                      className="inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-white px-5 py-3 text-sm font-black text-emerald-700 transition-colors hover:bg-emerald-100"
                    >
                      Modifier le formulaire
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {errors.root?.message && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold animate-shake">
                  {errors.root.message}
                </div>
              )}

              <Input
                label="Nom Complet"
                placeholder="Ex: Jean Dupont"
                icon={User}
                error={errors.name?.message}
                {...register('name')}
              />

              <Input
                label="Adresse Email Professionnelle"
                placeholder="nom@entreprise.com"
                icon={Mail}
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Nom de l'entreprise"
                placeholder="Ex: Atlas Consulting"
                icon={Building2}
                error={errors.companyName?.message}
                {...register('companyName')}
              />

              <Input
                label="Identifiant fiscal (ICE/IF)"
                placeholder="Ex: 001234567000089"
                icon={Hash}
                error={errors.companyTaxId?.message}
                {...register('companyTaxId')}
              />

              <Input
                label="Mot de passe"
                type="password"
                placeholder="••••••••"
                icon={Lock}
                error={errors.password?.message}
                {...register('password')}
              />

              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="terms"
                    className={`mt-1 w-5 h-5 rounded-lg border-slate-200 text-brand-600 focus:ring-brand-500/10 ${errors.terms ? 'border-red-500' : ''}`}
                    {...register('terms')}
                  />
                  <label htmlFor="terms" className="ml-3 text-sm font-bold text-slate-600 cursor-pointer leading-tight">
                    J'accepte les <Link to="#" className="text-brand-600 underline">Conditions Generales</Link> et la <Link to="#" className="text-brand-600 underline">Politique de Confidentialite</Link>
                  </label>
                </div>
                {errors.terms && <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider">{errors.terms.message}</p>}
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creation...
                  </div>
                ) : (
                  <>
                    Creer mon compte
                    <ArrowRight size={18} className="ml-2" />
                  </>
                )}
              </Button>
            </form>
          )}

          <p className="mt-10 text-center text-slate-500 font-medium text-sm">
            Deja inscrit ? <Link to="/login" className="text-brand-600 font-black hover:underline ml-1">Connectez-vous ici</Link>
          </p>

          <div className="mt-16 pt-10 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 size={18} /></div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Factures conformes</h4>
                <p className="text-[11px] text-slate-500">100% legal et securise</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ShieldCheck size={18} /></div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Zero engagement</h4>
                <p className="text-[11px] text-slate-500">Annulez a tout moment</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-slate-900 relative items-center justify-center p-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[120px] -mr-40 -mt-40 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -ml-20 -mb-20" />

        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-white text-xs font-black uppercase tracking-widest mb-8">
            <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded-md bg-white/95 p-0.5">
              <img src="/logo.png" alt="CRM" className="h-full w-full object-contain" />
            </span>
            Rejoignez 5,000+ entreprises
          </div>

          <h2 className="text-5xl font-black text-white leading-tight tracking-tight mb-8">
            Simplifiez votre facturation des aujourd'hui.
          </h2>

          <div className="space-y-6">
            {[
              { icon: BarChart3, title: 'Statistiques en temps reel', desc: "Suivez votre CA et vos impayes d'un seul coup d'oeil." },
              { icon: Clock, title: 'Automatisation complete', desc: 'Gagnez 5h par semaine sur vos taches administratives.' },
              { icon: ShieldCheck, title: 'Donnees chiffrees', desc: 'Vos informations sont stockees sur des serveurs securises.' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-white/5 transition-colors group">
                <div className="p-3 bg-white/10 text-white rounded-xl group-hover:bg-brand-500 transition-colors">
                  <item.icon size={22} />
                </div>
                <div>
                  <h4 className="text-white font-black text-base">{item.title}</h4>
                  <p className="text-slate-300 text-sm leading-relaxed mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
