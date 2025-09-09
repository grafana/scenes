import React, { ForwardRefExoticComponent, useImperativeHandle, useRef, useState } from 'react';
import { useEffectOnce } from 'react-use';

import { uniqueId } from 'lodash';
import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { t } from '@grafana/i18n';

export function useUniqueId(): string {
  const idRefLazy = useRef<string | undefined>(undefined);
  idRefLazy.current ??= uniqueId();
  return idRefLazy.current;
}

export interface Props extends Omit<React.HTMLProps<HTMLDivElement>, 'onChange' | 'children'> {
  children: React.ReactNode;
  key: string;
  onLoad?: () => void;
  onChange?: (isInView: boolean) => void;
}

export interface LazyLoaderType extends ForwardRefExoticComponent<Props> {
  addCallback: (id: string, c: (e: IntersectionObserverEntry) => void) => void;
  callbacks: Record<string, (e: IntersectionObserverEntry) => void>;
  observer: IntersectionObserver;
}

export const LazyLoader: LazyLoaderType = React.forwardRef<HTMLDivElement, Props>(
  ({ children, onLoad, onChange, className, ...rest }, ref) => {
    const id = useUniqueId();
    const { hideEmpty } = useStyles2(getStyles);
    const [loaded, setLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const innerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => innerRef.current!);

    useEffectOnce(() => {
      LazyLoader.addCallback(id, (entry) => {
        if (!loaded && entry.isIntersecting) {
          setLoaded(true);
          onLoad?.();
        }

        setIsInView(entry.isIntersecting);
        onChange?.(entry.isIntersecting);
      });

      const wrapperEl = innerRef.current;

      if (wrapperEl) {
        LazyLoader.observer.observe(wrapperEl);
      }

      return () => {
        wrapperEl && LazyLoader.observer.unobserve(wrapperEl);
        delete LazyLoader.callbacks[id];
        if (Object.keys(LazyLoader.callbacks).length === 0) {
          LazyLoader.observer.disconnect();
        }
      };
    });

    // since we will hide empty lazyloaded divs, we need to include a
    // non-breaking space while the loader has not been loaded. after it has
    // been loaded, we can remove the non-breaking space and show the children.
    // If the children render empty, the whole loader will be hidden by css.
    return (
      <div id={id} ref={innerRef} className={`${hideEmpty} ${className}`} {...rest}>
        {!loaded || !isInView ? (
          t('grafana-scenes.components.lazy-loader.placeholder', '\u00A0')
        ) : (
          <LazyLoaderInViewContext.Provider value={isInView}>{children}</LazyLoaderInViewContext.Provider>
        )}
      </div>
    );
  }
) as LazyLoaderType;

function getStyles() {
  return {
    hideEmpty: css({
      '&:empty': {
        display: 'none',
      },
    }),
  };
}

LazyLoader.displayName = 'LazyLoader';
LazyLoader.callbacks = {} as Record<string, (e: IntersectionObserverEntry) => void>;
LazyLoader.addCallback = (id: string, c: (e: IntersectionObserverEntry) => void) => (LazyLoader.callbacks[id] = c);
LazyLoader.observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (typeof LazyLoader.callbacks[entry.target.id] === 'function') {
        LazyLoader.callbacks[entry.target.id](entry);
      }
    }
  },
  { rootMargin: '100px' }
);

export const LazyLoaderInViewContext = React.createContext<boolean>(true);

export function useLazyLoaderIsInView(): boolean {
  return React.useContext(LazyLoaderInViewContext);
}
