import {
  SceneFlexLayout,
  SceneFlexItem,
  SceneQueryRunner,
  SceneAppPage,
  EmbeddedScene,
  SceneAppPageState,
  PanelBuilders,
  VizPanel,
  SceneObjectBase,
  SceneTimeRangeLike,
  sceneGraph,
  SceneTimeRangeState,
  SceneDataState,
  SceneTimeRange,
} from '@grafana/scenes';
import { DATASOURCE_REF } from '../constants';
import { getEmbeddedSceneDefaults } from './utils';
import { FieldType, MutableDataFrame, TimeRange, getDefaultTimeRange } from '@grafana/data';

export function getPanelTimeRangeHandlerDemoScene(defaults: SceneAppPageState): SceneAppPage {
  return new SceneAppPage({
    ...defaults,
    subTitle: 'This timeseries panel has the ability to select an alternative time range. ',
    getScene: () => {
      return new EmbeddedScene({
        ...getEmbeddedSceneDefaults(),
        body: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              height: 400,
              body: PanelBuilders.timeseries()
                .setData(getQueryRunnerFor3SeriesWithLabels())
                .setTitle('Change selection by mouse-dragging a time range')
                .setDisplayName('${__field.labels.cluster}')
                .setBehaviors(
                  [
                    (vizPanel: VizPanel) => {
                      patchPanelContext(vizPanel);
                      const altTimeRangeScene = sceneGraph.findObject(vizPanel, (scene) => {
                        return scene.state.key === 'altTimeRangeScene';
                      });

                      function representTimeRangeSelection(selection: TimeRange) {
                        const data = vizPanel.state.$data?.state.data;
                        if (!data) {
                          return;
                        }


                        const annotation = new RangeAnnotation();
                        annotation.addRange(
                          {
                            time: selection.from.unix() * 1000,
                            timeEnd: selection.to.unix() * 1000,
                            color: 'magenta',
                            text: "Alternate time range selection"
                          }
                        );

                        const newState: Partial<SceneDataState> = {
                          data: {
                            ...data,
                            annotations: [annotation]
                          }
                        }

                        vizPanel.state.$data?.setState(newState)
                        altTimeRangeScene?.state.$timeRange?.onTimeRangeChange(selection);
                      }

                      // Override time range update behavior
                      vizPanel.setState({
                        $timeRange: new TimeRangeChangeOverride({
                          onTimeRangeChange(timeRange) {
                            representTimeRangeSelection(timeRange);
                          },
                        })
                      });


                      // Restore time range selection if random walk is reset
                      vizPanel.state.$data?.subscribeToState((newState, oldState) => {
                        if (!newState.data) {
                          return;
                        }
                        if (!newState.data?.annotations?.length && !oldState.data?.annotations?.length) {
                          // Make new annotations, for the first time
                          if (altTimeRangeScene) {
                            const timeRange = altTimeRangeScene?.state.$timeRange?.state.value;
                            timeRange && representTimeRangeSelection(timeRange);
                          }
                        }
                        else if (!newState.data?.annotations?.length && oldState.data?.annotations?.length) {
                          // We can just ensure we retain the old annotations if they exist
                          newState.data.annotations = oldState.data.annotations;
                        }
                      });

                    }
                  ])
                .build(),
            }),
            new SceneFlexItem({
              height: 30,
              body: PanelBuilders.text().setOption('content', '').setTitle('Root time range from: ${__from:date:iso} to: ${__to:date:iso}').build(),
            }),
            new SceneFlexItem({
              key: "altTimeRangeScene",
              $timeRange: new SceneTimeRange(),
              height: 30,
              body: PanelBuilders.text().setOption('content', '').setTitle('Alternative (magenta) time range from: ${__from:date:iso} to: ${__to:date:iso}').build(),
            }),

          ],
        }),
      });
    },
  });
}

interface TimeRangeChangeOverrideState extends SceneTimeRangeState {
  alternateTimeRange: TimeRange
  onTimeRangeChange?: (timeRange: TimeRange) => void
}

class TimeRangeChangeOverride extends SceneObjectBase<TimeRangeChangeOverrideState> implements SceneTimeRangeLike {
  constructor(state: Omit<TimeRangeChangeOverrideState, 'from' | 'to' | 'value' | 'timeZone' | 'alternateTimeRange'> = {}) {
    super({
      ...state,
      // We set a default time range here. It will be overwritten on activation based on ancestor time range.
      from: 'now-6h',
      to: 'now',
      value: getDefaultTimeRange(),
      alternateTimeRange: getDefaultTimeRange(),
    }
    );

    this.addActivationHandler(() => {
      const timeRange = this.realTimeRange;

      this.setState({ ...timeRange.state, alternateTimeRange: timeRange.state.value });

      this._subs.add(
        timeRange.subscribeToState(
          (newState) => this.setState(newState)
        )
      )
    });
  }

  private get realTimeRange() {
    const scene = this.parent;
    if (!scene?.parent) {
      throw Error("A time range change override will not function if it is on a scene with no parent.");
    }
    const timeRange = sceneGraph.getTimeRange(scene?.parent);
    return timeRange;
  }

  onTimeRangeChange(timeRange: TimeRange): void {
    this.setState({ alternateTimeRange: timeRange });
    this.state.onTimeRangeChange?.(timeRange);
  }

  onTimeZoneChange(timeZone: string): void {
    this.realTimeRange.onTimeZoneChange(timeZone);
  }

  getTimeZone(): string {
    return this.realTimeRange.getTimeZone();
  }

  onRefresh(): void {
    this.realTimeRange.onRefresh();
  }
}

export function getQueryRunnerFor3SeriesWithLabels() {
  return new SceneQueryRunner({
    datasource: DATASOURCE_REF,
    queries: [
      {
        labels: 'cluster=eu',
        refId: 'A',
        scenarioId: 'random_walk',
        seriesCount: 1,
      },
      {
        hide: false,
        labels: 'cluster=us',
        refId: 'B',
        scenarioId: 'random_walk',
        seriesCount: 1,
      },
      {
        hide: false,
        labels: 'cluster=asia',
        refId: 'C',
        scenarioId: 'random_walk',
        seriesCount: 1,
      },
    ],
  });
}

class RangeAnnotation extends MutableDataFrame {
  constructor() {
    super();
    this.addField({
      name: 'time',
      type: FieldType.time,
    });
    this.addField({
      name: 'timeEnd',
      type: FieldType.time,
    });
    this.addField({
      name: 'isRegion',
      type: FieldType.boolean,
    });
    this.addField({
      name: 'color',
      type: FieldType.other,
    });
    this.addField({
      name: 'text',
      type: FieldType.string,
    });
  }
  addRange(entry: { time: number; timeEnd: number; color?: string; text: string }) {
    this.add({ ...entry, isRegion: true });
  }
}

function patchPanelContext(vizPanel: VizPanel) {
  // Avoid undefined errors by providing placeholder functions.
  // This is required for version of Grafana prior to viz tooltip enhancements (~10.3)
  // Until 10.3 & 10.4 still require `newVizTooltips` feature flag.
  const panelContext = vizPanel.getPanelContext();
  const nope = () => false;
  panelContext.canEditAnnotations = nope;
  panelContext.canDeleteAnnotations = nope;
}
