'use client';

import HeaderSlidesSection from '../../../components/admin/homepage/HeaderSlidesSection';

export default function HomepageAdminPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>
          Homepage
        </h1>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Customize hero slides
        </p>
      </div>

      <HeaderSlidesSection />
    </div>
  );
}
