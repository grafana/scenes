import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import CodeBlock from '@theme/CodeBlock';

import styles from './styles.module.css';
import Link from '@docusaurus/Link';

function HomepageGettingStarted() {
  return (
    <div className="container margin-bottom--xl text--left">
      <div className="card padding--lg">
        <div className="row">
          <div className="col col--5">
            <h2>Get started in seconds</h2>
            <p>
              Use{' '}
              <Link
                to="https://github.com/grafana/plugin-tools/blob/main/packages/create-plugin/README.md"
                target="_blank"
              >
                @grafana/create-plugin
              </Link>{' '}
              and start playing with Scenes right away!
              <br />
              <br />
              To create a Scenes app, run the following command:
            </p>
            <CodeBlock>npx @grafana/create-plugin@latest</CodeBlock>
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
  );
}

export default HomepageGettingStarted;
