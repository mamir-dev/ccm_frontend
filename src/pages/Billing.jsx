import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  DollarSign, 
  Calendar, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Billing() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [qualifyingPatients, setQualifyingPatients] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showBatchDetail, setShowBatchDetail] = useState(false);
  const queryClient = useQueryClient();
  
  // Get CPT configuration
  const { data: cptConfig } = useQuery('cpt-config', async () => {
    const response = await api.get('/billing/cpt-config');
    return response.data;
  });
  
  // Get claim batches
  const { data: batches, refetch: refetchBatches } = useQuery('claim-batches', async () => {
    const response = await api.get('/billing/batches');
    return response.data;
  });
  
  // Get qualifying patients
  const fetchQualifyingPatients = async () => {
    try {
      const response = await api.post('/billing/qualifying', {
        month: selectedMonth,
        year: selectedYear
      });
      setQualifyingPatients(response.data.patients);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch qualifying patients');
      throw error;
    }
  };
  
  const { refetch: refetchQualifying, isLoading: isLoadingQualifying } = useQuery(
    ['qualifying-patients', selectedMonth, selectedYear],
    fetchQualifyingPatients,
    { enabled: false }
  );
  
  // Generate claims mutation
  const generateMutation = useMutation(
    async (patientsToBill) => {
      const response = await api.post('/billing/generate', {
        month: selectedMonth,
        year: selectedYear,
        patients: patientsToBill
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success(`Claims generated: ${data.created} created, ${data.failed} failed`);
        refetchBatches();
        setQualifyingPatients([]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to generate claims');
      }
    }
  );
  
  const handleInitiate = async () => {
    const result = await refetchQualifying();
    if (result.data) {
      // Initialize patients with suggested CPT codes
      const initializedPatients = result.data.patients.map(p => ({
        ...p,
        cpt_code: p.suggested_cpt_code?.cpt_code || null,
        do_not_create: false,
        billing_provider_id: null
      }));
      setQualifyingPatients(initializedPatients);
    }
  };
  
  const handleUpdateCPT = (patientIndex, cptCode) => {
    const updated = [...qualifyingPatients];
    updated[patientIndex].cpt_code = cptCode;
    setQualifyingPatients(updated);
  };
  
  const handleToggleDoNotCreate = (patientIndex) => {
    const updated = [...qualifyingPatients];
    updated[patientIndex].do_not_create = !updated[patientIndex].do_not_create;
    setQualifyingPatients(updated);
  };
  
  const handleGenerateClaims = () => {
    const patientsToBill = qualifyingPatients.map(p => ({
      patient_id: p.id,
      enrollment_id: p.enrollment_id,
      cpt_code: p.do_not_create ? null : p.cpt_code,
      total_minutes: p.total_minutes,
      do_not_create: p.do_not_create,
      billing_provider_id: p.billing_provider_id,
      insurance_id: p.insurance_id
    }));
    
    generateMutation.mutate(patientsToBill);
  };
  
  const getCPTOption = (patient) => {
    const options = [];
    
    if (patient.program_type === 'CCM') {
      if (patient.professional_minutes >= 30 && patient.medical_decision_making !== 'low') {
        options.push({ code: '99491', label: '99491 - CCM 30+ min (Physician)', minutes: 30 });
      }
      if (patient.total_minutes >= 90 && patient.medical_decision_making !== 'low') {
        options.push({ code: '99489', label: '99489 - CCM Complex Each Additional 30 min', minutes: 90 });
      }
      if (patient.total_minutes >= 60 && patient.medical_decision_making !== 'low') {
        options.push({ code: '99487', label: '99487 - CCM Complex 60+ min', minutes: 60 });
      }
      if (patient.total_minutes >= 40) {
        options.push({ code: '99439', label: '99439 - CCM Each Additional 20 min', minutes: 40 });
      }
      if (patient.total_minutes >= 20) {
        options.push({ code: '99490', label: '99490 - CCM 20+ min (Clinical Staff)', minutes: 20 });
      }
    } else {
      if (patient.total_minutes >= 120) {
        options.push({ code: '99427', label: '99427 - PCM Each Additional 60 min', minutes: 120 });
      }
      if (patient.total_minutes >= 90) {
        options.push({ code: '99426', label: '99426 - PCM Each Additional 30 min', minutes: 90 });
      }
      if (patient.total_minutes >= 60) {
        options.push({ code: '99425', label: '99425 - PCM Initial 60 min', minutes: 60 });
      }
      if (patient.total_minutes >= 30) {
        options.push({ code: '99424', label: '99424 - PCM Initial 30 min', minutes: 30 });
      }
    }
    
    return options;
  };
  
  const getBatchStatusBadge = (status) => {
    const badges = {
      initiated: 'bg-blue-100 text-blue-800',
      processing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badges[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing Console</h1>
        <p className="text-gray-500 mt-1">Generate and manage CCM/PCM claims</p>
      </div>
      
      {/* Month Selection */}
      <div className="card p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="input w-40"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input w-28"
            >
              {[2023, 2024, 2025].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleInitiate}
            disabled={isLoadingQualifying}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingQualifying ? 'animate-spin' : ''}`} />
            {isLoadingQualifying ? 'Loading...' : 'Initiate Batch'}
          </button>
        </div>
      </div>
      
      {/* Qualifying Patients Table */}
      {qualifyingPatients.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-gray-900">Qualifying Patients</h2>
                <p className="text-sm text-gray-500">
                  {qualifyingPatients.length} patients eligible for billing this month
                </p>
              </div>
              <button
                onClick={handleGenerateClaims}
                disabled={generateMutation.isLoading}
                className="btn-primary flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                {generateMutation.isLoading ? 'Generating...' : 'Generate Claims'}
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Program</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Total Minutes</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Professional/Staff</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">CPT Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {qualifyingPatients.map((patient, idx) => {
                  const cptOptions = getCPTOption(patient);
                  return (
                    <tr key={patient.id} className={patient.do_not_create ? 'bg-gray-50' : ''}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {patient.first_name} {patient.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{patient.account_number}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          patient.program_type === 'CCM' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {patient.program_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{patient.total_minutes} min</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>Prof: {patient.professional_minutes} min</div>
                        <div className="text-gray-500">Staff: {patient.staff_minutes} min</div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={patient.cpt_code || ''}
                          onChange={(e) => handleUpdateCPT(idx, e.target.value)}
                          disabled={patient.do_not_create}
                          className="input text-sm py-1"
                        >
                          <option value="">Select CPT Code</option>
                          {cptOptions.map(opt => (
                            <option key={opt.code} value={opt.code}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleDoNotCreate(idx)}
                          className={`text-sm ${patient.do_not_create ? 'text-green-600' : 'text-red-600'} hover:underline`}
                        >
                          {patient.do_not_create ? 'Enable' : 'Exclude'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Previous Batches */}
      <div className="card">
        <div className="p-5 border-b">
          <h2 className="font-semibold text-gray-900">Previous Claim Batches</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Batch Month</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Qualified</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Failed</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Created At</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {batches?.map((batch) => (
                <tr key={batch.id}>
                  <td className="px-4 py-3 font-medium">
                    {new Date(batch.batch_month).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">{getBatchStatusBadge(batch.status)}</td>
                  <td className="px-4 py-3">{batch.total_qualified}</td>
                  <td className="px-4 py-3 text-green-600">{batch.total_created}</td>
                  <td className="px-4 py-3 text-red-600">{batch.total_failed}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(batch.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedBatch(batch);
                        setShowBatchDetail(true);
                      }}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Batch Detail Modal */}
      {showBatchDetail && selectedBatch && (
        <BatchDetailModal
          batch={selectedBatch}
          onClose={() => setShowBatchDetail(false)}
        />
      )}
    </div>
  );
}

// Batch Detail Modal Component
function BatchDetailModal({ batch, onClose }) {
  const { data } = useQuery(['batch-details', batch.id], async () => {
    const response = await api.get(`/billing/batch/${batch.id}`);
    return response.data;
  });
  
  const getClaimStatusBadge = (status) => {
    const badges = {
      pending: 'bg-gray-100 text-gray-800',
      created: 'bg-blue-100 text-blue-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      denied: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badges[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b">
          <div>
            <h2 className="text-lg font-bold">Batch Details</h2>
            <p className="text-sm text-gray-500">
              {new Date(batch.batch_month).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto max-h-[calc(80vh-80px)]">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{batch.total_qualified}</p>
              <p className="text-xs text-gray-600">Qualified</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{batch.total_created}</p>
              <p className="text-xs text-gray-600">Created</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{batch.total_failed}</p>
              <p className="text-xs text-gray-600">Failed</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">{batch.total_do_not_create}</p>
              <p className="text-xs text-gray-600">Excluded</p>
            </div>
          </div>
          
          {/* Claims Table */}
          <h3 className="font-semibold text-gray-900 mb-3">Claims</h3>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Patient</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">CPT Code</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Minutes</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Insurance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.claims?.map((claim) => (
                <tr key={claim.id}>
                  <td className="px-3 py-2">
                    <p className="font-medium text-sm">{claim.first_name} {claim.last_name}</p>
                    <p className="text-xs text-gray-500">{claim.account_number}</p>
                  </td>
                  <td className="px-3 py-2 text-sm font-mono">{claim.cpt_code}</td>
                  <td className="px-3 py-2 text-sm">{claim.total_minutes} min</td>
                  <td className="px-3 py-2">{getClaimStatusBadge(claim.status)}</td>
                  <td className="px-3 py-2 text-sm">{claim.insurance_name || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}