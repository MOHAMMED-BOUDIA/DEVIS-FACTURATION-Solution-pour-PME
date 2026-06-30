import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Sophie Martin',
    role: 'Gérante, SARL Martin & Fils',
    quote:
      'QuickDevis a transformé notre facturation. Ce qui nous prenait une demi-journée par semaine se fait maintenant en 30 minutes.',
    rating: 5,
  },
  {
    name: 'Karim Benali',
    role: 'Freelance, Web & Co',
    quote:
      'Le suivi des paiements en temps réel est un vrai game-changer. Je vois immédiatement qui a payé et qui est en retard.',
    rating: 5,
  },
  {
    name: 'Claire Dubois',
    role: 'Responsable administrative, TechStart',
    quote:
      'Les devis PDF sont magnifiques et professionnels. Mes clients me complimentent à chaque envoi.',
    rating: 5,
  },
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="relative py-24 sm:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200/60 text-sm font-semibold text-brand-700 mb-4">
            Témoignages
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Ils ont adopté QuickDevis
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Découvrez ce que nos utilisateurs disent de leur expérience.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((t, index) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="relative p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-[18px] h-[18px] fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-sm font-bold flex items-center justify-center">
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
