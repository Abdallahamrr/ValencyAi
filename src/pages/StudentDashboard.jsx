import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './StudentDashboard.css'; 
import ReviewUI from '../components/ReviewUI';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // State for Joining Classes
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [joinSuccess, setJoinSuccess] = useState(false);
  
  // Data State
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  
  // UI State
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewSegments, setReviewSegments] = useState([]);

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

  const handleJoinClass = async () => {
    if (!inviteCode || inviteCode.length < 6) return;
    setJoining(true);
    setJoinError(null);
    setJoinSuccess(false);

    try {
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id')
        .eq('invite_code', inviteCode)
        .single();

      if (classError || !classData) throw new Error('Invalid class code.');

      const { error: enrollError } = await supabase
        .from('class_enrollments')
        .insert({ student_id: profile.id, class_id: classData.id });

      if (enrollError) {
        if (enrollError.code === '23505') throw new Error('Already enrolled.');
        throw enrollError;
      }

      setJoinSuccess(true);
      setInviteCode('');
      await fetchData(profile.id);

    } catch (err) {
      setJoinError(err.message);
    } finally {
      setJoining(false);
    }
  };

  const handleFileUpload = async (e, assignmentId) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${assignmentId}_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('student-submissions')
        .upload(fileName, file);

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

      alert("Submission successful!");
      await fetchData(profile.id);
    } catch (err) {
      alert("Upload error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Derive Stats
  const totalAssignments = enrolledClasses.reduce((acc, cls) => acc + (cls.assignments?.length || 0), 0);
  const totalSubmitted = submissions.length;
  const completionRate = totalAssignments > 0 ? Math.round((totalSubmitted / totalAssignments) * 100) : 0;
  
  const gradedSubmissions = submissions.filter(s => s.status === 'graded');
  const avgScore = gradedSubmissions.length > 0 
    ? Math.round(gradedSubmissions.reduce((acc, s) => acc + (s.final_score || 0), 0) / gradedSubmissions.length)
    : 0;

  // Mock "Next Deadline"
  const nextDeadline = "14 Hours Left";

  if (loading) return <div className="sd-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading Valency.Ai...</div>;

  return (
    <div className="sd-layout">
      {/* ── SIDEBAR ── */}
      <aside className="sd-sidebar">
        <div className="sd-sidebar-logo">
           <div className="logo-v-box">V</div>
           <h1 style={{ color: 'white' }}>Valency.Ai</h1>
        </div>

        <div className="sd-user-card">
          <span className="role">Student</span>
          <span className="name">{profile?.full_name}</span>
        </div>

        <nav className="sd-nav">
          <Link to="/student-dashboard" className="sd-nav-item active"><i>📊</i> Dashboard</Link>
          <Link to="#" className="sd-nav-item"><i>📚</i> Classes</Link>
          <Link to="#" className="sd-nav-item"><i>📤</i> Submissions</Link>
          <Link to="#" className="sd-nav-item"><i>📈</i> Analytics</Link>
        </nav>

        <div className="sd-sidebar-footer">
          <div className="sd-logout" onClick={handleSignOut}><i>🚪</i> Sign out</div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="sd-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <header className="sd-header">
            <h2>Welcome back, {profile?.full_name?.split(' ')[0]}.</h2>
            <p>You have {totalAssignments - totalSubmitted} active assignments pending for this week.</p>
          </header>

          {/* Join Class (Top Right) */}
          <div className="sd-side-card" style={{ width: '320px', padding: '16px', marginBottom: 0 }}>
            <h4 style={{ marginBottom: '12px' }}><i>🎓</i> Join New Class</h4>
            <div className="sd-join-form">
              <input className="sd-join-input" placeholder="Class Code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} maxLength={6} />
              <button className="sd-join-btn" onClick={handleJoinClass}>Join</button>
            </div>
          </div>
        </div>

        {/* Stats Grid (3 columns as per feature image) */}
        <div className="sd-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '32px' }}>
          <div className="sd-stat-card">
            <div className="sd-stat-info" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="label">AVERAGE GRADE</span>
                <i style={{ color: '#10b981' }}>📈</i>
              </div>
              <span className="value">{avgScore}.2%</span>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Top 15% of the class</p>
            </div>
          </div>
          <div className="sd-stat-card">
            <div className="sd-stat-info" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="label">COMPLETION RATE</span>
                <i style={{ color: '#3b82f6' }}>✔️</i>
              </div>
              <span className="value">{completionRate}%</span>
              <div className="sd-progress-container">
                <div className="sd-progress-bar" style={{ width: `${completionRate}%` }}></div>
              </div>
            </div>
          </div>
          <div className="sd-stat-card">
            <div className="sd-stat-info" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="label">NEXT DEADLINE</span>
                <i style={{ color: '#ef4444' }}>🕒</i>
              </div>
              <span className="value">{nextDeadline}</span>
              <p style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600, marginTop: '4px' }}>Urgent: Physics Lab Report</p>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <section style={{ marginTop: '48px' }}>
          <div className="sd-section-header">
            <h3>Active Assignments</h3>
            <Link to="#" className="sd-view-all">View All</Link>
          </div>
          
          <div className="sd-assignments-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {enrolledClasses.map(cls => 
              cls.assignments?.map((asg, idx) => {
                const submission = submissions.find(s => s.assignment_id === asg.id);
                // Cycle through colors/subjects for demo
                const subjects = ['PHYSICS', 'MATH', 'CHEMISTRY'];
                const sub = subjects[idx % 3];
                const bgColors = ['#e0f2fe', '#fef3c7', '#dcfce7'];
                
                return (
                  <div className="sd-asg-card" key={asg.id}>
                    <div className="sd-asg-img" style={{ background: bgColors[idx % 3] }}>
                      <span className="sd-asg-tag" style={{ color: '#1e293b' }}>{sub}</span>
                    </div>
                    <div className="sd-asg-content">
                      <h4>{asg.title}</h4>
                      <p>{asg.description || "Complete the simulation and data analysis for the double-slit..."}</p>
                      
                      <div className="sd-asg-footer" style={{ border: 'none', padding: 0 }}>
                        <span className="sd-asg-date">📅 {new Date(asg.created_at || Date.now()).toLocaleDateString()}</span>
                        <span className={`sd-asg-status ${
                          submission?.status === 'graded' ? 'status-graded' : 
                          submission?.status === 'pending' ? 'status-pending' : 'status-not-started'
                        }`}>
                          {submission ? (submission.status === 'graded' ? 'Graded' : 'Pending') : 'Not Started'}
                        </span>
                      </div>
                      
                      {!submission && (
                        <div style={{ position: 'relative', marginTop: '16px' }}>
                           <input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, asg.id)} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                           <button className="sd-join-btn" style={{ width: '100%', background: 'transparent', color: '#7c3aed', border: '1px solid #7c3aed' }}>Upload PDF</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Results Summary Table */}
        <section style={{ marginTop: '48px' }}>
           <div className="sd-results-card">
              <div className="sd-table-header" style={{ background: '#f8fafc', color: '#1e293b', borderBottom: '1px solid #e2e8f0' }}>
                <h3>Recent Results Summary</h3>
              </div>
              <table className="sd-table">
                <thead>
                  <tr>
                    <th>SUBJECT</th>
                    <th>ASSIGNMENT</th>
                    <th>DATE</th>
                    <th style={{ textAlign: 'right' }}>SCORE</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { subject: 'Physics', asg: 'Newtonian Laws Quiz', date: '10/12/2023', score: '92/100' },
                    { subject: 'Chemistry', asg: 'Valency Worksheets', date: '10/10/2023', score: '88/100' },
                    { subject: 'Computer Science', asg: 'Python Algorithms', date: '10/08/2023', score: '100/100' },
                    { subject: 'Math', asg: 'Trigonometry Basics', date: '10/05/2023', score: '76/100' }
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="subject">{row.subject}</td>
                      <td>{row.asg}</td>
                      <td>{row.date}</td>
                      <td className="score">{row.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="sd-table-footer" style={{ background: '#f8fafc' }}>
                <Link to="#" className="sd-download-btn">Download Academic Transcript (PDF)</Link>
              </div>
           </div>
        </section>
      </main>
    </div>
  );
}