import { useState } from 'react';
import './Auth.css'; // Import the new CSS
import { supabase } from '../supabaseClient'; // Ensure path is correct
import { useNavigate } from 'react-router-dom';
import RoleCard from '../components/RoleCard'; // Ensure this component exists and is correctly implemented


export default function Auth() {
  // State management for both roles to keep inputs independent
  // Instead of two separate strings, use one object
const [emails, setEmails] = useState({ teacher: '', student: '' });

// Then create a generic handler
const handleEmailChange = (role, value) => {
  setEmails(prev => ({ ...prev, [role]: value }));
};

  const [teacherSent, setTeacherSent] = useState(false);
  const [studentSent, setStudentSent] = useState(false);
  const [teacherError, setTeacherError] = useState('');
  const [studentError, setStudentError] = useState('');
  const [loading, setLoading] = useState('');

  const handleGoogleLogin = async (role) => {
    localStorage.clear(); 
    await supabase.auth.signOut();
    // Store role so the Callback page knows where to send the user after Google redirects back
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
        // Appends the role to the URL so the magic link carries that context
        emailRedirectTo: `${window.location.origin}/callback?role=${role}`,
      },
    });

    setLoading('');
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1>Valency<span>Ai</span></h1>
        <br />
        <p className="auth-subtitle">Precision IGCSE Grading</p>
      </div>
      
      <div className="cards-wrapper">
        <RoleCard 
          role="teacher"
          description="Create classes, upload marking schemes, and grade IGCSE papers with AI precision."
          email={emails.teacher}           // Passing the state
          setEmail={(val) => handleEmailChange('teacher', val)}     // Passing the setter
          error={teacherError}
          setError={setTeacherError}
          sent={teacherSent}
          setSent={setTeacherSent}
          loading={loading}
          handleGoogleLogin={handleGoogleLogin} // Passing the function
          handleMagicLink={handleMagicLink}     // Passing the function
        />
        <RoleCard 
          role="student"
          description="Join classes, submit your assignments, and get instant feedback."
          email={emails.student}
          setEmail={(val) => handleEmailChange('student', val)}
          error={studentError}
          setError={setStudentError}
          sent={studentSent}
          setSent={setStudentSent}
          loading={loading}
          handleGoogleLogin={handleGoogleLogin}
          handleMagicLink={handleMagicLink}
        />
      </div>
    </div>
  );
}

// Simple internal styles
const cardStyle = { border: '1px solid #9e0707', borderRadius: '12px', padding: '24px', width: '100%' , boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };
const inputStyle = { display: 'block', width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' };
const googleBtnStyle = { width: '100%', padding: '12px', backgroundColor: '#a5a5a5', border: '1px solid #ffffff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const emailBtnStyle = { width: '100%', padding: '12px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' };