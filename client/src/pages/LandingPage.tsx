import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Sun, Moon, Shield, Users, LayoutGrid, Zap, Filter, Bell } from 'lucide-react';
import faviconUrl from '../assets/favicon.svg';

const PIPELINE_STEPS = [
  {
    num: '01',
    label: 'Proposed',
    cls: 'proposed',
    title: '01  Proposed',
    desc: 'Every great feature starts as a proposal. Ideas are captured, discussed, and refined before any work begins.',
  },
  {
    num: '02',
    label: 'In Progress',
    cls: 'in-progress',
    title: '02  In Progress',
    desc: 'The team picks it up and work begins. Developers, designers, and stakeholders collaborate in real time.',
  },
  {
    num: '03',
    label: 'Needs Review',
    cls: 'needs-review',
    title: '03  Needs Review',
    desc: 'Code done? Time for peer review. Quality gates ensure nothing ships without a second pair of eyes.',
  },
  {
    num: '04',
    label: 'Complete',
    cls: 'complete',
    title: '04  Complete',
    desc: 'Merged, deployed, and delivered. The task is done and the team celebrates another milestone.',
  },
  {
    num: '05',
    label: 'On Hold',
    cls: 'on-hold',
    title: '05  On Hold',
    desc: 'Sometimes priorities shift. Tasks can be paused and revisited when the time is right.',
  },
];

const FEATURES: { icon: React.ReactNode; iconCls: string; title: string; desc: string; comingSoon?: boolean }[] = [
  {
    icon: <Shield size={24} />,
    iconCls: 'feature-icon--purple',
    title: 'Role-Based Access',
    desc: 'Admins create projects and manage tasks. Members focus on execution. Clear roles, zero confusion.',
  },
  {
    icon: <Users size={24} />,
    iconCls: 'feature-icon--blue',
    title: 'Multi-Assignee Tasks',
    desc: 'Assign tasks to one or many team members. Everyone knows who owns what — no more dropped balls.',
  },
  {
    icon: <LayoutGrid size={24} />,
    iconCls: 'feature-icon--green',
    title: 'Board & List Views',
    desc: 'Switch between a Kanban-style board and a detailed list table. Your workflow, your way.',
  },
  {
    icon: <Zap size={24} />,
    iconCls: 'feature-icon--pink',
    title: 'Real-time Tracking',
    desc: 'Instant status updates, priority labels, and due-date alerts. Stay on top of everything, effortlessly.',
  },
  {
    icon: <Filter size={24} />,
    iconCls: 'feature-icon--blue',
    title: 'Task Filtering',
    desc: 'Filter tasks by status, priority, assignee, and more. Find exactly what you need in seconds.',
  },
  {
    icon: <Bell size={24} />,
    iconCls: 'feature-icon--purple',
    title: 'Task Notifications',
    desc: 'Coming soon — get notified when tasks are assigned, updated, or approaching their due date.',
    comingSoon: true,
  },
];

const LandingPage = () => {
  const { isAuthenticated, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login', { state: { mode: 'register' } });
    }
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  return (
    <div className="landing-page">
      {/* ── Navbar ────────────────────────────────────────── */}
      <nav className="landing-navbar" id="landing-nav">
        <div className="landing-navbar-logo">
          <img src={faviconUrl} alt="EtharaTasks" style={{ width: 28, height: 28 }} />
          <span>EtharaTasks</span>
        </div>
        <div className="landing-navbar-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            id="landing-theme-toggle"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {isAuthenticated ? (
            <>
              <button className="btn-cta-primary" onClick={() => navigate('/dashboard')} id="landing-dashboard-btn">
                Dashboard <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              <button className="btn-cta-outline" onClick={handleSignIn} id="landing-signin-btn">
                Sign In
              </button>
              <button className="btn-cta-primary" onClick={handleGetStarted} id="landing-getstarted-btn">
                Get Started <ArrowRight size={16} />
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────────── */}
      <section className="landing-hero" id="hero-section">
        {/* Floating particles */}
        <div className="hero-particles">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="hero-particle" />
          ))}
        </div>

        {/* Glowing orbs */}
        <div className="hero-orb hero-orb--1" />
        <div className="hero-orb hero-orb--2" />

        {/* Decorative brackets */}
        <div className="hero-deco-bracket hero-deco-bracket--tl" />
        <div className="hero-deco-bracket hero-deco-bracket--br" />



        {/* Title */}
        <h1 className="hero-title">
          Every task begins.
          <span className="hero-title-gradient">With someone’s expectation..</span>
        </h1>

        {/* Description */}
        <p className="hero-description">
          Create projects, assign tasks, track progress — all in one
          beautiful workspace built for modern teams. Born from the need
          to make collaboration effortless.
        </p>

        {/* CTA */}
        <div className="hero-cta">
          {isAuthenticated ? (
            <>
              <button className="btn-cta-primary" onClick={() => navigate('/dashboard')} id="hero-dashboard-btn">
                Go to Dashboard <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              <button className="btn-cta-primary" onClick={handleGetStarted} id="hero-getstarted-btn">
                Get Started Free <ArrowRight size={16} />
              </button>
              <button className="btn-cta-outline" onClick={handleSignIn} id="hero-signin-btn">
                Sign In
              </button>
            </>
          )}
        </div>


      </section>

      {/* ── Task Pipeline Section ────────────────────────── */}
      <section className="landing-pipeline" id="pipeline-section">
        <div className="pipeline-header">
          <h2>How Tasks Flow</h2>
          <p>From idea to completion — a streamlined lifecycle designed for clarity and speed.</p>
        </div>

        <div className="pipeline-container">
          {/* SVG wave connector (visible on desktop) */}
          <svg className="pipeline-wave" viewBox="0 0 1100 220" preserveAspectRatio="none">
            <defs>
              <linearGradient id="pipelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <path d="M 55 55 C 200 55, 200 165, 330 165 S 460 55, 550 55 S 680 165, 770 165 S 900 55, 1045 55" />
          </svg>

          <div className="pipeline-steps">
            {PIPELINE_STEPS.map((step) => (
              <div key={step.cls} className={`pipeline-step pipeline-step--${step.cls}`}>
                <div className="pipeline-step-number">{step.num}</div>
                <span className="pipeline-step-label">{step.label}</span>
                <div className="pipeline-step-card">
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────── */}
      <section className="landing-stats" id="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">5</div>
            <div className="stat-label">Task Statuses</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">4</div>
            <div className="stat-label">Priority Levels</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">2</div>
            <div className="stat-label">View Modes</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">∞</div>
            <div className="stat-label">Team Members</div>
          </div>
        </div>
      </section>

      {/* ── Features Section ─────────────────────────────── */}
      <section className="landing-features" id="features-section">
        <div className="features-header">
          <h2>Everything You Need</h2>
          <p>Powerful features wrapped in a clean, intuitive interface.</p>
        </div>

        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className={`feature-card ${f.comingSoon ? 'feature-card--coming-soon' : ''}`}>
              <div className={`feature-icon ${f.iconCls}`}>{f.icon}</div>
              <h3>{f.title} {f.comingSoon && <span className="coming-soon-badge">Coming Soon</span>}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="landing-footer" id="landing-footer">
        <p>
         © {new Date().getFullYear()} Developed by <a href="https://amritanshusingh.netlify.app/" target="_blank" rel="noopener noreferrer">Amritanshu Singh</a>
          
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
