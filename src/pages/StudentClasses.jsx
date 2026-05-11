import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './StudentDashboard.css'; // Sidebar & layout
import './StudentClasses.css'; // Local styles

export default function StudentClasses() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // State for Classes
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  
  // State for Enrollment
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);

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
      if (classesList.length > 0 && !selectedClassId) {
        setSelectedClassId(classesList[0].id);
      }
      
      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', studentId);
      if (submissionsData) setSubmissions(submissionsData);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/signin');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        await fetchData(profileData.id);
      }
      setLoading(false);
    };
    checkUser();
  }, [navigate]);

  const handleJoinClass = async () => {
    if (!inviteCode || inviteCode.length < 6) return;
    setJoining(true);
    setJoinError(null);
    try {
      const { data: classData } = await supabase.from('classes').select('id').eq('invite_code', inviteCode).single();
      if (!classData) throw new Error('Invalid code.');

      await supabase.from('class_enrollments').insert({ student_id: profile.id, class_id: classData.id });
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
      const { data: uploadData } = await supabase.storage.from('student-submissions').upload(fileName, file);
      const { data: { publicUrl } } = supabase.storage.from('student-submissions').getPublicUrl(fileName);

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

  const selectedClass = enrolledClasses.find(c => c.id === selectedClassId);
  const activeAssignment = selectedClass?.assignments?.find(asg => !submissions.find(s => s.assignment_id === asg.id));
  const pastAssignments = selectedClass?.assignments?.filter(asg => submissions.find(s => s.assignment_id === asg.id)) || [];

  if (loading) return <div className="sd-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;

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
          <Link to="/student-dashboard" className="sd-nav-item"><i>📊</i> Dashboard</Link>
          <Link to="/student-classes" className="sd-nav-item active"><i>📚</i> My Classes</Link>
          <Link to="#" className="sd-nav-item"><i>📝</i> OCR Verification</Link>
          <Link to="#" className="sd-nav-item"><i>🎓</i> My Grades</Link>
        </nav>
        <div className="sd-sidebar-footer">
          <div className="sd-logout" onClick={() => { supabase.auth.signOut(); navigate('/'); }}><i>🚪</i> Sign out</div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="sd-main">
        <header className="sd-header">
          <h2>My Classes & Assignments</h2>
          <p>Manage your enrolled classes and submit new assignments.</p>
        </header>

        <div className="sc-grid">
          {/* Left Column */}
          <div className="sc-left-col">
            <div className="sc-enroll-card">
              <h3>Enroll in a Class</h3>
              <p>Enter the code provided by your teacher.</p>
              <div className="sc-enroll-form">
                <input className="sc-input" placeholder="e.g. CHEM-4A2X" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} maxLength={8} />
                <button className="sc-btn-join" onClick={handleJoinClass} disabled={joining}>{joining ? '...' : 'Join'}</button>
              </div>
              {joinError && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '8px' }}>{joinError}</p>}
            </div>

            <div className="sc-class-list">
              <h4 className="sc-class-list-header">Enrolled Classes</h4>
              {enrolledClasses.map(cls => (
                <div key={cls.id} className={`sc-class-card ${selectedClassId === cls.id ? 'active' : ''}`} onClick={() => setSelectedClassId(cls.id)}>
                   <div className="sc-class-info">
                      <h4>{cls.name}</h4>
                      <span>Dr. Roberts</span>
                   </div>
                   <span className="sc-class-tag">{cls.invite_code}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="sc-right-col">
            {selectedClass ? (
              <>
                <div className="sc-right-header">
                  <h2>{selectedClass.name} Assignments</h2>
                </div>

                {activeAssignment ? (
                  <div className="sc-asg-main-card">
                    <div className="sc-asg-header">
                      <div className="sc-asg-title-box">
                        <h3>{activeAssignment.title}</h3>
                        <div className="sc-asg-meta">
                          <span>🕒 Due: Tomorrow, 23:59</span>
                          <span>📄 2 Pages</span>
                        </div>
                      </div>
                      <span className="sc-status-badge">Open</span>
                    </div>
                    <div className="sc-asg-description">
                      {activeAssignment.description || "Please complete the worksheet, scan your handwritten answers as a PDF, and upload it here. Ensure your handwriting is legible."}
                    </div>
                    
                    <div className="sc-upload-area">
                      <input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, activeAssignment.id)} style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer' }} />
                      <div className="sc-upload-icon">☁️</div>
                      <h4>Click or drag PDF to upload</h4>
                      <p>Maximum file size 10MB.</p>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#64748b', marginBottom: '32px' }}>No active assignments for this class.</p>
                )}

                <div className="sc-past-section">
                  <h4 className="sc-past-header">Past Assignments</h4>
                  {pastAssignments.map(asg => {
                    const submission = submissions.find(s => s.assignment_id === asg.id);
                    return (
                      <div className="sc-past-item" key={asg.id}>
                        <div className="sc-past-info">
                           <div className="sc-past-icon">📄</div>
                           <div className="sc-past-text">
                              <h5>{asg.title}</h5>
                              <span>Submitted {new Date(submission.created_at).toLocaleDateString()}</span>
                           </div>
                        </div>
                        <span className={`sc-past-badge ${submission.status === 'graded' ? 'badge-graded' : 'badge-awaiting'}`}>
                          {submission.status === 'graded' ? 'Graded' : 'Awaiting Grade'}
                        </span>
                      </div>
                    );
                  })}
                  {pastAssignments.length === 0 && <p style={{ fontSize: '13px', color: '#94a3b8' }}>No past submissions yet.</p>}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '100px 0', color: '#64748b' }}>
                 <p>Select a class from the left to view assignments.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
