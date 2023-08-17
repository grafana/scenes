import React, { ComponentType, SVGProps } from 'react';
import clsx from 'clsx';
import EasyUseIcon from '@iconscout/unicons/svg/line/user-check.svg';
import FeatureRichIcon from '@iconscout/unicons/svg/line/create-dashboard.svg';
import ExtensibleIcon from '@iconscout/unicons/svg/line/puzzle-piece.svg';

type FeatureItem = {
  title: string;
  description: JSX.Element;
  href?: string;
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
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
    Icon: EasyUseIcon,
  },
  {
    title: 'Feature Rich',
    description: (
      <>
        All fantastic Grafana Dashboard's features like querying and transformations, templating, time ranges and more
        are available in Grafana Scenes.
      </>
    ),
    Icon: FeatureRichIcon,
  },
  {
    title: 'Extensible',
    description: (
      <>Grafana Scenes is built with extensibility in mind. Build your own Scene objects to provide custom behaviors.</>
    ),
    Icon: ExtensibleIcon,
  },
];

function Feature({ title, description, href, Icon }: FeatureItem) {
  return (
    <div className="col">
      <div className={clsx('card card--full-height padding--md')}>
        <span className="avatar margin-bottom--sm">
          {Icon && <Icon aria-hidden="true" style={{ fill: 'currentColor', width: 24 }} />}
          <h3 className="margin-bottom--none text--normal">{title}</h3>
        </span>
        <p className="margin-bottom--none">{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className="margin-bottom--lg">
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
