import { SceneQueryRunner, SceneDataQuery, SceneDataTransformer, CustomTransformerDefinition, SceneDataProvider, SceneObjectBase, SceneObject, SceneVariable, SceneObjectState, SceneTimeRangeState, ControlsLayout, VizConfig, VariableValue, VariableValueSingle, EmbeddedScene, EmbeddedSceneState, SceneComponentProps, SceneTimeRangeLike } from '@grafana/scenes';
import { DataSourceRef, DataTransformerConfig, VariableHide, VariableRefresh, VariableSort } from '@grafana/schema';
import React from 'react';
import { NavModelItem, AnnotationQuery, TimeRange } from '@grafana/data';

interface UseQueryOptions {
    queries: SceneDataQuery[];
    maxDataPoints?: number;
    datasource?: DataSourceRef;
    liveStreaming?: boolean;
    maxDataPointsFromWidth?: boolean;
}
/**
 * Maintains the state of SceneQueryRunner in the scene
 *
 * @example // To access query results do
 * const query = useQueryRunner(...);
 * const { data } = query.useState();
 */
declare function useQueryRunner(options: UseQueryOptions): SceneQueryRunner;

interface UseDataTransformerOptions {
    transformations: Array<DataTransformerConfig | CustomTransformerDefinition>;
    data: SceneDataProvider;
}
declare function useDataTransformer(options: UseDataTransformerOptions): SceneDataTransformer;

interface SceneContextObjectState extends SceneObjectState {
    childContexts?: SceneContextObject[];
    children: SceneObject[];
}
declare class SceneContextObject extends SceneObjectBase<SceneContextObjectState> {
    constructor(state?: Partial<SceneContextObjectState>);
    addToScene(obj: SceneObject): () => void;
    findByKey<T>(key: string): T | undefined;
    findVariable<T>(name: string): T | undefined;
    addVariable(variable: SceneVariable): () => void;
    addChildContext(ctx: SceneContextObject): void;
    removeChildContext(ctx: SceneContextObject): void;
}

declare const SceneContext: React.Context<SceneContextObject | null>;
interface SceneContextProviderProps {
    /**
     * Only the initial time range, cannot be used to update time range
     **/
    timeRange?: Partial<SceneTimeRangeState>;
    /**
     *  This makes it possbile to view running state of queries via
     *  refresh picker and also cancel all queries in the scene.
     */
    withQueryController?: boolean;
    /**
     * Children
     */
    children: React.ReactNode;
}
/**
 * Wrapps the react children in a SceneContext
 */
declare function SceneContextProvider({ children, timeRange, withQueryController }: SceneContextProviderProps): React.JSX.Element | null;

interface Props$4 {
}
declare function TimeRangePicker(props: Props$4): React.JSX.Element;

interface Props$3 {
    name: string;
    hideLabel?: boolean;
    layout?: ControlsLayout;
}
declare function VariableControl({ name, hideLabel, layout }: Props$3): React.JSX.Element;

interface VizPanelProps {
    title: string;
    dataProvider?: SceneDataProvider;
    viz: VizConfig;
    headerActions?: React.ReactNode;
}
declare function VizPanel(props: VizPanelProps): React.JSX.Element;

interface Props$2 {
    refresh?: string;
    withText?: boolean;
}
declare function RefreshPicker(props: Props$2): React.JSX.Element;

interface Props$1 {
    name: string;
}
declare function DataLayerControl({ name }: Props$1): React.JSX.Element;

interface VariableProps {
    name: string;
    label?: string;
    hide?: VariableHide;
    initialValue?: VariableValue;
}

interface CustomVariableProps extends VariableProps {
    query: string;
    isMulti?: boolean;
    includeAll?: boolean;
    children: React.ReactNode;
}
declare function CustomVariable({ query, name, label, hide, initialValue, isMulti, includeAll, children, }: CustomVariableProps): React.ReactNode;

interface DataSourceVariableProps extends VariableProps {
    pluginId: string;
    regex?: string;
    refresh?: VariableRefresh;
    sort?: VariableSort;
    isMulti?: boolean;
    includeAll?: boolean;
    children: React.ReactNode;
}
declare function DataSourceVariable({ pluginId, regex, name, label, hide, initialValue, isMulti, includeAll, children, }: DataSourceVariableProps): React.ReactNode;

