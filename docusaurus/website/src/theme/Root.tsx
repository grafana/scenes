import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from '@docusaurus/router';
import { useOneTrustIntegration } from '../utils/useOneTrustIntegration';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import { CookieConsent } from '../components/CookieConsent/CookieConsent';
import { RudderStackTrackingConfig, startTracking, trackPage } from './tracking';
import { analyticsVersion, cookieName, getCookie, setCookie } from './tracking/cookie';

export default function Root({ children }) {
  const location = useLocation();
  const {
    siteConfig: { customFields },
  } = useDocusaurusContext();

  const isOneTrustEnabled = customFields.oneTrust.enabled;

  const { hasAnalyticsConsent } = useOneTrustIntegration(customFields.oneTrust);

  const rudderStackConfig = customFields.rudderStackTracking as RudderStackTrackingConfig;

  const setCookieAndStartTracking = useCallback(() => {
    setCookie(cookieName, {
      analytics: analyticsVersion,
    });

    setShouldShow(false);
    startTracking(rudderStackConfig);
  }, [rudderStackConfig]);

  const [shouldShow, setShouldShow] = useState(false);

  const canSpam = useCallback(async () => {
    try {
      const response = await fetch(customFields.canSpamUrl as string, {
        mode: 'no-cors',
      });
      if (response.status === 204) {
        return true;
      }
    } catch (e) {
      // do nothing
    }
    return false;
  }, [customFields.canSpamUrl]);

  // Handles cookie consent logic when OneTrust is disabled
  const handleOriginalCookieConsent = useCallback(() => {
    // If the user has already given consent, start tracking.
    if (getCookie(cookieName, 'analytics') === analyticsVersion) {
      return setCookieAndStartTracking();
    }

    // If the user is from an IP address that does not require consent, start tracking.
    canSpam()
      .then((result) => {
        if (result) {
          return setCookieAndStartTracking();
        } else {
          // If the user has not given consent and is from IP address that requires consent, show the consent banner.
          setShouldShow(true);
        }
      })
      .catch((error) => {
        console.error(error);
        setShouldShow(true);
      });
  }, [setCookieAndStartTracking, canSpam]);

  useEffect(() => {
    if (isOneTrustEnabled) {
      return;
    }
    handleOriginalCookieConsent();
  }, [isOneTrustEnabled, handleOriginalCookieConsent]);

  useEffect(() => {
    const shouldTrack = isOneTrustEnabled
      ? hasAnalyticsConsent
      : getCookie(cookieName, 'analytics') === analyticsVersion;

    if (shouldTrack) {
      if (isOneTrustEnabled && hasAnalyticsConsent) {
        startTracking(rudderStackConfig);
      }
      trackPage();
    }
  }, [location, hasAnalyticsConsent, isOneTrustEnabled]);

  const onClick = () => {
    return setCookieAndStartTracking();
  };

  return (
    <>
      {children}
      {!isOneTrustEnabled && shouldShow && <CookieConsent onClick={onClick} />}
    </>
  );
}
