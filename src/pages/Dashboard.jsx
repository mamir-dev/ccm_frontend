import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  Clock, 
  DollarSign,
  TrendingUp,
  Activity,
  ChevronRight,
  UserPlus,
  BarChart3
} from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const { data: kpis, isLoading: kpisLoading } = useQuery('dashboard-kpis', async () => {
    const response = await api.get('/reports/kpis');
    return response.data;
  });

  const { data: billingSummary, isLoading: billingLoading } = useQuery('monthly-summary', async () => {
    const res = await api.get('/time/monthly-summary');
    return res.data;
  });

  const isLoading = kpisLoading || billingLoading;

  const stats = [
    {
      title: 'Eligible Patients',
      value: kpis?.eligible_count || 0,
      icon: Users,
      color: 'bg-blue-500',
      link: '/enrollment-queue'
    },
    {
      title: 'Enrolled Patients',
      value: kpis?.enrolled_count || 0,
      icon: UserCheck,
      color: 'bg-green-500',
      link: '/enrolled-patients'
    },
    {
      title: 'Minutes This Month',
      value: kpis?.total_minutes || 0,
      icon: Clock,
      color: 'bg-purple-500',
      link: '/reports'
    },
    {
      title: 'Claims Pending',
      value: kpis?.pending_claims || 0,
      icon: DollarSign,
      color: 'bg-orange-500',
      link: '/billing'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening with your CCM program.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              to={stat.link}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enrollments */}
        <div className="card">
          <div className="p-5 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Enrollments</h2>
              <Link to="/enrolled-patients" className="text-primary-600 text-sm hover:underline flex items-center">
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="divide-y">
            {kpis?.recent_enrollments?.map((enrollment) => (
              <div key={enrollment.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{enrollment.patient_name}</p>
                  <p className="text-sm text-gray-500">Enrolled in {enrollment.program_type}</p>
                </div>
                <span className="text-sm text-gray-400">
                  {new Date(enrollment.enrolled_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly CCM Billing Status */}
        <div className="card bg-gradient-to-br from-white to-primary-50">
          <div className="p-5 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Monthly CCM Billing Status</h2>
              <span className="text-xs font-bold text-primary-600 bg-primary-100 px-2 py-1 rounded-full uppercase">
                {new Date().toLocaleString('default', { month: 'long' })}
              </span>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                <p className="text-xl font-black text-green-700">{billingSummary?.eligible_for_billing || 0}</p>
                <p className="text-[10px] font-bold text-green-600 uppercase mt-1">Ready to Bill</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xl font-black text-blue-700">
                  {billingSummary?.patients?.filter(p => p.total_minutes > 0 && p.total_minutes < 20).length || 0}
                </p>
                <p className="text-[10px] font-bold text-blue-600 uppercase mt-1">In Progress</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xl font-black text-gray-700">
                  {billingSummary?.patients?.filter(p => p.total_minutes === 0).length || 0}
                </p>
                <p className="text-[10px] font-bold text-gray-600 uppercase mt-1">No Activity</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 font-medium">Monthly Program Goal Progress</span>
                <span className="font-bold text-primary-700">
                  {Math.round(((billingSummary?.eligible_for_billing || 0) / (billingSummary?.total_patients || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${((billingSummary?.eligible_for_billing || 0) / (billingSummary?.total_patients || 1)) * 100}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-gray-500 italic text-center">
                * Based on the 20-minute clinical staff time threshold for 99490
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/enrollment-queue"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors"
          >
            <UserPlus className="w-5 h-5 text-primary-600 mr-2" />
            <span>Enroll New Patient</span>
          </Link>
          <Link
            to="/billing"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors"
          >
            <DollarSign className="w-5 h-5 text-primary-600 mr-2" />
            <span>Generate Claims</span>
          </Link>
          <Link
            to="/reports"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-primary-600 mr-2" />
            <span>View Reports</span>
          </Link>
        </div>
      </div>
    </div>
  );
}