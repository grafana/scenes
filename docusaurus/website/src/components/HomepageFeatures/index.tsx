import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;

  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Easy to Use',
    description: (
      <>
        Grafana Scenes is a simple and intuitive API that allows you to build experiences similar to Grafana Dashboards
        in no time.
      </>
    ),
  },
  {
    title: 'Feature Rich',
    description: (
      <>
        All fantastic Grafana Dashboard's features like querying and transformations, templating, time ranges and more
        are available in Grafana Scenes.
      </>
    ),
  },
  {
    title: 'Extensible',
    description: (
      <>Grafana Scenes is built with extensibility in mind. Build your own Scene objects to provide custom behaviors.</>
    ),
  },
];

function Feature({ title, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
