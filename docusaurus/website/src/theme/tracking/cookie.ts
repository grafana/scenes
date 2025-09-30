import cookie from 'cookiejs';

export const cookieName = 'consent';
export const analyticsVersion = '2';

export function getCookie(name: string, key: string) {
  let res = cookie.get(name);

  try {
    if (res && typeof res === 'string') {
      const parsed = JSON.parse(decodeURIComponent(res));
      if (parsed[key] !== undefined) {
        return parsed[key];
      }
    }
  } catch (e) {
    // do nothing
  }
  if (key === undefined) {
    return res;
  }
}

export function setCookie(name: string, value: any) {
  let val = value;

  if (typeof value === 'object') {
    val = JSON.stringify(value);
  }

  return cookie.set(name, val, {
    expires: 365,
    domain: `.${window.location.hostname}`,
  });
}
