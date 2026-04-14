import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
    User, Calendar, Phone, Mail, MapPin, Activity, Clock,
    FileText, Users, MessageCircle, Edit,
    Plus, Trash2, Play, StopCircle, History, Download,
    Search, Info, Printer, Settings,
    Microscope, Image, Stethoscope, PhoneCall, Globe,
    Share2, Package, Layout, List, ChevronRight, X, ArrowRight,
    Heart, ClipboardList, AlertCircle, CheckCircle, Timer, MoreVertical
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
    const [elapsedTime, setElapsedTime] = useState(0);
    const [timerInterval, setTimerInterval] = useState(null);

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
                const interval = setInterval(() => {
                    setElapsedTime(prev => prev + 1);
                }, 1000);
                setTimerInterval(interval);
                toast.success('Timer started');
            },
            onError: () => toast.error('Failed to start timer')
        }
    );

    // Stop timer mutation
    const stopTimerMutation = useMutation(
        async () => {
            const response = await api.post('/time/stop', { patientId: id, seconds: elapsedTime });
            return response.data;
        },
        {
            onSuccess: (data) => {
                if (timerInterval) clearInterval(timerInterval);
                setActiveTimer(false);
                setElapsedTime(0);
                toast.success(`${Math.round(data.minutes)} minutes recorded`);
                refetch();
                queryClient.invalidateQueries(['time-logs', id]);
            },
            onError: () => toast.error('Failed to stop timer')
        }
    );

    const formatElapsedTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen  flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading patient data...</p>
                </div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="min-h-screen  flex items-center justify-center">
                <div className="text-center text-red-600">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-lg font-semibold">Patient not found</p>
                </div>
            </div>
        );
    }

    const currentEnrollment = patient.current_enrollment;
    const isEnrolled = currentEnrollment?.status === 'enrolled';
    const totalMinutes = timeLogs?.summary?.total_minutes || 0;

    return (
        <div className="min-h-screen ">
            {/* Modern Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                            <div className="h-8 w-px bg-gray-200"></div>
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gray-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-800">
                                        {patient.last_name}, {patient.first_name}
                                    </h1>
                                    <div className="flex items-center space-x-3 text-sm text-gray-500 mt-0.5">
                                        <span className="flex items-center">
                                            <Calendar className="w-3.5 h-3.5 mr-1" />
                                            {new Date(patient.date_of_birth).toLocaleDateString()} ({patient.age} years)
                                        </span>
                                        <span>•</span>
                                        <span>ID: {patient.account_number}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium">
                                <Settings className="w-4 h-4 inline mr-2" />
                                Settings
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Quick Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Total CCM Time</p>
                                <p className="text-2xl font-bold text-gray-800 mt-1">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</p>
                            </div>
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-gray-500" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Active Problems</p>
                                <p className="text-2xl font-bold text-gray-800 mt-1">{patient.problems?.filter(p => p.clinical_status === 'active').length || 0}</p>
                            </div>
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Heart className="w-5 h-5 text-gray-500" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Enrollment Status</p>
                                <p className={`text-lg font-bold mt-1 ${isEnrolled ? 'text-gray-700' : 'text-gray-400'}`}>
                                    {isEnrolled ? 'Active' : 'Not Enrolled'}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-gray-500" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Care Plan</p>
                                <p className="text-lg font-bold mt-1 text-gray-700">In Progress</p>
                            </div>
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <ClipboardList className="w-5 h-5 text-gray-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Left Column - Patient Info & CCM Core */}
                    <div className="col-span-12 lg:col-span-5 space-y-6">
                        {/* Patient Information Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                                <h2 className="text-sm font-semibold text-gray-800 flex items-center">
                                    <User className="w-4 h-4 mr-2 text-gray-400" />
                                    Patient Information
                                </h2>
                            </div>
                            <div className="p-5 space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500">Phone Number</label>
                                        <p className="text-sm font-medium text-gray-800 mt-0.5">{patient.phone_mobile || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Email</label>
                                        <p className="text-sm font-medium text-gray-800 mt-0.5">{patient.email || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Date of Birth</label>
                                        <p className="text-sm font-medium text-gray-800 mt-0.5">{new Date(patient.date_of_birth).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Gender</label>
                                        <p className="text-sm font-medium text-gray-800 mt-0.5 capitalize">{patient.gender || 'Not specified'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs text-gray-500">Address</label>
                                        <p className="text-sm font-medium text-gray-800 mt-0.5">{patient.city ? `${patient.city}, ${patient.state} ${patient.zip_code}` : 'Not provided'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CCM Enrollment Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                                <h2 className="text-sm font-semibold text-gray-800 flex items-center">
                                    <Activity className="w-4 h-4 mr-2 text-gray-400" />
                                    Chronic Care Management Enrollment
                                </h2>
                            </div>
                            <div className="p-5">
                                {isEnrolled ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center">
                                                <CheckCircle className="w-5 h-5 text-gray-500 mr-2" />
                                                <span className="text-sm font-medium text-gray-700">Actively Enrolled</span>
                                            </div>
                                            <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                                                Disenroll
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-500">Start Date</label>
                                                <p className="text-sm font-medium text-gray-800 mt-0.5">
                                                    {currentEnrollment?.start_date ? new Date(currentEnrollment.start_date).toLocaleDateString() : 'Not set'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Consent Type</label>
                                                <p className="text-sm font-medium text-gray-800 mt-0.5 capitalize">{currentEnrollment?.consent_type || 'Verbal'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Primary Care Provider</label>
                                            <p className="text-sm font-medium text-gray-800 mt-0.5">{patient.pcp_name || 'Not assigned'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 mb-3">Patient not enrolled in CCM</p>
                                        <button className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors" style={{backgroundColor: '#1E2A3A'}}>
                                            Enroll Patient
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Time Tracking Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                                <h2 className="text-sm font-semibold text-gray-800 flex items-center">
                                    <Timer className="w-4 h-4 mr-2 text-gray-400" />
                                    Time Tracking
                                </h2>
                            </div>
                            <div className="p-5">
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Current Session</p>
                                        <p className="text-3xl font-mono font-bold text-gray-800">{formatElapsedTime(elapsedTime)}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    {activeTimer ? (
                                        <button
                                            onClick={() => stopTimerMutation.mutate()}
                                            className="flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                                            style={{backgroundColor: '#1E2A3A'}}
                                        >
                                            <StopCircle className="w-4 h-4 mr-2" />
                                            Stop Timer
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => startTimerMutation.mutate()}
                                            className="flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                                            style={{backgroundColor: '#1E2A3A'}}
                                        >
                                            <Play className="w-4 h-4 mr-2" />
                                            Start Timer
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowTimeModal(true)}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        Add Manual Time
                                    </button>
                                </div>
                                <div className="mt-4 pt-3 border-t border-gray-100">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Total Time This Month</span>
                                        <span className="font-semibold text-gray-800">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Problems & Actions */}
                    <div className="col-span-12 lg:col-span-7 space-y-6">
                        {/* Problem List Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-sm font-semibold text-gray-800 flex items-center">
                                    <Heart className="w-4 h-4 mr-2 text-gray-400" />
                                    Chronic Conditions (Problem List)
                                </h2>
                                <button
                                    onClick={() => setShowProblemModal(true)}
                                    className="px-3 py-1.5 text-white rounded-lg text-xs font-medium transition-colors flex items-center"
                                    style={{backgroundColor: '#1E2A3A'}}
                                >
                                    <Plus className="w-3.5 h-3.5 mr-1" />
                                    Add Condition
                                </button>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {patient.problems?.filter(p => p.clinical_status === 'active').map((problem) => (
                                    <div key={problem.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center mb-1">
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono mr-2">
                                                        {problem.icd_code}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-800">{problem.icd_description}</span>
                                                </div>
                                                <div className="flex items-center text-xs text-gray-500 mt-2">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    Onset: {new Date(problem.onset_date).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                                                <MoreVertical className="w-4 h-4 text-gray-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(!patient.problems || patient.problems.filter(p => p.clinical_status === 'active').length === 0) && (
                                    <div className="p-8 text-center">
                                        <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No chronic conditions recorded</p>
                                        <button
                                            onClick={() => setShowProblemModal(true)}
                                            className="mt-3 text-gray-600 text-sm hover:text-gray-800"
                                        >
                                            Add a condition
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions Grid */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                                <h2 className="text-sm font-semibold text-gray-800 flex items-center">
                                    <Layout className="w-4 h-4 mr-2 text-gray-400" />
                                    Quick Actions
                                </h2>
                            </div>
                            <div className="p-5">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {[
                                        { label: 'Progress Note', icon: FileText, color: 'blue' },
                                        { label: 'Care Plan', icon: ClipboardList, color: 'green' },
                                        { label: 'Send Message', icon: MessageCircle, color: 'indigo' },
                                        { label: 'View History', icon: History, color: 'purple' },
                                        { label: 'Export Data', icon: Download, color: 'gray' },
                                        { label: 'Care Team', icon: Users, color: 'orange' },
                                    ].map((action) => (
                                        <button
                                            key={action.label}
                                            className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all text-left group"
                                        >
                                            <action.icon className="w-5 h-5 text-gray-400 mb-2 group-hover:scale-105 transition-transform" />
                                            <p className="text-sm font-medium text-gray-700">{action.label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                                <h2 className="text-sm font-semibold text-gray-800 flex items-center">
                                    <History className="w-4 h-4 mr-2 text-gray-500" />
                                    Recent Activity
                                </h2>
                            </div>
                            <div className="p-5">
                                {timeLogs?.recent?.length > 0 ? (
                                    <div className="space-y-3">
                                        {timeLogs.recent.slice(0, 5).map((log, idx) => (
                                            <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                                <div className="flex items-center">
                                                    <Clock className="w-4 h-4 text-gray-400 mr-3" />
                                                    <div>
                                                        <p className="text-sm text-gray-800">{log.description || 'CCM Time Entry'}</p>
                                                        <p className="text-xs text-gray-500">{new Date(log.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-medium text-gray-600">{log.minutes} min</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-4">No recent activity</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
                        toast.success('Condition added successfully');
                    }}
                />
            )}
        </div>
    );
}