interface QueryVariableProps extends VariableProps {
    query: string | SceneDataQuery;
    datasource: DataSourceRef | null;
    regex?: string;
    refresh?: VariableRefresh;
    sort?: VariableSort;
    isMulti?: boolean;
    includeAll?: boolean;
    children: React.ReactNode;
}
declare function QueryVariable({ query, name, datasource, label, hide, regex, refresh, sort, initialValue, isMulti, includeAll, children, }: QueryVariableProps): React.ReactNode;

/**
 * Code and concepts copied from https://github.com/grafana/hackathon-2023-12-grafana-react/blob/main/src/grafana-react
 *
 * These contexts & components needs some more thought and naming considerations, just a quick proof of concept for now.
 */
type BreadcrumbItem = Pick<NavModelItem, 'text' | 'url'>;
interface BreadcrumbContextValue {
    breadcrumbs: BreadcrumbItem[];
    addBreadcrumb(breadcrumb: BreadcrumbItem): void;
    removeBreadcrumb(breadcrumb: BreadcrumbItem): void;
}
declare const BreadcrumbContext: React.Context<BreadcrumbContextValue>;
declare function BreadcrumbProvider({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
interface BreadcrumbProps {
    text: string;
    path: string;
    extraKeys?: string[];
}
declare function Breadcrumb({ text, path, extraKeys }: BreadcrumbProps): React.ReactNode;

declare function useVariableValues<T = VariableValueSingle>(name: string): [T[] | undefined, boolean];

declare function useVariableValue<T = VariableValueSingle>(name: string): [T | undefined, boolean];

interface AnnotationLayerSetProps {
    name: string;
    query: AnnotationQuery;
    children: React.ReactNode;
}
declare function AnnotationLayer({ name, query, children }: AnnotationLayerSetProps): React.ReactNode;

declare class EmbeddedSceneWithContext extends EmbeddedScene {
    constructor(state: EmbeddedSceneState);
    static Component: ({ model }: SceneComponentProps<EmbeddedSceneWithContext>) => React.JSX.Element;
}

interface Props {
    minWidth?: number;
    minHeight?: number;
    children: React.ReactNode;
}
/**
 * Simple css grid layout for visualizations
 */
declare function VizGridLayout({ children, minWidth, minHeight }: Props): React.JSX.Element;

declare function useSceneContext(): SceneContextObject;
declare function useTimeRange(): [TimeRange, SceneTimeRangeLike];
/**
 * Only returns the variables on the closest context level.
 * We could modify it to extract all variables from the full context tree.
 */
declare function useVariables(): SceneVariable[];
interface UseUpdateWhenSceneChangesOptions {
    /** Variable names */
    variables?: string[];
    timeRange?: boolean;
}
interface UseUpdateWhenSceneChangesReason {
    variableName?: string;
    variableValue?: VariableValue | undefined | null;
    timeRange?: TimeRange;
}
/**
 * A utility hook to re-render the calling react component when specified variables or time range changes
 */
declare function useUpdateWhenSceneChanges({ timeRange, variables }: UseUpdateWhenSceneChangesOptions): UseUpdateWhenSceneChangesReason | undefined;
/**
 * Mainly a utility hook to re-render the calling react component when specified variables or time range changes
 */
declare function useVariableInterpolator(options: UseUpdateWhenSceneChangesOptions): (str: string) => string;

export { AnnotationLayer, Breadcrumb, BreadcrumbContext, BreadcrumbProvider, CustomVariable, DataLayerControl, DataSourceVariable, EmbeddedSceneWithContext, QueryVariable, RefreshPicker, SceneContext, SceneContextObject, SceneContextProvider, SceneContextProviderProps, TimeRangePicker, UseUpdateWhenSceneChangesOptions, UseUpdateWhenSceneChangesReason, VariableControl, VizGridLayout, VizPanel, useDataTransformer, useQueryRunner, useSceneContext, useTimeRange, useUpdateWhenSceneChanges, useVariableInterpolator, useVariableValue, useVariableValues, useVariables };
