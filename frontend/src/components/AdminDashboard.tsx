'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Calendar, Clock, TrendingUp, Building2, GraduationCap, Briefcase, Filter } from 'lucide-react';
import api from '@/lib/axios';

interface Stats {
  summary: {
    totalVisits: number;
    uniqueVisitors: number;
    activeNow: number;
    peakHour: string;
    averageDuration: string;
  };
  breakdown: {
    byReason: Array<{ label: string; count: number; percentage: string }>;
    byCollege: Array<{ college: string; count: number; percentage: string }>;
    byEmployment: { students: number; teachers: number; staff: number };
  };
  filters: {
    availableColleges: string[];
    availableReasons: string[];
  };
}

export default function AdminDashboard() {
  const [period, setPeriod] = useState<'day' | 'week' | 'custom'>('day');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [filters, setFilters] = useState({ college: 'all', reason: 'all', isEmployee: 'all' });
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [period, customStart, customEnd, filters]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period,
        ...(period === 'custom' && customStart && customEnd ? { startDate: customStart, endDate: customEnd } : {}),
        ...(filters.college !== 'all' ? { college: filters.college } : {}),
        ...(filters.reason !== 'all' ? { reason: filters.reason } : {}),
        ...(filters.isEmployee !== 'all' ? { isEmployee: filters.isEmployee } : {}),
      });
      const res = await api.get(`/api/stats/visitor-stats?${params}`);
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) return <div className="text-center py-12">Loading statistics...</div>;

  const statCards = [
    { title: 'Total Visits', value: stats.summary.totalVisits, icon: Users, color: 'bg-blue-500', trend: 'Current period' },
    { title: 'Unique Visitors', value: stats.summary.uniqueVisitors, icon: GraduationCap, color: 'bg-green-500', trend: 'Distinct users' },
    { title: 'Currently Active', value: stats.summary.activeNow, icon: Clock, color: 'bg-orange-500', trend: 'Checked in now' },
    { title: 'Peak Hour', value: stats.summary.peakHour, icon: TrendingUp, color: 'bg-purple-500', trend: 'Busiest time' },
    { title: 'Avg. Duration', value: stats.summary.averageDuration, icon: Calendar, color: 'bg-pink-500', trend: 'Time spent' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg"
      >
        <h2 className="text-2xl font-bold">Welcome to NEU Library!</h2>
        <p className="text-blue-100 mt-1">Administrator Dashboard • Visitor Analytics</p>
      </motion.div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
            <div className="flex gap-2">
              {(['day', 'week', 'custom'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    period === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p === 'custom' ? 'Custom Range' : `This ${p}`}
                </button>
              ))}
            </div>
          </div>

          {period === 'custom' && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}

          <div className="flex gap-2 items-center ml-auto flex-wrap">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filters.college}
              onChange={(e) => setFilters(f => ({ ...f, college: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Colleges</option>
              {stats.filters.availableColleges.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filters.reason}
              onChange={(e) => setFilters(f => ({ ...f, reason: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Reasons</option>
              {stats.filters.availableReasons.map(r => (
                <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <select
              value={filters.isEmployee}
              onChange={(e) => setFilters(f => ({ ...f, isEmployee: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Visitors</option>
              <option value="false">Students Only</option>
              <option value="true">Employees Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <AnimatePresence>
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.trend}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Reason */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-sm border p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Visits by Reason
          </h3>
          {stats.breakdown.byReason.length === 0 ? (
            <p className="text-gray-500 text-sm">No data for this period.</p>
          ) : (
            <div className="space-y-3">
              {stats.breakdown.byReason.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-32 text-sm text-gray-600">{item.label}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        className="h-full bg-blue-500 rounded-full"
                      />
                    </div>
                  </div>
                  <div className="ml-4 text-sm font-medium text-gray-900">{item.count} ({item.percentage}%)</div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* By College */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-sm border p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-green-600" />
            Visits by College
          </h3>
          {stats.breakdown.byCollege.length === 0 ? (
            <p className="text-gray-500 text-sm">No data for this period.</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {stats.breakdown.byCollege.map((item) => (
                <div key={item.college} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-32 text-sm text-gray-600 truncate">{item.college}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        className="h-full bg-green-500 rounded-full"
                      />
                    </div>
                  </div>
                  <div className="ml-4 text-sm font-medium text-gray-900">{item.count}</div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Demographics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border p-6 lg:col-span-2"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-600" />
            Visitor Demographics
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Students', value: stats.breakdown.byEmployment.students, color: 'bg-blue-500' },
              { label: 'Teachers', value: stats.breakdown.byEmployment.teachers, color: 'bg-green-500' },
              { label: 'Staff', value: stats.breakdown.byEmployment.staff, color: 'bg-orange-500' },
            ].map((item) => (
              <div key={item.label} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                  <span className="text-white font-bold text-lg">{item.value}</span>
                </div>
                <p className="text-sm font-medium text-gray-700">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
