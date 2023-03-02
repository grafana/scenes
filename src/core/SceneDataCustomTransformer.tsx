import { map, mergeMap, MonoTypeOperatorFunction, Observable, of, Unsubscribable } from 'rxjs';

import { DataFrame, DataTransformContext, LoadingState, PanelData } from '@grafana/data';

import { SceneObjectBase } from './SceneObjectBase';
import { sceneGraph } from './sceneGraph';
import { SceneDataState } from './types';

export interface SceneDataCustomTransformerState<TOptions = {}> extends SceneDataState {
  transformation: (context: DataTransformContext) => MonoTypeOperatorFunction<DataFrame[]>;
}

export class SceneDataCustomTransformer extends SceneObjectBase<SceneDataCustomTransformerState> {
  private _transformationsSub?: Unsubscribable;

  public activate() {
    super.activate();

    if (!this.parent || !this.parent.parent) {
      return;
    }

    const initialData = sceneGraph.getData(this.parent.parent).state.data;

    if (initialData) {
      this.transformData(of(initialData));
    }

    this._subs.add(
      // Need to subscribe to the parent's parent because the parent has a $data reference to this object
      sceneGraph.getData(this.parent.parent).subscribeToState({
        next: (data) => {
          if (data.data?.state === LoadingState.Done) {
            this.transformData(of(data.data));
          } else {
            this.setState({ data: data.data });
          }
        },
      })
    );
  }

  public deactivate(): void {
    super.deactivate();

    if (this._transformationsSub) {
      this._transformationsSub.unsubscribe();
      this._transformationsSub = undefined;
    }
  }

  private transformData(data: Observable<PanelData>) {
    const { transformation } = this.state;
    if (this._transformationsSub) {
      this._transformationsSub.unsubscribe();
      this._transformationsSub = undefined;
    }

    this._transformationsSub = data
      .pipe(
        mergeMap((data) => {
          if (!transformation) {
            return of(data);
          }

          const ctx = {
            interpolate: (value: string) => {
              return sceneGraph.interpolate(this, value, data?.request?.scopedVars);
            },
          };

          return transformation(ctx)(of(data.series)).pipe(map((series) => ({ ...data, series })));
        })
      )
      .subscribe({
        next: (data) => {
          console.log('transformed data', data);
          this.setState({ data });
        },
      });
  }
}
