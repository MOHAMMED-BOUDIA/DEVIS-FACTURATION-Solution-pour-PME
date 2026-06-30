import { FileText, Code2, MessageCircle, Globe, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

const footerLinks = [
  {
    title: 'Produit',
    links: [
      { label: 'Fonctionnalités', href: '#features' },
      { label: 'Tarifs', href: '#' },
      { label: 'FAQ', href: '#' },
      { label: 'Documentation', href: '#' },
    ],
  },
  {
    title: 'Entreprise',
    links: [
      { label: 'À propos', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Nous contacter', href: '#' },
      { label: 'Carrières', href: '#' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: 'Confidentialité', href: '#' },
      { label: 'CGU', href: '#' },
      { label: 'Mentions légales', href: '#' },
      { label: 'Cookies', href: '#' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 group mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Quick<span className="text-brand-400">Devis</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              La solution de devis et facturation intelligente pour les PME.
              Simple, rapide, professionnelle.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {[
                { icon: MessageCircle, href: '#' },
                { icon: Globe, href: '#' },
                { icon: Code2, href: '#' },
                { icon: Mail, href: '#' },
              ].map(({ icon: Icon, href }) => (
                <a
                  key={href}
                  href={href}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800 text-slate-400 hover:bg-brand-600 hover:text-white transition-colors"
                >
                  <Icon className="w-[18px] h-[18px]" />
                </a>
              ))}
            </div>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-bold text-white mb-4">{group.title}</h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-brand-300 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} QuickDevis. Tous droits réservés.</p>
          <p>Fait avec passion pour les PME</p>
        </div>
      </div>
    </footer>
  )
}
