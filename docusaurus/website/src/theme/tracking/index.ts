declare global {
  interface Window {
    rudderanalytics: any;
  }
}

let rudderId;

export function getRudderId() {
  return rudderId;
}

const isRudderstackSetup = (config: RudderStackTrackingConfig) =>
  config && config.writeKey && config.url && config.sdkUrl;

// Enqueue all rudderstack requests until it is loaded and consent is granted
let rudderstack = {};
let rudderQueue = [];
const rudderMethods = ["page", "track", "identify", "reset"];
for (const method of rudderMethods) {
  rudderstack[method] = (...args) => {
    rudderQueue.push([method].concat(args));
  };
}

export type RudderStackTrackingConfig = {
  url: string;
  writeKey: string;
  configUrl: string;
  sdkUrl: string;
};

export function startTracking(config: RudderStackTrackingConfig) {
  if (isRudderstackSetup(config)) {
    const { writeKey, url, configUrl } = config;

    const initRudderstack = async () => {
      rudderId = await window.rudderanalytics.getAnonymousId();

      window.rudderanalytics.load(writeKey, url, { configUrl });
      rudderstack = window.rudderanalytics;

      // send any queued requests
      for (const [method, ...args] of rudderQueue) {
        rudderstack[method](...args);
      }
      // clean up afterwards so trackPage
      rudderQueue = [];
    };

    const el = document.createElement("script");
    el.async = true;
    el.src = config.sdkUrl;
    el.onload = initRudderstack;
    document.getElementsByTagName("head")[0].appendChild(el);
  }
}

export function trackPage() {
  // rudderstack automagically accesses all this but if it isn't loaded we need to
  // define it manually.
  if (rudderQueue) {
    const { href, pathname } = location;
    const canonicalLink = document.querySelector("link[rel='canonical']");

    const properties = {
      url: canonicalLink ? canonicalLink.getAttribute("href") : href,
      path: pathname,
      referrer: document.referrer || "$direct",
      title: document.title,
      tab_url: href,
    };
    // @ts-ignore we don't have the types.
    rudderstack.page(properties);
  } else {
    // @ts-ignore we don't have the types.
    rudderstack.page();
  }
}
