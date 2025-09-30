import React, { MouseEventHandler } from 'react';
import styles from './styles.module.css';

type Props = {
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export function CookieConsent({ onClick }: Props) {
  return (
    <div className={styles.cookieConsent}>
      <div className={styles.cookieConsentContainer}>
        <div>
          Grafana Labs uses cookies for the normal operation of this website.{' '}
          <a href="https://grafana.com/terms#cookie-policy">
            <strong>Learn more.</strong>
          </a>
        </div>
        <div>
          <button className={styles.cookieConsentCta} onClick={onClick}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
