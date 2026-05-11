import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

// ── Floating particles background ──────────────────────────────────────────
function Particles() {
  return (
    <div className="particles" aria-hidden="true">
      {Array.from({ length: 15 }).map((_, i) => (
        <span key={i} className="particle" style={{ '--i': i }} />
      ))}
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
      <Particles />

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-nav-logo" onClick={() => navigate('/')}>
          <svg className="logo-icon" width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 4L4 10L16 16L28 10L16 4Z" fill="#7C3AED" />
            <path d="M4 22L16 28L28 22" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16L16 22L28 16" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
        <div className="hero-grid-bg" />
        <div className="hero-content">
          <div className="hero-badge reveal">
            <span className="badge-icon">🛡️</span>
            Verify-then-Grade Architecture
          </div>
          <h1 className="hero-title reveal">
            Precision Grading.<br />
            <span className="gradient-text">Human Fairness.</span>
          </h1>
          <p className="hero-sub reveal">
            The AI-powered IGCSE grading platform that empowers students to 
            verify handwriting OCR before the AI grades. Built specifically for 
            Chemistry and Math.
          </p>
          <div className="hero-actions reveal">
            <button className="btn-primary" onClick={() => navigate('/auth')}>
              Start Free Trial
            </button>
            <button className="btn-secondary" onClick={() => document.getElementById('how').scrollIntoView({ behavior: 'smooth' })}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
              </svg>
              Watch Demo
            </button>
          </div>

          <div className="hero-visual reveal">
             <div className="visual-mockup">
                <div className="network-nodes">
                   <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
                      <circle cx="200" cy="100" r="4" fill="#7C3AED" opacity="0.6" />
                      <circle cx="400" cy="250" r="6" fill="#7C3AED" />
                      <circle cx="600" cy="150" r="4" fill="#7C3AED" opacity="0.6" />
                      <line x1="200" y1="100" x2="400" y2="250" stroke="#7C3AED" strokeWidth="1" opacity="0.3" />
                      <line x1="400" y1="250" x2="600" y2="150" stroke="#7C3AED" strokeWidth="1" opacity="0.3" />
                   </svg>
                </div>
                <div className="verification-status">
                   <div className="status-dot" />
                   <span>OCR Verification Complete</span>
                   <div className="status-progress-bar">
                      <div className="progress-fill" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ── WORKFLOW ── */}
      <section className="lp-workflow" id="how">
        <div className="section-header reveal">
          <h2>The "Verify-then-Grade" Workflow</h2>
          <p>A transparent process that builds trust between students, teachers, and AI.</p>
        </div>

        <div className="workflow-timeline">
          <div className="timeline-line" />
          {[
            {
              role: 'TEACHER',
              title: 'Create Class & Upload Scheme',
              desc: 'Teachers set up the assignment and upload the official mark scheme PDF. The AI digests the marking criteria.',
              step: '01'
            },
            {
              role: 'STUDENT',
              title: 'Submit Handwritten PDF',
              desc: 'Students scan and upload their handwritten IGCSE Chemistry or Math assignments securely to the platform.',
              step: '02'
            },
            {
              role: 'AI + STUDENT',
              title: 'Read & Verify',
              desc: 'AI transcribes the handwriting. Uncertain areas are highlighted. The student uses the MathLive editor to correct any misread symbols.',
              step: '03'
            },
            {
              role: 'AI',
              title: 'Automated Grading',
              desc: 'Gemini Pro compares the verified student answers against the mark scheme, assigning marks and generating feedback.',
              step: '04'
            },
            {
              role: 'TEACHER',
              title: 'Review & Finalize',
              desc: "Teachers review the AI's grading decisions, override where necessary, and publish the final results to the students.",
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
          <h2>Engineered for Academic Rigor</h2>
          <p>We don't just guess handwriting. We put the student in the loop to ensure every symbol, equation, and chemical formula is read perfectly before grading begins.</p>
        </div>

        <div className="features-grid">
          {[
            {
              icon: '⚡',
              title: 'Advanced OCR Pipeline',
              desc: 'Powered by Gemini, our pipeline is fine-tuned for complex mathematical notations and chemical structures.',
              color: '#3B82F6'
            },
            {
              icon: '👤',
              title: 'Student Verification',
              desc: "Before any grading happens, students review the AI's transcription of their work and correct any misread symbols.",
              color: '#10B981'
            },
            {
              icon: '✏️',
              title: 'MathLive Editor',
              desc: 'A powerful, intuitive editor allowing students to easily input complex math and chemistry symbols during verification.',
              color: '#3B82F6'
            },
            {
              icon: '📄',
              title: 'Mark Scheme Alignment',
              desc: 'Gemini Pro grades the verified text strictly against the teacher\'s uploaded mark scheme, ensuring standardized scoring.',
              color: '#8B5CF6'
            },
            {
              icon: '🛡️',
              title: 'Teacher Override',
              desc: 'Teachers have the final say. Review AI-suggested marks, read the rationale, and override scores with a single click.',
              color: '#EF4444'
            },
            {
              icon: '📈',
              title: 'Actionable Analytics',
              desc: 'Identify common misconceptions across the class. See exactly where students are losing marks at a glance.',
              color: '#F59E0B'
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
          <h2>Simple, Transparent Pricing</h2>
          <p>Start for free, scale when you need to.</p>
        </div>

        <div className="pricing-grid">
          {/* Free */}
          <div className="pricing-card reveal">
            <h3>Free</h3>
            <p className="pricing-desc">Perfect for individual teachers trying out the platform.</p>
            <div className="price">
              <span className="currency">$</span>
              <span className="amount">0</span>
              <span className="period">/mo</span>
            </div>
            <ul className="pricing-features">
              <li><span className="check">✓</span> Up to 3 classes</li>
              <li><span className="check">✓</span> Up to 30 students total</li>
              <li><span className="check">✓</span> Standard OCR pipeline</li>
              <li><span className="check">✓</span> Basic grading features</li>
            </ul>
            <button className="btn-pricing-ghost">Get Started Free</button>
          </div>

          {/* Pro */}
          <div className="pricing-card pro reveal">
            <div className="most-popular">MOST POPULAR</div>
            <h3>Pro</h3>
            <p className="pricing-desc">For dedicated educators managing full courseloads.</p>
            <div className="price">
              <span className="currency">$</span>
              <span className="amount">29</span>
              <span className="period">/mo</span>
            </div>
            <ul className="pricing-features">
              <li><span className="check">✓</span> Unlimited classes</li>
              <li><span className="check">✓</span> Unlimited students</li>
              <li><span className="check">✓</span> Advanced MathLive integration</li>
              <li><span className="check">✓</span> Detailed class analytics</li>
            </ul>
            <button className="btn-pricing-primary">Upgrade to Pro</button>
          </div>

          {/* School */}
          <div className="pricing-card reveal">
            <h3>School</h3>
            <p className="pricing-desc">For entire departments and institutional deployment.</p>
            <div className="price">
              <span className="currency">$</span>
              <span className="amount">99</span>
              <span className="period">/mo</span>
            </div>
            <ul className="pricing-features">
              <li><span className="check">✓</span> Everything in Pro</li>
              <li><span className="check">✓</span> Multi-teacher collaboration</li>
              <li><span className="check">✓</span> Advanced clustering & reporting</li>
              <li><span className="check">✓</span> Priority engineering support</li>
            </ul>
            <button className="btn-pricing-ghost">Contact Sales</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="footer-left">
          <div className="lp-nav-logo">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <path d="M16 4L4 10L16 16L28 10L16 4Z" fill="#7C3AED" />
              <path d="M4 22L16 28L28 22" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="logo-text">Valency.Ai</span>
          </div>
        </div>
        
        <div className="footer-center">
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Documentation</a>
            <a href="#">Contact</a>
          </div>
        </div>

        <div className="footer-right">
          <p>© 2025 Valency.Ai. All rights reserved.</p>
          <div className="replit-badge">Made with Replit</div>
        </div>
      </footer>
    </div>
  );
}