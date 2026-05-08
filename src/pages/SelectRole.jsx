import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function SelectRole() {
  const navigate = useNavigate();

  const handleSelection = async (role) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('profiles')
      .update({ role: role })
      .eq('id', user.id);

    if (!error) {
      navigate(role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>One last thing...</h2>
      <p>We couldn't determine if you are a Teacher or a Student. Please select one:</p>
      <button onClick={() => handleSelection('teacher')} style={btnStyle}>I am a Teacher</button>
      <button onClick={() => handleSelection('student')} style={btnStyle}>I am a Student</button>
    </div>
  );
}

const btnStyle = { margin: '10px', padding: '15px 30px', cursor: 'pointer' };