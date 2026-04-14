import { useState, useEffect } from 'react';
import { X, Calendar, FileText, Users, Activity, CheckCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function EnrollmentModal({ patient, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [eligibility, setEligibility] = useState(null);
  const [careTeams, setCareTeams] = useState([]);
  const [timeReasons, setTimeReasons] = useState([]);
  
  const [formData, setFormData] = useState({
    programType: 'CCM',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    consentType: 'verbal',
    consentDate: new Date().toISOString().split('T')[0],
    medicalDecisionMaking: 'not_assigned',
    selectedChronicConditionIds: [],
    careTeamId: '',
    enrollmentNotes: ''
  });
  
  useEffect(() => {
    fetchEligibility();
    fetchCareTeams();
    fetchTimeReasons();
  }, [patient.id]);
  
  const fetchEligibility = async () => {
    try {
      const response = await api.get(`/enrollment/eligibility/${patient.id}`);
      setEligibility(response.data);
      
      // Auto-select all chronic conditions for PCM
      if (response.data.chronic_conditions.length === 1) {
        setFormData(prev => ({
          ...prev,
          selectedChronicConditionIds: response.data.chronic_conditions.map(c => c.id)
        }));
      }
    } catch (error) {
      console.error('Failed to fetch eligibility:', error);
    }
  };
  
  const fetchCareTeams = async () => {
    try {
      const response = await api.get('/config/care-teams');
      setCareTeams(response.data);
    } catch (error) {
      console.error('Failed to fetch care teams:', error);
    }
  };
  
  const fetchTimeReasons = async () => {
    try {
      const response = await api.get('/time/reasons');
      setTimeReasons(response.data);
    } catch (error) {
      console.error('Failed to fetch time reasons:', error);
    }
  };
  
  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/enrollment/enroll', {
        patientId: patient.id,
        ...formData
      });
      toast.success('Patient enrolled successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to enroll patient');
    } finally {
      setLoading(false);
    }
  };
  
  const canProceed = () => {
    if (step === 1) return formData.programType && formData.startDate;
    if (step === 2) return formData.consentType && formData.consentDate;
    if (step === 3) {
      if (formData.programType === 'PCM') {
        return formData.selectedChronicConditionIds.length > 0;
      }
      return true;
    }
    return true;
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">Enroll Patient in CCM/PCM</h2>
            <p className="text-gray-500 text-sm mt-1">
              {patient.first_name} {patient.last_name} (ID: {patient.account_number})
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Steps */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Program Selection' },
              { num: 2, label: 'Consent & Documents' },
              { num: 3, label: 'Care Team' },
              { num: 4, label: 'Review & Enroll' }
            ].map((s) => (
              <div key={s.num} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    step >= s.num
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                </div>
                <span className={`ml-2 text-sm ${step >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>
                  {s.label}
                </span>
                {s.num < 4 && <div className="w-12 h-px bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {step === 1 && (
            <div className="space-y-5">
              {/* Eligibility Summary */}
              {eligibility && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Eligibility Summary</h3>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p>✓ {eligibility.chronic_conditions_count} chronic conditions identified</p>
                    <p>✓ {eligibility.insurances.filter(i => i.is_eligible_for_ccm).length} eligible insurances</p>
                    <p>{eligibility.eligible_for_ccm ? '✓' : '✗'} Eligible for CCM (2+ conditions)</p>
                    <p>{eligibility.eligible_for_pcm ? '✓' : '✗'} Eligible for PCM (1+ condition)</p>
                  </div>
                </div>
              )}
              
              {/* Program Type */}
              <div>
                <label className="label">Program Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, programType: 'CCM' })}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      formData.programType === 'CCM'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">CCM - Chronic Care Management</div>
                    <div className="text-xs text-gray-500 mt-1">
                      For patients with 2+ chronic conditions
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, programType: 'PCM' })}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      formData.programType === 'PCM'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">PCM - Principal Care Management</div>
                    <div className="text-xs text-gray-500 mt-1">
                      For patients with 1 high-risk chronic condition
                    </div>
                  </button>
                </div>
              </div>
              
              {/* Program Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">End Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              
              {/* Medical Decision Making */}
              <div>
                <label className="label">Medical Decision Making Complexity</label>
                <select
                  value={formData.medicalDecisionMaking}
                  onChange={(e) => setFormData({ ...formData, medicalDecisionMaking: e.target.value })}
                  className="input"
                >
                  <option value="not_assigned">Not Assigned</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-5">
              {/* Consent Type */}
              <div>
                <label className="label">Consent Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, consentType: 'verbal' })}
                    className={`p-3 border rounded-lg text-center ${
                      formData.consentType === 'verbal'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200'
                    }`}
                  >
                    Verbal Consent
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, consentType: 'written' })}
                    className={`p-3 border rounded-lg text-center ${
                      formData.consentType === 'written'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200'
                    }`}
                  >
                    Written Consent
                  </button>
                </div>
              </div>
              
              {/* Consent Date */}
              <div>
                <label className="label">Consent Date *</label>
                <input
                  type="date"
                  value={formData.consentDate}
                  onChange={(e) => setFormData({ ...formData, consentDate: e.target.value })}
                  className="input"
                />
              </div>
              
              {/* Chronic Conditions (for PCM) */}
              {formData.programType === 'PCM' && eligibility && (
                <div>
                  <label className="label">Select Chronic Condition to Manage *</label>
                  <div className="space-y-2">
                    {eligibility.chronic_conditions.map((condition) => (
                      <label key={condition.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.selectedChronicConditionIds.includes(condition.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                selectedChronicConditionIds: [...formData.selectedChronicConditionIds, condition.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                selectedChronicConditionIds: formData.selectedChronicConditionIds.filter(id => id !== condition.id)
                              });
                            }
                          }}
                          className="mt-0.5"
                        />
                        <div>
                          <p className="font-medium">{condition.icd_code} - {condition.icd_description}</p>
                          <p className="text-xs text-gray-500">Group: {condition.group_name || 'Uncategorized'}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    For PCM, select the single high-risk condition to focus care management on.
                  </p>
                </div>
              )}
              
              {/* Notes */}
              <div>
                <label className="label">Enrollment Notes</label>
                <textarea
                  rows={3}
                  value={formData.enrollmentNotes}
                  onChange={(e) => setFormData({ ...formData, enrollmentNotes: e.target.value })}
                  className="input"
                  placeholder="Add any additional notes about the enrollment..."
                />
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-5">
              {/* Care Team Assignment */}
              <div>
                <label className="label">Assign Care Team</label>
                <select
                  value={formData.careTeamId}
                  onChange={(e) => setFormData({ ...formData, careTeamId: e.target.value })}
                  className="input"
                >
                  <option value="">Select a care team...</option>
                  {careTeams.map((team) => (
                    <option key={team.id} value={team.id}>{team.team_name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Care teams can be configured in Settings &gt; Care Teams
                </p>
              </div>
              
              {/* Time Capture Reasons Preview */}
              <div>
                <label className="label">Common Time Capture Reasons</label>
                <div className="flex flex-wrap gap-2">
                  {timeReasons.slice(0, 6).map((reason) => (
                    <span key={reason.id} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {reason.reason_name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {step === 4 && (
            <div className="space-y-5">
              <h3 className="font-semibold text-lg">Review Enrollment Details</h3>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Patient:</span>
                  <span className="font-medium">{patient.first_name} {patient.last_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Program:</span>
                  <span className="font-medium">{formData.programType}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Start Date:</span>
                  <span>{new Date(formData.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Consent:</span>
                  <span className="capitalize">{formData.consentType} on {new Date(formData.consentDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Medical Decision Making:</span>
                  <span className="capitalize">{formData.medicalDecisionMaking}</span>
                </div>
                {formData.programType === 'PCM' && (
                  <div className="py-2 border-b">
                    <span className="text-gray-600">Selected Condition:</span>
                    <p className="text-sm mt-1">
                      {eligibility?.chronic_conditions
                        .filter(c => formData.selectedChronicConditionIds.includes(c.id))
                        .map(c => `${c.icd_code} - ${c.icd_description.substring(0, 50)}`)
                        .join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-between p-6 border-t bg-gray-50">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Back
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">
              Cancel
            </button>
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="px-4 py-2 btn-primary disabled:opacity-50"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 btn-primary disabled:opacity-50"
              >
                {loading ? 'Enrolling...' : 'Enroll Patient'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}