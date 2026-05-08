import { useState } from 'react';
import { supabase } from '../supabaseClient';
import '../pages/Dashboard.css';

export default function CreateClassModal({ isOpen, onClose, onClassCreated, teacherId }) {
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Ensure we have the latest user ID from the session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      setError("Session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    // Generate a random 6-character alphanumeric code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    console.log("Attempting to create class for user:", userId);

    const { data, error } = await supabase
      .from('classes')
      .insert([
        {
          teacher_id: userId,
          name: className,
          invite_code: inviteCode
        }
      ])
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error('Full Supabase Error:', error);
      setError(error.message + " (Check console for details)");
    } else {
      setClassName('');
      if (onClassCreated) onClassCreated(data);

      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="glass-card" style={{ width: '400px', background: '#fff' }}>
        <div className="card-header">
          <h3 className="card-title">Create New Class</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
        </div>
        
        {error && <div style={{ color: '#d97706', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleCreateClass}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1e293b' }}>Class Name</label>
            <input 
              type="text" 
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              required
              placeholder="e.g. IGCSE Chemistry - Year 10"
              style={{
                width: '100%', padding: '12px', borderRadius: '8px', 
                border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="action-btn secondary" style={{ width: 'auto' }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="action-btn" style={{ width: 'auto' }} disabled={loading}>
              {loading ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
