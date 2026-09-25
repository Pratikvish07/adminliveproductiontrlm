import React from 'react';
import PageShell from '../../components/common/PageShell';
import { useAuth } from '../../context/AuthContext';
import { crpService, type CreateCRPPayload, type SHGMemberRecord } from '../../services/crpService';
import { getGramPanchayats, getVillages } from '../../services/masterService';
import type { GramPanchayat, Village } from '../../types/master.types';
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

  const [gramPanchayats, setGramPanchayats] = React.useState<GramPanchayat[]>([]);
  const [selectedGpId, setSelectedGpId] = React.useState('');
  const [villages, setVillages] = React.useState<Village[]>([]);
  const [villageLoading, setVillageLoading] = React.useState(false);
  const [shgMembers, setShgMembers] = React.useState<SHGMemberRecord[]>([]);
  const [shgMembersLoading, setShgMembersLoading] = React.useState(false);

  React.useEffect(() => {
    if (!blockId) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      blockId: String(blockId),
    }));
  }, [blockId]);

  // Gram Panchayats are scoped to this CRP's block.
  React.useEffect(() => {
    if (!blockId) {
      setGramPanchayats([]);
      return;
    }
    let cancelled = false;
    getGramPanchayats(blockId)
      .then((gps) => { if (!cancelled) setGramPanchayats(gps); })
      .catch(() => { if (!cancelled) setGramPanchayats([]); });
    return () => { cancelled = true; };
  }, [blockId]);

  // Villages are scoped to the selected Gram Panchayat.
  React.useEffect(() => {
    if (!selectedGpId) {
      setVillages([]);
      return;
    }
    let cancelled = false;
    setVillageLoading(true);
    getVillages(selectedGpId)
      .then((v) => { if (!cancelled) setVillages(v); })
      .catch(() => { if (!cancelled) setVillages([]); })
      .finally(() => { if (!cancelled) setVillageLoading(false); });
    return () => { cancelled = true; };
  }, [selectedGpId]);

  // Once a village is picked, show the SHG members registered there.
  React.useEffect(() => {
    if (!form.villageId) {
      setShgMembers([]);
      return;
    }
    let cancelled = false;
    setShgMembersLoading(true);
    crpService.getSHGMembersByVillage(form.villageId)
      .then((members) => { if (!cancelled) setShgMembers(members); })
      .catch(() => { if (!cancelled) setShgMembers([]); })
      .finally(() => { if (!cancelled) setShgMembersLoading(false); });
    return () => { cancelled = true; };
  }, [form.villageId]);

  const handleChange = React.useCallback((field: keyof CRPCreateForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleGpChange = React.useCallback((gpId: string) => {
    setSelectedGpId(gpId);
    setForm((prev) => ({ ...prev, villageId: '' }));
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
              <span>Block ID</span>
              <input type="number" value={form.blockId} onChange={(e) => handleChange('blockId', e.target.value)} required disabled />
            </label>
            <label className="crp-create-field">
              <span>Gram Panchayat</span>
              <select value={selectedGpId} onChange={(e) => handleGpChange(e.target.value)} required disabled={!blockId}>
                <option value="">{blockId ? 'Select gram panchayat' : 'Loading block scope...'}</option>
                {gramPanchayats.map((gp) => (
                  <option key={gp.GPId} value={gp.GPId}>{gp.GPName}</option>
                ))}
              </select>
            </label>
            <label className="crp-create-field">
              <span>Village</span>
              <select
                value={form.villageId}
                onChange={(e) => handleChange('villageId', e.target.value)}
                required
                disabled={!selectedGpId || villageLoading}
              >
                <option value="">
                  {!selectedGpId ? 'Select gram panchayat first' : villageLoading ? 'Loading villages...' : 'Select village'}
                </option>
                {villages.map((village) => (
                  <option key={village.VillageId} value={village.VillageId}>{village.VillageName}</option>
                ))}
              </select>
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
              <span>SHG ID (optional)</span>
              <input type="number" value={form.shgId} onChange={(e) => handleChange('shgId', e.target.value)} />
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

          {form.villageId && (
            <div className="crp-create-shg-preview">
              <h3>SHG Members in this village</h3>
              {shgMembersLoading ? (
                <p>Loading SHG members...</p>
              ) : shgMembers.length === 0 ? (
                <p>No SHG members found for this village.</p>
              ) : (
                <table className="crp-create-shg-table">
                  <thead>
                    <tr>
                      <th>Member Name</th>
                      <th>SHG Code</th>
                      <th>SHG Name</th>
                      <th>Mobile No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shgMembers.map((member) => (
                      <tr key={member.MemberId}>
                        <td>{member.MemberName}</td>
                        <td>{member.SHGCode}</td>
                        <td>{member.SHGName}</td>
                        <td>{member.MobileNo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

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
