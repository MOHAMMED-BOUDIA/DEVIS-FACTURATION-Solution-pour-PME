import { motion } from 'framer-motion'
import {
  FileText,
  FileSpreadsheet,
  Users,
  CreditCard,
  BarChart3,
  Bell,
  Shield,
  RefreshCw,
} from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'Devis professionnels',
    description:
      'Créez des devis personnalisés en quelques clics avec vos tarifs, taxes et conditions générales.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Facturation simplifiée',
    description:
      'Générez des factures conformes, suivez les paiements et gérez les échéances automatiquement.',
  },
  {
    icon: Users,
    title: 'Gestion clients',
    description:
      'Centralisez vos contacts, suivez l\'historique des échanges et segmentez votre portefeuille client.',
  },
  {
    icon: CreditCard,
    title: 'Suivi des paiements',
    description:
      'Visualisez l\'état de vos factures, relancez automatiquement et suivez vos encaissements en temps réel.',
  },
  {
    icon: BarChart3,
    title: 'Tableau de bord financier',
    description:
      'Pilotez votre activité avec des indicateurs clés : chiffre d\'affaires, impayés, tendances.',
  },
  {
    icon: RefreshCw,
    title: 'Mises à jour en temps réel',
    description:
      'Tout se synchronise instantanément grâce à Socket.IO. Pas de rafraîchissement manuel.',
  },
  {
    icon: Shield,
    title: 'Contrôle d\'accès',
    description:
      'Gérez les permissions de vos équipes avec des rôles personnalisés (admin, gestionnaire, utilisateur).',
  },
  {
    icon: Bell,
    title: 'Notifications intelligentes',
    description:
      'Soyez alerté des paiements reçus, des devis consultés et des échéances à venir.',
  },
]

export default function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-brand-50/30 to-white pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200/60 text-sm font-semibold text-brand-700 mb-4">
            Fonctionnalités
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Tout ce qu'il vous faut pour gérer votre facturation
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Un ensemble complet d'outils conçus pour les PME qui veulent professionaliser
            leur gestion financière.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group relative p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-brand-200/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="mb-4 flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 group-hover:from-brand-500 group-hover:to-brand-600 group-hover:text-white transition-all duration-300">
                <feature.icon className="w-[22px] h-[22px]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
