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
  const [expandedAssignmentIds, setExpandedAssignmentIds] = useState([]);
  const [uploadingAssignmentId, setUploadingAssignmentId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submissionNotice, setSubmissionNotice] = useState(null);
  
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
    if (uploadingAssignmentId) return;

    const file = e.target.files[0];
    if (!file) return;

    setUploadingAssignmentId(assignmentId);
    setUploadProgress(1);
    setSubmissionNotice(null);

    let currentProgress = 1;
    const simulationInterval = setInterval(() => {
      if (currentProgress < 92) {
        currentProgress += Math.random() * 4;
        setUploadProgress(Math.floor(currentProgress));
      }
    }, 500);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${assignmentId}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
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

      const { data: { publicUrl } } = supabase.storage.from('student-submissions').getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('submissions').insert({
        assignment_id: assignmentId,
        student_id: profile.id,
        pdf_url: publicUrl,
        status: 'pending'
      });

      if (insertError) throw insertError;

      clearInterval(simulationInterval);
      setUploadProgress(100);
      setSubmissionNotice({ type: 'success', text: 'Assignment submitted successfully.' });
      e.target.value = '';

      await new Promise(resolve => setTimeout(resolve, 700));
      await fetchData(profile.id);
    } catch (err) {
      clearInterval(simulationInterval);
      setSubmissionNotice({ type: 'error', text: `Upload error: ${err.message}` });
      e.target.value = '';
    } finally {
      setUploadingAssignmentId(null);
      setUploadProgress(0);
    }
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return { relative: 'No due date', absolute: '' };
    
    const due = new Date(dueDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    
    const diffTime = dueDay - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let relative = '';
    if (diffDays === 0) relative = 'Today';
    else if (diffDays === 1) relative = 'Tomorrow';
    else if (diffDays > 1) relative = `In ${diffDays} days`;
    else if (diffDays === -1) relative = 'Yesterday';
    else relative = `${Math.abs(diffDays)} days ago`;
    
    const hours = due.getHours().toString().padStart(2, '0');
    const minutes = due.getMinutes().toString().padStart(2, '0');
    const date = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const absolute = `${date} at ${hours}:${minutes}`;
    
    return { relative, absolute };
  };

  const getQuestionPdfUrl = (assignment) => {
    const questionPdf = assignment?.question_pdf_url;
    if (!questionPdf) return null;

    if (/^https?:\/\//i.test(questionPdf)) {
      return questionPdf;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('assignment_questions')
      .getPublicUrl(questionPdf);

    return publicUrl;
  };

  const toggleAssignment = (assignmentId) => {
    setExpandedAssignmentIds(current =>
      current.includes(assignmentId)
        ? current.filter(id => id !== assignmentId)
        : [...current, assignmentId]
    );
  };

  const selectedClass = enrolledClasses.find(c => c.id === selectedClassId);
  const activeAssignments = selectedClass?.assignments?.filter(asg => !submissions.find(s => s.assignment_id === asg.id)) || [];
  const pastAssignments = selectedClass?.assignments?.filter(asg => submissions.find(s => s.assignment_id === asg.id)) || [];

  return (
    <div className="sd-layout">
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

        {submissionNotice && (
          <div className={`sc-submission-notice ${submissionNotice.type}`} role="status">
            {submissionNotice.text}
          </div>
        )}

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

                {activeAssignments.length > 0 ? (
                  <div className="sc-active-list">
                    {activeAssignments.map(assignment => {
                      const dueDate = formatDueDate(assignment.due_date);
                      const questionPdfUrl = getQuestionPdfUrl(assignment);
                      const isExpanded = expandedAssignmentIds.includes(assignment.id);
                      const isUploading = uploadingAssignmentId === assignment.id;
                      const isUploadLocked = Boolean(uploadingAssignmentId);

                      return (
                        <div className={`sc-asg-main-card ${isExpanded ? 'expanded' : ''}`} key={assignment.id}>
                    <div
                      className="sc-asg-header sc-asg-toggle"
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleAssignment(assignment.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleAssignment(assignment.id);
                        }
                      }}
                      aria-expanded={isExpanded}
                    >
                      <div className="sc-asg-title-box">
                        <h3>{assignment.title}</h3>
                        <div className="sc-asg-meta">
                          <span>🕒 Due: {dueDate.relative}{dueDate.absolute ? `, ${dueDate.absolute}` : ''}</span>
                          {questionPdfUrl ? (
                            <a href={questionPdfUrl} download target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                              📄 Download questions PDF
                            </a>
                          ) : (
                            <span>📄 Questions PDF unavailable</span>
                          )}
                        </div>
                      </div>
                      <div className="sc-asg-actions">
                        <span className="sc-status-badge">Open</span>
                        <span className="sc-expand-icon">{isExpanded ? '-' : '+'}</span>
                      </div>
                    </div>
                    {isExpanded && (
                      <>
                    <div className="sc-asg-description">
                      {assignment.description || "Please complete the worksheet, scan your handwritten answers as a PDF, and upload it here. Ensure your handwriting is legible."}
                    </div>
                    
                    <div className={`sc-upload-area ${isUploading ? 'uploading' : ''}`}>
                      <input type="file" accept=".pdf" disabled={isUploadLocked} onChange={(e) => handleFileUpload(e, assignment.id)} style={{ position: 'absolute', opacity: 0, inset: 0, cursor: isUploadLocked ? 'not-allowed' : 'pointer' }} />
                      <div className="sc-upload-icon">☁️</div>
                      <h4>{isUploading ? 'Uploading your PDF...' : 'Click or drag PDF to upload'}</h4>
                      <p>{isUploading ? 'Please keep this page open.' : 'Maximum file size 10MB.'}</p>
                      {isUploading && (
                        <div className="sc-upload-progress" aria-label={`Upload progress ${uploadProgress}%`}>
                          <div className="sc-upload-progress-track">
                            <div className="sc-upload-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                          <span>{uploadProgress}%</span>
                        </div>
                      )}
                    </div>
                      </>
                    )}
                        </div>
                      );
                    })}
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
