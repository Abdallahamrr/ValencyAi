import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

// ── Background Elements ───────────────────────────────────────────────────
function Background() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div className="bg-mesh" aria-hidden="true">
      <div 
        className="cursor-glow" 
        style={{ 
          left: `${mousePos.x}px`, 
          top: `${mousePos.y}px` 
        }} 
      />
      <div className="mesh-blob blob-1" />
      <div className="mesh-blob blob-2" />
      <div className="mesh-blob blob-3" />
      <div className="hero-grid-bg" />
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();

  // Reveal on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="lp-root">
      <Background />

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-nav-logo" onClick={() => navigate('/')}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 4L4 10L16 16L28 10L16 4Z" fill="#8B5CF6" />
            <path d="M4 22L16 28L28 22" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16L16 22L28 16" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="logo-text">Valency.Ai</span>
        </div>
        <div className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it Works</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="lp-nav-actions">
          <button className="btn-login" onClick={() => navigate('/signin')}>Sign In</button>
          <button className="btn-get-started" onClick={() => navigate('/auth')}>Get Started</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="hero-content">
          <div className="hero-badge reveal">
            <span className="badge-icon">✨</span>
            The Future of IGCSE Assessment
          </div>
          <h1 className="hero-title reveal">
            Grade with AI.<br />
            <span className="gradient-text">Trust with Verification.</span>
          </h1>
          <p className="hero-sub reveal">
            Valency AI bridges the gap between manual grading and AI efficiency. 
            Verify handwriting OCR before the AI grades. Specifically optimized for 
            Chemistry and Math.
          </p>
          <div className="hero-actions reveal">
            <button className="btn-primary" onClick={() => navigate('/auth')}>
              Get Started for Free
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            <button className="btn-secondary" onClick={() => document.getElementById('how').scrollIntoView({ behavior: 'smooth' })}>
              View the Workflow
            </button>
          </div>

          <div className="hero-visual reveal">
             <div className="visual-mockup">
                <img 
                  src="/valency_hero_dashboard_1778544518723.png" 
                  alt="Valency AI Dashboard" 
                  className="hero-img"
                />
             </div>
          </div>
        </div>
      </section>

      

      {/* ── WORKFLOW ── */}
      <section className="lp-workflow" id="how">
        <div className="section-header reveal">
          <h2>The "Verify-then-Grade" Workflow</h2>
          <p>A transparent, human-in-the-loop process that ensures 100% accuracy in every assessment.</p>
        </div>

        <div className="workflow-timeline">
          <div className="timeline-line" />
          {[
            {
              role: 'TEACHER',
              title: 'Set Up & Upload',
              desc: 'Teachers create classes and upload official mark schemes. Our AI analyzes the marking criteria instantly.',
              step: '01'
            },
            {
              role: 'STUDENT',
              title: 'Secure Submission',
              desc: 'Students upload handwritten work. Our system handles scans, photos, and PDFs with extreme precision.',
              step: '02'
            },
            {
              role: 'AI + STUDENT',
              title: 'OCR Verification',
              desc: 'AI transcribes handwriting. Students verify and correct any mathematical or chemical symbols in real-time.',
              step: '03'
            },
            {
              role: 'AI',
              title: 'Intelligent Grading',
              desc: 'Gemini Pro evaluates work against the mark scheme, providing detailed rationale for every mark awarded.',
              step: '04'
            },
            {
              role: 'TEACHER',
              title: 'Final Approval',
              desc: 'Teachers review suggestions, override where necessary, and publish grades with personalized feedback.',
              step: '05'
            }
          ].map((s, i) => (
            <div className={`workflow-card-container reveal ${i % 2 === 0 ? 'left' : 'right'}`} key={i}>
              <div className="workflow-card">
                <span className="role-tag">{s.role}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
              <div className="step-indicator">
                <span>{s.step}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="lp-features" id="features">
        <div className="section-header reveal">
          <h2>Academic Precision Redefined</h2>
          <p>We've built specialized tools for the most demanding subjects. No more "guessing" what a student wrote.</p>
        </div>

        <div className="features-grid">
          {[
            {
              icon: '🧬',
              title: 'Chemical Formula Recognition',
              desc: 'Optimized for organic and inorganic chemistry. Understands structural diagrams and balanced equations.',
              color: '#10B981'
            },
            {
              icon: '📐',
              title: 'MathLive Verification',
              desc: 'Industry-standard math editor allows students to easily correct complex equations and notations.',
              color: '#3B82F6'
            },
            {
              icon: '🤖',
              title: 'Gemini Pro Analysis',
              desc: "State-of-the-art AI that doesn't just grade, but understands the 'why' behind every student's answer.",
              color: '#8B5CF6'
            },
            {
              icon: '📊',
              title: 'Class mis-conceptions',
              desc: 'Automatically cluster common errors to help teachers address knowledge gaps across the entire class.',
              color: '#F59E0B'
            },
            {
              icon: '⌨️',
              title: 'Teacher Dashboards',
              desc: 'Powerful tools for reviewing, overriding, and providing deep feedback at scale.',
              color: '#EF4444'
            },
            {
              icon: '🔐',
              title: 'Privacy First',
              desc: 'End-to-end encryption for all student submissions and academic data. GDPR and COPPA compliant.',
              color: '#6366F1'
            }
          ].map((f, i) => (
            <div className="feature-card reveal" key={i}>
              <div className="feature-icon-wrapper" style={{ '--icon-color': f.color }}>
                <span className="feature-icon">{f.icon}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="lp-pricing" id="pricing">
        <div className="section-header reveal">
          <h2>Scale with your Success</h2>
          <p>Start for free and unlock advanced analytics as your class grows.</p>
        </div>

        <div className="pricing-grid">
          {/* Free */}
          <div className="pricing-card reveal">
            <h3>Free</h3>
            <p className="pricing-desc">For individual teachers starting their AI journey.</p>
            <div className="price">
              <span className="currency">$</span>
              <span className="amount">0</span>
              <span className="period">/mo</span>
            </div>
            <ul className="pricing-features">
              <li><span className="check">✓</span> 3 Classes</li>
              <li><span className="check">✓</span> 30 Students</li>
              <li><span className="check">✓</span> Standard OCR</li>
              <li><span className="check">✓</span> Basic Analytics</li>
            </ul>
            <button className="btn-pricing-ghost" onClick={() => navigate('/auth')}>Start Now</button>
          </div>

          {/* Pro */}
          <div className="pricing-card pro reveal">
            <div className="most-popular">MOST POPULAR</div>
            <h3>Pro</h3>
            <p className="pricing-desc">The complete toolkit for professional teaching.</p>
            <div className="price">
              <span className="currency">$</span>
              <span className="amount">12</span>
              <span className="period">/mo</span>
            </div>
            <ul className="pricing-features">
              <li><span className="check">✓</span> Unlimited Classes</li>
              <li><span className="check">✓</span> Unlimited Students</li>
              <li><span className="check">✓</span> Priority OCR Pipeline</li>
              <li><span className="check">✓</span> Advanced Misconception Analysis</li>
            </ul>
            <button className="btn-pricing-primary" onClick={() => navigate('/auth')}>Upgrade Now</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="footer-left">
          <div className="lp-nav-logo">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <path d="M16 4L4 10L16 16L28 10L16 4Z" fill="#8B5CF6" />
              <path d="M4 22L16 28L28 22" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="logo-text">Valency.Ai</span>
          </div>
        </div>
        
        <div className="footer-center">
          <div className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Docs</a>
            <a href="#">Contact</a>
          </div>
        </div>

        <div className="footer-right">
          <p>© 2025 Valency.Ai. Premium IGCSE Grading.</p>
          <div className="replit-badge">Built for Excellence</div>
        </div>
      </footer>
    </div>
  );
}