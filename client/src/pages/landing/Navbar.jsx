import { useState, useEffect } from 'react'
import { Menu, X, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'

const navLinks = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Comment ça marche', href: '#how-it-works' },
  { label: 'Témoignages', href: '#testimonials' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-18 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/20 group-hover:shadow-lg group-hover:shadow-brand-500/30 transition-shadow">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              Quick<span className="text-brand-600">Devis</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-brand-600 transition-colors"
            >
              Connexion
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/30 hover:-translate-y-0.5 active:scale-[0.97] transition-all"
            >
              Essai gratuit
            </button>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden relative z-50 p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden absolute top-full inset-x-0 mx-4 mb-4 p-5 bg-white rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-900/10"
          >
            <nav className="flex flex-col gap-1 mb-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-sm font-semibold text-slate-600 hover:text-brand-600 rounded-xl hover:bg-brand-50 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => { setMobileOpen(false); navigate('/login') }}
                className="w-full py-3 text-sm font-bold text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Connexion
              </button>
              <button
                onClick={() => { setMobileOpen(false); navigate('/register') }}
                className="w-full py-3 text-sm font-bold text-white bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl shadow-md"
              >
                Essai gratuit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
