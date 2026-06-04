'use client';

import HeroSlidesSection from '../../../components/admin/interface/HeroSlidesSection';
import HowToApplyEditor from '../../../components/admin/interface/HowToApplyEditor';

export default function InterfacePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold uppercase tracking-widest" style={{ color: 'var(--admin-text)' }}>Interface Billboard</h1>
      <HeroSlidesSection />
      <HowToApplyEditor />
    </div>
  );
}
