import { motion } from 'framer-motion'
import {
  Clock,
  TrendingUp,
  ShieldCheck,
  Smartphone,
  HeadphonesIcon,
  Database,
} from 'lucide-react'

const benefits = [
  {
    icon: Clock,
    title: 'Gagnez un temps précieux',
    description:
      'Automatisez la création de vos devis et factures. Fini les modèles Word et les calculs manuels.',
  },
  {
    icon: TrendingUp,
    title: 'Augmentez votre trésorerie',
    description:
      'Suivez vos impayés en temps réel et relancez automatiquement vos clients en retard de paiement.',
  },
  {
    icon: ShieldCheck,
    title: 'Documentez vos échanges',
    description:
      'Tous vos documents sont horodatés, sécurisés et accessibles depuis n\'importe où.',
  },
  {
    icon: Smartphone,
    title: 'Accessible partout',
    description:
      'Responsive et disponible sur tous vos appareils. Gérez votre entreprise depuis votre mobile.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Support réactif',
    description:
      'Une équipe à votre écoute pour vous accompagner. Assistance par email et chat en direct.',
  },
  {
    icon: Database,
    title: 'Données sécurisées',
    description:
      'Hébergement sécurisé, chiffrement SSL et sauvegardes quotidiennes. Vos données sont protégées.',
  },
]

export default function Benefits() {
  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-white via-brand-50/40 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200/60 text-sm font-semibold text-brand-700 mb-4">
            Avantages
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Pourquoi choisir QuickDevis ?
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Des milliers de PME nous font confiance. Voici pourquoi.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="flex gap-5"
            >
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 text-brand-600">
                <benefit.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{benefit.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
