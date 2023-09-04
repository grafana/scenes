import { AnnotationEvent, arrayToDataFrame, DataFrame, DataTopic, PanelData } from '@grafana/data';
import { map, merge, mergeAll } from 'rxjs';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { CancelActivationHandler, SceneDataProvider, SceneObjectState } from '../core/types';

interface CompositeQueryRunnerState extends SceneObjectState {
  runners: SceneDataProvider[];
  data?: PanelData;
}

export class CompositeQueryRunner extends SceneObjectBase<CompositeQueryRunnerState> implements SceneDataProvider {
  public getDataTopic(): DataTopic {
    return 'composite' as DataTopic;
  }

  public constructor(state: CompositeQueryRunnerState) {
    super(state);
    this.addActivationHandler(() => {
      this._onActivate();
    });
  }

  private _onActivate() {
    const deactivationHadlers: CancelActivationHandler[] = [];
    const resultsMap: Record<string, Map<string, unknown>> = {};

    const observables = this.state.runners.map((runner) => {
      deactivationHadlers.push(runner.activate());
      return runner.getResultsStream!();
    });

    this._subs.add(
      merge(observables)
        .pipe(
          // takeUntil(this.runs.asObservable()),
          mergeAll(),
          map((v) => {
            if (!resultsMap[v.origin.getDataTopic()]) {
              resultsMap[v.origin.getDataTopic()] = new Map();
            }
            if (v.origin.getDataTopic() === DataTopic.Annotations) {
              // Is there a better, rxjs only way to combine multiple same-data-topic observables?
              // Indexing by origin state key is to make sure we do not duplicate/overwrite data from the different origins
              resultsMap[v.origin.getDataTopic()].set(
                v.origin.state.key!,
                arrayToDataFrame((v.data || []) as AnnotationEvent[])
              );
            }

            if (v.origin.getDataTopic() === ('data' as DataTopic)) {
              resultsMap[v.origin.getDataTopic()].set(v.origin.state.key!, v.data);
              // Is there a better, rxjs only way to combine multiple same-data-topic observables?
              // Indexing by origin state key is to make sure we do not duplicate/overwrite data from the different origins
              // resultsMap[v.origin.state.key!] = {
              //   ['data' as DataTopic]: v.data,
              // };
            }

            // Combine results with results from other layers.
            // const result: Record<string, DataFrame[]> = {};
            // Object.keys(resultsMap).forEach((key) => {
            //   if (resultsMap[key]?.[DataTopic.Annotations]) {
            //     result[DataTopic.Annotations] = (result[DataTopic.Annotations] || []).concat(
            //       resultsMap[key].annotations
            //     );
            //   }
            //   // handle alerting channel
            // });
            return resultsMap;
          })
        )
        .subscribe((result) => {
          this._processResults(result);
        })
    );

    return () => {
      deactivationHadlers.map((handler) => handler());
    };
  }

  private _processResults(resultsMap: Record<DataTopic, Map<string, unknown>>) {
    let panelData: PanelData = {} as PanelData;

    if (resultsMap['data' as DataTopic]) {
      panelData = this._combinePanelData(resultsMap['data' as DataTopic] as Map<string, PanelData>);
    }

    if (resultsMap[DataTopic.Annotations]) {
      panelData.annotations = (panelData.annotations || []).concat(
        this._combineAnnotations(resultsMap[DataTopic.Annotations] as Map<string, DataFrame>)
      );
    }
    // const panelData = this._combinePanelData();
    this.setState({
      data: panelData,
    });
  }

  private _combineAnnotations(resultsMap: Map<string, DataFrame>) {
    return Array.from(resultsMap.values()).reduce((acc, value) => {
      acc = acc.concat(value);
      return acc;
    }, [] as DataFrame[]);
  }
  private _combinePanelData(resultsMap: Map<string, PanelData>) {
    return Array.from(resultsMap.values()).reduce((acc, value) => {
      acc.errors = (acc.errors || []).concat(value.errors || []);
      acc.series = (acc.series || []).concat(value.series || []);

      // We would need to sensibly recude states here
      acc.state = value.state;
      acc.alertState = value.alertState;

      acc.timeRange = value.timeRange;
      acc.annotations = (acc.annotations || []).concat(value.annotations || []);
      // THIS IS GOING TO BREAK A LOADS OF THINGS
      acc.structureRev = value.structureRev;
      acc.timings = value.timings;
      acc.request = value.request;
      acc.traceIds = (acc.traceIds || []).concat(value.traceIds || []);
      return acc;
    }, {} as PanelData);
  }
}
