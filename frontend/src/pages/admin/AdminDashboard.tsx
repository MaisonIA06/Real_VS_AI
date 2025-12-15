import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  LayoutDashboard,
  Image,
  FileQuestion,
  FolderOpen,
  Users,
  TrendingUp,
  Trophy,
  Clock,
} from 'lucide-react';
import { adminApi } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

const COLORS = ['#d946ef', '#22d3ee', '#f59e0b', '#22c55e'];

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats().then((res) => res.data),
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const statsCards = [
    {
      title: 'Catégories',
      value: stats?.total_categories || 0,
      icon: FolderOpen,
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/20',
      link: '/admin/categories',
    },
    {
      title: 'Paires de médias',
      value: stats?.total_pairs || 0,
      icon: Image,
      color: 'text-accent-400',
      bgColor: 'bg-accent-500/20',
      link: '/admin/pairs',
    },
    {
      title: 'Quiz',
      value: stats?.total_quizzes || 0,
      icon: FileQuestion,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      link: '/admin/quizzes',
    },
    {
      title: 'Sessions jouées',
      value: stats?.completed_sessions || 0,
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      link: '/leaderboard',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-dark-400">Vue d'ensemble de Real vs AI</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => {
            const CardContent = (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`card ${stat.link ? 'cursor-pointer hover:bg-dark-700 transition-colors' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <div className="text-sm text-dark-400">{stat.title}</div>
                  </div>
                </div>
              </motion.div>
            );

            return stat.link ? (
              <Link key={stat.title} to={stat.link}>
                {CardContent}
              </Link>
            ) : (
              <div key={stat.title}>{CardContent}</div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Average Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-400" />
              Score moyen
            </h3>
            <div className="text-5xl font-bold gradient-text mb-2">
              {stats?.average_score?.toFixed(0) || 0}
            </div>
            <p className="text-dark-400">points par partie</p>
          </motion.div>

          {/* Top Pairs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
          >
            <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Image className="w-5 h-5 text-accent-400" />
              Paires les plus jouées
            </h3>
            {stats?.top_pairs && stats.top_pairs.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.top_pairs.slice(0, 5)}>
                  <XAxis
                    dataKey="media_pair__category__name"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="total_attempts" fill="#d946ef" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-dark-400 text-center py-8">Aucune donnée disponible</p>
            )}
          </motion.div>
        </div>

        {/* Recent Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Sessions récentes
          </h3>
          {stats?.recent_sessions && stats.recent_sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table-admin">
                <thead>
                  <tr>
                    <th>Pseudo</th>
                    <th>Score</th>
                    <th>Streak Max</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_sessions.map((session, index) => (
                    <tr key={index}>
                      <td className="font-semibold">{session.pseudo || 'Anonyme'}</td>
                      <td className="gradient-text font-bold">{session.score}</td>
                      <td>{session.streak_max}</td>
                      <td className="text-dark-400">
                        {new Date(session.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-dark-400 text-center py-8">Aucune session récente</p>
          )}
        </motion.div>
      </div>
    </AdminLayout>
  );
}

