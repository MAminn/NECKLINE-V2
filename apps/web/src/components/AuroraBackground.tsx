import React from 'react';

interface AuroraBackgroundProps {
  variant?: 'hero' | 'subtle';
}

const AuroraBackground: React.FC<AuroraBackgroundProps> = ({ variant = 'subtle' }) => {
  const opacity1 = variant === 'hero' ? '0.06' : '0.03';
  const opacity2 = variant === 'hero' ? '0.04' : '0.02';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div
        className="absolute animate-aurora-1"
        style={{
          width: '60vw',
          height: '60vh',
          borderRadius: '50%',
          filter: 'blur(120px)',
          background: `radial-gradient(circle, rgba(220,38,38,${opacity1}) 0%, transparent 70%)`,
          top: '-10%',
          left: '-10%',
          willChange: 'transform',
        }}
      />
      <div
        className="absolute animate-aurora-2"
        style={{
          width: '60vw',
          height: '60vh',
          borderRadius: '50%',
          filter: 'blur(120px)',
          background: `radial-gradient(circle, rgba(120,20,20,${opacity2}) 0%, transparent 70%)`,
          bottom: '-10%',
          right: '-10%',
          animationDelay: '5s',
          willChange: 'transform',
        }}
      />
    </div>
  );
};

export default React.memo(AuroraBackground);
