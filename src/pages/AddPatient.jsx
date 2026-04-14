import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'react-query';
import { User, Shield, Activity, Plus, Trash2, Save, ArrowLeft, Search } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AddPatient = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'male',
    accountNumber: '',
    email: '',
    phoneMobile: '',
    addressLine1: '',
    city: '',
    state: '',
    zip: '',
    pcpId: '',
    facilityId: '',
    insurances: [],
    problems: []
  });

  const [icdQuery, setIcdQuery] = useState('');
  const [icdResults, setIcdResults] = useState([]);

  // Fetch Providers & Facilities for dropdowns
  const { data: providers } = useQuery('config-providers', async () => {
    const res = await api.get('/config/users');
    return res.data.filter(u => u.role === 'provider' || u.role === 'admin');
  });

  // ICD Search
  const searchIcd = async (val) => {
    setIcdQuery(val);
    if (val.length < 2) {
      setIcdResults([]);
      return;
    }
    const res = await api.get(`/config/icd-search?q=${val}`);
    setIcdResults(res.data);
  };

  const addProblem = (prob) => {
    if (!formData.problems.find(p => p.code === prob.icd_code)) {
      setFormData({
        ...formData,
        problems: [...formData.problems, { code: prob.icd_code, description: prob.icd_description }]
      });
    }
    setIcdQuery('');
    setIcdResults([]);
  };

  const removeProblem = (code) => {
    setFormData({
      ...formData,
      problems: formData.problems.filter(p => p.code !== code)
    });
  };

  const addInsurance = () => {
    setFormData({
      ...formData,
      insurances: [...formData.insurances, { name: '', policy: '', type: 'primary', isEligible: true }]
    });
  };

  const updateInsurance = (index, field, value) => {
    const newIns = [...formData.insurances];
    newIns[index][field] = value;
    setFormData({ ...formData, insurances: newIns });
  };

  const removeInsurance = (index) => {
    setFormData({
      ...formData,
      insurances: formData.insurances.filter((_, i) => i !== index)
    });
  };

  const mutation = useMutation(
    (data) => api.post('/patients', data),
    {
      onSuccess: () => {
        toast.success('Patient registered successfully!');
        navigate('/enrollment-queue');
      },
      onError: (err) => {
        toast.error(err.response?.data?.error || 'Failed to register patient');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Patient Intake & Registration</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Demographics */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <User className="w-5 h-5 text-primary-600" />
            Demographics
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">First Name *</label>
              <input 
                type="text" required className="input" 
                value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="label">Last Name *</label>
              <input 
                type="text" required className="input" 
                value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="label">Date of Birth *</label>
              <input 
                type="date" required className="input" 
                value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="label">Gender *</label>
              <select 
                className="input" value={formData.gender} 
                onChange={e => setFormData({...formData, gender: e.target.value})}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Account Number (Optional)</label>
              <input 
                type="text" className="input" placeholder="Auto-generated if blank"
                value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="label">Email Address</label>
              <input 
                type="email" className="input" 
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="label">Mobile Phone</label>
              <input 
                type="tel" className="input" 
                value={formData.phoneMobile} onChange={e => setFormData({...formData, phoneMobile: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Clinical Info */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-600" />
            Chronic Conditions
          </div>
          <div className="card-body space-y-4">
            <div className="relative">
              <label className="label">Search ICD-10 Code or Description</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" className="input pl-10" 
                  placeholder="e.g. Hypertension or I10"
                  value={icdQuery} onChange={e => searchIcd(e.target.value)}
                />
              </div>
              
              {icdResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {icdResults.map(res => (
                    <button
                      key={res.icd_code}
                      type="button"
                      onClick={() => addProblem(res)}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-0 flex justify-between"
                    >
                      <span className="font-medium text-sm text-primary-700">{res.icd_code}</span>
                      <span className="text-sm text-gray-600 truncate ml-4">{res.icd_description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.problems.map(prob => (
                <div key={prob.code} className="flex items-center gap-2 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full text-sm border border-primary-100">
                  <span className="font-bold">{prob.code}</span>
                  <span className="truncate max-w-[200px]">{prob.description}</span>
                  <button type="button" onClick={() => removeProblem(prob.code)} className="hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {formData.problems.length === 0 && <p className="text-gray-400 text-sm italic">No conditions added yet.</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="form-group">
                <label className="label">Assign Primary Care Provider</label>
                <select 
                  className="input" value={formData.pcpId} 
                  onChange={e => setFormData({...formData, pcpId: e.target.value})}
                >
                  <option value="">Select Provider</option>
                  {providers?.map(p => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Insurance Info */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600" />
              Insurance Details
            </div>
            <button 
              type="button" onClick={addInsurance}
              className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Insurance
            </button>
          </div>
          <div className="card-body space-y-4">
            {formData.insurances.map((ins, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative group">
                <button 
                  type="button" onClick={() => removeInsurance(idx)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="label text-xs">Insurance Provider Name</label>
                    <input 
                      type="text" className="input py-1.5" placeholder="e.g. Medicare"
                      value={ins.name} onChange={e => updateInsurance(idx, 'name', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="label text-xs">Policy / Member ID</label>
                    <input 
                      type="text" className="input py-1.5" 
                      value={ins.policy} onChange={updateInsurance.bind(null, idx, 'policy', e => e.target.value)} // Wait, fixed below
                      onChange={(e) => updateInsurance(idx, 'policy', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="label text-xs">Priority</label>
                    <select 
                      className="input py-1.5" value={ins.type} 
                      onChange={(e) => updateInsurance(idx, 'type', e.target.value)}
                    >
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            {formData.insurances.length === 0 && <p className="text-gray-400 text-sm italic">No insurance records added.</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button 
            type="button" onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button 
            type="submit" disabled={mutation.isLoading}
            className="btn-primary px-8 py-2.5 flex items-center gap-2 shadow-lg shadow-primary-200"
          >
            <Save className="w-5 h-5" />
            {mutation.isLoading ? 'Registering...' : 'Complete Registration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPatient;
