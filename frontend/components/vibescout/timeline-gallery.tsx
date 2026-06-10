'use client';

import Image from 'next/image';
import TimelineMilestones from './timeline-milestone';

const images = [
  { src: '/sunrise-in-mountains.jpg', alt: 'Sunrise in mountains' },
  { src: '/highrise-buildings.jpg', alt: 'Highrise buildings' },
  { src: '/sunset-in-mountains.jpg', alt: 'Sunset in mountains' },
  { src: '/city-moonlight.jpg', alt: 'City moonlight' },
];

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D8B56A" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);
const SunMidIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D8B56A" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="6" fill="rgba(216,181,106,0.15)" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);
const SunsetIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D8B56A" strokeWidth="1.5" strokeLinecap="round">
    <path d="M17 18a5 5 0 00-10 0" />
    <line x1="12" y1="2" x2="12" y2="9" />
    <line x1="4.22" y1="10.22" x2="5.64" y2="11.64" />
    <line x1="1" y1="18" x2="3" y2="18" />
    <line x1="21" y1="18" x2="23" y2="18" />
    <line x1="18.36" y1="11.64" x2="19.78" y2="10.22" />
  </svg>
);
const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D8B56A" strokeWidth="1.5" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

const milestones = [
  {
    label: 'MORNING (5 AM)',
    time: '5:00 AM',
    icon: <SunIcon />,
    temp: 'TEMP: 28°C',
    meta1Label: 'HUMIDITY',
    meta1Value: '66%',
    meta2Label: 'NOISE',
    meta2Value: 'LOW',
    chartPoints: [3, 5, 4, 6, 5, 7, 6, 8, 7, 9],
  },
  {
    label: 'MIDDAY (12 PM)',
    time: '12:00 PM',
    icon: <SunMidIcon />,
    temp: 'TEMP: 26°C',
    meta1Label: 'TDOR',
    meta1Value: '26°C',
    meta2Label: 'NOISE',
    meta2Value: 'MODERATE',
    chartPoints: [6, 8, 10, 9, 11, 10, 12, 11, 10, 9],
  },
  {
    label: 'EVENING (6 PM)',
    time: '6:00 PM',
    icon: <SunsetIcon />,
    temp: 'TEMP: 28°C',
    meta1Label: 'EQUIP',
    meta1Value: 'PEAK',
    meta2Label: 'TRAFFIC',
    meta2Value: 'PEAK',
    chartPoints: [9, 10, 12, 11, 13, 12, 11, 10, 9, 8],
  },
  {
    label: 'NIGHT (12 AM)',
    time: '12:00 AM',
    icon: <MoonIcon />,
    temp: 'EQUIP: 07°G',
    meta1Label: 'NOISE',
    meta1Value: 'LOW',
    meta2Label: 'QUIET',
    meta2Value: 'OPTIMAL',
    chartPoints: [8, 6, 5, 4, 3, 4, 3, 2, 3, 2],
  },
];

export default function TimelineGallery() {
  return (
    <div style={{ borderRadius: '0 0 28px 28px', overflow: 'hidden' }}>
      {/* Image row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', height: '340px' }}>
        {images.map((img, i) => (
          <div key={i} style={{ position: 'relative', height: '340px', overflow: 'hidden' }}>
            <Image
              src={img.src}
              alt={img.alt}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 25vw"
            />
          </div>
        ))}
      </div>

      {/* Timeline milestones */}
      <TimelineMilestones milestones={milestones} />
    </div>
  );
}
