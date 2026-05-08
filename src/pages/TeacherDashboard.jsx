import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

      // Fetch classes for this teacher
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
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
    setClasses(prev => [...prev, newClass]);
  };

  const openCreateAssignment = (classId) => {
    setSelectedClassId(classId);
    setIsAssignmentModalOpen(true);
  };

  const handleAssignmentCreated = (newAssignment) => {
    alert(`Assignment "${newAssignment.title}" created successfully!`);
  };

  if (loading) return <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}><p>Loading ValencyAi...</p></div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Teacher Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back, {profile?.full_name || 'Professor'}</p>
        </div>
        <div className="header-actions">
          <button className="action-btn secondary" onClick={() => setIsClassModalOpen(true)}>
            + New Class
          </button>
          <button className="action-btn" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.activeClasses}</div>
          <div className="stat-label">Active Classes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#d97706' }}>{stats.pendingSubmissions}</div>
          <div className="stat-label">Pending Reviews</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#10b981' }}>{stats.papersGraded}</div>
          <div className="stat-label">Papers Graded</div>
        </div>
      </div>

      <h2 className="section-title">Your Classes</h2>
      <div className="content-grid">
        {classes.map(cls => (
          <div key={cls.id} className="glass-card">
            <div className="card-header">
              <h3 className="card-title">{cls.name}</h3>
              <span className="badge primary">{cls.invite_code}</span>
            </div>
            <div className="card-body">
              <p style={{ marginBottom: '12px' }}><strong>0</strong> Students Enrolled</p>
              
              {/* Progress Bar for Grading Status */}
              <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `0%`, height: '100%', background: '#1000f3', transition: 'width 0.5s ease' }}></div>
              </div>
              <p style={{ fontSize: '0.8rem', marginTop: '8px', textAlign: 'right' }}>
                0% Graded
              </p>
            </div>
            <button className="action-btn secondary" onClick={() => openCreateAssignment(cls.id)}>
              + Add Assignment
            </button>
          </div>
        ))}
        
        {/* Empty State / Add New Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', background: 'transparent' }}>
          <div style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '16px' }}>+</div>
          <h3 className="card-title" style={{ color: '#64748b' }}>Create New Class</h3>
          <p className="card-body" style={{ textAlign: 'center', margin: '12px 0' }}>Generate an invite code and start grading.</p>
          <button className="action-btn" style={{ width: 'auto' }} onClick={() => setIsClassModalOpen(true)}>Create Class</button>
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
    </div>
  );
}
