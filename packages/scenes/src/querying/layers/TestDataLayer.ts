import { AnnotationEvent, arrayToDataFrame, DataTopic } from '@grafana/data';
import { Subscription } from 'rxjs';
import { emptyPanelData } from '../../core/SceneDataNode';
import { SceneDataLayerProvider, SceneDataLayerProviderState } from '../../core/types';
import { SceneDataLayerBase } from './SceneDataLayerBase';

interface TestAnnotationsDataLayerState extends SceneDataLayerProviderState {
  fakeAnnotations?: () => AnnotationEvent[];
  cancellationSpy?: jest.Mock;
  onEnableSpy?: jest.Mock;
  onDisableSpy?: jest.Mock;
}

export class TestAnnotationsDataLayer
  extends SceneDataLayerBase<TestAnnotationsDataLayerState>
  implements SceneDataLayerProvider
{
  public topic = DataTopic.Annotations;

  public constructor(state: TestAnnotationsDataLayerState) {
    super({
      ...state,
    });
  }

  public completeRun() {
    this.publishResults(this.getResults(), this.topic);
  }

  private getResults() {
    let ano: AnnotationEvent[] = [
      {
        time: 100,
        text: `${this.state.name}: Test annotation`,
        tags: ['tag1'],
      },
    ];

    if (this.state.fakeAnnotations) {
      ano = this.state.fakeAnnotations().map((a) => ({
        text: `${this.state.name}: Test annotation`,
        ...a,
      }));
    }

    return {
      ...emptyPanelData,
      annotations: [arrayToDataFrame(ano)],
    };
  }

  public cancelQuery() {
    if (this.state.cancellationSpy) {
      this.state.cancellationSpy();
    }
  }

  public onEnable(): void {
    if (this.state.onEnableSpy) {
      this.state.onEnableSpy();
    }
    // Emulate query
    this.setupQuerySub();
  }

  public onDisable(): void {
    if (this.state.onDisableSpy) {
      this.state.onDisableSpy();
    }
  }

  private setupQuerySub() {
    this.querySub = new Subscription();
  }
}
