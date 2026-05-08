import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Dashboard.css'; // Updated to use the premium dashboard styles
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
  const [enrolledClasses, setEnrolledClasses] = useState([]);

  // Assignments State
  const [activeAssignments, setActiveAssignments] = useState([]);
  const [pastAssignments, setPastAssignments] = useState([]);
  
  // Review UI State
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewSegments, setReviewSegments] = useState([]);
  const [currentSubmissionId, setCurrentSubmissionId] = useState(null);

  const fetchAssignments = async (enrolledClassIds) => {
    if (enrolledClassIds.length === 0) return;

    // Fetch assignments for these classes
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*, classes(name)')
      .in('class_id', enrolledClassIds);

    if (!assignmentsError && assignmentsData) {
      // For simplicity, we just map them all to active right now
      const active = assignmentsData.map(a => ({
        id: a.id,
        title: `${a.classes.name} - ${a.title}`,
        status: 'pending_upload', // We'd check the submissions table in reality
        dueDate: 'Pending',
        questionPdfUrl: a.question_pdf_url
      }));
      setActiveAssignments(active);
    }
  };

  const fetchEnrolledClasses = async (studentId) => {
    const { data, error } = await supabase
      .from('class_enrollments')
      .select('classes(id, name)')
      .eq('student_id', studentId);
      
    if (!error && data) {
      const classesList = data.map(item => item.classes);
      setEnrolledClasses(classesList);
      await fetchAssignments(classesList.map(c => c.id));
    }
  };

  const handleJoinClass = async () => {
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
      await fetchEnrolledClasses(profile.id);

    } catch (err) {
      setJoinError(err.message);
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/');

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
        await fetchEnrolledClasses(profileData.id);
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

    alert(`Simulating upload for ${file.name}...`);
    
    // In reality, upload to submissions_raw bucket and insert into submissions table here.
    
    // MOCK OCR RESPONSE:
    setTimeout(() => {
      setReviewSegments([
        { id: 1, text: "The", confidence: 0.99, isReviewed: false },
        { id: 2, text: "molecule", confidence: 0.95, isReviewed: false },
        { id: 3, text: "chlorine", confidence: 0.60, isReviewed: false }, // Low confidence
        { id: 4, text: "is", confidence: 0.98, isReviewed: false },
        { id: 5, text: "diatomic.", confidence: 0.90, isReviewed: false }
      ]);
      setCurrentSubmissionId(assignmentId);
      setIsReviewing(true);
    }, 1500);
  };

  const handleReviewSubmit = (finalText) => {
    alert(`Submitted Final Text to LLM: "${finalText}"`);
    setIsReviewing(false);
    // Here we would update the submission status to 'ready_for_ai'
  };

  if (loading) return <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}><p>Loading ValencyAi...</p></div>;

  if (isReviewing) {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header" style={{ marginBottom: '20px' }}>
          <button className="action-btn secondary" onClick={() => setIsReviewing(false)}>Back to Dashboard</button>
        </header>
        <ReviewUI 
          initialSegments={reviewSegments} 
          onFinalSubmit={handleReviewSubmit}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Student Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back, {profile?.full_name} &bull; <span style={{color: '#1000f3'}}>{profile?.school_name}</span> (Grade {profile?.grade_level})
          </p>
        </div>
        <div className="header-actions">
          <button className="action-btn" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </header>

      <h2 className="section-title">Action Required</h2>
      <div className="content-grid" style={{ marginBottom: '40px' }}>
        {activeAssignments.length === 0 && <p style={{ color: '#64748b' }}>No pending assignments.</p>}
        {activeAssignments.map(assignment => (
          <div key={assignment.id} className="glass-card" style={{ 
            borderColor: assignment.status === 'pending_review' ? '#d97706' : 'rgba(255, 255, 255, 0.5)',
            boxShadow: assignment.status === 'pending_review' ? '0 0 15px rgba(217, 119, 6, 0.2)' : ''
          }}>
            <div className="card-header">
              <h3 className="card-title">{assignment.title}</h3>
              {assignment.status === 'pending_review' ? (
                <span className="badge warning">Review Needed</span>
              ) : (
                <span className="badge primary">Upload Due</span>
              )}
            </div>
            <div className="card-body">
              <p>Due: {assignment.dueDate}</p>
            </div>
            
            {assignment.questionPdfUrl && (
              <a 
                href={assignment.questionPdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  display: 'block', marginBottom: '16px', color: '#1000f3', 
                  fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' 
                }}
              >
                &darr; Download Questions (PDF)
              </a>
            )}

            {assignment.status === 'pending_review' ? (
              <button className="action-btn" style={{ background: '#d97706' }}>Review AI Text</button>
            ) : (
              <div style={{ position: 'relative' }}>
                <input 
                  type="file" 
                  accept=".pdf,image/*" 
                  onChange={(e) => handleFileUpload(e, assignment.id)}
                  style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                />
                <button className="action-btn">Upload Answers</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="content-grid">
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '24px' }}>
          
          {/* Past Assignments Section */}
          <div style={{ flex: 2 }}>
            <h2 className="section-title">Recent Grades</h2>
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'rgba(0,0,0,0.03)' }}>
                  <tr>
                    <th style={{ padding: '16px 24px', fontWeight: 600, color: '#475569' }}>Assignment</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600, color: '#475569' }}>Score</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600, color: '#475569' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pastAssignments.map((assignment, idx) => (
                    <tr key={assignment.id} style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      <td style={{ padding: '16px 24px', fontWeight: 500 }}>{assignment.title}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ color: '#10b981', fontWeight: 700, fontSize: '1.1rem' }}>{assignment.score}</span> / {assignment.maxScore}
                      </td>
                      <td style={{ padding: '16px 24px', color: '#64748b' }}>{assignment.gradedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Join Class Section */}
          <div style={{ flex: 1 }}>
            <h2 className="section-title">Classes</h2>
            <div className="glass-card" style={{ textAlign: 'center' }}>
              <h3 className="card-title" style={{ marginBottom: '12px' }}>Join a New Class</h3>
              <p className="card-body">Enter the 6-character code provided by your teacher.</p>
              
              {joinError && <div style={{ color: '#d97706', marginBottom: '10px', fontSize: '0.9rem' }}>{joinError}</div>}
              {joinSuccess && <div style={{ color: '#10b981', marginBottom: '10px', fontSize: '0.9rem' }}>Successfully joined class!</div>}

              <input 
                type="text" 
                placeholder="e.g. A1B2C3" 
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={6}
                style={{ 
                  width: '100%', padding: '12px', marginBottom: '16px', 
                  borderRadius: '12px', border: '2px solid #e2e8f0', 
                  textAlign: 'center', letterSpacing: '2px', fontSize: '1.1rem',
                  textTransform: 'uppercase', boxSizing: 'border-box'
                }} 
              />
              <button 
                className="action-btn secondary" 
                onClick={handleJoinClass}
                disabled={joining || inviteCode.length < 6}
              >
                {joining ? 'Joining...' : 'Join Class'}
              </button>

              {/* List enrolled classes here temporarily for validation */}
              <div style={{ marginTop: '24px', textAlign: 'left' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Enrolled</h4>
                {enrolledClasses.length === 0 ? (
                  <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>No classes yet.</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {enrolledClasses.map(c => (
                      <li key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontWeight: 500 }}>
                        {c.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}