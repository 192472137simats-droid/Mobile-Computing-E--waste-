import React from 'react';
import styles from './IconWrapper.module.css';

export function IconWrapper({
  name,
  size = 20,
  className = '',
  color = 'currentColor',
  'aria-label': ariaLabel,
  ...props
}) {
  const iconProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: '1.75',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    role: ariaLabel ? 'img' : 'presentation',
    'aria-label': ariaLabel,
    'aria-hidden': !ariaLabel,
  };

  const renderPath = () => {
    switch (name) {
      case 'calendar':
        return <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M7 14h3M14 14h3M7 18h3" /></>;
      case 'recycle':
        return (
          <>
            <path d="M8 7l3-5 4 7M16 9h-4V5M18 11l4 7H14M14 18l3-3M14 18l3 3M11 18H3l4-7M7 11l1 4M7 11l-4 1" />
          </>
        );
      case 'gift':
        return (
          <>
            <rect x="3" y="8" width="18" height="4" rx="1" />
            <path d="M5 12v9h14v-9M12 8v13M12 8C6 8 5 6 6 4s5-1 6 4ZM12 8c6 0 7-2 6-4s-5-1-6 4Z" />
          </>
        );
      case 'crest':
        return (
          <>
            <path d="M12 2L4 6v6c0 5.5 3.5 10 8 11 4.5-1 8-5.5 8-11V6l-8-4z" strokeWidth="1.5" />
            <path d="M8.5 8.5L12 16l3.5-7.5" strokeWidth="1.5" />
            <line x1="10" y1="12" x2="14" y2="12" strokeWidth="1.25" />
          </>
        );
      case 'user':
        return (
          <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" />
            <circle cx="12" cy="8" r="1.5" fill={color} />
          </>
        );
      case 'vendor':
      case 'tools':
        return (
          <>
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </>
        );
      case 'admin':
      case 'shield':
        return (
          <>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <circle cx="12" cy="10" r="2" />
            <line x1="12" y1="12" x2="12" y2="16" />
            <line x1="10.5" y1="14" x2="13.5" y2="14" />
          </>
        );
      case 'lock':
        return (
          <>
            <rect x="4" y="11" width="16" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            <circle cx="12" cy="16" r="1.5" fill={color} />
          </>
        );
      case 'envelope':
        return (
          <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <polyline points="3 7 12 13 21 7" />
          </>
        );
      case 'arrow-right':
        return (
          <>
            <line x1="4" y1="12" x2="20" y2="12" />
            <polyline points="14 6 20 12 14 18" />
          </>
        );
      case 'arrow-left':
        return (
          <>
            <line x1="20" y1="12" x2="4" y2="12" />
            <polyline points="10 18 4 12 10 6" />
          </>
        );
      case 'eye':
        return (
          <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </>
        );
      case 'eye-off':
        return (
          <>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </>
        );
      case 'check':
        return <polyline points="20 6 9 17 4 12" />;
      case 'info':
        return (
          <>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </>
        );
      case 'globe':
        return (
          <>
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </>
        );
      default:
        return <circle cx="12" cy="12" r="8" />;
    }
  };

  return (
    <svg className={`${styles.icon} ${className}`} {...iconProps} {...props}>
      {renderPath()}
    </svg>
  );
}

export default IconWrapper;
