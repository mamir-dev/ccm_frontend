import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'react-query';
import {
  User, Shield, Activity, Plus, Trash2, Save, ArrowLeft, Search,
  HelpCircle, X, Download, Phone, Mail, MapPin, Calendar, CreditCard,
  FileText, Settings, Info, Heart, Home, Briefcase
} from 'lucide-react';
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
    phoneHome: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'TX',
    zip: '',
    pcpId: '',
    facilityId: '',
    insurances: [],
    problems: [],
    ssn: '',
    maritalStatus: '',
    language: '',
    race: '',
    ethnicity: '',
    releaseOfInfo: 'Y',
    rxHistoryConsent: 'U',
    notes: ''
  });

  const [icdQuery, setIcdQuery] = useState('');
  const [icdResults, setIcdResults] = useState([]);
  const [activeTab, setActiveTab] = useState('Insurance');
  const [showIcdDropdown, setShowIcdDropdown] = useState(false);

  // Emergency contacts state
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [newEmergency, setNewEmergency] = useState({ name: '', relation: '', phone: '', altPhone: '' });

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
      setShowIcdDropdown(false);
      return;
    }
    const res = await api.get(`/config/icd-search?q=${val}`);
    setIcdResults(res.data);
    setShowIcdDropdown(true);
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
    setShowIcdDropdown(false);
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
      insurances: [...formData.insurances, { name: '', policy: '', type: 'primary', isEligible: true, state: '', subscriberNo: '', rel: '', groupNo: '', coPay: '' }]
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

  const addEmergencyContact = () => {
    if (newEmergency.name && newEmergency.relation && newEmergency.phone) {
      setEmergencyContacts([...emergencyContacts, { ...newEmergency, id: Date.now() }]);
      setNewEmergency({ name: '', relation: '', phone: '', altPhone: '' });
      setShowEmergencyForm(false);
      toast.success('Emergency contact added');
    } else {
      toast.error('Please fill at least name, relation and phone');
    }
  };

  const removeEmergencyContact = (id) => {
    setEmergencyContacts(emergencyContacts.filter(c => c.id !== id));
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
    const finalData = { ...formData, emergencyContacts };
    mutation.mutate(finalData);
  };

  // Helper to calculate age
  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Primary color: #1E2A3A
  const primaryColor = '#1E2A3A';
  const primaryLight = '#f1f3f6';
  const primaryBorder = '#d1d5db';

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-[13px]">
      {/* Header Bar - #1E2A3A color */}
      <div className="text-white sticky top-0 z-10">
        <div className="flex justify-between items-center px-4 py-2">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <span className="text-2xl font-bold text-black  ">New Patient Information</span>
          </div>

        </div>
      </div>

      <form onSubmit={handleSubmit} className=" mx-auto px-4 py-4">
        <div className="space-y-4">

          {/* ==================== SECTION 1: DEMOGRAPHICS ==================== */}
          <div className="bg-white border border-gray-300 rounded overflow-hidden">
            <div className="bg-[#f1f3f6] px-4 py-2 border-b border-gray-300">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#1E2A3A]" />
                <h2 className="font-bold text-[#1E2A3A] text-sm">Demographics</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Account No</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px] focus:outline-none focus:border-[#1E2A3A] focus:ring-1 focus:ring-[#1E2A3A]"
                    value={formData.accountNumber} onChange={e => setFormData({ ...formData, accountNumber: e.target.value })} placeholder="Auto-generated" />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Suffix</label>
                    <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px] bg-white">
                      <option></option>
                      <option>Jr</option>
                      <option>Sr</option>
                      <option>II</option>
                      <option>III</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Title</label>
                    <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px] bg-white">
                      <option></option>
                      <option>Mr.</option>
                      <option>Mrs.</option>
                      <option>Ms.</option>
                      <option>Dr.</option>
                    </select>
                  </div>
                </div>
                <div></div>

                <div>
                  <label className="block text-[11px] font-medium text-red-600 mb-0.5">Last Name *</label>
                  <input type="text" required className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px] focus:outline-none focus:border-[#1E2A3A] focus:ring-1 focus:ring-[#1E2A3A]"
                    value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} placeholder="Last name" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-red-600 mb-0.5">First Name *</label>
                  <input type="text" required className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px] focus:outline-none focus:border-[#1E2A3A]"
                    value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} placeholder="First name" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Middle Name</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px]" placeholder="MI" />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Previous Name</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px]" placeholder="Maiden name" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Name to Use</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px]" placeholder="Preferred name" />
                </div>
                <div></div>

                <div>
                  <label className="block text-[11px] font-medium text-red-600 mb-0.5">DOB *</label>
                  <input type="date" required className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px]"
                    value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Age</label>
                  <div className="border border-gray-300 rounded px-2 py-1.5 text-[12px] bg-gray-50">
                    {calculateAge(formData.dob) || '—'} years
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-red-600 mb-0.5">Sex *</label>
                  <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px] bg-white"
                    value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Marital Status</label>
                  <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px]" value={formData.maritalStatus} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}>
                    <option value="">Select</option>
                    <option>Single</option>
                    <option>Married</option>
                    <option>Divorced</option>
                    <option>Widowed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">SSN</label>
                  <div className="flex gap-2">
                    <input type="text" className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-[12px]" placeholder="XXX-XX-XXXX"
                      value={formData.ssn} onChange={e => setFormData({ ...formData, ssn: e.target.value })} />
                    <label className="flex items-center gap-1 text-[10px] text-gray-500 whitespace-nowrap">
                      <input type="checkbox" className="rounded" />
                      Not Provided
                    </label>
                  </div>
                </div>
                <div></div>
              </div>
            </div>
          </div>

          {/* ==================== SECTION 2: CONTACT & ADDRESS ==================== */}
          <div className="bg-white border border-gray-300 rounded overflow-hidden">
            <div className="bg-[#f1f3f6] px-4 py-2 border-b border-gray-300">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#1E2A3A]" />
                <h2 className="font-bold text-[#1E2A3A] text-sm">Contact & Address</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-medium text-red-600 mb-0.5">Address Line 1 *</label>
                  <input type="text" required className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px]"
                    value={formData.addressLine1} onChange={e => setFormData({ ...formData, addressLine1: e.target.value })} placeholder="Street address" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Address Line 2</label>
                  <div className="flex gap-2">
                    <input type="text" className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-[12px]"
                      value={formData.addressLine2} onChange={e => setFormData({ ...formData, addressLine2: e.target.value })} placeholder="Apt, suite, unit" />
                    <button type="button" className="bg-gray-200 border border-gray-400 rounded px-3 py-1.5 text-[11px] font-medium hover:bg-gray-300">Validate</button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-red-600 mb-0.5">City *</label>
                  <input type="text" required className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px]"
                    value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="City" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-red-600 mb-0.5">State *</label>
                  <input type="text" maxLength={2} className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px] uppercase"
                    value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })} placeholder="TX" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-red-600 mb-0.5">ZIP *</label>
                  <input type="text" required className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px]"
                    value={formData.zip} onChange={e => setFormData({ ...formData, zip: e.target.value })} placeholder="ZIP code" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">County</label>
                  <button type="button" className="w-full bg-gray-100 border border-gray-300 rounded px-2 py-1.5 text-[12px] text-left text-gray-600 hover:bg-gray-200">Select County</button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[11px] font-semibold text-red-600">Phone Numbers *</label>
                  <button type="button" className="text-[10px] text-[#1E2A3A] hover:underline">Manage Phone List</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">(C) Cell Phone *</label>
                    <input type="tel" required className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px]"
                      value={formData.phoneMobile} onChange={e => setFormData({ ...formData, phoneMobile: e.target.value })} placeholder="(123) 456-7890" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">(H) Home Phone</label>
                    <input type="tel" className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px]"
                      value={formData.phoneHome} onChange={e => setFormData({ ...formData, phoneHome: e.target.value })} placeholder="(123) 456-7890" />
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Email</label>
                <div className="flex gap-3 items-center">
                  <input type="email" className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-[12px]" placeholder="patient@example.com"
                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  <label className="flex items-center gap-1 text-[10px] text-gray-500 whitespace-nowrap">
                    <input type="checkbox" className="rounded" />
                    Not Provided
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== SECTION 3: PROVIDERS & ADMIN ==================== */}
          <div className="bg-white border border-gray-300 rounded overflow-hidden">
            <div className="bg-[#f1f3f6] px-4 py-2 border-b border-gray-300">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#1E2A3A]" />
                <h2 className="font-bold text-[#1E2A3A] text-sm">Providers & Admin</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-red-600 mb-0.5">PCP *</label>
                  <div className="flex gap-2">
                    <select className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-[12px] bg-white"
                      value={formData.pcpId} onChange={e => setFormData({ ...formData, pcpId: e.target.value })}>
                      <option value="">Select PCP...</option>
                      {providers?.map(p => (
                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                      ))}
                    </select>
                    <button type="button" className="bg-gray-200 border border-gray-400 rounded px-2 text-[11px]">...</button>
                    <button type="button" className="bg-gray-200 border border-gray-400 rounded px-2 text-[11px]">clr</button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-red-600 mb-0.5">Referring Provider *</label>
                  <div className="flex gap-2">
                    <input type="text" className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-[12px]" placeholder="Search provider" />
                    <button type="button" className="bg-gray-200 border border-gray-400 rounded px-2 text-[11px]">...</button>
                    <button type="button" className="bg-gray-200 border border-gray-400 rounded px-2 text-[11px]">clr</button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Rendering Pr./PCG</label>
                  <div className="relative">
                    <input type="text" className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px] bg-gray-50" placeholder="Auto-assigned" readOnly />
                    <Search className="absolute right-2 top-1.5 w-3.5 h-3.5 text-gray-400" />
                  </div>
                </div>
                <div></div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Language</label>
                  <div className="flex gap-2">
                    <input type="text" className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-[12px]" value={formData.language} onChange={e => setFormData({ ...formData, language: e.target.value })} placeholder="English" />
                    <button type="button" className="bg-gray-200 border border-gray-400 rounded px-2 text-[11px]">...</button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Race</label>
                  <div className="flex gap-2">
                    <input type="text" className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-[12px]" value={formData.race} onChange={e => setFormData({ ...formData, race: e.target.value })} />
                    <button type="button" className="bg-gray-200 border border-gray-400 rounded px-2 text-[11px]">...</button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Ethnicity</label>
                  <div className="flex gap-2">
                    <input type="text" className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-[12px]" value={formData.ethnicity} onChange={e => setFormData({ ...formData, ethnicity: e.target.value })} />
                    <button type="button" className="bg-gray-200 border border-gray-400 rounded px-2 text-[11px]">...</button>
                  </div>
                </div>
                <div></div>

                <div>
                  <label className="block text-[11px] font-medium text-red-600 mb-0.5">Release of Info *</label>
                  <div className="flex gap-2">
                    <input type="text" maxLength={1} className="w-16 border border-gray-300 rounded px-2 py-1.5 text-[12px] text-center"
                      value={formData.releaseOfInfo} onChange={e => setFormData({ ...formData, releaseOfInfo: e.target.value })} />
                    <button type="button" className="bg-gray-200 border border-gray-400 rounded px-2 text-[11px]">...</button>
                  </div>
                  <p className="text-[9px] text-gray-400 mt-0.5">Y=Yes, N=No</p>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-red-600 mb-0.5">Rx History Consent *</label>
                  <div className="flex gap-2">
                    <input type="text" maxLength={1} className="w-16 border border-gray-300 rounded px-2 py-1.5 text-[12px] text-center"
                      value={formData.rxHistoryConsent} onChange={e => setFormData({ ...formData, rxHistoryConsent: e.target.value })} />
                    <button type="button" className="bg-gray-200 border border-gray-400 rounded px-2 text-[11px]">...</button>
                    <button type="button" className="bg-gray-200 border border-gray-400 rounded px-2 text-[11px]">Scan</button>
                  </div>
                  <p className="text-[9px] text-gray-400 mt-0.5">U=Unknown, Y=Yes, N=No</p>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Signature Date</label>
                  <div className="relative">
                    <input type="text" className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px]" placeholder="MM/DD/YYYY" />
                    <Calendar className="absolute right-2 top-1.5 w-3.5 h-3.5 text-gray-400" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">Notes</label>
                  <textarea className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px] resize-none h-20"
                    value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes..."></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== SECTION 4: EMERGENCY CONTACT ==================== */}
          <div className="bg-white border border-gray-300 rounded overflow-hidden">
            <div className="bg-[#f1f3f6] px-4 py-2 border-b border-gray-300">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#1E2A3A]" />
                  <h2 className="font-bold text-[#1E2A3A] text-sm">Emergency Contact</h2>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowEmergencyForm(!showEmergencyForm)} className="bg-[#00c0f3] text-white px-3 py-1 rounded text-[11px] font-medium hover:bg-[#009dc7] border border-[#009dc7]">Add</button>
                  <button type="button" className="bg-gray-200 border border-gray-400 px-3 py-1 rounded text-[11px] font-medium hover:bg-gray-300">Parent Info</button>
                  <button type="button" className="bg-gray-200 border border-gray-400 px-3 py-1 rounded text-[11px] font-medium hover:bg-gray-300">Family Hub</button>
                </div>
              </div>
            </div>
            <div className="p-4">
              {showEmergencyForm && (
                <div className="mb-4 p-3 bg-[#f1f3f6] rounded border border-[#d1d5db]">
                  <h3 className="font-medium text-[#1E2A3A] text-sm mb-2">New Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input type="text" placeholder="Full Name" className="border border-gray-300 rounded px-2 py-1.5 text-[12px]"
                      value={newEmergency.name} onChange={e => setNewEmergency({ ...newEmergency, name: e.target.value })} />
                    <input type="text" placeholder="Relation" className="border border-gray-300 rounded px-2 py-1.5 text-[12px]"
                      value={newEmergency.relation} onChange={e => setNewEmergency({ ...newEmergency, relation: e.target.value })} />
                    <input type="tel" placeholder="Phone Number" className="border border-gray-300 rounded px-2 py-1.5 text-[12px]"
                      value={newEmergency.phone} onChange={e => setNewEmergency({ ...newEmergency, phone: e.target.value })} />
                    <input type="tel" placeholder="Alternate Phone" className="border border-gray-300 rounded px-2 py-1.5 text-[12px]"
                      value={newEmergency.altPhone} onChange={e => setNewEmergency({ ...newEmergency, altPhone: e.target.value })} />
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <button type="button" onClick={() => setShowEmergencyForm(false)} className="px-3 py-1 text-[11px] text-gray-600 hover:bg-gray-200 rounded">Cancel</button>
                    <button type="button" onClick={addEmergencyContact} className="px-3 py-1 bg-[#00c0f3] text-white rounded text-[11px] font-medium hover:bg-[#009dc7]">Save Contact</button>
                  </div>
                </div>
              )}

              {emergencyContacts.length === 0 ? (
                <div className="text-center py-6">
                  <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Phone className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-gray-400 text-[12px]">No Emergency Contacts Added For This Patient</p>
                  <button type="button" onClick={() => setShowEmergencyForm(true)} className="mt-2 text-[#1E2A3A] text-[11px] font-medium hover:underline">+ Add Emergency Contact</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {emergencyContacts.map(contact => (
                    <div key={contact.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="bg-[#f1f3f6] p-1.5 rounded-full">
                          <Heart className="w-3.5 h-3.5 text-[#1E2A3A]" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-[12px]">{contact.name}</p>
                          <p className="text-[10px] text-gray-500">{contact.relation}</p>
                          <p className="text-[10px] text-gray-500">{contact.phone}</p>
                          {contact.altPhone && <p className="text-[9px] text-gray-400">Alt: {contact.altPhone}</p>}
                        </div>
                      </div>
                      <button type="button" onClick={() => removeEmergencyContact(contact.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ==================== SECTION 5: FINANCIAL SUMMARY ==================== */}
          <div className="bg-white border border-gray-300 rounded overflow-hidden">
            <div className="bg-[#f1f3f6] px-4 py-2 border-b border-gray-300">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#1E2A3A]" />
                <h2 className="font-bold text-[#1E2A3A] text-sm">Financial Summary</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded p-3 text-center border border-gray-200">
                  <label className="text-[10px] text-gray-500 uppercase">Acct Balance</label>
                  <div className="text-xl font-bold text-gray-800">$0.00</div>
                  <button type="button" className="mt-1 text-[10px] text-[#1E2A3A] hover:underline">Details</button>
                </div>
                <div className="bg-gray-50 rounded p-3 text-center border border-gray-200">
                  <label className="text-[10px] text-gray-500 uppercase">Pt Balance</label>
                  <div className="text-xl font-bold text-gray-800">$0.00</div>
                  <button type="button" className="mt-1 text-[10px] text-[#1E2A3A] hover:underline">Account Inquiry</button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center p-1.5 bg-gray-50 rounded border border-gray-200">
                  <div className="text-[9px] text-gray-500 uppercase">Last Annual Visit</div>
                  <div className="text-[11px] font-medium text-gray-700">—</div>
                </div>
                <div className="text-center p-1.5 bg-gray-50 rounded border border-gray-200">
                  <div className="text-[9px] text-gray-500 uppercase">Last Appt</div>
                  <div className="text-[11px] font-medium text-gray-700">N/A</div>
                </div>
                <div className="text-center p-1.5 bg-gray-50 rounded border border-gray-200">
                  <div className="text-[9px] text-gray-500 uppercase">Next Appt</div>
                  <div className="text-[11px] font-medium text-gray-700">N/A</div>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== SECTION 6: INSURANCE & OTHER TABS ==================== */}
          <div className="bg-white border border-gray-300 rounded overflow-hidden">
            <div className="bg-[#f1f3f6] px-4 py-2 border-b border-gray-300">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#1E2A3A]" />
                <h2 className="font-bold text-[#1E2A3A] text-sm">Insurance & Other Information</h2>
              </div>
            </div>

            <div className="border-b border-gray-300 px-4 pt-1">
              <div className="flex flex-wrap">
                {['Insurance', 'Pharmacies', 'Contacts', 'Attorneys', 'Case Management', 'Circle of Care', 'Employers'].map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-[11px] font-medium border-r border-gray-300 transition-colors ${activeTab === tab
                      ? 'bg-white text-[#1E2A3A] border-t-2 border-t-[#1E2A3A] -mb-px'
                      : 'text-gray-600 hover:text-[#1E2A3A]'
                      }`}
                  >
                    {tab} ({tab === 'Insurance' ? formData.insurances.length : '0'})
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-50 min-h-[200px]">
              {activeTab === 'Insurance' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <label className="flex items-center gap-2 text-[11px]">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-gray-600">Self Pay</span>
                    </label>
                    <div className="flex gap-2">
                      <button type="button" onClick={addInsurance} className="bg-[#00c0f3] text-white px-3 py-1 rounded text-[11px] font-medium hover:bg-[#009dc7] border border-[#009dc7]">Add</button>
                      <button type="button" className="bg-gray-200 border border-gray-400 px-3 py-1 rounded text-[11px] font-medium hover:bg-gray-300">New Case</button>
                      <button type="button" className="bg-gray-200 border border-gray-400 px-3 py-1 rounded text-[11px] font-medium hover:bg-gray-300">Update</button>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-300 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead className="bg-[#f1f3f6] text-[11px]">
                        <tr>
                          <th className="border border-gray-300 px-2 py-1 w-10">#</th>
                          <th className="border border-gray-300 px-2 py-1">Insurance Name</th>
                          <th className="border border-gray-300 px-2 py-1">Policy / ID</th>
                          <th className="border border-gray-300 px-2 py-1">Type</th>
                          <th className="border border-gray-300 px-2 py-1">Subscriber</th>
                          <th className="border border-gray-300 px-2 py-1">Relation</th>
                          <th className="border border-gray-300 px-2 py-1 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="text-[11px]">
                        {formData.insurances.map((ins, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-2 py-1 text-center">{idx + 1}</td>
                            <td className="border border-gray-300 px-2">
                              <input type="text" className="w-full border-none p-0 focus:outline-none text-[11px]" value={ins.name} onChange={e => updateInsurance(idx, 'name', e.target.value)} placeholder="Insurance name" />
                            </td>
                            <td className="border border-gray-300 px-2">
                              <input type="text" className="w-full border-none p-0 focus:outline-none text-[11px]" value={ins.policy} onChange={e => updateInsurance(idx, 'policy', e.target.value)} placeholder="Policy number" />
                            </td>
                            <td className="border border-gray-300 px-2">
                              <select className="w-full border-none bg-transparent text-[11px]" value={ins.type} onChange={e => updateInsurance(idx, 'type', e.target.value)}>
                                <option value="primary">Primary</option>
                                <option value="secondary">Secondary</option>
                                <option value="tertiary">Tertiary</option>
                              </select>
                            </td>
                            <td className="border border-gray-300 px-2">
                              <input type="text" className="w-full border-none p-0 focus:outline-none text-[11px]" value={ins.subscriberNo} onChange={e => updateInsurance(idx, 'subscriberNo', e.target.value)} placeholder="Subscriber ID" />
                            </td>
                            <td className="border border-gray-300 px-2">
                              <input type="text" className="w-full border-none p-0 focus:outline-none text-[11px]" value={ins.rel} onChange={e => updateInsurance(idx, 'rel', e.target.value)} placeholder="Relation" />
                            </td>
                            <td className="border border-gray-300 px-2 text-center text-red-500">
                              <button type="button" onClick={() => removeInsurance(idx)} className="hover:text-red-700">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {formData.insurances.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-gray-400 italic bg-white text-[11px]">No Insurance Active</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab !== 'Insurance' && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="bg-gray-100 p-2 rounded-full mb-2">
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-gray-400 text-[11px]">No {activeTab.toLowerCase()} information available</p>
                  <button type="button" className="mt-2 text-[#1E2A3A] text-[10px] font-medium hover:underline">+ Add {activeTab.slice(0, -1)}</button>
                </div>
              )}
            </div>
          </div>

          {/* ==================== SECTION 7: CHRONIC CONDITIONS ==================== */}
          <div className="bg-white border border-gray-300 rounded overflow-hidden">
            <div className="bg-[#f1f3f6] px-4 py-2 border-b border-gray-300">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#1E2A3A]" />
                <h2 className="font-bold text-[#1E2A3A] text-sm">Chronic Conditions & ICD-10 Search</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="relative mb-3">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded text-[12px] focus:outline-none focus:border-[#1E2A3A] focus:ring-1 focus:ring-[#1E2A3A]"
                    placeholder="Search ICD-10 Code or Description (e.g. Hypertension or I10)"
                    value={icdQuery}
                    onChange={e => searchIcd(e.target.value)}
                    onFocus={() => icdResults.length > 0 && setShowIcdDropdown(true)}
                  />
                </div>

                {showIcdDropdown && icdResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-52 overflow-y-auto">
                    {icdResults.map(res => (
                      <button
                        key={res.icd_code}
                        type="button"
                        onClick={() => addProblem(res)}
                        className="w-full text-left px-3 py-1.5 hover:bg-[#f1f3f6] border-b last:border-0 flex justify-between items-center text-[11px]"
                      >
                        <span className="font-bold text-[#1E2A3A] whitespace-nowrap">{res.icd_code}</span>
                        <span className="text-gray-600 truncate ml-3 flex-1">{res.icd_description}</span>
                        <Plus className="w-3 h-3 text-gray-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[50px]">
                {formData.problems.map(prob => (
                  <div key={prob.code} className="flex items-center gap-1.5 bg-[#f1f3f6] text-[#1E2A3A] px-2 py-0.5 rounded border border-[#d1d5db] text-[11px]">
                    <span className="font-bold">{prob.code}</span>
                    <span className="text-gray-700 max-w-md truncate">{prob.description}</span>
                    <button type="button" onClick={() => removeProblem(prob.code)} className="text-gray-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {formData.problems.length === 0 && (
                  <div className="text-gray-400 text-[11px] flex items-center gap-1 py-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>No conditions added yet.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ==================== ACTION BUTTONS ==================== */}
          <div className="flex flex-wrap justify-between items-center gap-2 pt-2 pb-4">
            <div className="flex gap-2 flex-wrap">
              <button type="button" className="bg-gray-100 border border-gray-400 px-3 py-1 rounded text-[11px] font-medium hover:bg-gray-200">Additional Information</button>
              <button type="button" className="bg-gray-100 border border-gray-400 px-3 py-1 rounded text-[11px] font-medium hover:bg-gray-200">Alert</button>
              <button type="button" className="bg-gray-100 border border-gray-400 px-3 py-1 rounded text-[11px] font-medium hover:bg-gray-200">Misc Info</button>
              <button type="button" className="bg-gray-100 border border-gray-400 px-3 py-1 rounded text-[11px] font-medium hover:bg-gray-200">Options</button>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-1.5 bg-gray-100 border border-gray-400 rounded text-gray-700 font-medium text-[12px] hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isLoading}
                className="px-6 py-1.5 bg-[#1E2A3A] text-white rounded font-medium text-[12px] hover:bg-[#15202E] border border-[#15202E] shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {mutation.isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddPatient;