import React, { ForwardRefExoticComponent, useImperativeHandle, useRef, useState } from 'react';
import { useEffectOnce } from 'react-use';

import { uniqueId } from 'lodash';
import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';

export function useUniqueId(): string {
  const idRefLazy = useRef<string | undefined>(undefined);
  idRefLazy.current ??= uniqueId();
  return idRefLazy.current;
}

export interface Props extends Omit<React.HTMLProps<HTMLDivElement>, 'onChange' | 'children'> {
  children: React.ReactNode | (({ isInView }: { isInView: boolean }) => React.ReactNode);
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

    // If the element was loaded, we add the `hideEmpty` class to potentially
    // hide the LazyLoader if it does not have any children. This is the case
    // when children have the `isHidden` property set.
    // We always include the `className` class, as this is coming from the
    // caller of the `LazyLoader` component.
    const classes = `${loaded ? hideEmpty : ''} ${className}`;
    return (
      <div id={id} ref={innerRef} className={classes} {...rest}>
        {loaded && (typeof children === 'function' ? children({ isInView }) : children)}
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
