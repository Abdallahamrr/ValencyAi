import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import CreateClassModal from '../components/CreateClassModal';
import CreateAssignmentModal from '../components/CreateAssignmentModal';
import './Dashboard.css';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);

  const fetchData = async (teacherId) => {
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select(`
        *,
        assignments (*)
      `)
      .eq('teacher_id', teacherId);
    
    if (!classError && classData) {
      setClasses(classData);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/signin');

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !profileData) return setLoading(false);

      if (!profileData.school_name || !profileData.grade_level) {
        navigate('/complete-profile');
      } else {
        setProfile(profileData);
        await fetchData(profileData.id);
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Derive Stats and Content for Dashboard (matching the Vision)
  const activeClasses = classes.length;
  const [totalStudents, setTotalStudents] = useState(0);

useEffect(() => {
  const fetchCount = async () => {
    // Only run if we actually have a teacher ID
    if (!profile?.id) return;

    const { data, error } = await supabase.rpc('get_teacher_student_count', { 
      t_id: profile.id 
    });

    if (error) {
      console.error('Error fetching student count:', error);
    } else if (data && data.length > 0) {
      // Access the count from the first row of the returned table
      setTotalStudents(data[0].unique_student_count);
    }
  };

  fetchCount();
}, [profile?.id]); // Re-run if the profile ID changes
  const gradingProgress = "-"; 

  // Flattened assignments for "Upcoming Deadlines"
  const upcomingAssignments = classes.flatMap(cls => 
    (cls.assignments || []).map(asg => ({ ...asg, className: cls.name }))
  ).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 5);

  return (
    <div className="td-layout">
      {/* ── BACKGROUND DESIGN ── */}
      <div className="bg-grid"></div>

      {/* ── SIDEBAR ── */}
      <aside className="td-sidebar">
        <div className="td-sidebar-logo" onClick={() => navigate('/teacher-dashboard')}>
          <img src="/logo-light.svg" alt="Valency.Ai" style={{ width: '100%', maxWidth: '220px', height: 'auto', display: 'block' }} />
        </div>

        <div className="td-user-info">
          <span className="role">Teacher</span>
          <span className="name">{profile?.full_name}</span>
        </div>

        <nav className="td-nav">
          <Link to="/teacher-dashboard" className="td-nav-item active"><i>📊</i> Dashboard</Link>
          <Link to="/teacher-classes" className="td-nav-item"><i>📚</i> My Classes</Link>
          <Link to="#" className="td-nav-item"><i>🔍</i> OCR Verification</Link>
          <Link to="#" className="td-nav-item"><i>📈</i> My Grades</Link>
        </nav>

        <div className="td-sidebar-footer">
          <div className="td-logout" onClick={handleSignOut}><i>🚪</i> Sign out</div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="td-main">
        <header className="td-header">
          <div className="td-header-text">
            <h2>Dashboard</h2>
            <p>Welcome back, {profile?.full_name?.split(' ')[0]}. Here is your academic overview.</p>
          </div>
          <button className="td-create-btn" onClick={() => setIsClassModalOpen(true)}>
            <span>+</span> Create New Class
          </button>
        </header>

        {/* Stats Bar (Vision Layout) */}
        <div className="td-stats-grid">
          <div className="td-stat-card">
            <div className="td-stat-icon purple">🏫</div>
            <div className="td-stat-info">
              <span className="stat-label">Active Classes</span>
              <span className="stat-value">{activeClasses}</span>
            </div>
          </div>
          <div className="td-stat-card">
            <div className="td-stat-icon blue">👥</div>
            <div className="td-stat-info">
              <span className="stat-label">Total Students</span>
              <span className="stat-value">{totalStudents}</span>
            </div>
          </div>
          <div className="td-stat-card">
            <div className="td-stat-icon orange">📈</div>
            <div className="td-stat-info">
              <span className="stat-label">Grading Progress</span>
              <span className="stat-value">{gradingProgress}</span>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content Grid (Vision Layout) */}
        <div className="td-content-grid">
          {/* Left: Upcoming Deadlines (Matching Vision Prompt) */}
          <div className="td-glass-card">
            <div className="td-card-header">
              <h3>Upcoming Deadlines</h3>
              <Link to="#" style={{ fontSize: '14px', color: 'var(--td-primary)', fontWeight: 700 }}>View All</Link>
            </div>
            
            <div className="td-table-container">
              <table className="td-table">
                <thead>
                  <tr>
                    <th>ASSIGNMENT</th>
                    <th>CLASS</th>
                    <th>DUE DATE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingAssignments.map(asg => (
                    <tr key={asg.id}>
                      <td><div style={{ fontWeight: 700 }}>{asg.title}</div></td>
                      <td>{asg.className}</td>
                      <td>{new Date(asg.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</td>
                      <td>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '8px', 
                          fontSize: '11px', 
                          fontWeight: 700,
                          background: '#fef3c7',
                          color: '#d97706'
                        }}>
                          Pending
                        </span>
                      </td>
                    </tr>
                  ))}
                  {upcomingAssignments.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        No upcoming deadlines found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Analytics Overview (Matching Vision Prompt) */}
          <div className="td-glass-card">
            <div className="td-card-header">
              <h3>Performance Analytics</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>+12% vs last month</span>
              </div>
            </div>
            
            <div className="td-chart-placeholder">
              {/* CSS-based Mock Chart with Vibrant Gradients from Vision */}
              <div className="td-chart-bar-wrapper">
                <div className="td-chart-bar" style={{ height: '70%', background: 'linear-gradient(180deg, #8b5cf6, #c084fc)' }}>
                  <span className="td-chart-value">84%</span>
                </div>
                <span className="td-chart-label">Math</span>
              </div>
              <div className="td-chart-bar-wrapper">
                <div className="td-chart-bar" style={{ height: '90%', background: 'linear-gradient(180deg, #3b82f6, #60a5fa)' }}>
                  <span className="td-chart-value">92%</span>
                </div>
                <span className="td-chart-label">Physics</span>
              </div>
              <div className="td-chart-bar-wrapper">
                <div className="td-chart-bar" style={{ height: '60%', background: 'linear-gradient(180deg, #10b981, #34d399)' }}>
                  <span className="td-chart-value">78%</span>
                </div>
                <span className="td-chart-label">Chem</span>
              </div>
              <div className="td-chart-bar-wrapper">
                <div className="td-chart-bar" style={{ height: '85%', background: 'linear-gradient(180deg, #f59e0b, #fbbf24)' }}>
                  <span className="td-chart-value">88%</span>
                </div>
                <span className="td-chart-label">Bio</span>
              </div>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>142</div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>SUBMISSIONS</div>
              </div>
              <div style={{ borderLeft: '1px solid #e2e8f0' }}></div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>86%</div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>AVG SCORE</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {isClassModalOpen && (
        <CreateClassModal 
          isOpen={isClassModalOpen}
          onClose={() => setIsClassModalOpen(false)}
          teacherId={profile?.id}
          onClassCreated={() => fetchData(profile.id)}
        />
      )}

      {isAssignmentModalOpen && (
        <CreateAssignmentModal
          isOpen={isAssignmentModalOpen}
          onClose={() => setIsAssignmentModalOpen(false)}
          classId={selectedClassId}
          onAssignmentCreated={() => fetchData(profile.id)}
        />
      )}
    </div>
  );
}
