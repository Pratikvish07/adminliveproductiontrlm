import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import heroImage from '../../assets/hero.png';
import { isLikelyScopeId } from '../../utils/helpers';
import { normalizeRoleId } from '../../utils/roleAccess';
import './Login.css';

const getFirstValue = (record: Record<string, unknown> | undefined, keys: string[]): string => {
  if (!record) {
    return '';
  }

  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value);
    }
  }

  return '';
};

const resolveUserId = (response: any, livelihoodTrackerId: string): string => {
  const candidate = response?.user?.staffId
    ?? response?.user?.id
    ?? response?.staffId
    ?? response?.id;

  if (candidate !== undefined && candidate !== null && String(candidate).trim()) {
    return String(candidate);
  }

  return livelihoodTrackerId;
};

/* ── Stats shown on the left panel ── */
const STATS = [
  { value: '8+',   label: 'Districts' },
  { value: '12k+', label: 'CRP Records' },
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

      const resolvedRole = normalizeRoleId(response.role ?? response.user?.role ?? response.roleId ?? response.user?.roleId);
      const roleId = resolvedRole;
      const role = resolvedRole;
      const resolvedUserId = resolveUserId(response, livelihoodTrackerId);
      const responseUser = response?.user && typeof response.user === 'object'
        ? response.user as Record<string, unknown>
        : undefined;
      const responseRoot = response && typeof response === 'object'
        ? response as Record<string, unknown>
        : undefined;
      const resolvedDistrictId = getFirstValue(responseUser, ['districtId', 'DistrictId', 'district', 'District'])
        || getFirstValue(responseRoot, ['districtId', 'DistrictId', 'district', 'District']);
      const resolvedBlockId = getFirstValue(responseUser, ['blockId', 'BlockId', 'block', 'Block'])
        || getFirstValue(responseRoot, ['blockId', 'BlockId', 'block', 'Block']);
      const resolvedDistrictName = getFirstValue(responseUser, ['districtName', 'DistrictName'])
        || getFirstValue(responseRoot, ['districtName', 'DistrictName']);
      const resolvedBlockName = getFirstValue(responseUser, ['blockName', 'BlockName'])
        || getFirstValue(responseRoot, ['blockName', 'BlockName']);
      const normalizedDistrictId = isLikelyScopeId(resolvedDistrictId) ? resolvedDistrictId : '';
      const normalizedBlockId = isLikelyScopeId(resolvedBlockId) ? resolvedBlockId : '';
      const normalizedDistrictName =
        resolvedDistrictName || (!isLikelyScopeId(resolvedDistrictId) ? resolvedDistrictId : '');
      const normalizedBlockName =
        resolvedBlockName || (!isLikelyScopeId(resolvedBlockId) ? resolvedBlockId : '');
      const user = response.user
        ? {
            id:    resolvedUserId,
            staffId: response.user.staffId ? String(response.user.staffId) : response.staffId ? String(response.staffId) : resolvedUserId,
            livelihoodTrackerId: response.user.livelihoodTrackerId ?? response.livelihoodTrackerId ?? livelihoodTrackerId,
            email: response.user.email ?? '',
            name:  response.user.name  ?? livelihoodTrackerId,
            role,
            roleId,
            districtId: normalizedDistrictId,
            blockId: normalizedBlockId,
            districtName: normalizedDistrictName,
            blockName: normalizedBlockName,
          }
        : {
            id: resolvedUserId,
            staffId: response.staffId ? String(response.staffId) : response.id ? String(response.id) : '',
            livelihoodTrackerId,
            email: '',
            name: livelihoodTrackerId,
            role,
            roleId,
            districtId: normalizedDistrictId,
            blockId: normalizedBlockId,
            districtName: normalizedDistrictName,
            blockName: normalizedBlockName,
          };

      localStorage.setItem('token', response.token);
      if (roleId) localStorage.setItem('role', roleId);

      login(user);
      navigate('/dashboard');
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      const message = err?.response?.data?.message;

      setError(
        detail === 'Invalid credentials' ? 'Invalid credentials. Please check your User ID and password.' :
        status === 401 ? 'Invalid credentials. Please check your User ID and password.' :
        status >= 500 ? detail || 'Server error during sign in. Please try again in a moment.' :
        detail || message || 'Invalid credentials. Please check your User ID and password.'
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
              <em>CRP</em> &amp; payment workflows
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
