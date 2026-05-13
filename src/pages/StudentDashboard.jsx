import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './StudentDashboard.css'; 

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // State for Joining Classes
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  
  // Data State
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [uploadingAsgId, setUploadingAsgId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch Data
  const fetchData = async (studentId) => {
    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from('class_enrollments')
      .select(`
        class_id,
        classes (
          id,
          name,
          invite_code,
          assignments (*)
        )
      `)
      .eq('student_id', studentId);
      
    if (!enrollmentError && enrollmentData) {
      const classesList = enrollmentData.map(item => item.classes);
      setEnrolledClasses(classesList);
      
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', studentId);
        
      if (!submissionsError && submissionsData) {
        setSubmissions(submissionsData);
      }
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

  const handleFileUpload = async (e, assignmentId) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingAsgId(assignmentId);
    setUploadProgress(1);

    let currentProgress = 1;
    const simulationInterval = setInterval(() => {
      if (currentProgress < 92) {
        currentProgress += Math.random() * 3;
        setUploadProgress(Math.floor(currentProgress));
      }
    }, 600);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${assignmentId}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('student-submissions')
        .upload(fileName, file, {
          onUploadProgress: (evt) => {
            if (evt.total) {
              const realPercent = Math.round((evt.loaded / evt.total) * 100);
              if (realPercent > currentProgress) {
                currentProgress = realPercent;
                setUploadProgress(realPercent);
              }
            }
          }
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('student-submissions')
        .getPublicUrl(fileName);

      await supabase.from('submissions').insert({
        assignment_id: assignmentId,
        student_id: profile.id,
        pdf_url: publicUrl,
        status: 'pending'
      });

      setUploadProgress(100);
      clearInterval(simulationInterval);
      
      setTimeout(async () => {
        await fetchData(profile.id);
        setUploadingAsgId(null);
        setUploadProgress(0);
      }, 800);

    } catch (err) {
      clearInterval(simulationInterval);
      alert("Upload error: " + err.message);
      setUploadingAsgId(null);
      setUploadProgress(0);
    }
  };

  // Stats Logic
  const pendingAssignments = enrolledClasses.reduce((acc, cls) => {
    const classAsgs = cls.assignments || [];
    const unsubmitted = classAsgs.filter(asg => !submissions.find(s => s.assignment_id === asg.id));
    return acc + unsubmitted.length;
  }, 0);

  const toVerify = submissions.filter(s => s.status === 'ocr-pending').length;
  
  const gradedSubmissions = submissions.filter(s => s.status === 'graded');
  const avgScore = gradedSubmissions.length > 0 
    ? Math.round(gradedSubmissions.reduce((acc, s) => acc + (s.final_score || 0), 0) / gradedSubmissions.length)
    : 0;

  // Flattened assignments for upcoming deadlines
  const allAssignments = enrolledClasses.flatMap(cls => 
    (cls.assignments || []).map(asg => ({ ...asg, className: cls.name }))
  ).filter(asg => !submissions.find(s => s.assignment_id === asg.id))
   .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
   .slice(0, 4);

  // Removed blocking loading screen for professional instant transition

  return (
    <div className="sd-layout">
      {/* ── BACKGROUND DESIGN ── */}
      <div className="bg-grid"></div>

      {/* ── SIDEBAR ── */}
      <aside className="sd-sidebar">
        <div className="sd-sidebar-logo" onClick={() => navigate('/student-dashboard')} style={{ cursor: 'pointer' }}>
           <img src="/logo-light.svg" alt="Valency.Ai" style={{ width: '100%', maxWidth: '220px', height: 'auto', display: 'block' }} />
        </div>

        <div className="sd-user-card">
          <span className="role">Student</span>
          <span className="name">{profile?.full_name}</span>
        </div>

        <nav className="sd-nav">
          <Link to="/student-dashboard" className="sd-nav-item active"><i>📊</i> Dashboard</Link>
          <Link to="/student-classes" className="sd-nav-item"><i>📚</i> My Classes</Link>
          <Link to="#" className="sd-nav-item"><i>🔍</i> OCR Verification</Link>
          <Link to="#" className="sd-nav-item"><i>📝</i> My Grades</Link>
        </nav>

        <div className="sd-sidebar-footer">
          <div className="sd-logout" onClick={handleSignOut}><i>🚪</i> Sign out</div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="sd-main">
        <header className="sd-header">
          <h2>Dashboard</h2>
          <p>Welcome back, {profile?.full_name?.split(' ')[0]}. Here is your academic overview.</p>
        </header>

        {/* Action Banner */}
        {toVerify > 0 && (
          <div className="sd-action-banner">
            <div className="sd-action-content">
              <div className="sd-action-icon">⚠️</div>
              <div className="sd-action-text">
                <h4>Action Required: Verify OCR Results</h4>
                <p>Valency.Ai has finished processing your recent submission. Please verify the AI's reading of your handwriting before it is submitted to your teacher.</p>
              </div>
            </div>
            <button className="sd-action-btn">Verify Now →</button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="sd-stats-grid">
          <div className="sd-stat-card">
            <div className="sd-stat-icon purple">📖</div>
            <div className="sd-stat-info">
              <span className="stat-label">Enrolled Classes</span>
              <span className="stat-value">{enrolledClasses.length}</span>
            </div>
          </div>
          <div className="sd-stat-card">
            <div className="sd-stat-icon blue">📄</div>
            <div className="sd-stat-info">
              <span className="stat-label">Pending Assignments</span>
              <span className="stat-value">{pendingAssignments}</span>
            </div>
          </div>
          <div className="sd-stat-card">
            <div className="sd-stat-icon yellow">🕒</div>
            <div className="sd-stat-info">
              <span className="stat-label">To Verify</span>
              <span className="stat-value">{toVerify}</span>
            </div>
          </div>
          <div className="sd-stat-card">
            <div className="sd-stat-icon green">📈</div>
            <div className="sd-stat-info">
              <span className="stat-label">Recent Average</span>
              <span className="stat-value">{avgScore}%</span>
            </div>
          </div>
        </div>

        {/* Content Layout Grid */}
        <div className="sd-dashboard-grid">
          {/* Upcoming Deadlines */}
          <div className="sd-glass-card">
            <div className="sd-card-header">
              <i>🕒</i>
              <h3>Upcoming Deadlines</h3>
            </div>
            <div className="sd-deadline-list">
              {allAssignments.length > 0 ? allAssignments.map(asg => (
                <div className="sd-deadline-item" key={asg.id}>
                  <div className="sd-deadline-info">
                    <h4>{asg.title}</h4>
                    <p>{asg.className}</p>
                  </div>
                  <div className="sd-deadline-tag">
                    {new Date(asg.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No upcoming deadlines. You're all caught up!
                </div>
              )}
            </div>
          </div>

          {/* Recently Returned Grades */}
          <div className="sd-glass-card">
            <div className="sd-card-header">
              <i>✔️</i>
              <h3>Recently Returned Grades</h3>
            </div>
            <div className="sd-grade-list">
              {gradedSubmissions.length > 0 ? gradedSubmissions.map(sub => {
                const asg = enrolledClasses.flatMap(c => c.assignments).find(a => a.id === sub.assignment_id);
                const className = enrolledClasses.find(c => c.assignments.find(a => a.id === sub.assignment_id))?.name;
                return (
                  <div className="sd-grade-item" key={sub.id}>
                    <div className="sd-grade-info">
                      <h4>{asg?.title || 'Assignment'}</h4>
                      <p>{className || 'Subject'}</p>
                    </div>
                    <div className="sd-grade-score">
                      <span className="sd-grade-pct">{sub.final_score}%</span>
                      <span className="sd-grade-fraction">{sub.marks_obtained || 0}/{asg?.total_max_marks || 100}</span>
                    </div>
                    <Link to="#" className="sd-grade-view">View</Link>
                  </div>
                );
              }) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No grades returned yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}