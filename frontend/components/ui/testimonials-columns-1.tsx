'use client';
import React from 'react';
import { motion } from 'framer-motion';

export type Testimonial = {
  text: string;
  image: string;
  name: string;
  role: string;
  signal?: string;
};

export const TestimonialsColumn = (props: {
  className?: string;
  style?: React.CSSProperties;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className} style={{ overflow: 'hidden', ...props.style }}>
      <motion.div
        animate={{ y: '-50%' }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop',
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '16px' }}
      >
        {[0, 1].map((key) => (
          <React.Fragment key={key}>
            {props.testimonials.map(({ text, image, name, role, signal }, i) => (
              <div
                key={i}
                style={{
                  background:   '#0A0E1A',
                  borderTop:    '1px solid rgba(255,255,255,0.08)',
                  borderRight:  '1px solid rgba(255,255,255,0.05)',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  borderLeft:   '2px solid rgba(3,211,189,0.28)',
                  borderRadius: '12px',
                  padding:      '22px 24px 20px',
                  width:        '300px',
                  boxShadow:    '0 0 0 1px rgba(3,211,189,0.03), 0 20px 60px rgba(0,0,0,0.55)',
                  position:     'relative',
                  overflow:     'hidden',
                  flexShrink:   0,
                }}
              >
                {/* Ambient teal glow top-left */}
                <div
                  aria-hidden
                  style={{
                    position:     'absolute',
                    top:          '-20px',
                    left:         '-20px',
                    width:        '80px',
                    height:       '80px',
                    borderRadius: '50%',
                    background:   'radial-gradient(circle, rgba(3,211,189,0.06) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Signal badge */}
                {signal && (
                  <div style={{ marginBottom: '14px' }}>
                    <span
                      style={{
                        fontFamily:    "'Geist Mono', monospace",
                        fontSize:      '8px',
                        fontWeight:    500,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color:         'rgba(3,211,189,0.65)',
                        padding:       '3px 8px',
                        background:    'rgba(3,211,189,0.06)',
                        border:        '1px solid rgba(3,211,189,0.14)',
                        borderRadius:  '4px',
                      }}
                    >
                      ◆ {signal}
                    </span>
                  </div>
                )}

                {/* Quote mark */}
                <div
                  style={{
                    fontFamily:  "'Instrument Serif', serif",
                    fontSize:    '48px',
                    lineHeight:  '0.6',
                    color:       'rgba(232,160,48,0.25)',
                    marginBottom: '10px',
                    userSelect:  'none',
                  }}
                  aria-hidden
                >
                  &ldquo;
                </div>

                {/* Quote text */}
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize:   '13.5px',
                    fontWeight: 400,
                    lineHeight: 1.70,
                    color:      'rgba(255,255,255,0.62)',
                    margin:     '0 0 18px',
                  }}
                >
                  {text}
                </p>

                {/* Divider */}
                <div
                  style={{
                    height:     '1px',
                    background: 'linear-gradient(90deg, rgba(3,211,189,0.15), rgba(255,255,255,0.03) 70%, transparent)',
                    marginBottom: '16px',
                  }}
                />

                {/* Author row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img
                      src={image}
                      alt={name}
                      width={36}
                      height={36}
                      style={{
                        width:        '36px',
                        height:       '36px',
                        borderRadius: '50%',
                        objectFit:    'cover',
                        display:      'block',
                        border:       '1.5px solid rgba(3,211,189,0.30)',
                        boxShadow:    '0 0 10px rgba(3,211,189,0.15)',
                      }}
                    />
                    {/* Live dot */}
                    <span
                      style={{
                        position:     'absolute',
                        bottom:       '0px',
                        right:        '0px',
                        width:        '8px',
                        height:       '8px',
                        borderRadius: '50%',
                        background:   '#34D399',
                        border:       '1.5px solid #0A0E1A',
                        boxShadow:    '0 0 6px rgba(52,211,153,0.60)',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily:  "'Inter', sans-serif",
                        fontSize:    '12.5px',
                        fontWeight:  500,
                        color:       'rgba(255,255,255,0.88)',
                        margin:      '0 0 2px',
                        lineHeight:  1.2,
                      }}
                    >
                      {name}
                    </p>
                    <p
                      style={{
                        fontFamily:    "'Geist Mono', monospace",
                        fontSize:      '9px',
                        fontWeight:    400,
                        color:         'rgba(3,211,189,0.55)',
                        letterSpacing: '0.06em',
                        margin:        0,
                        lineHeight:    1.3,
                        textOverflow:  'ellipsis',
                        overflow:      'hidden',
                        whiteSpace:    'nowrap',
                      }}
                    >
                      {role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};
