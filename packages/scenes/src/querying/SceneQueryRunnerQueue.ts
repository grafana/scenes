import { DataQueryRequest, DataSourceApi, LoadingState, PanelData } from '@grafana/data';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { DataQuery } from '@grafana/schema';

export abstract class HttpHandler {
  abstract handle(ds: DataSourceApi<DataQuery>, req: DataQueryRequest<DataQuery>): Observable<PanelData>
}

let sceneInterceptorService: InterceptorService;
export function initSceneQueryRunnerQueue(props?: SceneQueryRunnerQueueProps): void {
  if (!sceneInterceptorService) {
    sceneInterceptorService = new InterceptorService(props);
  }
}

export function getInterceptorService(initialState?: SceneQueryRunnerQueueProps): InterceptorService {
  if(!sceneInterceptorService){
    initSceneQueryRunnerQueue(initialState)
  }

  return sceneInterceptorService
}

interface HttpInterceptor {
  intercept(ds: DataSourceApi<DataQuery>, req: DataQueryRequest<DataQuery>, next: HttpHandler): Observable<PanelData>
}
type request = {req: DataQueryRequest<DataQuery>, ds: DataSourceApi<DataQuery>}
export class InterceptorService implements HttpInterceptor {
  private pendingRequests: request[] = [];
  private pendingRequestCount = 0;
  private pendingRequestsQueue: Array<{ reqID: string, req: DataQueryRequest<DataQuery>, ds: DataSourceApi<DataQuery> }> = [];
  private concurrencyLimit: number;
  // private responseBehaviorSubject: BehaviorSubject<HttpEvent<any>> = new BehaviorSubject<any>(null);

  private responseBehvaiorSubjectObject: any = {};

  public constructor(props?: SceneQueryRunnerQueueProps) {
    this.concurrencyLimit = 2 ?? props?.maxConcurrentQueries ?? 10
  }

  public intercept(ds: DataSourceApi<DataQuery>, request: DataQueryRequest<DataQuery>, next: HttpHandler): Observable<PanelData> {
    // Check if the pending requests are over limit
    if (this.pendingRequestCount >= this.concurrencyLimit) {
      // Push the new request into the pending queue
      const reqID: string = request.requestId
      this.pendingRequestsQueue.push({
        reqID,
        req: request,
        ds
      });
      this.responseBehvaiorSubjectObject[reqID] = new BehaviorSubject<any>(null);
      return this.responseBehvaiorSubjectObject[reqID].asObservable();
    } else {
      this.responseBehvaiorSubjectObject = {};
    }

    // Increment the pending request count
    this.pendingRequestCount++;

    // Push the request into the array of pending requests
    this.pendingRequests.push({
      req: request,
      ds
    });

    return next.handle(ds, request).pipe(
      tap(
        (event) => {
          // @todo streaming
          // When an event completes, allow the next one in the queue
          if(event.state === LoadingState.Done){
            // If request is done, decrement the pending request count
            this.pendingRequestCount--;
            this.sendRequestFromQueue(next);
          }else if(event.state === LoadingState.Error){
            // If request is done, decrement the pending request count
            this.pendingRequestCount--;
            this.sendRequestFromQueue(next)
          }

          return event;
        }
      ),
    );
  }

  private processNextRequest(ds: DataSourceApi<DataQuery>, request: DataQueryRequest<DataQuery>, next: HttpHandler, reqID: string): void {
    next.handle(ds, request).subscribe({
      next: (data) => {
        // @todo streaming/ split queries and cancelled queries
        if (data.state === LoadingState.Done) {
          this.sendRequestFromQueue(next);
          if(this.responseBehvaiorSubjectObject[reqID]){
            this.responseBehvaiorSubjectObject[reqID].next(data);
          }else{
            console.warn('Request ID missing?', reqID, this.responseBehvaiorSubjectObject)
          }

        } else if(data.state === LoadingState.Error) {
          this.sendRequestFromQueue(next);
          this.responseBehvaiorSubjectObject[reqID].next(data);
        }
      },
    })
  }

  // Function to Send Checks Queue and Send REQUEST FROM Queue
  private sendRequestFromQueue(next: HttpHandler) {
    // Process the pending queue if there are any requests
    if (this.pendingRequestsQueue.length > 0) {
      const nextOne = this.pendingRequestsQueue.shift();
      if(nextOne){
        const reqID = nextOne.reqID;
        const nextRequest = nextOne.req;
        const nextDs = nextOne.ds;
        this.processNextRequest(nextDs, nextRequest, next, reqID);
      }
    }
  }
}

export interface SceneQueryRunnerQueueProps {
  maxConcurrentQueries: number;
}

