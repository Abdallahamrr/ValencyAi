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
    <div className="td-modal-overlay">
      <div className="td-modal-content td-class-modal">
        <header className="td-modal-header">
          <div>
            <span className="td-modal-eyebrow">New classroom</span>
            <h2>Create New Class</h2>
          </div>
          <button className="td-modal-close" onClick={onClose}>&times;</button>
        </header>
        
        <form onSubmit={handleCreateClass}>
          <div className="td-modal-body">
            {error && (
              <div style={{ 
                background: '#fff7ed', 
                border: '1px solid #ffedd5', 
                color: '#9a3412', 
                padding: '12px 16px', 
                borderRadius: '12px', 
                marginBottom: '20px',
                fontSize: '14px',
                fontWeight: 500
              }}>
                ⚠️ {error}
              </div>
            )}

            <div className="td-form-group">
              <label className="td-form-label">Class Name</label>
              <input 
                type="text" 
                className="td-form-input"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
                placeholder="e.g. IGCSE Chemistry - Year 10"
              />
              <p className="td-form-help">
                We'll generate a unique invite code for your students automatically.
              </p>
            </div>
          </div>
          
          <footer className="td-modal-footer">
            <button 
              type="button" 
              className="td-btn-secondary" 
              style={{ width: 'auto' }} 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="td-btn-primary" 
              style={{ width: 'auto', padding: '10px 24px' }} 
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Class'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
