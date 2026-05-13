import { useState } from 'react';
import { supabase } from '../supabaseClient';
import '../pages/Dashboard.css';

export default function CreateAssignmentModal({ isOpen, onClose, classId, onAssignmentCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [questionFile, setQuestionFile] = useState(null);
  const [markingSchemeFile, setMarkingSchemeFile] = useState(null);
  const [questionProgress, setQuestionProgress] = useState(0);
  const [markingSchemeProgress, setMarkingSchemeProgress] = useState(0);
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
      // Helper function to upload files with smart perceived progress
      const uploadPDF = async (file, bucketName, setProgress) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${classId}/${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

        // Start a simulation to keep the UI moving
        let currentProgress = 1;
        const simulationInterval = setInterval(() => {
          if (currentProgress < 92) {
            // Randomly increment to feel "real"
            currentProgress += Math.random() * 3;
            setProgress(Math.floor(currentProgress));
          }
        }, 600);

        try {
          const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file, {
              onUploadProgress: (evt) => {
                if (evt.total) {
                  const realPercent = Math.round((evt.loaded / evt.total) * 100);
                  // Only update if real progress is ahead of simulation
                  if (realPercent > currentProgress) {
                    currentProgress = realPercent;
                    setProgress(realPercent);
                  }
                }
              }
            });

          if (uploadError) throw uploadError;

          // Snap to 100% on success
          clearInterval(simulationInterval);
          setProgress(100);

          const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

          return publicUrl;
        } catch (err) {
          clearInterval(simulationInterval);
          throw err;
        }
      };

      // 1. Upload the PDFs to Supabase Storage in parallel
      const [questionPdfUrl, markingSchemeUrl] = await Promise.all([
        uploadPDF(questionFile, 'assignment_questions', setQuestionProgress),
        uploadPDF(markingSchemeFile, 'marking_schemes', setMarkingSchemeProgress)
      ]);

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
      setQuestionProgress(0);
      setMarkingSchemeProgress(0);
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
    <div className="td-modal-overlay">
      <div className="td-modal-content">
        <header className="td-modal-header">
          <h2>Create New Assignment</h2>
          <button className="td-modal-close" onClick={onClose}>&times;</button>
        </header>

        <form onSubmit={handleCreateAssignment}>
          <div className="td-modal-body">
            {error && (
              <div style={{ 
                background: '#fff7ed', 
                border: '1px solid #ffedd5', 
                color: '#9a3412', 
                padding: '12px 16px', 
                borderRadius: '12px', 
                marginBottom: '24px',
                fontSize: '14px',
                fontWeight: 500
              }}>
                ⚠️ {error}
              </div>
            )}

            <div className="td-form-group">
              <label className="td-form-label">Assignment Title</label>
              <input
                type="text"
                className="td-form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Midterm Test 1"
              />
            </div>

            <div className="td-form-group">
              <label className="td-form-label">Description</label>
              <textarea
                className="td-form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Briefly describe the assignment goals..."
                style={{ minHeight: '80px', resize: 'vertical' }}
              />
            </div>

            <div className="td-form-row">
              <div className="td-form-group">
                <label className="td-form-label">Total Marks</label>
                <input
                  type="number"
                  className="td-form-input"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                  required
                  min="1"
                  placeholder="50"
                />
              </div>
              <div className="td-form-group">
                <label className="td-form-label">Due Date & Time</label>
                <input
                  type="datetime-local"
                  className="td-form-input"
                  value={dueDate}
                  onClick={(e) => e.target.showPicker()}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="td-form-row" style={{ marginTop: '8px' }}>
              <div className="td-form-group">
                <label className="td-form-label">Question Paper (PDF)</label>
                <label className="td-file-upload">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setQuestionFile(e.target.files[0])}
                    required
                  />
                  <span className="td-file-upload-icon">📄</span>
                  <span className="td-file-upload-text">
                    {questionFile ? 'Change File' : 'Upload PDF'}
                  </span>
                  {questionFile && (
                    <div className="td-file-name">{questionFile.name}</div>
                  )}
                </label>
                {loading && (
                  <div className="td-progress-wrapper" style={{ marginTop: '12px' }}>
                    <div className="td-progress-container" style={{ height: '8px', background: '#eef2f6', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                      <div 
                        className="td-progress-bar" 
                        style={{ 
                          width: `${questionProgress}%`, 
                          height: '100%', 
                          background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)',
                          borderRadius: '4px',
                          transition: 'width 0.3s ease'
                        }}
                      ></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--td-primary)' }}>
                        {questionProgress === 100 ? '✅ Uploaded' : 'Uploading...'}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--td-text)' }}>
                        {questionProgress}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="td-form-group">
                <label className="td-form-label">Marking Scheme (PDF)</label>
                <label className="td-file-upload">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setMarkingSchemeFile(e.target.files[0])}
                    required
                  />
                  <span className="td-file-upload-icon">⚖️</span>
                  <span className="td-file-upload-text">
                    {markingSchemeFile ? 'Change File' : 'Upload PDF'}
                  </span>
                  {markingSchemeFile && (
                    <div className="td-file-name">{markingSchemeFile.name}</div>
                  )}
                </label>
                {loading && (
                  <div className="td-progress-wrapper" style={{ marginTop: '12px' }}>
                    <div className="td-progress-container" style={{ height: '8px', background: '#eef2f6', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                      <div 
                        className="td-progress-bar" 
                        style={{ 
                          width: `${markingSchemeProgress}%`, 
                          height: '100%', 
                          background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)',
                          borderRadius: '4px',
                          transition: 'width 0.3s ease'
                        }}
                      ></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--td-primary)' }}>
                        {markingSchemeProgress === 100 ? '✅ Uploaded' : 'Uploading...'}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--td-text)' }}>
                        {markingSchemeProgress}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <footer className="td-modal-footer">
            <button 
              type="button" 
              className="td-btn-secondary" 
              style={{ width: 'auto' }} 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="td-btn-primary" 
              style={{ width: 'auto', padding: '12px 24px' }} 
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Assignment'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

