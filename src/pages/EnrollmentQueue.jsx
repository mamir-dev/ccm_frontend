import { useState } from 'react';
import { useQuery } from 'react-query';
import { Search, Filter, UserPlus, ChevronRight, Activity, Calendar, Phone, Mail } from 'lucide-react';
import api from '../services/api';
import EnrollmentModal from '../components/EnrollmentModal';
import toast from 'react-hot-toast';

export default function EnrollmentQueue() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const { data, isLoading, refetch } = useQuery(
    ['enrollment-queue', searchTerm, statusFilter],
    async () => {
      const response = await api.get('/enrollment/queue', {
        params: { search: searchTerm, status: statusFilter, limit: 100 }
      });
      return response.data;
    }
  );
  
  const handleEnrollClick = (patient) => {
    setSelectedPatient(patient);
    setShowEnrollmentModal(true);
  };
  
  const handleEnrollmentComplete = () => {
    setShowEnrollmentModal(false);
    setSelectedPatient(null);
    refetch();
    toast.success('Patient enrolled successfully!');
  };
  
  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      ready_to_enroll: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800'
    };
    const labels = {
      pending: 'Pending',
      ready_to_enroll: 'Ready to Enroll',
      declined: 'Declined'
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badges[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enrollment Queue</h1>
          <p className="text-gray-500 mt-1">Review and enroll eligible patients for CCM/PCM programs</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Total Eligible</p>
          <p className="text-2xl font-bold">{data?.patients?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-600">
            {data?.patients?.filter(p => p.enrollment_status === 'pending').length || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Ready to Enroll</p>
          <p className="text-2xl font-bold text-green-600">
            {data?.patients?.filter(p => p.enrollment_status === 'ready_to_enroll').length || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Declined</p>
          <p className="text-2xl font-bold text-red-600">
            {data?.patients?.filter(p => p.enrollment_status === 'declined').length || 0}
          </p>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by patient name or account number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      
      {/* Status Tabs */}
      <div className="flex gap-2 border-b">
        {['pending', 'ready_to_enroll', 'declined'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>
      
      {/* Patients Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DOB / Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chronic Conditions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Insurance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PCP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    Loading patients...
                  </td>
                </tr>
              ) : data?.patients?.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No eligible patients found
                  </td>
                </tr>
              ) : (
                data?.patients?.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {patient.first_name} {patient.last_name}
                        </p>
                        <p className="text-sm text-gray-500">ID: {patient.account_number}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {new Date(patient.date_of_birth).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">Age: {patient.age}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Activity className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium">{patient.chronic_conditions_count} conditions</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate max-w-xs">
                        {patient.chronic_conditions?.substring(0, 50)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {patient.insurances?.split('|')[0] || 'No insurance'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {patient.pcp_name || 'Not assigned'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(patient.enrollment_status || 'pending')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleEnrollClick(patient)}
                        className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        <UserPlus className="w-4 h-4" />
                        Enroll
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Enrollment Modal */}
      {showEnrollmentModal && selectedPatient && (
        <EnrollmentModal
          patient={selectedPatient}
          onClose={() => {
            setShowEnrollmentModal(false);
            setSelectedPatient(null);
          }}
          onSuccess={handleEnrollmentComplete}
        />
      )}
    </div>
  );
}