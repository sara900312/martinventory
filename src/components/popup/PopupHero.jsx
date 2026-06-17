import { useEffect, useState, useCallback, useRef } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { parseVideoUrl } from '@/lib/videoUtils';
import { usePopupQueue } from '@/hooks/usePopupQueue';
import { generateTargetUrl } from '@/lib/popupTargetUtils';
import {
  shouldShowPopup,
  recordPopupShown,
  incrementPopupVisitCount
} from '@/lib/popupFrequencyManager';

const animationVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.5 },
  },
  slide: {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 },
    transition: { duration: 0.5, type: 'spring', stiffness: 100 },
  },
  zoom: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { duration: 0.5, type: 'spring', stiffness: 200 },
  },
  bounce: {
    initial: { opacity: 0, scale: 0.5, y: 100 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.5 },
    transition: { duration: 0.6, type: 'spring', stiffness: 150, damping: 10 },
  },
};

const getButtonPositionClasses = (buttonPosition) => {
  const positions = {
    'top-left': 'self-start !mt-0 !mb-auto',
    'top-center': 'self-center !mt-0 !mb-auto',
    'top-right': 'self-end !mt-0 !mb-auto',
    'middle-left': 'self-start !my-auto',
    'middle-center': 'self-center !my-auto',
    'middle-right': 'self-end !my-auto',
    'bottom-left': 'self-start !mt-auto !mb-0',
    'bottom-center': 'self-center !mt-auto !mb-0',
    'bottom-right': 'self-end !mt-auto !mb-0',
  };

  return positions[buttonPosition] || positions['bottom-center'];
};

const getButtonSizeClasses = (buttonSize) => {
  const sizes = {
    small: 'px-4 py-2 text-sm md:text-base',
    medium: 'px-6 py-3 text-base md:text-lg',
    large: 'px-8 py-4 text-lg md:text-xl',
    xlarge: 'px-10 py-5 text-xl md:text-2xl',
  };
  return sizes[buttonSize] || sizes.medium;
};

const getButtonStyles = (buttonStyle, buttonColor, buttonTextColor, buttonSize = 'medium') => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-bold hover:opacity-90 transition-opacity min-w-max';
  const sizeClasses = getButtonSizeClasses(buttonSize);
  const baseStyle = {
    color: buttonTextColor || '#ffffff',
    textDecoration: 'none',
  };

  const styles = {
    solid: {
      className: cn(baseClasses, sizeClasses, 'rounded-lg shadow-lg'),
      style: {
        ...baseStyle,
        backgroundColor: buttonColor || '#3b82f6',
      }
    },
    outline: {
      className: cn(baseClasses, sizeClasses, 'rounded-lg border-2 shadow-md'),
      style: {
        ...baseStyle,
        borderColor: buttonColor || '#3b82f6',
        color: buttonColor || '#3b82f6',
        backgroundColor: 'transparent',
      }
    },
    ghost: {
      className: cn(baseClasses, sizeClasses, 'rounded-lg'),
      style: {
        ...baseStyle,
        color: buttonColor || '#3b82f6',
        backgroundColor: 'transparent',
      }
    },
    gradient: {
      className: cn(baseClasses, sizeClasses, 'rounded-lg shadow-lg'),
      style: {
        ...baseStyle,
        background: `linear-gradient(135deg, ${buttonColor || '#3b82f6'} 0%, #8b5cf6 100%)`,
      }
    },
    pill: {
      className: cn(baseClasses, sizeClasses, 'rounded-full shadow-lg'),
      style: {
        ...baseStyle,
        backgroundColor: buttonColor || '#3b82f6',
      }
    },
    square: {
      className: cn(baseClasses, sizeClasses, 'shadow-lg'),
      style: {
        ...baseStyle,
        backgroundColor: buttonColor || '#3b82f6',
      }
    },
    shadow: {
      className: cn(baseClasses, sizeClasses, 'rounded-lg'),
      style: {
        ...baseStyle,
        backgroundColor: buttonColor || '#3b82f6',
        boxShadow: `0 10px 25px ${buttonColor || '#3b82f6'}80`,
      }
    },
    minimal: {
      className: cn(baseClasses, sizeClasses, 'rounded-md'),
      style: {
        ...baseStyle,
        backgroundColor: buttonColor || '#3b82f6',
      }
    }
  };

  return styles[buttonStyle] || styles.solid;
};

