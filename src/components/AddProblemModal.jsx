import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AddProblemModal({ patientId, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedIcd, setSelectedIcd] = useState(null);
    const [formData, setFormData] = useState({
        onsetDate: new Date().toISOString().split('T')[0],
        clinicalStatus: 'active',
        notes: ''
    });

    const searchIcdCodes = async () => {
        if (searchTerm.length < 2) return;

        try {
            // This would call your ICD search endpoint
            // For now, using mock data
            const mockResults = [
                { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
                { code: 'I10', description: 'Essential (primary) hypertension' },
                { code: 'J44.9', description: 'Chronic obstructive pulmonary disease, unspecified' },
                { code: 'I25.10', description: 'Atherosclerotic heart disease' },
                { code: 'N18.9', description: 'Chronic kidney disease, unspecified' }
            ].filter(r =>
                r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setSearchResults(mockResults);
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    useEffect(() => {
        const delay = setTimeout(() => {
            if (searchTerm) searchIcdCodes();
        }, 300);
        return () => clearTimeout(delay);
    }, [searchTerm]);

    const handleSubmit = async () => {
        if (!selectedIcd) {
            toast.error('Please select an ICD code');
            return;
        }

        setLoading(true);
        try {
            await api.post('/patients/problems', {
                patientId,
                icdCode: selectedIcd.code,
                icdDescription: selectedIcd.description,
                onsetDate: formData.onsetDate,
                clinicalStatus: formData.clinicalStatus,
                notes: formData.notes
            });
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add problem');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-md">
                <div className="flex justify-between items-center p-5 border-b">
                    <h2 className="text-lg font-bold">Add Chronic Condition</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* ICD Code Search */}
                    <div>
                        <label className="label">Search ICD-10 Code</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input pl-10"
                                placeholder="Search by code or description..."
                            />
                        </div>
                        {searchResults.length > 0 && (
                            <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                                {searchResults.map((result) => (
                                    <button
                                        key={result.code}
                                        onClick={() => setSelectedIcd(result)}
                                        className={`w-full text-left p-2 hover:bg-gray-50 border-b last:border-b-0 ${selectedIcd?.code === result.code ? 'bg-primary-50' : ''
                                            }`}
                                    >
                                        <p className="font-medium text-sm">{result.code}</p>
                                        <p className="text-xs text-gray-500">{result.description}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Selected ICD */}
                    {selectedIcd && (
                        <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-green-800">Selected:</p>
                            <p className="text-sm">{selectedIcd.code} - {selectedIcd.description}</p>
                        </div>
                    )}

                    {/* Onset Date */}
                    <div>
                        <label className="label">Onset Date</label>
                        <input
                            type="date"
                            value={formData.onsetDate}
                            onChange={(e) => setFormData({ ...formData, onsetDate: e.target.value })}
                            className="input"
                        />
                    </div>

                    {/* Clinical Status */}
                    <div>
                        <label className="label">Clinical Status</label>
                        <select
                            value={formData.clinicalStatus}
                            onChange={(e) => setFormData({ ...formData, clinicalStatus: e.target.value })}
                            className="input"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="label">Notes</label>
                        <textarea
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="input"
                            placeholder="Additional notes about this condition..."
                        />
                    </div>
                </div>

                <div className="flex gap-3 p-5 border-t bg-gray-50">
                    <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !selectedIcd}
                        className="flex-1 btn-primary disabled:opacity-50"
                    >
                        {loading ? 'Adding...' : 'Add Problem'}
                    </button>
                </div>
            </div>
        </div>
    );
}