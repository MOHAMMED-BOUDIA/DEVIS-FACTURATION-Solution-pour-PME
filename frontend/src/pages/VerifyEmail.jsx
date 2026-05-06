import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const VerifyEmail = () => {
  const [code, setCode] = useState('');
  const [state, setState] = useState({ status: 'idle', message: 'Entrez le code a 6 chiffres recu par email.' });

  const onSubmit = async (event) => {
    event.preventDefault();

    const cleanedCode = code.replace(/\D/g, '').slice(0, 6);
    setCode(cleanedCode);

    if (!/^\d{6}$/.test(cleanedCode)) {
      setState({ status: 'error', message: 'Le code doit contenir 6 chiffres.' });
      return;
    }

    setState({ status: 'loading', message: 'Verification en cours...' });

    try {
      const response = await api.post('/auth/verify-email', { code: cleanedCode });
      setState({
        status: 'success',
        message: response.data?.message || 'Votre adresse email a ete verifiee.',
      });
    } catch (error) {
      setState({
        status: 'error',
        message: error.response?.data?.message || 'La verification a echoue.',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl shadow-slate-200/70 border border-slate-100 p-8 md:p-10">
        <div className="text-center space-y-4">
          <div className={`mx-auto h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-black ${state.status === 'success' ? 'bg-emerald-100 text-emerald-700' : state.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
            {state.status === 'success' ? '✓' : state.status === 'error' ? '!' : '6'}
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Verification du compte</h1>
          <p className={`text-sm font-medium ${state.status === 'success' ? 'text-emerald-700' : state.status === 'error' ? 'text-red-600' : 'text-slate-500'}`}>
            {state.message}
          </p>
          {state.status !== 'success' ? (
            <form onSubmit={onSubmit} className="pt-4 space-y-4 text-left">
              <div>
                <label htmlFor="verification-code" className="mb-2 block text-sm font-black text-slate-700">
                  Code de verification
                </label>
                <input
                  id="verification-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(event) => {
                    const nextValue = event.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(nextValue);
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-2xl font-black tracking-[0.45em] text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                  placeholder="000000"
                />
              </div>
              <button
                type="submit"
                disabled={state.status === 'loading'}
                className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-white font-black hover:bg-brand-700 transition-colors disabled:opacity-70"
              >
                {state.status === 'loading' ? 'Verification...' : 'Verifier le code'}
              </button>
            </form>
          ) : (
            <div className="pt-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-white font-black hover:bg-brand-700 transition-colors"
              >
                Aller a la connexion
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;