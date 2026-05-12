import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Dashboard.css';
import CreateClassModal from '../components/CreateClassModal';
import CreateAssignmentModal from '../components/CreateAssignmentModal';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classes, setClasses] = useState([]);

  // Assignment Modal State
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);

  // Mock data for UI demonstration purposes based on the implementation plan
  const stats = {
    activeClasses: classes.length,
    pendingSubmissions: 12,
    papersGraded: 145
  };

  useEffect(() => {
    const fetchTeacherData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profileData) {
        console.error("Error fetching profile:", profileError);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch classes for this teacher with assignments
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*, assignments(*)')
        .eq('teacher_id', session.user.id);

      if (!classesError && classesData) {
        setClasses(classesData);
      }

      setLoading(false);
    };

    fetchTeacherData();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleClassCreated = (newClass) => {
    setClasses(prev => [...prev, { ...newClass, assignments: [] }]);
  };

  const openCreateAssignment = (classId) => {
    setSelectedClassId(classId);
    setIsAssignmentModalOpen(true);
  };

  const handleAssignmentCreated = (newAssignment) => {
    setClasses(prev => prev.map(cls => 
      cls.id === newAssignment.class_id 
        ? { ...cls, assignments: [...(cls.assignments || []), newAssignment] }
        : cls
    ));
    setIsAssignmentModalOpen(false);
  };

  if (loading) return <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}><p>Loading ValencyAi...</p></div>;

  return (
    <div className="td-layout">
      {/* ── SIDEBAR ── */}
      <aside className="td-sidebar">
        <div className="td-sidebar-logo">
           <div className="logo-v-box">V</div>
           <h1 className="logo-text">Valency.Ai</h1>
        </div>

        <nav className="td-nav">
          <Link to="/teacher-dashboard" className="td-nav-item active">
            <span className="icon">📊</span> Dashboard
          </Link>
          <div className="td-nav-item">
            <span className="icon">📚</span> My Classes
          </div>
          <div className="td-nav-item">
            <span className="icon">📄</span> Assignments
          </div>
          <div className="td-nav-item">
            <span className="icon">📈</span> Reports
          </div>
          <div className="td-nav-item">
            <span className="icon">⚙️</span> Settings
          </div>
        </nav>

        <div className="td-sidebar-footer">
          <div className="td-logout" onClick={handleSignOut}>
            <span className="icon">🚪</span> Logout
          </div>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="td-main-wrapper">
        {/* ── TOP NAV ── */}
        <header className="td-top-nav">
          <div className="td-search">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search classes or students..." />
          </div>
          
          <div className="td-top-actions">
            <button className="td-btn-notification">
              <span className="icon">🔔</span>
              <span className="dot"></span>
            </button>
            <div className="td-profile-pill">
              <div className="profile-info">
                <span className="name">{profile?.full_name || 'Teacher'}</span>
                <span className="role">Administrator</span>
              </div>
              <div className="avatar">
                {profile?.full_name?.charAt(0) || 'T'}
              </div>
            </div>
          </div>
        </header>

        {/* ── CONTENT ── */}
        <main className="td-content">
          <header className="td-content-header">
            <div className="header-text">
              <h1>Dashboard Overview</h1>
              <p>Welcome back! Here's what's happening with your classes today.</p>
            </div>
            <button className="td-btn-primary" onClick={() => setIsClassModalOpen(true)}>
              + Create New Class
            </button>
          </header>

          <div className="td-stats-grid">
            <div className="td-stat-card">
              <div className="stat-header">
                <span className="stat-label">Active Classes</span>
                <span className="stat-icon-bg purple">📚</span>
              </div>
              <div className="stat-value">{stats.activeClasses}</div>
              <div className="stat-trend positive">↑ 12% from last month</div>
            </div>
            <div className="td-stat-card">
              <div className="stat-header">
                <span className="stat-label">Pending Reviews</span>
                <span className="stat-icon-bg orange">🕒</span>
              </div>
              <div className="stat-value">{stats.pendingSubmissions}</div>
              <div className="stat-trend warning">Action required</div>
            </div>
            <div className="td-stat-card">
              <div className="stat-header">
                <span className="stat-label">Papers Graded</span>
                <span className="stat-icon-bg green">✅</span>
              </div>
              <div className="stat-value">{stats.papersGraded}</div>
              <div className="stat-trend positive">↑ 24% this week</div>
            </div>
          </div>

        <h2 className="td-section-title">Your Classes</h2>
        <div className="td-content-grid">
          {classes.map(cls => (
            <div key={cls.id} className="td-glass-card">
              <div className="td-card-header">
                <h3 className="td-card-title">{cls.name}</h3>
                <span className="td-badge primary">{cls.invite_code}</span>
              </div>
              <div className="td-card-body">
                <p style={{ marginBottom: '12px' }}><strong>0</strong> Students Enrolled</p>
                
                {/* Assignments List */}
                <div className="td-assignments-section" style={{ marginTop: '16px', marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assignments</h4>
                  <div className="td-assignments-stack" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {cls.assignments && cls.assignments.length > 0 ? (
                      cls.assignments.map(asg => (
                        <div key={asg.id} className="td-assignment-item" style={{ 
                          padding: '10px 14px', 
                          background: 'rgba(255, 255, 255, 0.5)', 
                          borderRadius: '10px',
                          border: '1px solid rgba(226, 232, 240, 0.8)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{asg.title}</span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {asg.due_date ? new Date(asg.due_date).toLocaleDateString() : 'No deadline'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '10px' }}>
                        No assignments created.
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress Bar for Grading Status */}
                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `0%`, height: '100%', background: '#1000f3', transition: 'width 0.5s ease' }}></div>
                </div>
                <p style={{ fontSize: '0.8rem', marginTop: '8px', textAlign: 'right' }}>
                  0% Graded
                </p>
              </div>
              <button className="td-action-btn secondary" onClick={() => openCreateAssignment(cls.id)}>
                + Add Assignment
              </button>
            </div>
          ))}
          
          {/* Empty State / Add New Card */}
          <div className="td-glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', background: 'transparent' }}>
            <div style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '16px' }}>+</div>
            <h3 className="td-card-title" style={{ color: '#64748b' }}>Create New Class</h3>
            <p className="td-card-body" style={{ textAlign: 'center', margin: '12px 0' }}>Generate an invite code and start grading.</p>
            <button className="td-action-btn" style={{ width: 'auto' }} onClick={() => setIsClassModalOpen(true)}>Create Class</button>
          </div>
        </div>

        <CreateClassModal 
          isOpen={isClassModalOpen} 
          onClose={() => setIsClassModalOpen(false)} 
          onClassCreated={handleClassCreated}
          teacherId={profile?.id}
        />

        <CreateAssignmentModal
          isOpen={isAssignmentModalOpen}
          onClose={() => setIsAssignmentModalOpen(false)}
          classId={selectedClassId}
          onAssignmentCreated={handleAssignmentCreated}
        />
      </main>
    </div>
    </div>
  );
}
