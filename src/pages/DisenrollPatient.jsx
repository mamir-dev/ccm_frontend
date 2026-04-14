import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { AlertTriangle, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function DisenrollPatient() {
    const { enrollmentId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        disenrollmentDate: new Date().toISOString().split('T')[0],
        reasonId: '',
        notes: ''
    });
    const [acknowledged, setAcknowledged] = useState(false);

    // Fetch disenrollment reasons
    const { data: reasons } = useQuery('disenrollment-reasons', async () => {
        const response = await api.get('/config/disenrollment-reasons');
        return response.data;
    });

    // Fetch enrollment details
    const { data: enrollment } = useQuery(['enrollment', enrollmentId], async () => {
        const response = await api.get(`/enrollment/${enrollmentId}`);
        return response.data;
    });

    const disenrollMutation = useMutation(
        async () => {
            const response = await api.post(`/enrollment/disenroll/${enrollmentId}`, formData);
            return response.data;
        },
        {
            onSuccess: () => {
                toast.success('Patient disenrolled successfully');
                navigate('/enrolled-patients');
            },
            onError: (error) => {
                toast.error(error.response?.data?.error || 'Failed to disenroll patient');
            }
        }
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!acknowledged) {
            toast.error('Please acknowledge the disenrollment notice');
            return;
        }
        if (!formData.reasonId) {
            toast.error('Please select a disenrollment reason');
            return;
        }
        disenrollMutation.mutate();
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="card">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold text-gray-900">Disenroll Patient from CCM/PCM</h1>
                    <p className="text-gray-500 mt-1">Please provide the reason for disenrollment</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Warning Banner */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                            <p className="font-medium">Important Notice:</p>
                            <p className="mt-1">
                                Once disenrolled, the patient will no longer be eligible for CCM/PCM billing.
                                Any time recorded after the disenrollment date will not be billable.
                                The patient can be re-enrolled at any time with a new consent form.
                            </p>
                        </div>
                    </div>

                    {/* Patient Info */}
                    {enrollment && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600">Patient: <span className="font-medium">{enrollment.patient_name}</span></p>
                            <p className="text-sm text-gray-600">Program: <span className="font-medium">{enrollment.program_type}</span></p>
                            <p className="text-sm text-gray-600">Enrolled Since: <span className="font-medium">{new Date(enrollment.start_date).toLocaleDateString()}</span></p>
                        </div>
                    )}

                    {/* Disenrollment Date */}
                    <div>
                        <label className="label">Disenrollment Date *</label>
                        <input
                            type="date"
                            value={formData.disenrollmentDate}
                            onChange={(e) => setFormData({ ...formData, disenrollmentDate: e.target.value })}
                            className="input"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Services provided on or before this date may still be billed.
                        </p>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="label">Disenrollment Reason *</label>
                        <select
                            value={formData.reasonId}
                            onChange={(e) => setFormData({ ...formData, reasonId: e.target.value })}
                            className="input"
                            required
                        >
                            <option value="">Select a reason...</option>
                            {reasons?.map((reason) => (
                                <option key={reason.id} value={reason.id}>{reason.reason_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="label">Additional Notes</label>
                        <textarea
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="input"
                            placeholder="Optional: Add any additional information about the disenrollment..."
                        />
                    </div>

                    {/* Acknowledgement */}
                    <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                        <input
                            type="checkbox"
                            checked={acknowledged}
                            onChange={(e) => setAcknowledged(e.target.checked)}
                            className="mt-0.5"
                        />
                        <div className="text-sm text-gray-700">
                            I acknowledge that this action will disenroll the patient from the CCM/PCM program
                            and they will no longer receive care management services under this program.
                        </div>
                    </label>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={disenrollMutation.isLoading}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                            {disenrollMutation.isLoading ? 'Processing...' : 'Confirm Disenrollment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}