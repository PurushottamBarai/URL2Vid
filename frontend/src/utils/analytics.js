/**
 * Utility for Google Analytics 4 (GA4) event tracking.
 * Safely invokes window.gtag if present in window scope.
 * 
 * @param {string} eventName
 * @param {object} [params={}]
 */
export const trackEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
};
