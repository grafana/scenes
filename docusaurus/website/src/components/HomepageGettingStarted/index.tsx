import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import CodeBlock from '@theme/CodeBlock';

import styles from './styles.module.css';
import Link from '@docusaurus/Link';

function HomepageGettingStarted() {
  return (
    <>
      <div className={styles.gettingStartedSection}>
        <div className="container padding-vert--xl text--left">
          <div className="row">
            <div className="col col--4 col--offset-1">
              <h2>Get started in seconds</h2>
              <p>
                Use our{' '}
                <a href="https://github.com/grafana/scenes-app-template/" target="_blank">
                  Scenes app template
                </a>{' '}
                and start playing with Scenes right away!
                <br />
                <br />
                <Link
                  className="button button--primary button--md "
                  to="https://github.com/grafana/scenes-app-template/generate"
                  target="_blank"
                >
                  Create Scene app using the template
                </Link>
              </p>
              <br />
            </div>
            <div className="col col--6 col--offset-1">
              <img
                className={styles.featureImage}
                alt="Easy to get started in seconds"
                src={useBaseUrl('img/homepage_template.gif')}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default HomepageGettingStarted;
