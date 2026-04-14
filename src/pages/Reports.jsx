import { useState } from 'react';
import { useQuery } from 'react-query';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  FileText,
  Download,
  Calendar,
  Activity,
  DollarSign,
  PieChart
} from 'lucide-react';
import api from '../services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('kpi');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const { data: kpis, isLoading: kpisLoading } = useQuery('kpis', async () => {
    const response = await api.get('/reports/kpis');
    return response.data;
  });
  
  const { data: timeReport, isLoading: timeLoading } = useQuery(['time-report', selectedYear], async () => {
    const response = await api.get('/reports/time-report', { params: { year: selectedYear } });
    return response.data;
  });
  
  const { data: financialReport, isLoading: financialLoading } = useQuery(['financial-report', selectedYear], async () => {
    const response = await api.get('/reports/financial-report', { params: { year: selectedYear } });
    return response.data;
  });
  
  const { data: careplanReport } = useQuery('careplan-report', async () => {
    const response = await api.get('/reports/careplan-report');
    return response.data;
  });
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec489a'];
  
  // Prepare chart data
  const timeBreakdownData = kpis?.time_breakdown?.map(item => ({
    name: item.time_range,
    value: item.patient_count
  })) || [];
  
  const topConditionsData = kpis?.top_chronic_conditions?.map(cond => ({
    name: cond.icd_code,
    patients: cond.patient_count,
    description: cond.icd_description.substring(0, 30)
  })) || [];
  
  const monthlyClaimsData = financialReport?.monthly_summary?.map(month => ({
    month: new Date(month.batch_month).toLocaleString('default', { month: 'short' }),
    created: month.total_created,
    qualified: month.total_qualified
  })) || [];
  
  const cptUsageData = financialReport?.cpt_code_usage?.map(cpt => ({
    name: cpt.cpt_code,
    count: cpt.claim_count,
    minutes: cpt.total_minutes
  })) || [];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Comprehensive insights into your CCM program performance</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="input w-28"
          >
            {[2023, 2024, 2025].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex gap-1 border-b">
        {[
          { id: 'kpi', label: 'KPI Dashboard', icon: BarChart3 },
          { id: 'time', label: 'Time Tracking', icon: Clock },
          { id: 'financial', label: 'Financial', icon: DollarSign },
          { id: 'clinical', label: 'Clinical', icon: Activity }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* KPI Dashboard Tab */}
      {activeTab === 'kpi' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="card p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Eligible Patients</p>
                  <p className="text-2xl font-bold text-gray-900">{kpis?.eligible_count || 0}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="card p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Enrolled Patients</p>
                  <p className="text-2xl font-bold text-green-600">{kpis?.enrolled_count || 0}</p>
                  <p className="text-xs text-gray-400">Pending: {kpis?.pending_enrollment_count || 0}</p>
                </div>
                <div className="bg-green-100 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="card p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Total Minutes (This Month)</p>
                  <p className="text-2xl font-bold text-purple-600">{kpis?.total_minutes || 0}</p>
                  <p className="text-xs text-gray-400">Avg: {kpis?.average_minutes || 0} min/patient</p>
                </div>
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="card p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Pending Claims</p>
                  <p className="text-2xl font-bold text-orange-600">{kpis?.pending_claims || 0}</p>
                </div>
                <div className="bg-orange-100 p-2 rounded-lg">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Consent Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Consent Type Breakdown</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RePieChart>
                  <Pie
                    data={kpis?.consent_breakdown || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(kpis?.consent_breakdown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Time-Based Activities</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={timeBreakdownData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" name="Patients" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Top Chronic Conditions */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Top 5 Chronic Conditions</h3>
            <div className="space-y-3">
              {topConditionsData.map((cond, idx) => (
                <div key={cond.name} className="flex items-center gap-4">
                  <div className="w-12 text-sm font-medium text-gray-500">{idx + 1}</div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{cond.name}</span>
                      <span className="text-gray-500">{cond.patients} patients</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${(cond.patients / (topConditionsData[0]?.patients || 1)) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{cond.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Recent Enrollments */}
          <div className="card">
            <div className="p-5 border-b">
              <h3 className="font-semibold text-gray-900">Recent Enrollments</h3>
            </div>
            <div className="divide-y">
              {kpis?.recent_enrollments?.map((enrollment) => (
                <div key={enrollment.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{enrollment.patient_name}</p>
                    <p className="text-sm text-gray-500">
                      {enrollment.program_type} • Enrolled by {enrollment.enrolled_by_name}
                    </p>
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(enrollment.enrolled_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Time Tracking Tab */}
      {activeTab === 'time' && timeReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="card p-5 text-center">
              <p className="text-sm text-gray-500">Total Enrolled Patients</p>
              <p className="text-2xl font-bold">{timeReport.summary?.total_enrolled_patients || 0}</p>
            </div>
            <div className="card p-5 text-center">
              <p className="text-sm text-gray-500">Eligible for Billing (20+ min)</p>
              <p className="text-2xl font-bold text-green-600">{timeReport.summary?.eligible_for_billing || 0}</p>
            </div>
            <div className="card p-5 text-center">
              <p className="text-sm text-gray-500">Below Threshold (&lt;20 min)</p>
              <p className="text-2xl font-bold text-yellow-600">{timeReport.summary?.below_threshold || 0}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Staff Time Distribution</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>20-39 minutes</span>
                  <span className="font-medium">{timeReport.summary?.staff_time_20_39 || 0} patients</span>
                </div>
                <div className="flex justify-between">
                  <span>40-59 minutes</span>
                  <span className="font-medium">{timeReport.summary?.staff_time_40_59 || 0} patients</span>
                </div>
                <div className="flex justify-between">
                  <span>60-89 minutes</span>
                  <span className="font-medium">{timeReport.summary?.staff_time_60_89 || 0} patients</span>
                </div>
                <div className="flex justify-between">
                  <span>90+ minutes</span>
                  <span className="font-medium">{timeReport.summary?.staff_time_90plus || 0} patients</span>
                </div>
              </div>
            </div>
            
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Professional (Physician) Time</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>30+ minutes</span>
                  <span className="font-medium">{timeReport.summary?.professional_time_30plus || 0} patients</span>
                </div>
                <div className="flex justify-between">
                  <span>60+ minutes</span>
                  <span className="font-medium">{timeReport.summary?.professional_time_60plus || 0} patients</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Patient Details Table */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="font-semibold text-gray-900">Patient Time Details</h3>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Patient</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Program</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total Minutes</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Professional</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Staff</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Sessions</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Reasons</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {timeReport.patient_details?.slice(0, 20).map((patient) => (
                    <tr key={patient.patient_id}>
                      <td className="px-4 py-2 text-sm">
                        {patient.patient_name}<br />
                        <span className="text-xs text-gray-400">{patient.account_number}</span>
                       </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          patient.program_type === 'CCM' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {patient.program_type}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-medium">{patient.total_minutes} min</td>
                      <td className="px-4 py-2">{patient.professional_minutes} min</td>
                      <td className="px-4 py-2">{patient.staff_minutes} min</td>
                      <td className="px-4 py-2">{patient.sessions_count || 0}</td>
                      <td className="px-4 py-2 text-xs text-gray-500 max-w-xs truncate">
                        {patient.reasons}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Financial Tab */}
      {activeTab === 'financial' && financialReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="card p-5 text-center">
              <p className="text-sm text-gray-500">Projected Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                ${financialReport.projected_revenue?.toLocaleString() || 0}
              </p>
            </div>
            <div className="card p-5 text-center">
              <p className="text-sm text-gray-500">Average Claim Value</p>
              <p className="text-2xl font-bold text-blue-600">
                ${financialReport.average_claim_value?.toFixed(2) || 0}
              </p>
            </div>
            <div className="card p-5 text-center">
              <p className="text-sm text-gray-500">Total Claims (YTD)</p>
              <p className="text-2xl font-bold text-purple-600">
                {financialReport.monthly_summary?.reduce((sum, m) => sum + (m.total_created || 0), 0) || 0}
              </p>
            </div>
          </div>
          
          {/* Monthly Claims Chart */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Monthly Claims Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyClaimsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="qualified" fill="#f59e0b" name="Qualified Patients" />
                <Bar dataKey="created" fill="#10b981" name="Claims Created" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* CPT Code Usage */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">CPT Code Usage</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cptUsageData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="Number of Claims" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Monthly Breakdown Table */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="font-semibold text-gray-900">Monthly Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Month</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Qualified</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Created</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Failed</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Submitted</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Paid</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Denied</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {financialReport.monthly_summary?.map((month) => (
                    <tr key={month.month}>
                      <td className="px-4 py-2 font-medium">{month.month}</td>
                      <td className="px-4 py-2">{month.total_qualified}</td>
                      <td className="px-4 py-2 text-green-600">{month.total_created}</td>
                      <td className="px-4 py-2 text-red-600">{month.total_failed}</td>
                      <td className="px-4 py-2">{month.submitted || 0}</td>
                      <td className="px-4 py-2 text-green-600">{month.paid || 0}</td>
                      <td className="px-4 py-2 text-red-600">{month.denied || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Clinical Tab */}
      {activeTab === 'clinical' && careplanReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="card p-5 text-center">
              <p className="text-sm text-gray-500">Total Enrolled</p>
              <p className="text-2xl font-bold">{careplanReport.total_enrolled}</p>
            </div>
            <div className="card p-5 text-center">
              <p className="text-sm text-gray-500">Has Care Plan</p>
              <p className="text-2xl font-bold text-green-600">{careplanReport.has_care_plan}</p>
            </div>
            <div className="card p-5 text-center">
              <p className="text-sm text-gray-500">Needs Care Plan</p>
              <p className="text-2xl font-bold text-red-600">{careplanReport.needs_care_plan}</p>
            </div>
            <div className="card p-5 text-center">
              <p className="text-sm text-gray-500">Locked Plans</p>
              <p className="text-2xl font-bold text-blue-600">{careplanReport.locked_plans}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Care Plan Metrics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Average Problems per Plan</span>
                    <span className="font-medium">{careplanReport.average_problems_per_plan}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${(careplanReport.average_problems_per_plan / 5) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Average Goals per Plan</span>
                    <span className="font-medium">{careplanReport.average_goals_per_plan}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(careplanReport.average_goals_per_plan / 5) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Care Plan Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Care Plan Completed</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{careplanReport.has_care_plan}</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(careplanReport.has_care_plan / careplanReport.total_enrolled) * 100}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Needs Care Plan</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{careplanReport.needs_care_plan}</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: `${(careplanReport.needs_care_plan / careplanReport.total_enrolled) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Patient Care Plan Status Table */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="font-semibold text-gray-900">Patient Care Plan Status</h3>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Patient</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Program</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Last Care Plan</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Days Since</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Problems</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Goals</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {careplanReport.patients?.slice(0, 30).map((patient) => (
                    <tr key={patient.patient_id}>
                      <td className="px-4 py-2 text-sm">{patient.patient_name}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          patient.program_type === 'CCM' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {patient.program_type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {patient.last_care_plan_date ? new Date(patient.last_care_plan_date).toLocaleDateString() : 'Not created'}
                      </td>
                      <td className="px-4 py-2">
                        {patient.days_since_last_plan ? (
                          <span className={`text-sm ${patient.days_since_last_plan > 30 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                            {patient.days_since_last_plan} days
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-2 text-center">{patient.problems_addressed || 0}</td>
                      <td className="px-4 py-2 text-center">{patient.goals_created || 0}</td>
                      <td className="px-4 py-2">
                        {patient.is_locked ? (
                          <span className="text-green-600 text-sm">Locked</span>
                        ) : patient.last_care_plan_date ? (
                          <span className="text-yellow-600 text-sm">In Progress</span>
                        ) : (
                          <span className="text-gray-400 text-sm">Not Started</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}