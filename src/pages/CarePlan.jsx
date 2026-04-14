import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Save, Lock, Plus, Trash2, ChevronRight, FileText, Target, Activity, Users } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function CarePlan() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('problems');
  const [problems, setProblems] = useState([]);
  const [goals, setGoals] = useState([]);
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [assessmentNotes, setAssessmentNotes] = useState('');
  
  if (!patientId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="bg-primary-50 p-6 rounded-full">
          <FileText className="w-12 h-12 text-primary-600" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">No Patient Selected</h2>
          <p className="text-gray-500 mt-2 max-w-sm">
            Care plans are patient-specific. Please select an enrolled patient first to view or create their care plan.
          </p>
        </div>
        <button
          onClick={() => navigate('/enrolled-patients')}
          className="btn-primary px-6 py-2 flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          View Enrolled Patients
        </button>
      </div>
    );
  }

  const { data: patientData } = useQuery(['patient', patientId], async () => {
    const response = await api.get(`/patients/${patientId}`);
    return response.data;
  });
  
  const { data: patientProblems } = useQuery(['patient-problems', patientId], async () => {
    const response = await api.get(`/care-plans/patient-problems/${patientId}`);
    return response.data;
  });
  
  const { data: existingCarePlan } = useQuery(['care-plan', patientId], async () => {
    const response = await api.get(`/care-plans/patient/${patientId}`);
    return response.data.care_plan;
  });
  
  const saveMutation = useMutation(
    async (data) => {
      const response = await api.post('/care-plans', data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Care plan saved successfully');
        queryClient.invalidateQueries(['care-plan', patientId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to save care plan');
      }
    }
  );

  const lockMutation = useMutation(
    async () => {
      const response = await api.put(`/care-plans/lock/${existingCarePlan.id}`);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Care plan signed and locked successfully');
        queryClient.invalidateQueries(['care-plan', patientId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to lock care plan');
      }
    }
  );

  useEffect(() => {
    if (existingCarePlan) {
      setSelectedProblems(existingCarePlan.problems || []);
      setGoals(existingCarePlan.goals || []);
      setAssessmentNotes(existingCarePlan.assessment_notes || '');
    }
  }, [existingCarePlan]);

  const isLocked = existingCarePlan?.is_locked;
  
  const handleAddProblem = (problem) => {
    if (!selectedProblems.find(p => p.problem_id === problem.id)) {
      setSelectedProblems([
        ...selectedProblems,
        {
          problem_id: problem.id,
          icd_code: problem.icd_code,
          icd_description: problem.icd_description,
          action_plan: ''
        }
      ]);
    }
  };
  
  const handleRemoveProblem = (problemId) => {
    setSelectedProblems(selectedProblems.filter(p => p.problem_id !== problemId));
  };
  
  const handleUpdateActionPlan = (problemId, actionPlan) => {
    setSelectedProblems(selectedProblems.map(p =>
      p.problem_id === problemId ? { ...p, action_plan: actionPlan } : p
    ));
  };
  
  const handleAddGoal = () => {
    setGoals([
      ...goals,
      {
        id: Date.now(),
        description: '',
        target_date: '',
        status: 'not_started',
        is_new: true
      }
    ]);
  };
  
  const handleUpdateGoal = (index, field, value) => {
    const updatedGoals = [...goals];
    updatedGoals[index][field] = value;
    setGoals(updatedGoals);
  };
  
  const handleRemoveGoal = (index) => {
    setGoals(goals.filter((_, i) => i !== index));
  };
  
  const handleSave = () => {
    const saveData = {
      patientId,
      visitDate: new Date().toISOString().split('T')[0],
      problems: selectedProblems.map(p => ({
        problem_id: p.problem_id,
        action_plan: p.action_plan
      })),
      goals: goals.filter(g => g.description.trim()).map(g => ({
        problem_id: null,
        description: g.description,
        target_date: g.target_date || null,
        status: g.status
      })),
      assessmentNotes
    };
    
    saveMutation.mutate(saveData);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-700 text-sm mb-2 flex items-center gap-1"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Care Plan</h1>
          <p className="text-gray-500">
            {patientData?.first_name} {patientData?.last_name} (ID: {patientData?.account_number})
          </p>
        </div>
        <div className="flex gap-2">
          {isLocked ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg font-bold">
              <Lock className="w-4 h-4" />
              Signed & Locked
            </div>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saveMutation.isLoading || !existingCarePlan}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saveMutation.isLoading ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to sign and lock this care plan? It will become read-only.')) {
                    lockMutation.mutate();
                  }
                }}
                disabled={lockMutation.isLoading || !existingCarePlan}
                className="flex items-center gap-2 px-4 py-2 btn-primary disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                Finalize & Sign
              </button>
            </>
          )}
        </div>
      </div>
      
      {isLocked && existingCarePlan && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          This care plan is finalized. Signed by <strong>{existingCarePlan.locked_by_name}</strong> on {new Date(existingCarePlan.locked_at).toLocaleString()}.
        </div>
      )}
      
      {/* Navigation Tabs */}
      <div className="flex gap-1 border-b">
        {[
          { id: 'problems', label: 'Problems & Action Plans', icon: Activity },
          { id: 'goals', label: 'Goals & Objectives', icon: Target },
          { id: 'assessment', label: 'Assessment', icon: FileText }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
              activeSection === tab.id
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Problems Section */}
      {activeSection === 'problems' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Problems */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Active Chronic Conditions</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {patientProblems?.map((problem) => {
                const isSelected = selectedProblems.some(p => p.problem_id === problem.id);
                return (
                  <div
                    key={problem.id}
                    className={`p-3 border rounded-lg transition-colors ${
                      isSelected ? 'bg-primary-50 border-primary-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{problem.icd_code} - {problem.icd_description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Group: {problem.condition_group || 'Uncategorized'}
                        </p>
                      </div>
                      {!isSelected && !isLocked && (
                        <button
                          onClick={() => handleAddProblem(problem)}
                          className="p-1 text-primary-600 hover:bg-primary-100 rounded"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {(!patientProblems || patientProblems.length === 0) && (
                <p className="text-gray-500 text-sm text-center py-4">No active chronic conditions found</p>
              )}
            </div>
          </div>
          
          {/* Selected Problems with Action Plans */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Care Plan Problems</h3>
            {selectedProblems.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No problems selected. Select conditions from the left to add to the care plan.
              </p>
            ) : (
              <div className="space-y-4">
                {selectedProblems.map((problem) => (
                  <div key={problem.problem_id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium text-[15px]">{problem.icd_code}</p>
                        <p className="text-sm text-gray-600">{problem.icd_description}</p>
                      </div>
                      {!isLocked && (
                        <button
                          onClick={() => handleRemoveProblem(problem.problem_id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Action Plan</label>
                      <textarea
                        rows={3}
                        value={problem.action_plan}
                        onChange={(e) => handleUpdateActionPlan(problem.problem_id, e.target.value)}
                        className="input mt-1"
                        placeholder="Describe the action plan for this condition..."
                        disabled={isLocked}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Goals Section */}
      {activeSection === 'goals' && (
        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Patient Goals</h3>
            {!isLocked && (
              <button
                onClick={handleAddGoal}
                className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
              >
                <Plus className="w-4 h-4" />
                Add Goal
              </button>
            )}
          </div>
          
          {goals.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No goals added. Click "Add Goal" to create patient goals.
            </p>
          ) : (
            <div className="space-y-4">
              {goals.map((goal, index) => (
                <div key={goal.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-gray-900">Goal {index + 1}</h4>
                    {!isLocked && (
                      <button
                        onClick={() => handleRemoveGoal(index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Description</label>
                      <textarea
                        rows={2}
                        value={goal.description}
                        onChange={(e) => handleUpdateGoal(index, 'description', e.target.value)}
                        className="input mt-1"
                        placeholder="Describe the goal..."
                        disabled={isLocked}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Target Date</label>
                        <input
                          type="date"
                          value={goal.target_date}
                          onChange={(e) => handleUpdateGoal(index, 'target_date', e.target.value)}
                          className="input mt-1"
                          disabled={isLocked}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Status</label>
                        <select
                          value={goal.status}
                          onChange={(e) => handleUpdateGoal(index, 'status', e.target.value)}
                          className="input mt-1"
                          disabled={isLocked}
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="achieved">Achieved</option>
                          <option value="abandoned">Abandoned</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Assessment Section */}
      {activeSection === 'assessment' && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Clinical Assessment</h3>
          <textarea
            rows={8}
            value={assessmentNotes}
            onChange={(e) => setAssessmentNotes(e.target.value)}
            className="input"
            placeholder="Document your clinical assessment, observations, and recommendations..."
            disabled={isLocked}
          />
          <p className="text-xs text-gray-500 mt-2">
            Include: Patient progress, medication adherence, barriers to care, and next steps.
          </p>
        </div>
      )}
    </div>
  );
}