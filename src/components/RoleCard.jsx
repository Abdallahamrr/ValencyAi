import { useState, useEffect } from 'react';

export default function RoleCard({ 
  role, 
  description, 
  email, 
  setEmail, 
  error, 
  setError, 
  sent, 
  setSent, 
  loading, 
  handleGoogleLogin, 
  handleMagicLink,
  mode = 'signup'
}) {
  const isTeacher = role === 'teacher';
  const [resent, setResent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Handle countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const onResend = async () => {
    if (countdown > 0) return;
    setResent(false);
    await handleMagicLink(role);
    setResent(true);
    setCountdown(60); // Start 60s cooldown
    setTimeout(() => setResent(false), 3000);
  };

  if (sent) {
    return (
      <div className="success-state">
        <div className="success-icon">📬</div>
        <h3>Check your inbox!</h3>
        <p>We've sent a login link to <strong>{email}</strong>.</p>
        
        {error && (
          <p style={{ 
            color: '#EF4444', 
            fontSize: '13px', 
            marginTop: '16px',
            background: 'rgba(239, 68, 68, 0.1)',
            padding: '8px',
            borderRadius: '6px'
          }}>
            {error}
          </p>
        )}

        <div className="resend-container" style={{ marginBottom: '24px', marginTop: '24px' }}>
          <p style={{ fontSize: '13px', color: 'var(--auth-text-muted)', marginBottom: '8px' }}>
            Didn't receive it?
          </p>
          <button 
            className="resend-btn" 
            onClick={onResend}
            disabled={loading === role || countdown > 0}
            style={{
              background: 'transparent',
              color: countdown > 0 ? 'var(--auth-text-muted)' : 'var(--auth-primary-light)',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: countdown > 0 ? 'default' : 'pointer',
              textDecoration: countdown > 0 ? 'none' : 'underline'
            }}
          >
            {loading === role 
              ? 'Resending...' 
              : (countdown > 0 
                  ? `Wait ${countdown}s to resend` 
                  : (resent ? '✅ Link resent!' : 'Resend login link'))}
          </button>
        </div>

        <button className="magic-btn" onClick={() => { setSent(false); setEmail(''); setError(''); }}>
          ← Back to login
        </button>
      </div>
    );
  }

  return (
    <div className="role-card-content">
      <button className="google-btn" onClick={() => handleGoogleLogin(role)}>
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div className="divider">
        {mode === 'signin' ? 'or sign in with email' : 'or sign up with email'}
      </div>

      <div className="form-field">
        <label>EMAIL ADDRESS</label>
        <div className="input-wrapper">
          <span className="input-icon">✉️</span>
          <input
            className="auth-input"
            type="email"
            placeholder="alex@school.edu"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
          />
        </div>
      </div>

      {error && <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '16px', textAlign: 'left' }}>{error}</p>}

      <div className="notice-box">
        <span className="notice-icon">✉️</span>
        <p>
          {mode === 'signin' 
            ? "We'll send a login link to your inbox. No password needed." 
            : "We'll send a verification link to your inbox. Just click to activate."}
        </p>
      </div>

      <button
        className="magic-btn"
        onClick={() => handleMagicLink(role)}
        disabled={loading === role}
      >
        {loading === role ? 'Sending...' : (mode === 'signin' ? 'Sign In' : 'Send Verification Link')}
        <span style={{ marginLeft: '8px' }}>→</span>
      </button>
    </div>
  );
}