'use client';

import { useEffect, useState } from 'react';
import { getHowToApply, updateHowToApply } from '../../../lib/admin-api';
import type { HowToApply, HowToApplyStep } from '../../../types/nickline';

export default function HowToApplyEditor() {
  const [data, setData] = useState<HowToApply>({ color: '#D21B27', steps: [] });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getHowToApply().then(setData).catch(() => {});
  }, []);

  function setStep(idx: number, key: keyof HowToApplyStep, val: string) {
    setData((d) => {
      const steps = [...d.steps];
      steps[idx] = { ...steps[idx], [key]: val };
      return { ...d, steps };
    });
  }

  function addStep() {
    setData((d) => ({
      ...d,
      steps: [...d.steps, { num: String(d.steps.length + 1).padStart(2, '0'), title: '', desc: '', iconType: 'preset', presetName: '', customIconUrl: '' }],
    }));
  }

  function removeStep(idx: number) {
    setData((d) => ({ ...d, steps: d.steps.filter((_, i) => i !== idx) }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await updateHowToApply(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = { background: '#1a0a0c', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 8, padding: '6px 10px', fontSize: 12, width: '100%' } as React.CSSProperties;

  return (
    <form onSubmit={handleSave} className="rounded-xl p-4" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--admin-gold)' }}>How to Apply</h3>

      <div className="mb-4 flex items-center gap-3">
        <label className="text-xs font-semibold" style={{ color: 'var(--admin-gold)' }}>Accent Color</label>
        <input type="color" value={data.color} onChange={(e) => setData((d) => ({ ...d, color: e.target.value }))} className="h-8 w-16 cursor-pointer rounded" />
        <span className="text-xs font-mono" style={{ color: 'var(--admin-text)' }}>{data.color}</span>
      </div>

      <div className="space-y-3 mb-4">
        {data.steps.map((step, idx) => (
          <div key={idx} className="rounded-lg p-3 grid grid-cols-4 gap-2 items-start" style={{ border: '1px solid var(--admin-border)' }}>
            <input placeholder="Num (01)" style={{ ...inputStyle }} value={step.num} onChange={(e) => setStep(idx, 'num', e.target.value)} />
            <input placeholder="Title" style={{ ...inputStyle }} value={step.title} onChange={(e) => setStep(idx, 'title', e.target.value)} />
            <input placeholder="Description" style={{ ...inputStyle, gridColumn: 'span 1' }} value={step.desc} onChange={(e) => setStep(idx, 'desc', e.target.value)} />
            <button type="button" onClick={() => removeStep(idx)} style={{ color: 'var(--admin-accent)', fontSize: 18, alignSelf: 'center' }}>✕</button>
          </div>
        ))}
      </div>

      <button type="button" onClick={addStep} className="mb-4 text-xs underline" style={{ color: 'var(--admin-gold)' }}>+ Add Step</button>

      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
      {success && <p className="text-xs text-green-400 mb-2">Saved!</p>}

      <button type="submit" disabled={saving} className="rounded-lg px-6 py-2 text-xs font-bold uppercase tracking-widest" style={{ background: 'var(--admin-accent)', color: '#fff', opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Saving…' : 'Save Configuration'}
      </button>
    </form>
  );
}
