import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Clock,
  AlertCircle,
  Users,
  ArrowUpRight,
  TrendingDown,
} from 'lucide-react';
import { Card, Badge, Button } from '../components/UI';
import AppDatePicker from '../components/AppDatePicker';
import api from '../api/client';
import dayjs from 'dayjs';
import useAuthStore from '../store/authStore';

const MiniChart = ({ data, color = 'brand' }) => (
  <div className="">
    {data.map((h, i) => (
      <div key={i} className={`flex-1 rounded-sm bg-${color}-500/20 group-hover:bg-${color}-500/40 transition-colors`} style={{ height: `${h}%` }}></div>
    ))}
  </div>
);

const StatWidget = ({ title, value, icon, trend, color, data }) => {
  const IconComponent = icon;

  return (
    <Card className="hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl bg-${color}-50 text-${color}-600`}>
          {IconComponent ? <IconComponent size={24} /> : null}
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-xs font-black ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            <span>{trend > 0 ? '+' : ''}{trend}%</span>
            {trend > 0 ? <ArrowUpRight size={14} /> : <TrendingDown size={14} />}
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
        </div>
        <div className="w-20">
          <MiniChart data={data || [30, 50, 40, 70, 60, 90]} color={color} />
        </div>
      </div>
    </Card>
  );
};

const Dashboard = () => {
  const { user } = useAuthStore();
  const hasCompany = Boolean(
    user?.companyId
    || user?.company?._id
    || (typeof user?.company === 'string' ? user.company : null)
  );
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        if (!hasCompany) {
          setStats({
            totalUnpaid: 0,
            overdueCount: 0,
            monthlyRevenue: [],
            topClients: [],
            productsCount: 0,
            totalClients: 0,
            quarterly: { paymentRate: 0, totalBilled: 0, totalPaid: 0 },
            estimation: 0,
            lastInvoice: null,
          });
          return;
        }

        const month = selectedMonth.month() + 1;
        const year = selectedMonth.year();
        const response = await api.get(`/stats/summary?month=${month}&year=${year}`);
        setStats(response.data.data);
      } catch (error) {
        console.error('Stats error', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedMonth, user?.role, hasCompany]);

  const monthlyRevenue = stats?.monthlyRevenue || [];
  const latestRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0;
  const revenuePeak = Math.max(...monthlyRevenue.map((item) => item.revenue), 1);

  if (loading) {
    return <div className="p-20 text-center"><div className="animate-spin w-10 h-10 border-4 border-brand-600 border-t-white rounded-full mx-auto"></div></div>;
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Vue d'ensemble</h2>
          <p className="text-slate-500 font-medium">Suivez la sante financiere de votre PME en temps reel.</p>
        </div>
        <div className="flex items-center">
          <AppDatePicker value={selectedMonth} onChange={setSelectedMonth} mode="month" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatWidget
          title="Chiffre d'Affaire"
          value={`${latestRevenue.toLocaleString()} DH`}
          icon={TrendingUp}
          color="brand"
          data={monthlyRevenue.map((m) => (m.revenue / revenuePeak) * 100)}
        />
        <StatWidget
          title="Factures Impayees"
          value={`${(stats?.totalUnpaid || 0).toLocaleString()} DH`}
          icon={Clock}
          color="orange"
          data={[30, 50, 40, 70, 60, 90]}
        />
        <StatWidget
          title="En Retard"
          value={stats?.overdueCount || 0}
          icon={AlertCircle}
          color="red"
          data={[20, 30, 25, 40, 35, 50]}
        />
        <StatWidget
          title="Total Clients"
          value={stats?.totalClients || 0}
          icon={Users}
          color="green"
          data={[10, 20, 30, 40, 50, 60]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card title="Indicateur" subtitle="TOP 5 PAR VOLUME D'AFFAIRE" className="lg:col-span-2" action={<Button variant="ghost" size="sm">Tout voir</Button>}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats?.topClients?.map((item, idx) => (
                  <tr key={idx} className="group hover:bg-slate-50 transition-all duration-300">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-500">{item.clientDetails.name.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">{item.clientDetails.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Societe active</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge color={idx === 0 ? 'green' : 'slate'}>{idx === 0 ? 'Premium' : 'Standard'}</Badge></td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">{item.totalSpent.toLocaleString()} DH</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Objectifs Trimestriels" subtitle="REVENUS PREVISIONNELS">
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-end mb-3">
                <p className="text-sm font-bold text-slate-900">Encaissements / Facture</p>
                <p className="text-xs font-black text-brand-600">{stats?.quarterly?.paymentRate || 0}%</p>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                <div className="bg-brand-600 h-full rounded-full transition-all duration-1000" style={{ width: `${stats?.quarterly?.paymentRate || 0}%` }}></div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Estimation (Devis en cours)</p>
              <div className="flex items-baseline justify-center space-x-2">
                <span className="text-4xl font-black text-slate-900 font-display">{(stats?.estimation || 0).toLocaleString()}</span>
                <span className="text-sm font-bold text-slate-400 uppercase">DH</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Derniere Facture</span>
                <span className="text-slate-900">{stats?.lastInvoice?.invoiceNumber || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Date</span>
                <span className="text-slate-900">{stats?.lastInvoice?.createdAt ? new Date(stats.lastInvoice.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
