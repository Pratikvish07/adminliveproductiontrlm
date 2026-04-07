import React from 'react';
import PageShell from '../../components/common/PageShell';
import { useAuth } from '../../context/AuthContext';
import { crpService, type CreateCRPPayload } from '../../services/crpService';
import { useResolvedScope } from '../../utils/useResolvedScope';
import './CRPCreate.css';

type CRPCreateForm = {
  fullName: string;
  aadhaarNo: string;
  lokOSId: string;
  villageId: string;
  blockId: string;
  contactNo: string;
  emailId: string;
  password: string;
  crpTypeId: string;
  shgId: string;
  picturePath: string;
  latitude: string;
  longitude: string;
};

const INITIAL_FORM: CRPCreateForm = {
  fullName: '',
  aadhaarNo: '',
  lokOSId: '',
  villageId: '',
  blockId: '',
  contactNo: '',
  emailId: '',
  password: '',
  crpTypeId: '',
  shgId: '',
  picturePath: '',
  latitude: '',
  longitude: '',
};

const toNumber = (value: string): number => Number(value || 0);

const CRPCreate: React.FC = () => {
  const { user } = useAuth();
  const { blockId } = useResolvedScope(user);
  const [form, setForm] = React.useState<CRPCreateForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  React.useEffect(() => {
    if (!blockId) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      blockId: String(blockId),
    }));
  }, [blockId]);

  const handleChange = React.useCallback((field: keyof CRPCreateForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSubmit = React.useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      setSubmitting(true);
      const payload: CreateCRPPayload = {
        fullName: form.fullName.trim(),
        aadhaarNo: form.aadhaarNo.trim(),
        lokOSId: form.lokOSId.trim(),
        villageId: toNumber(form.villageId),
        blockId: toNumber(form.blockId),
        contactNo: form.contactNo.trim(),
        emailId: form.emailId.trim(),
        password: form.password,
        crpTypeId: toNumber(form.crpTypeId),
        shgId: toNumber(form.shgId),
        picturePath: form.picturePath.trim(),
        latitude: Number(form.latitude || 0),
        longitude: Number(form.longitude || 0),
      };

      await crpService.createCRP(payload);
      setSuccess('CRP created successfully.');
      setForm((prev) => ({
        ...INITIAL_FORM,
        blockId: prev.blockId,
      }));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Unable to create CRP right now.');
    } finally {
      setSubmitting(false);
    }
  }, [form]);

  return (
    <PageShell
      kicker="CRP Management"
      title="Create CRP"
      subtitle="Block staff can register a new CRP here using the live CRP signup API."
    >
      <div className="crp-create-card">
        <form className="crp-create-form" onSubmit={handleSubmit}>
          <div className="crp-create-grid">
            <label className="crp-create-field">
              <span>Full Name</span>
              <input value={form.fullName} onChange={(e) => handleChange('fullName', e.target.value)} required />
            </label>
            <label className="crp-create-field">
              <span>Aadhaar No</span>
              <input value={form.aadhaarNo} onChange={(e) => handleChange('aadhaarNo', e.target.value)} required />
            </label>
            <label className="crp-create-field">
              <span>LokOS ID</span>
              <input value={form.lokOSId} onChange={(e) => handleChange('lokOSId', e.target.value)} required />
            </label>
            <label className="crp-create-field">
              <span>Village ID</span>
              <input type="number" value={form.villageId} onChange={(e) => handleChange('villageId', e.target.value)} required />
            </label>
            <label className="crp-create-field">
              <span>Block ID</span>
              <input type="number" value={form.blockId} onChange={(e) => handleChange('blockId', e.target.value)} required disabled />
            </label>
            <label className="crp-create-field">
              <span>Contact No</span>
              <input value={form.contactNo} onChange={(e) => handleChange('contactNo', e.target.value)} required />
            </label>
            <label className="crp-create-field">
              <span>Email ID</span>
              <input type="email" value={form.emailId} onChange={(e) => handleChange('emailId', e.target.value)} required />
            </label>
            <label className="crp-create-field">
              <span>Password</span>
              <input type="password" value={form.password} onChange={(e) => handleChange('password', e.target.value)} required />
            </label>
            <label className="crp-create-field">
              <span>CRP Type ID</span>
              <input type="number" value={form.crpTypeId} onChange={(e) => handleChange('crpTypeId', e.target.value)} required />
            </label>
            <label className="crp-create-field">
              <span>SHG ID</span>
              <input type="number" value={form.shgId} onChange={(e) => handleChange('shgId', e.target.value)} required />
            </label>
            <label className="crp-create-field crp-create-field--wide">
              <span>Picture Path</span>
              <input value={form.picturePath} onChange={(e) => handleChange('picturePath', e.target.value)} />
            </label>
            <label className="crp-create-field">
              <span>Latitude</span>
              <input type="number" step="any" value={form.latitude} onChange={(e) => handleChange('latitude', e.target.value)} />
            </label>
            <label className="crp-create-field">
              <span>Longitude</span>
              <input type="number" step="any" value={form.longitude} onChange={(e) => handleChange('longitude', e.target.value)} />
            </label>
          </div>

          {error && <div className="crp-create-message crp-create-message--error">{error}</div>}
          {success && <div className="crp-create-message crp-create-message--success">{success}</div>}

          <div className="crp-create-actions">
            <button type="submit" className="gov-btn gov-btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create CRP'}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
};

export default CRPCreate;
