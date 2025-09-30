
let oneTrustInjected = false;
let consentChangeCallbacks = [];

/**
 * Load OneTrust script if conditions are met
 * @param {Object} oneTrustConfig - OneTrust configuration object
 * @returns {boolean} - Whether OneTrust script was loaded
 */
export function loadOneTrustScript(oneTrustConfig) {
  // Check if user has already made a consent decision (either accept or reject)
  const consentDecision = localStorage.getItem('localStorageConsent');
  if (consentDecision !== null) {
    // User has already made a decision, don't load OneTrust script again
    return consentDecision === 'true';
  }

  if (!oneTrustConfig?.enabled) {
    return false;
  }

  if (oneTrustInjected || window.__oneTrustInjected) {
    return false;
  }

  try {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.charset = 'UTF-8';
    script.async = true;
    script.src = oneTrustConfig.scriptSrc;

    script.setAttribute('data-domain-script', oneTrustConfig.domainId);

    script.onload = function () {
      oneTrustInjected = true;
      window.__oneTrustInjected = true;
    };

    script.onerror = function () {
      oneTrustInjected = false;
      window.__oneTrustInjected = false;
    };

    document.head.appendChild(script);
    return true;
  } catch (error) {
    console.error('Error loading OneTrust script:', error);
    return false;
  }
}


/**
 * Check if user has given consent (simplified version)
 * @returns {boolean}
 */
export function hasConsent() {
  const hasLocalConsent = localStorage.getItem('localStorageConsent') === 'true';
  return hasLocalConsent;
}


/**
 * Remove a callback from the analytics consent change listeners
 * @param callback - Function to remove from the callbacks list
 */
export function removeAnalyticsConsentChange(callback) {
  consentChangeCallbacks = consentChangeCallbacks.filter(cb => cb !== callback);
}


/**
 * Register callback for analytics consent changes
 * @param callback - Function to call when consent changes
 * @param config - OneTrust configuration object
 */
export function onAnalyticsConsentChange(callback, config = null) {
  if (typeof window === 'undefined') return;

  let analyticsGroupId = 'C0002';
  if (config?.analyticsGroupId) {
    analyticsGroupId = config.analyticsGroupId;
  }

  // Prevent duplicate callback registration
  if (!consentChangeCallbacks.includes(callback)) {
    consentChangeCallbacks.push(callback);
  }

  if (!window.OptanonWrapper) {
    window.OptanonWrapper = function() {
      const stack = new Error().stack;
      const isInitialLoad = stack.includes('windowLoadBanner');
      
      if (isInitialLoad) {
        return;
      }
      
      const hasAnalyticsConsent = window.OnetrustActiveGroups && 
        window.OnetrustActiveGroups.includes(analyticsGroupId);

      if (hasAnalyticsConsent) {
        localStorage.setItem('localStorageConsent', 'true');
      } else {
        localStorage.setItem('localStorageConsent', 'false');
      }
      
      
      consentChangeCallbacks.forEach((cb, index) => {
        try {
          cb('analytics', hasAnalyticsConsent);
        } catch (error) {
          console.error(`Error in consent change callback ${index + 1}:`, error);
        }
      });
    };
  }
}