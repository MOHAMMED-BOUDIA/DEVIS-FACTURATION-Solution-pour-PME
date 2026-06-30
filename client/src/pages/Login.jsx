import React from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, BarChart3 } from 'lucide-react';
import { Input, Button } from '../components/UI';
import useAuthStore from '../store/authStore';

const loginSchema = z.object({
  email: z.string().min(1, "L'email est requis").email("Format invalide"),
  password: z.string().min(6, 'Minimum 6 caracteres'),
  remember: z.boolean().optional(),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, isAuthenticated, initialized } = useAuthStore();
  const navigate = useNavigate();

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
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    const result = await login(data.email, data.password, data.remember || false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      if (result.error.errorCode === 'USER_NOT_FOUND') {
        setError('email', {
          type: 'manual',
          message: result.error.message,
        });
      } else if (result.error.errorCode === 'INVALID_PASSWORD') {
        setError('password', {
          type: 'manual',
          message: result.error.message,
        });
      } else {
        setError('root.serverError', {
          message: result.error.message,
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      <div className="flex-1 flex flex-col justify-center px-8 md:px-20 lg:px-32 py-12">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl shadow-brand-100 border border-slate-200/70 overflow-hidden bg-white">
                <img src="/devis.png" alt="QuickDevis" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-black font-display tracking-tight text-slate-900">QuickDevis</span>
            </div>
          </div>

          <h1 className="text-4xl font-black text-slate-900 mb-2 leading-tight tracking-tight">
            Bon retour parmi nous.
          </h1>
          <p className="text-slate-500 font-medium mb-10 text-lg">
            Gerez votre facturation en toute serenite.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {errors.root?.serverError && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold animate-shake">
                {errors.root.serverError.message}
              </div>
            )}

            <Input
              label="Adresse Email Professionnelle"
              placeholder="nom@entreprise.com"
              icon={Mail}
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className="label-modern">Mot de passe</label>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  icon={Lock}
                  error={errors.password?.message}
                  wrapperClassName="!space-y-0"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input type="checkbox" id="rem" className="w-5 h-5 rounded-lg border-slate-200 text-brand-600 focus:ring-brand-500/10" {...register('remember')} />
              <label htmlFor="rem" className="ml-3 text-sm font-bold text-slate-600 cursor-pointer">Rester connecte 30 jours</label>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion...
                </div>
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={18} className="ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-10 text-center text-slate-500 font-medium text-sm">
            Pas encore client ? <Link to="/register" className="text-brand-600 font-black hover:underline ml-1">Creez un compte gratuitement</Link>
          </p>

          <div className="mt-20 pt-10 border-t border-slate-100 space-y-8">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-brand-50 text-brand-600 rounded-xl"><ShieldCheck size={24} /></div>
              <div>
                <h4 className="font-bold text-slate-900">Securite de grade bancaire</h4>
                <p className="text-sm text-slate-500 leading-relaxed">Vos donnees sont protegees selon les normes europeennes les plus strictes.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-brand-50 text-brand-600 rounded-xl"><BarChart3 size={24} /></div>
              <div>
                <h4 className="font-bold text-slate-900">Analyses predictives</h4>
                <p className="text-sm text-slate-500 leading-relaxed">Anticipez vos besoins de tresorerie grace a nos algorithmes intelligents.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-[0.85] bg-slate-950 relative overflow-hidden items-center justify-center">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 right-10 w-96 h-96 bg-brand-500 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10 p-20 text-center max-w-lg">
          <div className="mb-12 inline-flex items-center space-x-3 bg-white/5 border border-white/10 px-6 py-2 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-white text-xs font-bold uppercase tracking-widest">Performance Directe</span>
          </div>
          <h2 className="text-5xl font-black text-white font-display mb-8 leading-tight tracking-tighter">Propulsez votre PME vers le futur.</h2>
          <div className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="text-left">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Facture</p>
                <p className="text-3xl font-black text-white mt-1">128.450 DH</p>
              </div>
              <div className="p-3 bg-brand-500 text-white rounded-2xl shadow-lg shadow-brand-500/20"><BarChart3 /></div>
            </div>
            <div className="flex space-x-2">
              {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                <div key={i} className="flex-1 bg-white/10 rounded-full h-16 relative overflow-hidden">
                  <div className="absolute bottom-0 w-full bg-brand-500 transition-all duration-1000" style={{ height: `${h}%` }}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
