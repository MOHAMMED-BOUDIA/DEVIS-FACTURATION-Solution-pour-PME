import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  Receipt, 
  LogOut, 
  Menu, 
  X,
  Settings,
  AlertCircle,
  Bell,
  Search
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const SidebarLink = ({ to, icon: Icon, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
        isActive
          ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 translate-x-1'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`
    }
  >
    <Icon size={20} className={({ isActive }) => `transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110'}`} />
    <span className="font-semibold">{children}</span>
  </NavLink>
);

const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans selection:bg-primary-100 selection:text-primary-900">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200/60 p-6 z-20">
        <div className="flex items-center space-x-3 px-2 mb-10">
          <div className="w-10 h-10 bg-gradient-to-tr from-primary-600 to-blue-400 rounded-xl shadow-lg shadow-primary-200 flex items-center justify-center text-white">
            <img src="/logo.png" alt="CRM" className="w-full h-full object-contain" />
          </div>
          <span className="text-2xl font-bold tracking-tight font-heading bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            CRM
          </span>
        </div>

        <nav className="flex-1 space-y-1.5">
          <div className="px-4 mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Menu Principal</span>
          </div>
          <SidebarLink to="/dashboard" icon={LayoutDashboard}>Tableau de bord</SidebarLink>
          <SidebarLink to="/clients" icon={Users}>Clients</SidebarLink>
          <SidebarLink to="/products" icon={Package}>Catalogue Produits</SidebarLink>
          
          <div className="px-4 mb-4 mt-8">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Documents</span>
          </div>
          <SidebarLink to="/quotes" icon={FileText}>Mes Devis</SidebarLink>
          <SidebarLink to="/invoices" icon={Receipt}>Mes Factures</SidebarLink>
          <SidebarLink to="/unpaid" icon={AlertCircle}>Suivi Impayés</SidebarLink>
        </nav>

        <div className="mt-auto space-y-2">
          <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Support Technique</p>
            <p className="text-sm text-slate-600 mb-3">Besoin d'aide pour vos factures ?</p>
            <button className="text-primary-600 text-sm font-bold hover:underline">Ouvrir un ticket</button>
          </div>
          
          <SidebarLink to="/settings" icon={Settings}>Paramètres</SidebarLink>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-left text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-300"
          >
            <LogOut size={20} />
            <span className="font-semibold">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 lg:px-10 z-10">
          <div className="flex items-center space-x-4">
            <button
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center bg-slate-100/50 rounded-xl px-4 py-2 border border-slate-200/50 w-80 focus-within:bg-white focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all duration-300">
              <Search size={18} className="text-slate-400 mr-2" />
              <input type="text" placeholder="Rechercher..." className="bg-transparent border-none focus:ring-0 text-sm w-full" />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            
            <div className="flex items-center space-x-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{user?.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user?.company?.name || 'VOTRE SOCIÉTÉ'}</p>
              </div>
              <div className="w-11 h-11 bg-gradient-to-tr from-slate-100 to-slate-200 rounded-xl flex items-center justify-center text-slate-600 font-bold border-2 border-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsMobileMenuOpen(false)}></div>
          <aside className="fixed inset-y-0 left-0 w-72 bg-white p-6 shadow-2xl animate-in slide-in-from-left duration-500">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white">
                    <img src="/logo.png" alt="CRM" className="w-full h-full object-contain" />
                </div>
                <span className="text-xl font-bold font-heading">CRM</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>
            <nav className="space-y-1.5" onClick={() => setIsMobileMenuOpen(false)}>
              <SidebarLink to="/dashboard" icon={LayoutDashboard}>Dashboard</SidebarLink>
              <SidebarLink to="/clients" icon={Users}>Clients</SidebarLink>
              <SidebarLink to="/products" icon={Package}>Produits</SidebarLink>
              <SidebarLink to="/quotes" icon={FileText}>Devis</SidebarLink>
              <SidebarLink to="/invoices" icon={Receipt}>Factures</SidebarLink>
              <SidebarLink to="/unpaid" icon={AlertCircle}>Impayés</SidebarLink>
              <hr className="my-6 border-slate-100" />
              <SidebarLink to="/settings" icon={Settings}>Paramètres</SidebarLink>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-3 w-full text-left font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl mt-2 transition-all"
              >
                <LogOut size={20} />
                <span>Déconnexion</span>
              </button>
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
