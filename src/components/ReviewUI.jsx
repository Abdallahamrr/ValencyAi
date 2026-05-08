import { useState, useMemo } from 'react';
import '../pages/Dashboard.css';

// This is the implementation of the "Man-in-the-Loop" Review UI
export default function ReviewUI({ initialSegments, originalImageUrl, onFinalSubmit }) {
  // 1. Main state for all segments
  const [segments, setSegments] = useState(initialSegments || []);
  
  // 2. Track which segment is currently being edited
  const [activeSegmentId, setActiveSegmentId] = useState(null);
  
  // 3. Track the draft text for the active segment
  const [draftText, setDraftText] = useState("");

  // Derived state: count how many low-confidence items still need review
  const remainingReviews = useMemo(() => {
    return segments.filter(s => s.confidence < 0.85 && !s.isReviewed).length;
  }, [segments]);

  const handleOpenCorrectionBox = (segment) => {
    setActiveSegmentId(segment.id);
    setDraftText(segment.text);
  };

  const handleSaveCorrection = () => {
    setSegments(prev => prev.map(s => 
      s.id === activeSegmentId 
        ? { ...s, text: draftText, isReviewed: true, confidence: 1.0 } 
        : s
    ));
    setActiveSegmentId(null);
  };

  const handleFinalSubmit = () => {
    if (remainingReviews > 0) {
      alert("Please review all uncertain segments before submitting.");
      return;
    }
    // Reconstruct the full text from segments
    const finalTranscript = segments.map(s => s.text).join(" ");
    
    // Call parent handler
    if (onFinalSubmit) {
      onFinalSubmit(finalTranscript);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card-header">
        <h3 className="card-title">Review AI Transcription</h3>
        <span className={`badge ${remainingReviews > 0 ? 'warning' : 'primary'}`}>
          {remainingReviews} Reviews Remaining
        </span>
      </div>
      
      <p className="card-body">
        The AI has transcribed your handwritten answer. Words highlighted in <strong style={{color: '#d97706'}}>orange</strong> have low confidence. Please click them to verify or correct.
      </p>

      {/* The Transcript Display */}
      <div style={{ 
        padding: '24px', 
        background: 'rgba(255,255,255,0.8)', 
        borderRadius: '12px', 
        border: '1px solid #e2e8f0',
        lineHeight: '2',
        fontSize: '1.1rem',
        marginBottom: '24px'
      }}>
        {segments.map((segment) => {
          const isUncertain = segment.confidence < 0.85 && !segment.isReviewed;
          const isActive = activeSegmentId === segment.id;

          return (
            <span 
              key={segment.id}
              onClick={() => isUncertain ? handleOpenCorrectionBox(segment) : null}
              style={{
                display: 'inline-block',
                marginRight: '6px',
                padding: '2px 6px',
                borderRadius: '6px',
                cursor: isUncertain ? 'pointer' : 'default',
                background: isActive ? '#1000f3' : (isUncertain ? 'rgba(217, 119, 6, 0.15)' : 'transparent'),
                color: isActive ? 'white' : (isUncertain ? '#d97706' : '#1e293b'),
                border: isUncertain ? '1px dashed #d97706' : '1px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {segment.text}
            </span>
          );
        })}
      </div>

      {/* The Correction Box (Appears when a segment is clicked) */}
      {activeSegmentId && (
        <div style={{
          padding: '20px',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '2px solid #1000f3',
          marginBottom: '24px',
          display: 'flex',
          gap: '20px',
          alignItems: 'center'
        }}>
          {/* Simulated Image Crop using CSS object-position (in a real app this uses the bounding box) */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Original Image Crop</p>
            <div style={{
              height: '60px',
              background: '#e2e8f0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'monospace',
              color: '#94a3b8'
            }}>
              {/* This would be the actual image crop */}
              [ Image Segment ]
            </div>
          </div>

          <div style={{ flex: 2 }}>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Correct the Text</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                style={{ 
                  flex: 1, padding: '10px 16px', borderRadius: '8px', 
                  border: '1px solid #cbd5e1', fontSize: '1rem' 
                }} 
              />
              <button 
                onClick={handleSaveCorrection}
                className="action-btn"
                style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Submission */}
      <button 
        className={`action-btn ${remainingReviews > 0 ? 'secondary' : ''}`}
        onClick={handleFinalSubmit}
        disabled={remainingReviews > 0}
        style={{ 
          opacity: remainingReviews > 0 ? 0.5 : 1,
          cursor: remainingReviews > 0 ? 'not-allowed' : 'pointer'
        }}
      >
        Submit for AI Grading
      </button>
    </div>
  );
}
