import { useState, useEffect } from 'react';
import { X, Clock, Calendar, FileText } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function TimeTrackingModal({ patient, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [reasons, setReasons] = useState([]);
  const [formData, setFormData] = useState({
    minutes: '',
    serviceDate: new Date().toISOString().split('T')[0],
    reasonId: '',
    notes: ''
  });
  
  useEffect(() => {
    fetchReasons();
  }, []);
  
  const fetchReasons = async () => {
    try {
      const response = await api.get('/time/reasons');
      setReasons(response.data);
    } catch (error) {
      console.error('Failed to fetch reasons:', error);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.minutes || formData.minutes < 1) {
      toast.error('Please enter valid minutes (1-999)');
      return;
    }
    
    if (formData.minutes > 999) {
      toast.error('Minutes cannot exceed 999');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/time/manual', {
        patientId: patient.id,
        minutes: parseInt(formData.minutes),
        serviceDate: formData.serviceDate,
        reasonId: formData.reasonId || null,
        notes: formData.notes || null
      });
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to record time');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b">
          <div>
            <h2 className="text-lg font-bold">Record Time</h2>
            <p className="text-sm text-gray-500">
              {patient.first_name} {patient.last_name}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Minutes *</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                min="1"
                max="999"
                value={formData.minutes}
                onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
                className="input pl-10"
                placeholder="Enter minutes spent"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Minimum 1 minute, maximum 999 minutes</p>
          </div>
          
          <div>
            <label className="label">Service Date *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={formData.serviceDate}
                onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                className="input pl-10"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="label">Reason for Time</label>
            <select
              value={formData.reasonId}
              onChange={(e) => setFormData({ ...formData, reasonId: e.target.value })}
              className="input"
            >
              <option value="">Select a reason...</option>
              {reasons.map((reason) => (
                <option key={reason.id} value={reason.id}>{reason.reason_name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="label">Notes</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input pl-10"
                placeholder="Add any additional notes..."
              />
            </div>
          </div>
          
          {/* Quick Tips */}
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-800 font-medium mb-1">Billing Requirements:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Minimum 20 minutes per month for CCM billing</li>
              <li>• Minimum 30 minutes per month for PCM billing</li>
              <li>• Time can be cumulative across multiple sessions</li>
            </ul>
          </div>
          
          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary disabled:opacity-50">
              {loading ? 'Saving...' : 'Record Time'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}