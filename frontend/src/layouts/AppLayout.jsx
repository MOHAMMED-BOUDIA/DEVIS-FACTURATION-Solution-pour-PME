import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Settings,
  Shield,
  Users,
  X,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../api/client';
import GlobalSearch from '../components/GlobalSearch';
import './AppLayout.css';

function SidebarLink({ item, onClick, collapsed = false }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      aria-label={item.label}
      className={({ isActive }) => [
        'app-sidebar-link',
        isActive ? 'is-active' : '',
        collapsed ? 'is-collapsed' : '',
      ].join(' ').trim()}
    >
      <Icon size={18} className="app-sidebar-link-icon" />
      <span className="app-sidebar-link-label">{item.label}</span>
    </NavLink>
  );
}

export default function AppLayout() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [searchData, setSearchData] = useState({ clients: [], quotes: [], invoices: [] });

  const navItems = useMemo(() => {
    const baseItems = [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/clients', label: 'Clients', icon: Users },
      { to: '/products', label: 'Produits', icon: Package },
      { to: '/quotes', label: 'Devis', icon: FileText },
      { to: '/invoices', label: 'Factures', icon: Receipt },
    ];

    if (user?.role === 'admin') {
      baseItems.push({ to: '/admin/users', label: 'Utilisateurs', icon: Shield });
    }

    baseItems.push({ to: '/settings', label: 'Parametres', icon: Settings });
    return baseItems;
  }, [user?.role]);

  useEffect(() => {
    let mounted = true;

    const loadSearchData = async () => {
      try {
        const [clients, quotes, invoices] = await Promise.all([
          api.get('/clients').catch(() => ({ data: { data: [] } })),
          api.get('/quotes').catch(() => ({ data: { data: [] } })),
          api.get('/invoices').catch(() => ({ data: { data: [] } })),
        ]);

        if (mounted) {
          setSearchData({
            clients: clients.data?.data || [],
            quotes: quotes.data?.data || [],
            invoices: invoices.data?.data || [],
          });
        }
      } catch {
        if (mounted) {
          setSearchData({ clients: [], quotes: [], invoices: [] });
        }
      }
    };

    loadSearchData();
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  const pageTitle = useMemo(() => {
    const match = navItems.find((item) => location.pathname.startsWith(item.to));
    return match?.label || 'CRM';
  }, [location.pathname, navItems]);

  const resolvedCompanyId =
    user?.companyId
    || user?.company?._id
    || (typeof user?.company === 'string' ? user.company : null)
    || null;

  const hasCompany = Boolean(resolvedCompanyId);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <div className="app-shell" style={{ '--sidebar-width': sidebarExpanded ? '250px' : '70px' }}>
      <aside
        className="app-sidebar"
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        <div className={`app-brand ${sidebarExpanded ? 'is-expanded' : 'is-collapsed'}`}>
          <div className="app-brand-mark">
            <img src="/logo.png" alt="CRM" className="app-brand-logo" />
          </div>
          <div className="app-brand-text">
            
            <span className="app-brand-subtitle">Gestion PME</span>
          </div>
        </div>

        <nav className="app-sidebar-nav" aria-label="Navigation principale">
          {navItems.map((item) => (
            <SidebarLink key={item.to} item={item} collapsed={!sidebarExpanded} />
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="app-logout-button"
          title={sidebarExpanded ? undefined : 'Déconnexion'}
          aria-label="Déconnexion"
        >
          <LogOut size={18} className="app-sidebar-link-icon" />
          <span className="app-sidebar-link-label">Deconnexion</span>
        </button>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div className="app-header-left">
            <button
              type="button"
              className="app-mobile-menu-button"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu size={18} />
            </button>
            <div>
              <p className="app-eyebrow">Espace de travail</p>
              <h1 className="app-page-title">{pageTitle}</h1>
            </div>
          </div>

          <div className="app-header-search">
            <GlobalSearch
              clients={searchData.clients}
              quotes={searchData.quotes}
              invoices={searchData.invoices}
            />
          </div>

          <div className="app-header-actions">
            {!hasCompany && (
              <button
                className="app-company-alert"
                onClick={() => navigate('/settings?tab=entreprise')}
              >
                <Building2 size={14} />
                Configurer l'entreprise
              </button>
            )}
            <button onClick={() => navigate('/settings')} className="app-user-button">
              {user?.name || 'Utilisateur'}
            </button>
          </div>
        </header>

        <div className="app-content">
          <Outlet />
        </div>
      </main>

      {mobileOpen && (
        <div className="app-mobile-drawer">
          <button
            className="app-mobile-drawer-backdrop"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer"
          />
          <aside className="app-mobile-panel">
            <div className="app-mobile-panel-header">
              <div className="app-brand is-expanded">
                <div className="app-brand-mark">
                  <img src="/logo.png" alt="CRM" className="app-brand-logo" />
                </div>
                <div className="app-brand-text">
                  <span className="app-brand-name">CRM</span>
                  <span className="app-brand-subtitle">Gestion PME</span>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="app-mobile-close"
                aria-label="Fermer le menu"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="app-sidebar-nav">
              {navItems.map((item) => (
                <SidebarLink key={item.to} item={item} onClick={() => setMobileOpen(false)} />
              ))}
            </nav>

            <button onClick={handleLogout} className="app-logout-button app-logout-button-mobile">
              <LogOut size={18} className="app-sidebar-link-icon" />
              <span className="app-sidebar-link-label">Deconnexion</span>
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}