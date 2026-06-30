import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const perks = [
  'Gratuit pendant 14 jours',
  'Sans carte bancaire',
  'Annulation à tout moment',
]

export default function CTA() {
  const navigate = useNavigate()

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Prêt à simplifier votre facturation ?
          </h2>
          <p className="mt-4 text-lg sm:text-xl text-brand-100 max-w-2xl mx-auto">
            Rejoignez des centaines de PME qui gagnent du temps chaque jour avec QuickDevis.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => navigate('/register')}
            className="group w-full sm:w-auto px-8 py-4 text-base font-bold text-brand-700 bg-white rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.97] transition-all"
          >
            <span className="flex items-center gap-2">
              Démarrer l'essai gratuit
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white border-2 border-white/30 rounded-2xl hover:bg-white/10 active:scale-[0.97] transition-all"
          >
            En savoir plus
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
        >
          {perks.map((perk) => (
            <div key={perk} className="flex items-center gap-2 text-sm text-brand-100">
              <Check className="w-[18px] h-[18px] text-brand-200" />
              {perk}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
