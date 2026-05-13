import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import CreateClassModal from '../components/CreateClassModal';
import CreateAssignmentModal from '../components/CreateAssignmentModal';
import './Dashboard.css';

export default function TeacherClasses() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [studentsById, setStudentsById] = useState({});
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

    if (classError || !classData) {
      setClasses([]);
      setEnrollments([]);
      setStudentsById({});
      return;
    }

    setClasses(classData);

    const classIds = classData.map(cls => cls.id);
    if (classIds.length === 0) {
      setEnrollments([]);
      setStudentsById({});
      return;
    }

    const { data: enrollmentData } = await supabase
      .from('class_enrollments')
      .select('class_id, student_id')
      .in('class_id', classIds);

    const safeEnrollments = enrollmentData || [];
    setEnrollments(safeEnrollments);

    const studentIds = [...new Set(safeEnrollments.map(item => item.student_id).filter(Boolean))];
    if (studentIds.length === 0) {
      setStudentsById({});
      return;
    }

    const { data: studentData } = await supabase
      .from('profiles')
      .select('id, full_name, school_name, grade_level')
      .in('id', studentIds);

    setStudentsById(
      (studentData || []).reduce((acc, student) => {
        acc[student.id] = student;
        return acc;
      }, {})
    );
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
    };

    checkUser();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const openAssignmentModal = (classId) => {
    setSelectedClassId(classId);
    setIsAssignmentModalOpen(true);
  };

  const getClassStudents = (classId) =>
    enrollments
      .filter(item => item.class_id === classId)
      .map(item => studentsById[item.student_id])
      .filter(Boolean);

  const formatDueDate = (dueDate) => {
    if (!dueDate) return 'No due date';
    return new Date(dueDate).toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="td-layout">
      <div className="bg-grid"></div>

      <aside className="td-sidebar">
        <div className="td-sidebar-logo" onClick={() => navigate('/teacher-dashboard')}>
          <img src="/logo-light.svg" alt="Valency.Ai" style={{ width: '100%', maxWidth: '220px', height: 'auto', display: 'block' }} />
        </div>

        <div className="td-user-info">
          <span className="role">Teacher</span>
          <span className="name">{profile?.full_name}</span>
        </div>

        <nav className="td-nav">
          <Link to="/teacher-dashboard" className="td-nav-item"><i>📊</i> Dashboard</Link>
          <Link to="/teacher-classes" className="td-nav-item active"><i>📚</i> My Classes</Link>
          <Link to="#" className="td-nav-item"><i>🔍</i> OCR Verification</Link>
          <Link to="#" className="td-nav-item"><i>📈</i> My Grades</Link>
        </nav>

        <div className="td-sidebar-footer">
          <div className="td-logout" onClick={handleSignOut}><i>🚪</i> Sign out</div>
        </div>
      </aside>

      <main className="td-main">
        <header className="td-header">
          <div className="td-header-text">
            <h2>My Classes</h2>
            <p>Create assignments, share invite codes, and track who is enrolled.</p>
          </div>
        </header>

        <div className="tc-class-grid">
          {classes.map(cls => {
            const assignments = [...(cls.assignments || [])].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
            const students = getClassStudents(cls.id);

            return (
              <article className="tc-class-card" key={cls.id}>
                <div className="tc-class-card-top">
                  <div>
                    <h3>{cls.name}</h3>
                    <span className="tc-invite-code">{cls.invite_code}</span>
                  </div>
                  <button className="tc-icon-btn" onClick={() => openAssignmentModal(cls.id)} title="Add assignment">+</button>
                </div>

                <div className="tc-student-count">
                  <strong>{students.length}</strong> {students.length === 1 ? 'Student' : 'Students'} Enrolled
                </div>

                <section className="tc-card-section">
                  <h4>Assignments</h4>
                  <div className="tc-assignment-list">
                    {assignments.length > 0 ? assignments.map(asg => (
                      <div className="tc-assignment-row" key={asg.id}>
                        <span>{asg.title}</span>
                        <time>{formatDueDate(asg.due_date)}</time>
                      </div>
                    )) : (
                      <p className="tc-empty-text">No assignments yet.</p>
                    )}
                  </div>
                </section>

                <section className="tc-card-section">
                  <h4>Students</h4>
                  <div className="tc-student-list">
                    {students.length > 0 ? students.map(student => (
                      <div className="tc-student-row" key={student.id}>
                        <div className="tc-student-avatar">{student.full_name?.charAt(0) || '?'}</div>
                        <div>
                          <span>{student.full_name || 'Unnamed student'}</span>
                          <small>{student.grade_level || student.school_name || 'Student'}</small>
                        </div>
                      </div>
                    )) : (
                      <p className="tc-empty-text">No students enrolled yet.</p>
                    )}
                  </div>
                </section>

                <button className="tc-add-assignment-btn" onClick={() => openAssignmentModal(cls.id)}>
                  + Add Assignment
                </button>
              </article>
            );
          })}

          <button className="tc-create-class-card" onClick={() => setIsClassModalOpen(true)}>
            <span>+</span>
            <strong>Create New Class</strong>
            <p>Generate an invite code and start grading.</p>
            <em>Create Class</em>
          </button>
        </div>
      </main>

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
