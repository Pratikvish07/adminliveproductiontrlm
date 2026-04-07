import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { authService } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import {
  getDistricts,
  getBlocks,
  getRoles,
} from "../../services/masterService";
import type { SignupBlockOption } from "../../services/masterService";
import { getUserRoleId, ROLE_IDS } from "../../utils/roleAccess";
import "./Signup.css";

/* ── Types ───────────────────────────────────────────────────── */
interface District { districtId: number | string; districtName: string; }
interface Role      { roleId:     number | string; roleName:     string; }

interface FormState {
  districtId:          string;
  blockId:             string;
  roleId:              string;
  officialName:        string;
  contactNumber:       string;
  officialEmail:       string;
  designation:         string;
  livelihoodTrackerId: string;
  password:            string;
  confirmPassword:     string;
}

const INITIAL_FORM: FormState = {
  districtId:          "",
  blockId:             "",
  roleId:              "",
  officialName:        "",
  contactNumber:       "",
  officialEmail:       "",
  designation:         "",
  livelihoodTrackerId: "",
  password:            "",
  confirmPassword:     "",
};

/* ── Validation helpers ─────────────────────────────────────── */
const isEmail   = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone   = (v: string) => /^[6-9]\d{9}$/.test(v);
const isStrongPw = (v: string) =>
  v.length >= 8 && /[A-Z]/.test(v) && /[0-9]/.test(v) && /[^A-Za-z0-9]/.test(v);

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const hasLoadedMasterRef = React.useRef(false);

  const [formData, setFormData]   = useState<FormState>(INITIAL_FORM);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks]       = useState<SignupBlockOption[]>([]);
  const [roles, setRoles]         = useState<Role[]>([]);

  const [loading, setLoading]         = useState(false);
  const [masterLoading, setMasterLoading] = useState(true);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState(false);
  const [showPw, setShowPw]           = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const currentRoleId = getUserRoleId(user);
  const isDistrictStaff = currentRoleId === ROLE_IDS.DISTRICT_STAFF;
  const isBlockStaff = currentRoleId === ROLE_IDS.BLOCK_STAFF;
  const isStateAdmin = currentRoleId === ROLE_IDS.STATE_ADMIN;
  const isSelectedDistrictRole = formData.roleId === ROLE_IDS.DISTRICT_STAFF;
  const isCreateUserMode = isStateAdmin && location.pathname === "/staff/create-user";

  const visibleDistricts = React.useMemo(() => {
    if (isDistrictStaff || isBlockStaff) {
      return districts.filter((district) => String(district.districtId) === String(user?.districtId));
    }

    return districts;
  }, [districts, isBlockStaff, isDistrictStaff, user?.districtId]);

  const visibleBlocks = React.useMemo(() => {
    if (isBlockStaff) {
      return blocks.filter((block) => String(block.blockId) === String(user?.blockId));
    }

    return blocks;
  }, [blocks, isBlockStaff, user?.blockId]);

  const visibleRoles = React.useMemo(() => {
    if (isBlockStaff) {
      return roles.filter((role) => String(role.roleId) === ROLE_IDS.BLOCK_STAFF);
    }

    if (isDistrictStaff) {
      return roles.filter((role) => {
        const candidateRoleId = String(role.roleId);
        return candidateRoleId === ROLE_IDS.DISTRICT_STAFF || candidateRoleId === ROLE_IDS.BLOCK_STAFF;
      });
    }

    return roles;
  }, [isBlockStaff, isDistrictStaff, roles]);

  /* ── Load districts + roles on mount ───────────────────────── */
  useEffect(() => {
    if (hasLoadedMasterRef.current) {
      return;
    }

    hasLoadedMasterRef.current = true;
    setMasterLoading(true);
    Promise.all([getDistricts(), getRoles()])
      .then(([d, r]) => {
        setDistricts(d || []);
        setRoles(r || []);
      })
      .catch(() => setError("Failed to load master data. Please refresh."))
      .finally(() => setMasterLoading(false));
  }, []);

  /* ── Load blocks when district changes ─────────────────────── */
  useEffect(() => {
    if (!formData.districtId) {
      setBlocks([]);
      setFormData((prev) => ({ ...prev, blockId: "" }));
      return;
    }
    if (isSelectedDistrictRole) {
      setBlocks([]);
      setBlocksLoading(false);
      setFormData((prev) => ({ ...prev, blockId: "" }));
      return;
    }
    setBlocksLoading(true);
    setBlocks([]);
    setFormData((prev) => ({ ...prev, blockId: "" }));
    getBlocks(formData.districtId)
      .then((res: SignupBlockOption[]) => setBlocks(res || []))
      .catch(() => setBlocks([]))
      .finally(() => setBlocksLoading(false));
  }, [formData.districtId, isSelectedDistrictRole]);

  useEffect(() => {
    if (isDistrictStaff || isBlockStaff) {
      setFormData((prev) => ({
        ...prev,
        districtId: user?.districtId ? String(user.districtId) : prev.districtId,
      }));
    }
  }, [isBlockStaff, isDistrictStaff, user?.districtId]);

  useEffect(() => {
    if (isBlockStaff) {
      setFormData((prev) => ({
        ...prev,
        blockId: user?.blockId ? String(user.blockId) : prev.blockId,
        roleId: prev.roleId || ROLE_IDS.BLOCK_STAFF,
      }));
    }
  }, [isBlockStaff, user?.blockId]);

  /* ── Field change ───────────────────────────────────────────── */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setError("");
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ── Client-side validation ─────────────────────────────────── */
  const validate = (): string => {
    if (!formData.districtId)          return "Please select a District.";
    if (!formData.roleId)              return "Please select a Role.";
    if (!isSelectedDistrictRole && !formData.blockId) return "Please select a Block.";
    if (!formData.officialName.trim()) return "Official name is required.";
    if (!isPhone(formData.contactNumber))
                                       return "Enter a valid 10-digit mobile number.";
    if (!isEmail(formData.officialEmail))
                                       return "Enter a valid email address.";
    if (!formData.designation.trim())  return "Designation is required.";
    if (!formData.livelihoodTrackerId.trim())
                                       return "Livelihood Tracker ID is required.";
    if (!isStrongPw(formData.password))
      return "Password must be 8+ chars with uppercase, number & special character.";
    if (formData.password !== formData.confirmPassword)
                                       return "Passwords do not match.";
    return "";
  };

  /* ── Submit ─────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    /* ── Resolve names from IDs ─────────────────────────────────
       API expects:  districtName (string), blockName (string), role (string)
       NOT numeric IDs.
    ─────────────────────────────────────────────────────────── */
    const selectedDistrict = visibleDistricts.find(
      (d) => String(d.districtId) === String(formData.districtId)
    );
    const selectedBlock = isSelectedDistrictRole
      ? null
      : visibleBlocks.find((b) => String(b.blockId) === String(formData.blockId));
    const selectedRole = visibleRoles.find(
      (r) => String(r.roleId) === String(formData.roleId)
    );

    if (!selectedDistrict || !selectedRole || (!isSelectedDistrictRole && !selectedBlock)) {
      setError("Could not resolve selection. Please re-select and try again.");
      return;
    }

    /* ── Build payload matching API contract exactly ──────────── */
    const payload = {
      districtName:        selectedDistrict.districtId.toString().trim(),
      blockName:           selectedBlock ? selectedBlock.blockId.toString().trim() : "",
      officialName:        formData.officialName.trim(),
      contactNumber:       formData.contactNumber.trim(),
      officialEmail:       formData.officialEmail.trim().toLowerCase(),
      designation:         formData.designation.trim(),
      livelihoodTrackerId: formData.livelihoodTrackerId.trim(),
      password:            formData.password,
      role:                selectedRole.roleId.toString(),
    };

    console.info("[Signup] Payload →", payload);

    setLoading(true);
    try {
      await authService.signup(payload);
      setSuccess(true);
      if (isCreateUserMode) {
        setFormData(INITIAL_FORM);
        setBlocks([]);
        window.setTimeout(() => setSuccess(false), 2000);
      } else {
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err: any) {
      console.error("[Signup] Error →", err);
      const status = err?.response?.status;
      const msg    = err?.response?.data?.message;

      setError(
        msg                           ? msg :
        status === 409                ? "This Tracker ID or email is already registered." :
        status === 422                ? "Invalid data submitted. Please check all fields." :
        status >= 500                 ? "Server error. Please try again in a moment." :
        !err.response && err.request  ? "No response from server. Check your connection." :
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ─────────────────────────────────────────── */
  if (success) {
    return (
      <div className="signup-page">
        <div className="signup-success">
          <div className="success-icon">✓</div>
          <h3>{isCreateUserMode ? "User Created!" : "Account Created!"}</h3>
          <p>{isCreateUserMode ? "The new user has been created successfully." : "Redirecting you to login…"}</p>
        </div>
      </div>
    );
  }

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="signup-page">
      <div className="signup-card">

        {/* ── Header ── */}
        <div className="signup-header">
          <img src="/assets/logo.jpg" alt="TRLM Logo" className="signup-logo" />
          <div>
            <p className="signup-org-tag">TRLM Operations Console</p>
            <h2 className="signup-title">{isCreateUserMode ? "Create user account" : "Create your account"}</h2>
          </div>
        </div>

        <div className="signup-divider" />

        {/* ── Error banner ── */}
        {error && (
          <div className="signup-error" role="alert">
            <span className="signup-error-icon" aria-hidden="true">!</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="signup-form" noValidate>

          {masterLoading ? (
            <div className="signup-master-loading">
              <span className="signup-spinner" />
              Loading form data…
            </div>
          ) : (
            <>
              {/* ── Section: Location & Role ── */}
              <div className="signup-section-label">Location &amp; Role</div>

              <div className="signup-row">
                {/* District */}
                <div className="signup-field">
                  <label className="signup-label" htmlFor="districtId">District</label>
                  <select
                    id="districtId"
                    name="districtId"
                    className="signup-select"
                    value={formData.districtId}
                    onChange={handleChange}
                    disabled={isDistrictStaff || isBlockStaff}
                  >
                    <option value="">{isDistrictStaff || isBlockStaff ? "Assigned District" : "Select District"}</option>
                    {visibleDistricts.map((d) => (
                      <option key={d.districtId} value={d.districtId}>
                        {d.districtName}
                      </option>
                    ))}
                  </select>
                </div>

                {!isSelectedDistrictRole && (
                  <div className="signup-field">
                    <label className="signup-label" htmlFor="blockId">Block</label>
                    <div className="signup-select-wrap">
                      <select
                        id="blockId"
                        name="blockId"
                        className="signup-select"
                        value={formData.blockId}
                        onChange={handleChange}
                        disabled={!formData.districtId || blocksLoading || isBlockStaff}
                      >
                        <option value="">
                          {blocksLoading ? "Loading…" : isBlockStaff ? "Assigned Block" : "Select Block"}
                        </option>
                        {visibleBlocks.map((b) => (
                          <option key={b.blockId} value={b.blockId}>
                            {b.blockName}
                          </option>
                        ))}
                      </select>
                      {blocksLoading && (
                        <span className="signup-spinner signup-spinner--inline" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                )}

                {/* Role */}
                <div className="signup-field">
                  <label className="signup-label" htmlFor="roleId">Role</label>
                  <select
                    id="roleId"
                    name="roleId"
                    className="signup-select"
                    value={formData.roleId}
                    onChange={handleChange}
                    disabled={isBlockStaff}
                  >
                    <option value="">Select Role</option>
                    {visibleRoles.map((r) => (
                      <option key={r.roleId} value={r.roleId}>
                        {r.roleName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ── Section: Personal Details ── */}
              <div className="signup-section-label">Personal Details</div>

              <div className="signup-row signup-row--2">
                <div className="signup-field">
                  <Input
                    name="officialName"
                    label="Full Name"
                    value={formData.officialName}
                    onChange={handleChange}
                    placeholder="As per official records"
                  />
                </div>
                <div className="signup-field">
                  <Input
                    name="designation"
                    label="Designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="e.g. Block Coordinator"
                  />
                </div>
              </div>

              <div className="signup-row signup-row--2">
                <div className="signup-field">
                  <Input
                    name="contactNumber"
                    label="Mobile Number"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    placeholder="10-digit mobile"
                  />
                </div>
                <div className="signup-field">
                  <Input
                    name="officialEmail"
                    label="Official Email"
                    value={formData.officialEmail}
                    onChange={handleChange}
                    placeholder="you@gov.in"
                  />
                </div>
              </div>

              {/* ── Section: Account Credentials ── */}
              <div className="signup-section-label">Account Credentials</div>

              <div className="signup-row signup-row--2">
                <div className="signup-field">
                  <Input
                    name="livelihoodTrackerId"
                    label="Livelihood Tracker ID"
                    value={formData.livelihoodTrackerId}
                    onChange={handleChange}
                    placeholder="e.g. LT-001"
                  />
                </div>
                <div className="signup-field signup-field--empty" />
              </div>

              <div className="signup-row signup-row--2">
                {/* Password */}
                <div className="signup-field signup-field--pw">
                  <Input
                    name="password"
                    type={showPw ? "text" : "password"}
                    label="Password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 8 chars, A-Z, 0-9, symbol"
                  />
                  <button
                    type="button"
                    className="signup-toggle-pw"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPw ? "🙈" : "👁"}
                  </button>
                  {formData.password && (
                    <PasswordStrength password={formData.password} />
                  )}
                </div>

                {/* Confirm password */}
                <div className="signup-field signup-field--pw">
                  <Input
                    name="confirmPassword"
                    type={showConfirmPw ? "text" : "password"}
                    label="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    className="signup-toggle-pw"
                    onClick={() => setShowConfirmPw((v) => !v)}
                    aria-label={showConfirmPw ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showConfirmPw ? "🙈" : "👁"}
                  </button>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <span className="signup-pw-mismatch">Passwords do not match</span>
                  )}
                </div>
              </div>

              {/* ── Submit ── */}
              <Button
                type="submit"
                className="signup-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="signup-spinner" aria-hidden="true" />
                    Creating Account…
                  </>
                ) : (
                  <>
                    {isCreateUserMode ? "Create User" : "Create Account"}
                    <span className="signup-btn-arrow" aria-hidden="true">→</span>
                  </>
                )}
              </Button>
            </>
          )}
        </form>

        {/* ── Footer ── */}
        <div className="signup-footer">
          {!isCreateUserMode && (
            <p>
              Already have an account?{" "}
              <Link to="/login">Sign in</Link>
            </p>
          )}
          <p className="signup-footer-note">
            🔒 Your data is protected under government security standards
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── Password strength meter sub-component ──────────────────── */
const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const label = ["Weak", "Fair", "Good", "Strong"][score - 1] || "Weak";
  const cls   = ["weak", "fair", "good", "strong"][score - 1] || "weak";

  return (
    <div className="pw-strength">
      <div className="pw-strength-bars">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`pw-bar ${i < score ? `pw-bar--${cls}` : ""}`}
          />
        ))}
      </div>
      <span className={`pw-strength-label pw-label--${cls}`}>{label}</span>
    </div>
  );
};

export default Signup;
