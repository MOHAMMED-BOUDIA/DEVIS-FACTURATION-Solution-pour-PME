import { motion } from 'framer-motion'
import { UserPlus, FileText, Send } from 'lucide-react'

const steps = [
  {
    icon: UserPlus,
    title: 'Créez votre compte',
    description:
      'Inscrivez-vous gratuitement en moins d\'une minute. Aucune carte bancaire requise.',
  },
  {
    icon: FileText,
    title: 'Personnalisez vos documents',
    description:
      'Ajoutez votre logo, vos coordonnées et définissez vos tarifs. Vos devis et factures sont prêts.',
  },
  {
    icon: Send,
    title: 'Gérez et suivez',
    description:
      'Envoyez à vos clients, suivez les paiements en temps réel et pilotez votre activité depuis le tableau de bord.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200/60 text-sm font-semibold text-brand-700 mb-4">
            Comment ça marche
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Prêt en 3 minutes chrono
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Pas d'installation complexe. Pas de configuration interminable.
            Lancez-vous immédiatement.
          </p>
        </motion.div>

        <div className="relative grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative text-center"
            >
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-brand-200 to-brand-100" />
              )}
              <div className="relative mx-auto mb-6 flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200/60">
                <step.icon className="w-10 h-10 text-brand-600" />
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-brand-600 text-white text-sm font-extrabold flex items-center justify-center shadow-md">
                  {index + 1}
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-base text-slate-500 leading-relaxed max-w-xs mx-auto">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
