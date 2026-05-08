// We don't need imports here unless we use hooks, 
// but it's good practice to keep it clean.

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
  handleMagicLink 
}) {
  const isTeacher = role === 'teacher';

  // Logic: Success State (Magic Link Sent)
  if (sent) {
    return (
      <div className="role-card">
        <h2>{isTeacher ? '🧑‍🏫 Teacher' : '🎓 Student'}</h2>
        <p>📬 Magic link sent to <strong>{email}</strong>!</p>
        <button className="magic-btn" onClick={() => { setSent(false); setEmail(''); }}>← Back</button>
      </div>
    );
  }

  // Logic: Standard Input State
  return (
    <div className="role-card">
      <h2>{isTeacher ? 'Teacher' : 'Student'}</h2>
      <p className="role-description">{description}</p>

      <button className="google-btn" onClick={() => handleGoogleLogin(role)}>
        Continue with Google
      </button>

      <div className="divider"><span>OR</span></div>

      <input
        className="auth-input"
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setError(''); }}
      />

      {error && <p style={{ color: 'red', fontSize: '13px', marginBottom: '10px' }}>{error}</p>}

      <button
        className="magic-btn"
        onClick={() => handleMagicLink(role)}
        disabled={loading === role}
      >
        {loading === role ? 'Sending...' : 'Sign up with email'}
      </button>
    </div>
  );
}