const VideoPlayer = ({ videoUrl, className, onError }) => {
  const videoInfo = parseVideoUrl(videoUrl);
  const [videoError, setVideoError] = useState(false);

  const handleVideoError = (e) => {
    console.error('Video loading error:', e);
    setVideoError(true);
    onError?.(e);
  };

  if (videoError) {
    return null;
  }

  if (videoInfo.type === 'youtube' || videoInfo.type === 'vimeo') {
    return (
      <iframe
        src={videoInfo.embedUrl}
        className={cn('w-full h-full object-cover', className)}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        frameBorder="0"
        title="Video popup"
        onError={handleVideoError}
      />
    );
  }

  const isWebM = videoInfo.embedUrl?.toLowerCase().includes('.webm');
  const isMp4 = videoInfo.embedUrl?.toLowerCase().includes('.mp4');
  const isOgg = videoInfo.embedUrl?.toLowerCase().includes('.ogg');

  // Add CORS token to Supabase storage URLs
  const getVideoUrl = (url) => {
    if (url && url.includes('supabaseusercontent.com')) {
      // Supabase public URLs already work, but ensure they're accessible
      return url;
    }
    return url;
  };

  const videoSrc = getVideoUrl(videoInfo.embedUrl);

  return (
    <video
      className={cn('w-full h-full object-cover', className)}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      crossOrigin="anonymous"
      onError={handleVideoError}
    >
      {isWebM && (
        <source src={videoSrc} type="video/webm" />
      )}
      {isMp4 && (
        <source src={videoSrc} type="video/mp4" />
      )}
      {isOgg && (
        <source src={videoSrc} type="video/ogg" />
      )}
      {!isWebM && !isMp4 && !isOgg && (
        <source src={videoSrc} />
      )}
      Your browser does not support the video tag.
    </video>
  );
};

