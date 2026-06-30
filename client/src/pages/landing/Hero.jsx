import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Shield, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const stats = [
  { label: 'Devis générés', value: '10k+' },
  { label: 'PME客户', value: '500+' },
  { label: 'Taux de satisfaction', value: '98%' },
]

const floatingBadges = [
  { Icon: Zap, label: 'Gain de temps x3', x: '15%', y: '20%', delay: 0.2 },
  { Icon: Shield, label: 'Sécurisé', x: '75%', y: '15%', delay: 0.4 },
  { Icon: Sparkles, label: '100% PDF', x: '80%', y: '70%', delay: 0.6 },
]

export default function Hero() {
  const navigate = useNavigate()

  return (
    <section className="relative min-h-screen flex items-center pt-24 sm:pt-28 pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-brand-50/60 via-white to-white pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-brand-300/20 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200/60 text-sm font-semibold text-brand-700 mb-6"
            >
              <Sparkles className="w-4 h-4" />
              La solution tout-en-un pour vos devis et factures
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tighter text-slate-900"
            >
              Gérez vos devis et factures{' '}
              <span className="bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 bg-clip-text text-transparent">
                en un clic
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-lg sm:text-xl text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Créez, envoyez et suivez vos devis et factures professionnels en toute simplicité. 
              QuickDevis automatise votre facturation pour vous permettre de vous concentrer sur l'essentiel.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <button
                onClick={() => navigate('/register')}
                className="group w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5 active:scale-[0.97] transition-all"
              >
                <span className="flex items-center gap-2">
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>
              <a
                href="#features"
                className="group w-full sm:w-auto px-8 py-4 text-base font-bold text-slate-700 bg-white border-2 border-slate-200 rounded-2xl hover:border-brand-200 hover:bg-brand-50/30 active:scale-[0.97] transition-all text-center"
              >
                Découvrir
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 flex flex-wrap items-center gap-8 justify-center lg:justify-start"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <div className="text-2xl font-extrabold text-slate-900">{stat.value}</div>
                  <div className="text-sm font-medium text-slate-500">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-50 border-b border-slate-100">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="ml-3 text-xs font-medium text-slate-400">QuickDevis Dashboard</div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-36 rounded bg-slate-100" />
                  <div className="h-8 w-28 rounded-xl bg-brand-500/10" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[80, 65, 45].map((w, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="h-3 w-12 rounded bg-slate-200" />
                      <div className={`h-7 w-${w} rounded bg-brand-100`} />
                    </div>
                  ))}
                </div>
                <div className="h-32 rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-brand-100" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/4 rounded bg-slate-200" />
                      <div className="h-3 w-1/2 rounded bg-slate-100" />
                    </div>
                    <div className="h-6 w-16 rounded-full bg-green-100" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-orange-100" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-2/3 rounded bg-slate-200" />
                      <div className="h-3 w-1/3 rounded bg-slate-100" />
                    </div>
                    <div className="h-6 w-16 rounded-full bg-brand-100" />
                  </div>
                </div>
              </div>
            </div>

            {floatingBadges.map(({ Icon, label, x, y, delay }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + delay }}
                className="absolute flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-lg border border-slate-200 text-xs font-bold text-slate-700"
                style={{ left: x, top: y }}
              >
                <Icon className="w-4 h-4 text-brand-500" />
                {label}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
