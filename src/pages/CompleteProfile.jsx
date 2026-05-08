import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './Auth.css'; // Reuse your polished CSS!

export default function CompleteProfile() {
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('profiles')
      .update({ 
        school_name: school, 
        grade_level: parseInt(grade) 
      })
      .eq('id', user.id);

    if (!error) navigate('/student-dashboard');
  };

  return (
    <div className="auth-container">
      <div className="role-card" style={{ width: '400px' }}>
        <h2>Finish your Profile</h2>
        <p className="role-description">Just a few more details to get you started with your chemistry assignments.</p>
        
        <form onSubmit={handleSubmit}>
          <input 
            className="auth-input"
            placeholder="School Name"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            required
          />
          <input 
            className="auth-input"
            type="number"
            placeholder="Grade Level (e.g. 11)"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            required
          />
          <button type="submit" className="magic-btn">Save & Continue</button>
        </form>
      </div>
    </div>
  );
}