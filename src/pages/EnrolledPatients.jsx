import { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { Search, Clock, FileText, DollarSign, MoreVertical, Play, StopCircle, Plus } from 'lucide-react';
import api from '../services/api';
import TimeTrackingModal from '../components/TimeTrackingModal';
import toast from 'react-hot-toast';

export default function EnrolledPatients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [activeTimers, setActiveTimers] = useState({});
  
  const { data, isLoading, refetch } = useQuery(
    ['enrolled-patients', searchTerm],
    async () => {
      const response = await api.get('/patients/enrolled', {
        params: { search: searchTerm, limit: 100 }
      });
      return response.data;
    }
  );
  
  const startTimer = async (patientId) => {
    try {
      await api.post('/time/start', { patientId });
      setActiveTimers(prev => ({ ...prev, [patientId]: true }));
      toast.success('Timer started');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to start timer');
    }
  };
  
  const stopTimer = async (patientId) => {
    try {
      const response = await api.post('/time/stop', { patientId });
      toast.success(`${response.data.minutes} minutes recorded`);
      setActiveTimers(prev => ({ ...prev, [patientId]: false }));
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to stop timer');
    }
  };
  
  const getBillingStatusBadge = (minutes) => {
    if (minutes >= 20) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Eligible</span>;
    } else if (minutes > 0) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Below Threshold</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">No Time</span>;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enrolled Patients</h1>
        <p className="text-gray-500 mt-1">Manage enrolled patients, track time, and view care plans</p>
      </div>
      
      {/* Stats Summary */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">Total Enrolled</p>
            <p className="text-2xl font-bold">{data.pagination?.total || 0}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">Eligible for Billing</p>
            <p className="text-2xl font-bold text-green-600">
              {data.patients?.filter(p => p.minutes_completed_this_month >= 20).length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">Total Minutes (This Month)</p>
            <p className="text-2xl font-bold text-primary-600">
              {data.patients?.reduce((sum, p) => sum + (p.minutes_completed_this_month || 0), 0) || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">Pending Claims</p>
            <p className="text-2xl font-bold text-orange-600">
              {data.patients?.reduce((sum, p) => sum + (p.pending_claims || 0), 0) || 0}
            </p>
          </div>
        </div>
      )}
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search enrolled patients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      
      {/* Patients Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Minutes (This Month)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Billing Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Care Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Loading patients...
                   </td>
                 </tr>
              ) : data?.patients?.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No enrolled patients found
                   </td>
                 </tr>
              ) : (
                data?.patients?.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link to={`/patient/${patient.id}`} className="hover:text-primary-600">
                        <p className="font-medium text-gray-900">
                          {patient.first_name} {patient.last_name}
                        </p>
                        <p className="text-sm text-gray-500">ID: {patient.account_number}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        patient.program_type === 'CCM' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {patient.program_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{patient.minutes_completed_this_month || 0} min</span>
                    </td>
                    <td className="px-6 py-4">
                      {getBillingStatusBadge(patient.minutes_completed_this_month)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/care-plan/${patient.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                      >
                        <FileText className="w-4 h-4" />
                        View Plan
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {activeTimers[patient.id] ? (
                          <button
                            onClick={() => stopTimer(patient.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Stop Timer"
                          >
                            <StopCircle className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => startTimer(patient.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Start Timer"
                          >
                            <Play className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedPatient(patient);
                            setShowTimeModal(true);
                          }}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="Add Time Manually"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                        <Link
                          to={`/billing?patient=${patient.id}`}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="View Claims"
                        >
                          <DollarSign className="w-5 h-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Time Tracking Modal */}
      {showTimeModal && selectedPatient && (
        <TimeTrackingModal
          patient={selectedPatient}
          onClose={() => {
            setShowTimeModal(false);
            setSelectedPatient(null);
          }}
          onSuccess={() => {
            refetch();
            toast.success('Time recorded successfully');
          }}
        />
      )}
    </div>
  );
}