export const PopupHero = ({ preview = false, previewData = null }) => {
  const navigate = useNavigate();
  const { currentPopup, queueLength, closeCurrentAndShowNext } = usePopupQueue();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [buttonVisible, setButtonVisible] = useState(false);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState(15);

  const popupRef = useRef(null);
  const popup = preview ? previewData : currentPopup;

  // Keep ref in sync with popup to avoid stale closures
  useEffect(() => {
    popupRef.current = popup;
  }, [popup?.id]);

  // Handle countdown timer
  useEffect(() => {
    if (countdown === null || countdown === 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setButtonVisible(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);


  useEffect(() => {
    if (!popup) {
      setIsVisible(false);
      setImageLoaded(false);
      setVideoLoaded(false);
      setCountdown(null);
      setButtonVisible(false);
      setAutoCloseCountdown(15);
      return;
    }

    // Reset loading states for new popup
    setImageLoaded(false);
    setVideoLoaded(false);

    // Increment visit count for frequency tracking
    if (!preview && popup.display_frequency === 'interval') {
      incrementPopupVisitCount(popup.id);
    }

    if (preview) {
      setIsVisible(true);
      setAutoCloseCountdown(15);
      // Handle countdown for preview
      const buttonDelaySeconds = popup.button_delay_seconds || 0;
      if (buttonDelaySeconds > 0) {
        setCountdown(buttonDelaySeconds);
        setButtonVisible(false);
      } else {
        setButtonVisible(true);
        setCountdown(null);
      }
      return;
    }

    // Check if popup should be shown based on frequency rules
    const displayFrequency = popup.display_frequency || 'always';
    const frequencyInterval = popup.frequency_interval || 5;

    const canShow = shouldShowPopup(popup.id, displayFrequency, frequencyInterval);

    console.log(`Popup "${popup.title}" - shouldShow: ${canShow}, frequency: ${displayFrequency}`);
    if (queueLength > 1) {
      console.log(`📊 Queue: ${queueLength} popups total`);
    }

    if (canShow) {
      setAutoCloseCountdown(15);
      // Handle countdown for actual popup
      const buttonDelaySeconds = popup.button_delay_seconds || 0;
      if (buttonDelaySeconds > 0) {
        setCountdown(buttonDelaySeconds);
        setButtonVisible(false);
      } else {
        setButtonVisible(true);
        setCountdown(null);
      }
    }

    setIsVisible(canShow);
  }, [popup?.id, preview, queueLength]);

  const handleClose = useCallback(() => {
    // Record that popup was shown (when user closes it)
    // Use ref to avoid stale closure - popup data is always up-to-date via the ref
    if (!preview && popupRef.current) {
      recordPopupShown(popupRef.current.id, popupRef.current.display_frequency || 'always');
      console.log(`Popup "${popupRef.current.title}" shown recorded`);
    }

    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);

      // Move to next popup in queue
      if (!preview) {
        closeCurrentAndShowNext();
      }
    }, 200);
  }, [preview, closeCurrentAndShowNext]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]); // handleClose is stable due to optimized dependencies

  const getTargetUrl = useCallback(() => {
    const popup = popupRef.current;
    if (!popup) return null;

    // New system: use target_type and target_id
    if (popup.target_type && popup.target_id) {
      return generateTargetUrl(popup.target_type, popup.target_id);
    }

    // Legacy system: use link_url
    return popup.link_url || null;
  }, []);

  const handleTargetClick = useCallback((e) => {
    const popup = popupRef.current;
    if (!popup) return;

    // Record popup shown when user clicks CTA
    if (!preview) {
      recordPopupShown(popup.id, popup.display_frequency || 'always');
      console.log(`Popup "${popup.title}" shown recorded (CTA clicked)`);
    }

    const url = getTargetUrl();
    if (!url) return;

    // Navigate to the target URL
    e.preventDefault();
    handleClose();
    setTimeout(() => {
      navigate(url);
    }, 200);
  }, [preview, navigate, handleClose, getTargetUrl]);

  // Handle auto-close countdown (15 seconds)
  useEffect(() => {
    if (!isVisible || autoCloseCountdown <= 0) return;

    const timer = setInterval(() => {
      setAutoCloseCountdown(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, autoCloseCountdown]);

  // Auto-close popup when countdown reaches 0
  useEffect(() => {
    if (autoCloseCountdown === 0 && isVisible) {
      handleClose();
    }
  }, [autoCloseCountdown, isVisible, handleClose]);

  if (!isVisible || !popup) return null;

  const animationType = popup.animation_type || 'fade';
  const animation = animationVariants[animationType] || animationVariants.fade;

  const layoutClasses = {
    rectangle: 'max-w-3xl w-full aspect-[16/9] md:aspect-[21/9]',
    square: 'max-w-md w-full aspect-square',
    fullscreen: 'w-screen h-screen max-w-none rounded-none',
  };

  const positionClasses = {
    center: 'items-center justify-center',
    top: 'items-start justify-center pt-8 md:pt-16',
    bottom: 'items-end justify-center pb-8 md:pb-16',
  };

  const hasVideo = popup.video_url && popup.video_url.trim() !== '';
  const hasImage = popup.image_url && popup.image_url.trim() !== '';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            'fixed inset-0 z-50 flex bg-foreground/60 backdrop-blur-sm p-4',
            positionClasses[popup.position]
          )}
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-labelledby="popup-title"
          tabIndex={-1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className={cn(
              'relative bg-card rounded-2xl overflow-hidden shadow-popup',
              layoutClasses[popup.layout_type]
            )}
            onClick={(e) => e.stopPropagation()}
            initial={animation.initial}
            animate={animation.animate}
            exit={animation.exit}
            transition={animation.transition}
          >
        {/* Close button (X) - shown if close_method is 'x-only' or 'both' */}
        {(popup.close_method === 'x-only' || popup.close_method === 'both' || !popup.close_method) && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-10 bg-background/80 hover:bg-background backdrop-blur-sm rounded-full h-10 w-10"
            onClick={handleClose}
            aria-label="Close popup"
          >
            <X className="h-5 w-5 text-red-600 hover:text-red-700" />
          </Button>
        )}

        {/* Auto-close countdown timer - shown if close_method is 'countdown-only' or 'both' */}
        {(popup.close_method === 'countdown-only' || popup.close_method === 'both' || !popup.close_method) && (
          <motion.div
            className="absolute top-3 left-3 z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-2" style={{ borderColor: '#ffffff', backgroundColor: 'transparent' }}>
              <span className="text-xs font-bold" style={{ color: '#ffffff' }}>{autoCloseCountdown}</span>
            </div>
          </motion.div>
        )}

        {hasVideo && (
          <div className="absolute inset-0">
            <VideoPlayer
              videoUrl={popup.video_url}
              onError={() => {
                console.error('Failed to load video:', popup.video_url);
                setVideoLoaded(false);
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent" />
          </div>
        )}

        {!hasVideo && hasImage && (
          <div className="absolute inset-0">
            <img
              src={popup.image_url}
              alt={popup.title || 'Popup image'}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
              onLoad={() => {
                setImageLoaded(true);
                console.log('Image loaded successfully:', popup.image_url);
              }}
              onError={(e) => {
                console.error('Failed to load image:', popup.image_url, e);
                setImageLoaded(false);
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent" />
          </div>
        )}

        {!hasVideo && !hasImage && (
          <div className="absolute inset-0 gradient-hero opacity-90" />
        )}

        <div className={cn(
          'relative h-full flex flex-col p-6 md:p-8',
          popup.layout_type === 'fullscreen' && 'max-w-4xl mx-auto'
        )}>
          <div className="space-y-3 flex flex-col h-full">
            <h2
              id="popup-title"
              className={cn(
                'font-display font-bold',
                popup.layout_type === 'fullscreen' ? 'text-3xl md:text-5xl' : 'text-xl md:text-3xl'
              )}
              style={{ color: popup.title_color || '#ffffff' }}
            >
              {popup.title}
            </h2>
            {popup.description && (
              <p
                className={cn(
                  popup.layout_type === 'fullscreen' ? 'text-lg md:text-xl max-w-2xl' : 'text-sm md:text-base'
                )}
                style={{ color: popup.description_color || '#f0f0f0' }}
              >
                {popup.description}
              </p>
            )}
            {popup.target_type && popup.target_id && buttonVisible && (() => {
              const buttonStyles = getButtonStyles(popup.button_style || 'solid', popup.button_color, popup.button_text_color, popup.button_size || 'medium');
              const positionClasses = getButtonPositionClasses(popup.button_position || 'bottom-center');
              return (
                <motion.a
                  href={getTargetUrl() || '#'}
                  className={cn(buttonStyles.className, positionClasses)}
                  style={{
                    ...buttonStyles.style,
                    textDecoration: 'none',
                  }}
                  onClick={handleTargetClick}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="truncate">{popup.cta_text || 'Learn More'}</span>
                  <ArrowLeft className="h-5 w-5 flex-shrink-0 rotate-180" />
                </motion.a>
              );
            })()}
          </div>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
