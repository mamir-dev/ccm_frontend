import React, { useState } from 'react';
import { useTimerStore } from '../stores/timerStore';
import { Clock, Square, Play } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const TimeStatusWidget = () => {
  const { isRunning, activeTimer, elapsedSeconds, stopTimer } = useTimerStore();
  const [isStopping, setIsStopping] = useState(false);
  const [stopData, setStopData] = useState({ reasonId: '', notes: '' });
  const [reasons, setReasons] = useState([]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStopClick = async () => {
    try {
      const res = await api.get('/time/reasons');
      setReasons(res.data);
      setIsStopping(true);
    } catch (err) {
      toast.error('Failed to load tracking reasons');
    }
  };

  const handleFinalStop = async (e) => {
    e.preventDefault();
    try {
      await api.post('/time/stop', {
        patientId: activeTimer.patientId,
        reasonId: stopData.reasonId,
        notes: stopData.notes
      });
      stopTimer();
      setIsStopping(false);
      setStopData({ reasonId: '', notes: '' });
      toast.success('Time log saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to stop timer');
    }
  };

  if (!isRunning) return null;

  return (
    <>
      <div className="flex items-center bg-primary-600 text-white rounded-full px-4 py-1.5 shadow-md border border-primary-500 animate-pulse-slow">
        <div className="flex items-center gap-2 mr-3 border-r border-primary-400 pr-3">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-bold font-mono">{formatTime(elapsedSeconds)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium max-w-[120px] truncate">
            {activeTimer?.patientName}
          </span>
          <button 
            onClick={handleStopClick}
            className="p-1 hover:bg-primary-700 rounded-full transition-colors flex items-center justify-center bg-white/20"
            title="Stop Timer"
          >
            <Square className="w-3 h-3 fill-current" />
          </button>
        </div>
      </div>

      {isStopping && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-gray-900">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-primary-600 p-4 text-white">
              <h3 className="font-bold flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Finalize CCM Activity
              </h3>
              <p className="text-primary-100 text-sm mt-1">
                You tracked {Math.ceil(elapsedSeconds / 60)} minute(s) for {activeTimer.patientName}
              </p>
            </div>
            <form onSubmit={handleFinalStop} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">What activity was performed?</label>
                <select 
                  className="input w-full" 
                  required
                  value={stopData.reasonId}
                  onChange={e => setStopData({...stopData, reasonId: e.target.value})}
                >
                  <option value="">Select a reason...</option>
                  {reasons.map(r => <option key={r.id} value={r.id}>{r.reason_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Activity Notes</label>
                <textarea 
                  className="input w-full" 
                  rows={3} 
                  placeholder="e.g. Reviewed lab results and called pharmacy..."
                  value={stopData.notes}
                  onChange={e => setStopData({...stopData, notes: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsStopping(false)}
                  className="flex-1 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Keep Timing
                </button>
                <button 
                  type="submit"
                  className="flex-1 btn-primary py-2 shadow-lg shadow-primary-200"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TimeStatusWidget;
