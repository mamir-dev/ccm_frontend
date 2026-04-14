import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
    User, Calendar, Phone, Mail, MapPin, Activity, Clock,
    FileText, DollarSign, Users, MessageCircle, Edit,
    Plus, Trash2, Play, StopCircle, History, Download
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import TimeTrackingModal from '../components/TimeTrackingModal';
import AddProblemModal from '../components/AddProblemModal';

export default function PatientHub() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('overview');
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [showProblemModal, setShowProblemModal] = useState(false);
    const [activeTimer, setActiveTimer] = useState(false);

    // Fetch patient data
    const { data: patient, isLoading, refetch } = useQuery(['patient', id], async () => {
        const response = await api.get(`/patients/${id}`);
        return response.data;
    });

    // Fetch time logs
    const { data: timeLogs } = useQuery(['time-logs', id], async () => {
        const response = await api.get(`/time/logs/${id}`);
        return response.data;
    });

    // Fetch enrollment history
    const { data: enrollmentHistory } = useQuery(['enrollment-history', id], async () => {
        const response = await api.get(`/enrollment/history/${id}`);
        return response.data;
    });

    // Fetch care plan
    const { data: carePlan } = useQuery(['care-plan', id], async () => {
        const response = await api.get(`/care-plans/patient/${id}`);
        return response.data;
    });

    // Start timer mutation
    const startTimerMutation = useMutation(
        async () => {
            const response = await api.post('/time/start', { patientId: id });
            return response.data;
        },
        {
            onSuccess: () => {
                setActiveTimer(true);
                toast.success('Timer started');
            },
            onError: () => toast.error('Failed to start timer')
        }
    );

    // Stop timer mutation
    const stopTimerMutation = useMutation(
        async () => {
            const response = await api.post('/time/stop', { patientId: id });
            return response.data;
        },
        {
            onSuccess: (data) => {
                setActiveTimer(false);
                toast.success(`${data.minutes} minutes recorded`);
                refetch();
                queryClient.invalidateQueries(['time-logs', id]);
            },
            onError: () => toast.error('Failed to stop timer')
        }
    );

    if (isLoading) {
        return <div className="text-center py-8">Loading patient data...</div>;
    }

    if (!patient) {
        return <div className="text-center py-8 text-red-600">Patient not found</div>;
    }

    const currentEnrollment = patient.current_enrollment;
    const isEnrolled = currentEnrollment?.status === 'enrolled';

    return (
        <div className="space-y-6">
            {/* Patient Header Card */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                {patient.first_name} {patient.last_name}
                            </h1>
                            <p className="text-primary-100 mt-1">
                                ID: {patient.account_number} • DOB: {new Date(patient.date_of_birth).toLocaleDateString()} • Age: {patient.age}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => navigate(`/care-plan/${id}`)}
                                className="px-3 py-1 bg-white/20 text-white rounded-lg hover:bg-white/30"
                            >
                                <FileText className="w-4 h-4 inline mr-1" />
                                Care Plan
                            </button>
                            <button
                                onClick={() => setShowTimeModal(true)}
                                className="px-3 py-1 bg-white/20 text-white rounded-lg hover:bg-white/30"
                            >
                                <Clock className="w-4 h-4 inline mr-1" />
                                Add Time
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Contact Info */}
                    <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Contact</p>
                            <p className="font-medium">{patient.phone_mobile || 'No phone'}</p>
                            <p className="text-sm text-gray-600">{patient.email || 'No email'}</p>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Address</p>
                            <p className="font-medium">
                                {patient.address_line1} {patient.address_line2}
                            </p>
                            <p className="text-sm text-gray-600">
                                {patient.city}, {patient.state} {patient.zip_code}
                            </p>
                        </div>
                    </div>

                    {/* Providers */}
                    <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Providers</p>
                            <p className="font-medium">PCP: {patient.pcp_name || 'Not assigned'}</p>
                            <p className="text-sm text-gray-600">Rendering: {patient.rendering_provider_name || 'Not assigned'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enrollment Status Banner */}
            {isEnrolled ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex justify-between items-center">
                    <div>
                        <p className="text-green-800 font-medium">✓ Enrolled in {currentEnrollment.program_type} Program</p>
                        <p className="text-green-700 text-sm">
                            Started: {new Date(currentEnrollment.start_date).toLocaleDateString()} •
                            Consent: {currentEnrollment.consent_type} on {new Date(currentEnrollment.consent_date).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {activeTimer ? (
                            <button
                                onClick={() => stopTimerMutation.mutate()}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                <StopCircle className="w-4 h-4" />
                                Stop Timer
                            </button>
                        ) : (
                            <button
                                onClick={() => startTimerMutation.mutate()}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                <Play className="w-4 h-4" />
                                Start Timer
                            </button>
                        )}
                        <button
                            onClick={() => navigate(`/enrollment/disenroll/${currentEnrollment.id}`)}
                            className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                        >
                            Disenroll
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">Not enrolled in CCM/PCM program</p>
                    <button
                        onClick={() => navigate(`/enrollment-queue`)}
                        className="mt-2 text-yellow-700 underline text-sm"
                    >
                        Enroll this patient →
                    </button>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-1 border-b">
                {[
                    { id: 'overview', label: 'Overview', icon: User },
                    { id: 'problems', label: 'Problems', icon: Activity },
                    { id: 'time', label: 'Time Tracking', icon: Clock },
                    { id: 'history', label: 'Enrollment History', icon: History },
                    { id: 'care-team', label: 'Care Team', icon: Users }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'text-primary-600 border-b-2 border-primary-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Chronic Conditions */}
                    <div className="card p-5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-gray-900">Chronic Conditions</h3>
                            <button
                                onClick={() => setShowProblemModal(true)}
                                className="text-primary-600 text-sm flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" />
                                Add Problem
                            </button>
                        </div>
                        <div className="space-y-3">
                            {patient.problems?.filter(p => p.clinical_status === 'active').map((problem) => (
                                <div key={problem.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{problem.icd_code}</p>
                                        <p className="text-sm text-gray-600">{problem.icd_description}</p>
                                        <p className="text-xs text-gray-400 mt-1">Onset: {new Date(problem.onset_date).toLocaleDateString()}</p>
                                    </div>
                                    <button className="p-1 text-gray-400 hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {(!patient.problems || patient.problems.filter(p => p.clinical_status === 'active').length === 0) && (
                                <p className="text-gray-500 text-sm text-center py-4">No chronic conditions recorded</p>
                            )}
                        </div>
                    </div>

                    {/* Recent Time Logs */}
                    <div className="card p-5">
                        <h3 className="font-semibold text-gray-900 mb-4">Recent Time Logs</h3>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {timeLogs?.logs?.slice(0, 10).map((log) => (
                                <div key={log.id} className="flex justify-between items-center p-2 border-b">
                                    <div>
                                        <p className="font-medium">{log.minutes} minutes</p>
                                        <p className="text-xs text-gray-500">{log.reason_name || 'No reason'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm">{new Date(log.service_date).toLocaleDateString()}</p>
                                        <p className="text-xs text-gray-400">{log.user_name}</p>
                                    </div>
                                </div>
                            ))}
                            {(!timeLogs?.logs || timeLogs.logs.length === 0) && (
                                <p className="text-gray-500 text-sm text-center py-4">No time records found</p>
                            )}
                        </div>
                        {timeLogs?.summary && (
                            <div className="mt-4 pt-3 border-t">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Total (This Month):</span>
                                    <span className="font-medium">{timeLogs.summary.total_minutes} minutes</span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span className="text-gray-600">Professional Time:</span>
                                    <span className="font-medium">{timeLogs.summary.professional_minutes} minutes</span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span className="text-gray-600">Staff Time:</span>
                                    <span className="font-medium">{timeLogs.summary.staff_minutes} minutes</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Latest Care Plan */}
                    {carePlan?.care_plan && (
                        <div className="card p-5 lg:col-span-2">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-gray-900">Latest Care Plan</h3>
                                <button
                                    onClick={() => navigate(`/care-plan/${id}`)}
                                    className="text-primary-600 text-sm"
                                >
                                    Edit Care Plan →
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Visit Date</p>
                                    <p className="font-medium">{new Date(carePlan.care_plan.visit_date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <p className={`font-medium ${carePlan.care_plan.is_locked ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {carePlan.care_plan.is_locked ? 'Locked' : 'In Progress'}
                                    </p>
                                </div>
                            </div>
                            {carePlan.care_plan.problems?.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-sm text-gray-500 mb-2">Problems Addressed</p>
                                    <div className="flex flex-wrap gap-2">
                                        {carePlan.care_plan.problems.slice(0, 3).map((p) => (
                                            <span key={p.id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                {p.icd_code}
                                            </span>
                                        ))}
                                        {carePlan.care_plan.problems.length > 3 && (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                +{carePlan.care_plan.problems.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Problems Tab */}
            {activeTab === 'problems' && (
                <div className="card">
                    <div className="p-5 border-b flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Problem List</h3>
                        <button
                            onClick={() => setShowProblemModal(true)}
                            className="btn-primary text-sm py-1.5"
                        >
                            <Plus className="w-4 h-4 inline mr-1" />
                            Add Problem
                        </button>
                    </div>
                    <div className="divide-y">
                        {patient.problems?.map((problem) => (
                            <div key={problem.id} className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium">{problem.icd_code} - {problem.icd_description}</p>
                                        <div className="flex gap-4 mt-1 text-sm text-gray-500">
                                            <span>Status: {problem.clinical_status}</span>
                                            <span>Onset: {new Date(problem.onset_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="text-gray-400 hover:text-blue-600">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button className="text-gray-400 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Time Tracking Tab */}
            {activeTab === 'time' && (
                <div className="card">
                    <div className="p-5 border-b">
                        <h3 className="font-semibold text-gray-900">Time Tracking Logs</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Minutes</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Reason</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">User</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {timeLogs?.logs?.map((log) => (
                                    <tr key={log.id} className={log.is_voided ? 'bg-red-50 line-through text-gray-400' : ''}>
                                        <td className="px-4 py-3 text-sm">{new Date(log.service_date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 font-medium">{log.minutes} min</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 text-xs rounded-full ${log.is_professional_time ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {log.is_professional_time ? 'Professional' : 'Staff'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{log.reason_name || '-'}</td>
                                        <td className="px-4 py-3 text-sm">{log.user_name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{log.notes || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Enrollment History Tab */}
            {activeTab === 'history' && (
                <div className="card">
                    <div className="p-5 border-b">
                        <h3 className="font-semibold text-gray-900">Enrollment History</h3>
                    </div>
                    <div className="divide-y">
                        {enrollmentHistory?.map((enrollment) => (
                            <div key={enrollment.id} className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium">
                                            {enrollment.program_type} - {enrollment.status.toUpperCase()}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Enrolled: {new Date(enrollment.start_date).toLocaleDateString()}
                                            {enrollment.end_date && ` to ${new Date(enrollment.end_date).toLocaleDateString()}`}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Consent: {enrollment.consent_type} on {new Date(enrollment.consent_date).toLocaleDateString()}
                                        </p>
                                        {enrollment.disenrollment_reason && (
                                            <p className="text-sm text-red-600 mt-1">
                                                Disenrolled: {enrollment.disenrollment_reason}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400">
                                            Enrolled by: {enrollment.enrolled_by_name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(enrollment.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Care Team Tab */}
            {activeTab === 'care-team' && (
                <div className="card">
                    <div className="p-5 border-b">
                        <h3 className="font-semibold text-gray-900">Care Team Members</h3>
                    </div>
                    <div className="divide-y">
                        {patient.care_team?.map((member) => (
                            <div key={member.id} className="p-4 flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{member.first_name} {member.last_name}</p>
                                    <p className="text-sm text-gray-500">
                                        Role: {member.role_name || member.role} • {member.designation}
                                    </p>
                                </div>
                                {member.is_primary && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Primary Contact</span>
                                )}
                            </div>
                        ))}
                        {(!patient.care_team || patient.care_team.length === 0) && (
                            <p className="text-gray-500 text-center py-8">No care team assigned</p>
                        )}
                    </div>
                </div>
            )}

            {/* Modals */}
            {showTimeModal && (
                <TimeTrackingModal
                    patient={patient}
                    onClose={() => setShowTimeModal(false)}
                    onSuccess={() => {
                        refetch();
                        queryClient.invalidateQueries(['time-logs', id]);
                    }}
                />
            )}

            {showProblemModal && (
                <AddProblemModal
                    patientId={id}
                    onClose={() => setShowProblemModal(false)}
                    onSuccess={() => {
                        refetch();
                        toast.success('Problem added successfully');
                    }}
                />
            )}
        </div>
    );
}