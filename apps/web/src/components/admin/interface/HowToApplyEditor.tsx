'use client';

import { useEffect, useState } from 'react';
import { getHowToApply, updateHowToApply } from '../../../lib/admin-api';
import type { HowToApply, HowToApplyStep } from '../../../types/nickline';
import { adminInputSm, adminCard } from '../adminStyles';

const EMPTY_STEP: HowToApplyStep = { num: '', title: '', desc: '', iconType: 'preset', presetName: '', customIconUrl: '' };

const cardStyle = { ...adminCard, borderRadius: 12 } as const;

export default function HowToApplyEditor() {
  const [data,    setData]    = useState<HowToApply>({ color: '#D21B27', steps: [] });
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => { getHowToApply().then(setData).catch(() => {}); }, []);

  function setStep(idx: number, key: keyof HowToApplyStep, val: string) {
    setData((d) => {
      const steps = d.steps.map((s, i) => i === idx ? { ...s, [key]: val } : s);
      return { ...d, steps };
    });
  }

  function addStep() {
    setData((d) => ({
      ...d,
      steps: [...d.steps, { ...EMPTY_STEP, num: String(d.steps.length + 1).padStart(2, '0') }],
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

  return (
    <form onSubmit={handleSave} className="rounded-xl p-4" style={cardStyle}>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-gold)' }}>How to Apply</h3>

      <div className="mb-4 flex items-center gap-3">
        <label className="text-xs font-semibold" style={{ color: 'var(--color-gold)' }}>Accent Color</label>
        <input type="color" value={data.color} onChange={(e) => setData((d) => ({ ...d, color: e.target.value }))} className="h-8 w-16 cursor-pointer rounded" />
        <span className="text-xs font-mono" style={{ color: 'var(--color-text)' }}>{data.color}</span>
      </div>

      <div className="space-y-3 mb-4">
        {data.steps.map((step, idx) => (
          <div key={idx} className="rounded-lg p-3 grid grid-cols-4 gap-2 items-start" style={{ border: '1px solid var(--color-admin-border)' }}>
            <input placeholder="Num (01)" style={adminInputSm} value={step.num}   onChange={(e) => setStep(idx, 'num',   e.target.value)} />
            <input placeholder="Title"    style={adminInputSm} value={step.title} onChange={(e) => setStep(idx, 'title', e.target.value)} />
            <input placeholder="Desc"     style={adminInputSm} value={step.desc}  onChange={(e) => setStep(idx, 'desc',  e.target.value)} />
            <button type="button" onClick={() => removeStep(idx)} style={{ color: 'var(--color-primary)', fontSize: 18, alignSelf: 'center' }}>✕</button>
          </div>
        ))}
      </div>

      <button type="button" onClick={addStep} className="mb-4 text-xs underline" style={{ color: 'var(--color-gold)' }}>+ Add Step</button>

      {error   && <p className="text-xs text-red-400 mb-2">{error}</p>}
      {success && <p className="text-xs text-green-400 mb-2">Saved!</p>}

      <button type="submit" disabled={saving} className="rounded-lg px-6 py-2 text-xs font-bold uppercase tracking-widest"
        style={{ background: 'var(--color-primary)', color: '#fff', opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Saving…' : 'Save Configuration'}
      </button>
    </form>
  );
}
