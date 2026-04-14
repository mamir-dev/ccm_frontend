import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  User, Shield, Activity, Users, Phone, Mail, 
  Calendar, ArrowLeft, Clock, Play, FileText, Plus 
} from 'lucide-react';
import api from '../services/api';
import { useTimerStore } from '../stores/timerStore';
import TimeTrackingModal from '../components/TimeTrackingModal';

const PatientDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const { startTimer, isRunning, activeTimer } = useTimerStore();

  const { data: patient, isLoading, error } = useQuery(['patient', id], async () => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  });

  const { data: timeLogs, refetch: refetchLogs } = useQuery(['time-logs', id], async () => {
    const res = await api.get(`/time/logs/${id}?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`);
    return res.data;
  });

  const handleStartTimer = async () => {
    try {
      await startTimer(id, `${patient.first_name} ${patient.last_name}`);
    } catch (err) {
      // Error handled in store
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        Failed to load patient details.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/enrolled-patients" className="p-2 hover:bg-gray-100 rounded-full transition">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {patient.first_name} {patient.last_name}
            </h1>
            <p className="text-gray-500">#{patient.account_number}</p>
          </div>
        </div>
        {patient.current_enrollment && (
          <div className="badge badge-success px-3 py-1.5 text-sm">
            Enrolled in {patient.current_enrollment.program_type}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'details'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Patient Overview
        </button>
        <button
          onClick={() => setActiveTab('time')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'time'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Time & CCM Activity
        </button>
      </div>

      {activeTab === 'details' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <div className="card lg:col-span-1">
          <div className="card-header flex items-center gap-2">
            <User className="w-5 h-5 text-gray-500" />
            Basic Information
          </div>
          <div className="card-body space-y-4">
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4" /> Date of Birth
              </p>
              <p className="font-medium text-gray-900">
                {new Date(patient.date_of_birth).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                <Phone className="w-4 h-4" /> Contact
              </p>
              <p className="font-medium text-gray-900">{patient.phone_mobile}</p>
              <p className="text-sm text-gray-500">{patient.email}</p>
            </div>
            {patient.pcp_name && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Primary Care Provider</p>
                <p className="font-medium text-gray-900">{patient.pcp_name}</p>
              </div>
            )}
            {patient.default_facility_name && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Facility</p>
                <p className="font-medium text-gray-900">{patient.default_facility_name}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {/* Active Problems */}
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-500" />
              Active Conditions
            </div>
            <div className="card-body">
              {patient.problems?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {patient.problems.map((prob) => (
                    <div key={prob.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="font-semibold text-gray-900">{prob.icd_code}</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{prob.icd_description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No active conditions recorded.</p>
              )}
            </div>
          </div>

          {/* Insurances */}
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-500" />
              Insurance Information
            </div>
            <div className="card-body">
              {patient.insurances?.length > 0 ? (
                <div className="space-y-3">
                  {patient.insurances.map((ins) => (
                    <div key={ins.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">{ins.insurance_name}</p>
                        <p className="text-sm text-gray-500">Policy: {ins.policy_number}</p>
                      </div>
                      {ins.is_primary === 1 && (
                        <span className="badge badge-info">Primary</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No insurance information on file.</p>
              )}
            </div>
          </div>

          {/* Care Team */}
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              Care Team
            </div>
            <div className="card-body">
              {patient.care_team?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {patient.care_team.map((member) => (
                    <div key={member.id} className="flex items-center p-3 border border-gray-200 rounded-lg">
                      <div className="bg-primary-100 text-primary-700 w-10 h-10 rounded-full flex items-center justify-center font-bold mr-3">
                        {member.first_name[0]}{member.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {member.designation} {member.is_primary === 1 ? '(Primary)' : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No care team assigned.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    ) : (
        <div className="space-y-6">
          {/* CCM Progress Card */}
          <div className="card">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary-600" />
                    Monthly CCM Progress
                  </h3>
                  <p className="text-sm text-gray-500">Goal: 20 minutes for billable threshold</p>
                </div>
                
                <div className="flex-1 max-w-md w-full">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-primary-700">{timeLogs?.summary?.total_minutes || 0} / 20 mins</span>
                    <span className="text-gray-500">{Math.round(((timeLogs?.summary?.total_minutes || 0) / 20) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        (timeLogs?.summary?.total_minutes || 0) >= 20 ? 'bg-green-500' : 'bg-primary-500'
                      }`}
                      style={{ width: `${Math.min(((timeLogs?.summary?.total_minutes || 0) / 20) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={isRunning && activeTimer?.patientId === id}
                    onClick={handleStartTimer}
                    className="btn-primary flex items-center gap-2 px-4 py-2 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    {isRunning && activeTimer?.patientId === id ? 'Timer Running' : 'Start Timer'}
                  </button>
                  <button
                    onClick={() => setShowTimeModal(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Log Manual
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Logs Table */}
          <div className="card">
            <div className="card-header border-b px-6 py-4">
              <h3 className="font-bold text-gray-900">Activity History (Current Month)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left">Staff</th>
                    <th className="px-6 py-3 text-left">Activity</th>
                    <th className="px-6 py-3 text-left">Duration</th>
                    <th className="px-6 py-3 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {timeLogs?.logs?.length > 0 ? (
                    timeLogs.logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {new Date(log.service_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">{log.user_name}</span>
                          <span className="block text-xs text-gray-500 capitalize">{log.user_role.replace('_', ' ')}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 font-medium text-primary-700">
                            <FileText className="w-3.5 h-3.5" />
                            {log.reason_name || 'Care Coordination'}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {log.minutes} mins
                        </td>
                        <td className="px-6 py-4 text-gray-500 max-w-xs truncate" title={log.notes}>
                          {log.notes || '--'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-gray-400 italic">
                        No activity recorded for this month.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showTimeModal && (
        <TimeTrackingModal
          patient={patient}
          onClose={() => setShowTimeModal(false)}
          onSuccess={() => {
            refetchLogs();
            queryClient.invalidateQueries(['patient', id]);
          }}
        />
      )}
    </div>
  );
};

export default PatientDetail;
