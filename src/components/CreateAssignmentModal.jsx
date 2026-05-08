import { useState } from 'react';
import { supabase } from '../supabaseClient';
import '../pages/Dashboard.css';

export default function CreateAssignmentModal({ isOpen, onClose, classId, onAssignmentCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [dueDate, setdueDate] = useState(null);
  const [questionFile, setQuestionFile] = useState(null);
  const [markingSchemeFile, setMarkingSchemeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!questionFile || !markingSchemeFile) {
      setError('Please select both the Question PDF and Marking Scheme PDF.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Helper function to upload files
      const uploadPDF = async (file, bucketName) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${classId}/${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        return publicUrl;
      };

      // 1. Upload the PDFs to Supabase Storage
      const questionPdfUrl = await uploadPDF(questionFile, 'assignment_questions');
      const markingSchemeUrl = await uploadPDF(markingSchemeFile, 'marking_schemes');

      // 2. Insert into database
      const { data: insertData, error: insertError } = await supabase
        .from('assignments')
        .insert([
          {
            class_id: classId,
            title: title,
            description: description,
            total_max_marks: parseInt(totalMarks),
            mark_scheme_url: markingSchemeUrl,
            question_pdf_url: questionPdfUrl,
            due_date: dueDate
          }
        ])
        .select();

      if (insertError) throw insertError;

      // Success
      setTitle('');
      setDescription('');
      setTotalMarks('');
      setQuestionFile(null);
      setMarkingSchemeFile(null);
      if (onAssignmentCreated) onAssignmentCreated(insertData[0]);
      onClose();

    } catch (err) {
      console.error('Error creating assignment:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="glass-card" style={{ width: '450px', background: '#fff' }}>
        <div className="card-header">
          <h3 className="card-title">Create Assignment</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
        </div>

        {error && <div style={{ color: '#d97706', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleCreateAssignment}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1e293b' }}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Midterm Test 1"
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1e293b' }}>Desciription</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="e.g. Midterm Test 1"
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1e293b' }}>Total Marks</label>
            <input
              type="number"
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value)}
              required
              min="1"
              placeholder="e.g. 50"
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1e293b' }}>Questions (PDF) - Visible to Students</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setQuestionFile(e.target.files[0])}
              required
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                border: '1px dashed #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box',
                background: '#f8fafc', color: '#64748b'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1e293b' }}>Marking Scheme (PDF) - Hidden from Students</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setMarkingSchemeFile(e.target.files[0])}
              required
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                border: '1px dashed #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box',
                background: '#f8fafc', color: '#64748b'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1e293b' }}>
              Due Date & Time
            </label>
            <input
              type="datetime-local" // Changed from "date"
              value={dueDate}
              onClick={(e) => e.target.showPicker()}
              onChange={(e) => setdueDate(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '1rem',
                boxSizing: 'border-box',
                }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="action-btn secondary" style={{ width: 'auto' }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="action-btn" style={{ width: 'auto' }} disabled={loading}>
              {loading ? 'Uploading...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
