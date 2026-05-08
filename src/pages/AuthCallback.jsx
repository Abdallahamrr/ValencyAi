import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/');

      const userId = session.user.id;
      const params = new URLSearchParams(window.location.search);
      const requestedRole = params.get('role') || localStorage.getItem('pendingRole');

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, school_name, grade_level, full_name')
        .eq('id', userId)
        .maybeSingle();

      // --- START OF STRICT ROLE CHECK ---
      if (profile?.role) {
        // Check if the role in the database matches the card they clicked
        if (requestedRole && profile.role !== requestedRole) {
          alert(`Access Denied: This account is already registered as a ${profile.role}.`);
          await supabase.auth.signOut();
          localStorage.removeItem('pendingRole');
          return navigate('/');
        }

        // Existing routing logic
        if (profile.role === 'student') {
          if (!profile.school_name || !profile.grade_level) {
            navigate('/complete-profile');
          } else {
            navigate('/student-dashboard');
          }
        } else if (profile.role === 'teacher') {
          navigate('/teacher-dashboard');
        }
        return; // Exit here so we don't run the "new user" logic below
      }
      // --- END OF STRICT ROLE CHECK ---

      if (requestedRole) {
        await supabase.from('profiles').upsert({
          id: userId,
          role: requestedRole,
          full_name: session.user.user_metadata?.full_name || null,
        });

        localStorage.removeItem('pendingRole');
        
        // Ensure students go to profile completion first
        if (requestedRole === 'student') {
          navigate('/complete-profile');
        } else {
          navigate('/teacher-dashboard');
        }
      } else {
        navigate('/select-role');
      }
    };

    handleAuth();
  }, [navigate]);

  return <div style={{ textAlign: 'center', marginTop: '100px' }}>Finalizing sign-in...</div>;
}