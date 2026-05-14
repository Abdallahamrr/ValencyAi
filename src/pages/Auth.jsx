import { useState } from 'react';
import './Auth.css';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import RoleCard from '../components/RoleCard';

export default function Auth() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState('student');
  const [emails, setEmails] = useState({ teacher: '', student: '' });
  const [teacherSent, setTeacherSent] = useState(false);
  const [studentSent, setStudentSent] = useState(false);
  const [teacherError, setTeacherError] = useState('');
  const [studentError, setStudentError] = useState('');
  const [loading, setLoading] = useState('');

  const handleEmailChange = (role, value) => {
    setEmails(prev => ({ ...prev, [role]: value }));
  };

  const handleGoogleLogin = async (role) => {
    localStorage.clear(); 
    await supabase.auth.signOut();
    localStorage.setItem('pendingRole', role);
    
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/callback',
        queryParams: { prompt: 'select_account' },
      },
    });
  };

  const handleMagicLink = async (role) => {
    const email = emails[role];
    const setError = role === 'teacher' ? setTeacherError : setStudentError;
    const setSent = role === 'teacher' ? setTeacherSent : setStudentSent;

    if (!email.includes('@')) return setError('Valid email required.');

    setLoading(role);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/callback?role=${role}`,
      },
    });

    setLoading('');
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div className="auth-container">
      {/* Header Logo */}
      <div className="auth-header" onClick={() => navigate('/')}>
        <img className="auth-logo" src="/logo-light.svg" alt="Valency.Ai" />
      </div>

      <div className="auth-card-main">
        <h2>Create your account</h2>
        <p className="subheading">Join Valency.Ai — precision grading for IGCSE</p>

        <span className="role-selection-label">I AM JOINING AS A...</span>
        <div className="role-selector-group">
          <div 
            className={`role-option ${activeRole === 'student' ? 'active' : ''}`}
            onClick={() => setActiveRole('student')}
          >
            <div className="check-icon">✓</div>
            <span className="role-option-icon">🎓</span>
            <span>Student</span>
          </div>
          <div 
            className={`role-option ${activeRole === 'teacher' ? 'active' : ''}`}
            onClick={() => setActiveRole('teacher')}
          >
            <div className="check-icon">✓</div>
            <span className="role-option-icon">🧑‍🏫</span>
            <span>Teacher</span>
          </div>
        </div>

        {/* Instead of mapping both, we show the active one */}
        <RoleCard 
          role={activeRole}
          description={activeRole === 'teacher' ? 
            "Create classes, upload marking schemes, and grade IGCSE papers." : 
            "Join classes, submit assignments, and get instant feedback."}
          email={emails[activeRole]}
          setEmail={(val) => handleEmailChange(activeRole, val)}
          error={activeRole === 'teacher' ? teacherError : studentError}
          setError={activeRole === 'teacher' ? setTeacherError : setStudentError}
          sent={activeRole === 'teacher' ? teacherSent : studentSent}
          setSent={activeRole === 'teacher' ? setTeacherSent : setStudentSent}
          loading={loading}
          handleGoogleLogin={handleGoogleLogin}
          handleMagicLink={handleMagicLink}
        />

        <div className="auth-footer">
          Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/signin'); }}>Sign in</a>
        </div>
      </div>

      
    </div>
  );
}
