import React, { CSSProperties, ReactNode, HTMLAttributes } from 'react';

type AnimationMode = 'auto-rotate' | 'rotate-on-hover' | 'stop-rotate-on-hover';

interface BorderRotateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  children: ReactNode;
  className?: string;
  animationMode?: AnimationMode;
  animationSpeed?: number;
  gradientColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  backgroundColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  style?: CSSProperties;
}

const defaultGradientColors = {
  primary: 'transparent',
  secondary: '#067a6f',
  accent: '#0dd7bf',
};

const BorderRotate: React.FC<BorderRotateProps> = ({
  children,
  className = '',
  animationMode = 'auto-rotate',
  animationSpeed = 4,
  gradientColors = defaultGradientColors,
  backgroundColor = 'rgba(11,11,20,0.92)',
  borderWidth = 1,
  borderRadius = 18,
  style = {},
  ...props
}) => {
  const getAnimationClass = () => {
    switch (animationMode) {
      case 'auto-rotate':        return 'gradient-border-auto';
      case 'rotate-on-hover':    return 'gradient-border-hover';
      case 'stop-rotate-on-hover': return 'gradient-border-stop-hover';
      default:                   return '';
    }
  };

  const combinedStyle: CSSProperties = {
    '--gradient-primary':    gradientColors.primary,
    '--gradient-secondary':  gradientColors.secondary,
    '--gradient-accent':     gradientColors.accent,
    '--bg-color':            backgroundColor,
    '--border-width':        `${borderWidth}px`,
    '--border-radius':       `${borderRadius}px`,
    '--animation-duration':  `${animationSpeed}s`,
    border:          `${borderWidth}px solid transparent`,
    borderRadius:    `${borderRadius}px`,
    backgroundImage: `
      linear-gradient(${backgroundColor}, ${backgroundColor}),
      conic-gradient(
        from var(--gradient-angle, 0deg),
        ${gradientColors.primary} 0%,
        ${gradientColors.secondary} 37%,
        ${gradientColors.accent}   30%,
        ${gradientColors.secondary} 33%,
        ${gradientColors.primary} 40%,
        ${gradientColors.primary} 50%,
        ${gradientColors.secondary} 77%,
        ${gradientColors.accent}   80%,
        ${gradientColors.secondary} 83%,
        ${gradientColors.primary} 90%
      )
    `,
    backgroundClip:   'padding-box, border-box',
    backgroundOrigin: 'padding-box, border-box',
    ...style,
  } as CSSProperties;

  return (
    <div
      className={`gradient-border-component ${getAnimationClass()} ${className}`}
      style={combinedStyle}
      {...props}
    >
      {children}
    </div>
  );
};

export { BorderRotate };
