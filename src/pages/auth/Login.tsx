import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import heroImage from '../../assets/hero.png';
import './Login.css';

/* ── Stats shown on the left panel ── */
const STATS = [
  { value: '8+',   label: 'Districts' },
  { value: '40k+', label: 'SHG Members' },
  { value: '100%', label: 'Secure' },
];

const Login: React.FC = () => {
  const [livelihoodTrackerId, setLivelihoodTrackerId] = useState('');
  const [password, setPassword]                       = useState('');
  const [showPassword, setShowPassword]               = useState(false);
  const [loading, setLoading]                         = useState(false);
  const [error, setError]                             = useState('');

  const { login }  = useAuth();
  const navigate   = useNavigate();

  /* ── Validation ── */
  const isFormValid = livelihoodTrackerId.trim().length > 0 && password.length >= 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!isFormValid) return;

    setLoading(true);
    setError('');

    try {
      const response = await authService.login({ livelihoodTrackerId, password });

      const role = response.role ?? response.user?.role ?? '';
      const user = response.user
        ? {
            id:    response.user.id,
            email: response.user.email ?? '',
            name:  response.user.name  ?? livelihoodTrackerId,
            role:  response.user.role,
          }
        : { id: livelihoodTrackerId, email: '', name: livelihoodTrackerId, role };

      localStorage.setItem('token', response.token);
      if (role) localStorage.setItem('role', role);

      login(user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Invalid credentials. Please check your User ID and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        {/* ══ LEFT — visual / branding panel ══════════════════════ */}
        <div className="login-visual">

          {/* Top: tag + headline + sub-copy */}
          <div className="visual-info-card">
            <p className="visual-tag">TRLM Operations Console</p>
            <h2 className="visual-title">
              Access district, staff,{' '}
              <em>SHG</em>, CRP &amp; payment workflows
            </h2>
            <p className="visual-sub">
              A secure, unified platform for Tripura Rural Livelihood Mission
              field coordinators and district administrators.
            </p>
          </div>

          {/* Middle: logo badge */}
          <div className="visual-badge">
            <img
              src="/assets/logo.jpg"
              alt="Tripura Rural Livelihood Mission"
              className="visual-logo"
            />
            <div className="visual-badge-label">
              <span className="vbl-name">Tripura Rural Livelihood Mission</span>
              <span className="vbl-sub">ত্রিপুরা গ্রামীণ জীবিকা মিশন</span>
            </div>
          </div>

          {/* Bottom: stats row */}
          <div className="visual-stats">
            {STATS.map((s) => (
              <div className="visual-stat" key={s.label}>
                <span className="vs-value">{s.value}</span>
                <span className="vs-label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Decorative hero illustration */}
          <img src={heroImage} alt="" className="visual-hero" aria-hidden="true" />
        </div>

        {/* ══ RIGHT — form panel ══════════════════════════════════ */}
        <div className="login-panel">

          {/* Logo + org label + heading */}
          <div className="logo-section">
            <img
              src="/assets/logo.jpg"
              alt="Tripura Rural Livelihood Mission"
              className="logo"
            />
            <p className="panel-tag">TRLM Operations Console</p>
            <h2 className="panel-title">Sign in to continue</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="form-section" noValidate>

            {/* Error banner */}
            {error && (
              <div className="error" role="alert">
                <span className="error-icon">!</span>
                {error}
              </div>
            )}

            {/* User ID */}
            <div className="field-shell">
              <Input
                label="Livelihood Tracker ID"
                type="text"
                value={livelihoodTrackerId}
                onChange={(e) => setLivelihoodTrackerId(e.target.value)}
                placeholder="e.g. LT-001"
              />
            </div>

            {/* Password with show/hide toggle */}
            <div className="field-shell field-shell--password">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="toggle-pw"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>

            {/* Forgot password */}
            <div className="form-meta">
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="login-btn"
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <>
                  <span className="btn-spinner" aria-hidden="true" />
                  Signing In…
                </>
              ) : (
                <>
                  Sign In
                  <span className="btn-arrow" aria-hidden="true">→</span>
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="footer">
            <p>
              Don&apos;t have an account?{' '}
              <Link to="/signup">Request access</Link>
            </p>
            <p className="footer-secure">
              🔒 Authorised personnel only · All sessions are logged
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
