'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, GripVertical, Fingerprint, Crosshair, Flame, Wind, RefreshCw, Sparkles, Heart, Star, Target, Droplets, Moon, Sun } from 'lucide-react';
import type { HowToApply, HowToApplyStep } from '../../../types/nickline';
import { getHowToApply, updateHowToApply } from '../../../lib/admin-api';
import AdminSelect from '../AdminSelect';
import { adminInput, adminLabel } from '../adminStyles';

const ICON_OPTIONS = [
  { value: 'Fingerprint', label: 'Fingerprint' },
  { value: 'Crosshair', label: 'Crosshair' },
  { value: 'Flame', label: 'Flame' },
  { value: 'Wind', label: 'Wind' },
  { value: 'RefreshCw', label: 'Refresh' },
  { value: 'Sparkles', label: 'Sparkles' },
  { value: 'Heart', label: 'Heart' },
  { value: 'Star', label: 'Star' },
  { value: 'Target', label: 'Target' },
  { value: 'Droplets', label: 'Droplets' },
  { value: 'Moon', label: 'Moon' },
  { value: 'Sun', label: 'Sun' },
];

const DEFAULT_STEP: HowToApplyStep = {
  num: '01',
  title: '',
  desc: '',
  iconType: 'preset',
  presetName: 'Fingerprint',
};

export default function HowToApplySection() {
  const [config, setConfig] = useState<HowToApply>({ color: '#D21B27', steps: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    getHowToApply()
      .then((data) => setConfig(data.steps?.length ? data : { color: '#D21B27', steps: [] }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function updateStep(index: number, patch: Partial<HowToApplyStep>) {
    setConfig((c) => ({
      ...c,
      steps: c.steps.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  }

  function addStep() {
    setConfig((c) => ({
      ...c,
      steps: [...c.steps, { ...DEFAULT_STEP, num: String(c.steps.length + 1).padStart(2, '0') }],
    }));
  }

  function removeStep(index: number) {
    setConfig((c) => ({
      ...c,
      steps: c.steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, num: String(i + 1).padStart(2, '0') })),
    }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await updateHowToApply(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save How to Apply:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--color-admin-surface)', border: '1px solid var(--color-admin-border)' }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-gold)' }}>
            How to Apply
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            Edit the ritual section steps and accent color
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={addStep}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-widest"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text)', border: '1px solid var(--color-admin-border)' }}
          >
            <Plus size={14} /> Add Step
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-opacity"
            style={{ background: 'var(--color-primary)', color: '#fff', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {loading && <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Loading…</p>}

      {!loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label style={adminLabel} className="mb-0">Accent Color</label>
            <input
              type="color"
              value={config.color}
              onChange={(e) => setConfig((c) => ({ ...c, color: e.target.value }))}
              className="h-8 w-14 rounded cursor-pointer border-0 bg-transparent"
            />
            <input
              type="text"
              value={config.color}
              onChange={(e) => setConfig((c) => ({ ...c, color: e.target.value }))}
              className="w-28 rounded-lg px-2 py-1.5 text-xs font-mono"
              style={{ background: 'var(--color-surface-input)', border: '1px solid var(--color-admin-border)', color: 'var(--color-text)' }}
            />
          </div>

          {config.steps.length === 0 && (
            <div
              className="rounded-xl p-6 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--color-admin-border)' }}
            >
              <p className="text-sm" style={{ color: 'var(--color-text)' }}>No steps yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>Add steps to show the ritual on the homepage.</p>
            </div>
          )}

          <div className="space-y-3">
            {config.steps.map((step, index) => (
              <div
                key={index}
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-admin-border)' }}
              >
                <div className="flex items-start gap-3">
                  <GripVertical size={16} style={{ color: 'var(--color-text-tertiary)' }} className="mt-2" />
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-1">
                      <label style={adminLabel}>#</label>
                      <input
                        style={adminInput}
                        value={step.num}
                        onChange={(e) => updateStep(index, { num: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label style={adminLabel}>Title</label>
                      <input
                        style={adminInput}
                        value={step.title}
                        onChange={(e) => updateStep(index, { title: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-5">
                      <label style={adminLabel}>Description</label>
                      <input
                        style={adminInput}
                        value={step.desc}
                        onChange={(e) => updateStep(index, { desc: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label style={adminLabel}>Icon</label>
                      <AdminSelect
                        value={step.presetName || 'Fingerprint'}
                        onChange={(value) => updateStep(index, { presetName: value })}
                        options={ICON_OPTIONS}
                        size="sm"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeStep(index)}
                    className="rounded p-1.5 transition-colors mt-1"
                    style={{ color: 'var(--color-primary)' }}
                    aria-label="Remove step"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
