import React, { useContext } from 'react';
import { ReactContexts, SceneComponentProps, SceneObjectBase } from '@grafana/scenes';
import { Button } from '@grafana/ui';

import { SomeReactContext } from '../../components/SomeReactContext';

export class CustomObjectWithReactContext extends SceneObjectBase {
  static Component = ({ model }: SceneComponentProps<CustomObjectWithReactContext>) => {
    const context = useContext(SomeReactContext);

    return (
      <>
        <div>Value: {context?.value}</div>
        <div>
          <Button onClick={() => context?.setValue(context.value + 1)}>Change value</Button>
        </div>
      </>
    );
  };

  protected _reactContexts = new ReactContexts(this, [{ context: SomeReactContext }]);

  public constructor() {
    super({});

    this.addActivationHandler(() => {
      console.log('Value on activation:', this.reactContexts?.getContext(SomeReactContext)?.value);

      this._subs.add(
        this.reactContexts?.subscribeToContext(SomeReactContext, (newValue, prevValue) => {
          console.log('Value changed:', newValue, prevValue);
        })
      );
    });
  }
}
