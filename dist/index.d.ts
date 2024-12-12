import * as _grafana_data from '@grafana/data';
import { BusEventWithPayload, PanelData, BusEvent, BusEventType, BusEventHandler, TimeRange, DataQueryRequest, DataSourceGetTagKeysOptions, DataSourceGetTagValuesOptions, DataTransformContext, DataFrame, UrlQueryMap, PanelPlugin, EventBus, DataQuery as DataQuery$1, DataSourceApi, Registry, RegistryItem, ScopedVars, AdHocVariableFilter, SelectableValue, MetricFindValue, GetTagResponse, VariableRefresh as VariableRefresh$1, VariableSort, EventFilterOptions, AnnotationEvent, AnnotationQuery, DataTransformerConfig, PanelMenuItem, FieldConfigSource, PanelModel, AbsoluteTimeRange, InterpolateFunction, IconName as IconName$1, PageLayoutType, FieldConfig, FieldType, FieldValueMatcherConfig, ScopedVar } from '@grafana/data';
import * as React$1 from 'react';
import React__default, { CSSProperties, ComponentType } from 'react';
import * as rxjs from 'rxjs';
import { Observable, Unsubscribable, MonoTypeOperatorFunction, Subscription, ReplaySubject } from 'rxjs';
import * as _grafana_schema from '@grafana/schema';
import { VariableType, VariableHide, TimeZone, DataTopic, DataQuery, DataSourceRef, VariableRefresh, LoadingState, DashboardCursorSync, MatcherConfig, TableFieldOptions } from '@grafana/schema';
import { LocationService, VariableInterpolation } from '@grafana/runtime';
import { Location } from 'history';
import { PanelContext, IconName } from '@grafana/ui';
import ReactGridLayout from 'react-grid-layout';
import { RouteComponentProps } from 'react-router-dom';
import { Options, FieldConfig as FieldConfig$1 } from '@grafana/schema/dist/esm/raw/composable/barchart/panelcfg/x/BarChartPanelCfg_types.gen';
import { Options as Options$1 } from '@grafana/schema/dist/esm/raw/composable/bargauge/panelcfg/x/BarGaugePanelCfg_types.gen';
import { Options as Options$2 } from '@grafana/schema/dist/esm/raw/composable/datagrid/panelcfg/x/DatagridPanelCfg_types.gen';
import { Options as Options$3 } from '@grafana/schema/dist/esm/raw/composable/gauge/panelcfg/x/GaugePanelCfg_types.gen';
import { Options as Options$4 } from '@grafana/schema/dist/esm/raw/composable/geomap/panelcfg/x/GeomapPanelCfg_types.gen';
import { Options as Options$5, FieldConfig as FieldConfig$2 } from '@grafana/schema/dist/esm/raw/composable/heatmap/panelcfg/x/HeatmapPanelCfg_types.gen';
import { Options as Options$6, FieldConfig as FieldConfig$3 } from '@grafana/schema/dist/esm/raw/composable/histogram/panelcfg/x/HistogramPanelCfg_types.gen';
import { Options as Options$7 } from '@grafana/schema/dist/esm/raw/composable/logs/panelcfg/x/LogsPanelCfg_types.gen';
import { Options as Options$8 } from '@grafana/schema/dist/esm/raw/composable/news/panelcfg/x/NewsPanelCfg_types.gen';
import { Options as Options$9 } from '@grafana/schema/dist/esm/raw/composable/nodegraph/panelcfg/x/NodeGraphPanelCfg_types.gen';
import { Options as Options$a, FieldConfig as FieldConfig$4 } from '@grafana/schema/dist/esm/raw/composable/piechart/panelcfg/x/PieChartPanelCfg_types.gen';
import { Options as Options$b } from '@grafana/schema/dist/esm/raw/composable/stat/panelcfg/x/StatPanelCfg_types.gen';
import { Options as Options$c, FieldConfig as FieldConfig$5 } from '@grafana/schema/dist/esm/raw/composable/statetimeline/panelcfg/x/StateTimelinePanelCfg_types.gen';
import { Options as Options$d, FieldConfig as FieldConfig$6 } from '@grafana/schema/dist/esm/raw/composable/statushistory/panelcfg/x/StatusHistoryPanelCfg_types.gen';
import { Options as Options$e } from '@grafana/schema/dist/esm/raw/composable/table/panelcfg/x/TablePanelCfg_types.gen';
import { Options as Options$f } from '@grafana/schema/dist/esm/raw/composable/text/panelcfg/x/TextPanelCfg_types.gen';
import { Options as Options$g, FieldConfig as FieldConfig$7 } from '@grafana/schema/dist/esm/raw/composable/timeseries/panelcfg/x/TimeSeriesPanelCfg_types.gen';
import { Options as Options$h, FieldConfig as FieldConfig$8 } from '@grafana/schema/dist/esm/raw/composable/trend/panelcfg/x/TrendPanelCfg_types.gen';
import { Options as Options$i } from '@grafana/schema/dist/esm/raw/composable/xychart/panelcfg/x/XYChartPanelCfg_types.gen';

interface SceneVariableState extends SceneObjectState {
    type: VariableType;
    name: string;
    label?: string;
    hide?: VariableHide;
    skipUrlSync?: boolean;
    loading?: boolean;
    error?: any | null;
    description?: string | null;
}
interface SceneVariable<TState extends SceneVariableState = SceneVariableState> extends SceneObject<TState> {
    /**
     * This function is called on activation or when a dependency changes.
     */
    validateAndUpdate?(): Observable<ValidateAndUpdateResult>;
    /**
     * Should return the value for the given field path
     */
    getValue(fieldPath?: string): VariableValue | undefined | null;
    /**
     * Should return the value display text, used by the "text" formatter
     * Example: ${podId:text}
     * Useful for variables that have non user friendly values but friendly display text names.
     */
    getValueText?(fieldPath?: string): string;
    /**
     * For special edge case senarios. For example local function that locally scoped variables can implement.
     **/
    isAncestorLoading?(): boolean;
    /**
     * Allows cancelling variable execution.
     */
    onCancel?(): void;
    /**
     * @experimental
     * Indicates that a variable loads values lazily when user interacts with the variable dropdown.
     */
    isLazy?: boolean;
}
type VariableValue = VariableValueSingle | VariableValueSingle[];
type VariableValueSingle = string | boolean | number | CustomVariableValue;
/**
 * This is for edge case values like the custom "allValue" that should not be escaped/formatted like other values
 * The custom all value usually contain wildcards that should not be escaped.
 */
interface CustomVariableValue {
    /**
     * The format name or function used in the expression
     */
    formatter(formatNameOrFn?: string | VariableCustomFormatterFn): string;
}
interface ValidateAndUpdateResult {
}
interface VariableValueOption {
    label: string;
    value: VariableValueSingle;
    group?: string;
}
interface SceneVariableSetState extends SceneObjectState {
    variables: SceneVariable[];
}
interface SceneVariables extends SceneObject<SceneVariableSetState> {
    /**
     * Will look for and return variable matching name
     */
    getByName(name: string): SceneVariable | undefined;
    /**
     * Will return true if the variable is loading or waiting for an update to complete.
     */
    isVariableLoadingOrWaitingToUpdate(variable: SceneVariable): boolean;
}
declare class SceneVariableValueChangedEvent extends BusEventWithPayload<SceneVariable> {
    static type: string;
}
interface SceneVariableDependencyConfigLike {
    /** Return all variable names this object depend on */
    getNames(): Set<string>;
    /** Used to check for dependency on a specific variable */
    hasDependencyOn(name: string): boolean;
    /**
     * Will be called when the VariableSet have completed an update process or when a variable has changed value.
     **/
    variableUpdateCompleted(variable: SceneVariable, hasChanged: boolean): void;
}
/**
 * Used in CustomFormatterFn
 */
interface CustomFormatterVariable {
    name: string;
    type: VariableType;
    multi?: boolean;
    includeAll?: boolean;
}
type VariableCustomFormatterFn = (value: unknown, legacyVariableModel: Partial<CustomFormatterVariable>, legacyDefaultFormatter?: VariableCustomFormatterFn) => string;
type InterpolationFormatParameter = string | VariableCustomFormatterFn | undefined;
declare function isCustomVariableValue(value: VariableValue): value is CustomVariableValue;

declare class SceneObjectRef<T> {
    #private;
    constructor(ref: T);
    resolve(): T;
}

interface SceneObjectState {
    key?: string;
    $timeRange?: SceneTimeRangeLike;
    $data?: SceneDataProvider;
    $variables?: SceneVariables;
    /**
     * @experimental
     * Can be used to add extra behaviors to a scene object.
     * These are activated when the their parent scene object is activated.
     */
    $behaviors?: Array<SceneObject | SceneStatelessBehavior>;
}
interface SceneLayoutChildOptions {
    width?: number | string;
    height?: number | string;
    xSizing?: 'fill' | 'content';
    ySizing?: 'fill' | 'content';
    x?: number;
    y?: number;
    minWidth?: number | string;
    minHeight?: number | string;
    isDraggable?: boolean;
    isResizable?: boolean;
}
interface SceneComponentProps<T> {
    model: T;
}
type SceneComponent<TModel> = (props: SceneComponentProps<TModel>) => React__default.ReactElement | null;
interface SceneDataState extends SceneObjectState {
    data?: PanelData;
}
interface SceneObject<TState extends SceneObjectState = SceneObjectState> {
    /** The current state */
    readonly state: TState;
    /** True when there is a React component mounted for this Object */
    readonly isActive: boolean;
    /** SceneObject parent */
    readonly parent?: SceneObject;
    /** This abtractions declares what variables the scene object depends on and how to handle when they change value. **/
    readonly variableDependency?: SceneVariableDependencyConfigLike;
    /** This abstraction declares URL sync dependencies of a scene object. **/
    readonly urlSync?: SceneObjectUrlSyncHandler;
    /** Subscribe to state changes */
    subscribeToState(handler: SceneStateChangedHandler<TState>): Unsubscribable;
    /** Subscribe to a scene event */
    subscribeToEvent<T extends BusEvent>(typeFilter: BusEventType<T>, handler: BusEventHandler<T>): Unsubscribable;
    /** Publish an event and optionally bubble it up the scene */
    publishEvent(event: BusEvent, bubble?: boolean): void;
    /** Utility hook that wraps useObservable. Used by React components to subscribes to state changes */
    useState(): TState;
    /** How to modify state */
    setState(state: Partial<TState>): void;
    /**
     * Called when the Component is mounted. This will also activate any $data, $variables or $timeRange scene object on this level.
     * Don't override this in your custom SceneObjects, instead use addActivationHandler from the constructor.
     **/
    activate(): CancelActivationHandler;
    /** Get the scene root */
    getRoot(): SceneObject;
    /** Returns a deep clone this object and all its children */
    clone(state?: Partial<TState>): this;
    /** A React component to use for rendering the object */
    Component(props: SceneComponentProps<SceneObject<TState>>): React__default.ReactElement | null;
    /** Force a re-render, should only be needed when variable values change */
    forceRender(): void;
    /** Returns a SceneObjectRef that will resolve to this object */
    getRef(): SceneObjectRef<this>;
    /**
     * Allows external code to register code that is executed on activate and deactivate. This allow you
     * to wire up scene objects that need to respond to state changes in other objects from the outside.
     **/
    addActivationHandler(handler: SceneActivationHandler): void;
    /**
     * Loop through state and call callback for each direct child scene object.
     * Checks 1 level deep properties and arrays. So a scene object hidden in a nested plain object will not be detected.
     */
    forEachChild(callback: (child: SceneObject) => void): void;
}
type SceneActivationHandler = () => SceneDeactivationHandler | void;
type SceneDeactivationHandler = () => void;
/**
 * Function returned by activate() that when called will deactivate the object if it's the last activator
 **/
type CancelActivationHandler = () => void;
interface SceneLayoutState extends SceneObjectState {
    children: SceneObject[];
}
interface SceneLayout<T extends SceneLayoutState = SceneLayoutState> extends SceneObject<T> {
    isDraggable(): boolean;
    getDragClass?(): string;
    getDragClassCancel?(): string;
}
interface SceneTimeRangeState extends SceneObjectState {
    from: string;
    to: string;
    fiscalYearStartMonth?: number;
    value: TimeRange;
    timeZone?: TimeZone;
    /** weekStart will change the global date locale so having multiple different weekStart values is not supported  */
    weekStart?: string;
    /**
     * @internal
     * To enable feature parity with the old time range picker, not sure if it will be kept.
     * Override the now time by entering a time delay. Use this option to accommodate known delays in data aggregation to avoid null values.
     * */
    UNSAFE_nowDelay?: string;
    refreshOnActivate?: {
        /**
         * When set, the time range will invalidate relative ranges after the specified interval has elapsed
         */
        afterMs?: number;
        /**
         * When set, the time range will invalidate relative ranges after the specified percentage of the current interval has elapsed.
         * If both invalidate values are set, the smaller value will be used for the given interval.
         */
        percent?: number;
    };
}
interface SceneTimeRangeLike extends SceneObject<SceneTimeRangeState> {
    onTimeZoneChange(timeZone: TimeZone): void;
    onTimeRangeChange(timeRange: TimeRange): void;
    onRefresh(): void;
    getTimeZone(): TimeZone;
}
declare function isSceneObject(obj: any): obj is SceneObject;
interface SceneObjectWithUrlSync extends SceneObject {
    getUrlState(): SceneObjectUrlValues;
    updateFromUrl(values: SceneObjectUrlValues): void;
    shouldCreateHistoryStep?(values: SceneObjectUrlValues): boolean;
}
interface SceneObjectUrlSyncHandler {
    getKeys(): string[];
    getUrlState(): SceneObjectUrlValues;
    updateFromUrl(values: SceneObjectUrlValues): void;
    shouldCreateHistoryStep?(values: SceneObjectUrlValues): boolean;
}
interface DataRequestEnricher {
    enrichDataRequest(source: SceneObject): Partial<DataQueryRequest> | null;
}
interface FiltersRequestEnricher {
    enrichFiltersRequest(source: SceneObject): Partial<DataSourceGetTagKeysOptions | DataSourceGetTagValuesOptions> | null;
}
declare function isDataRequestEnricher(obj: any): obj is DataRequestEnricher;
declare function isFiltersRequestEnricher(obj: any): obj is FiltersRequestEnricher;
type SceneObjectUrlValue = string | string[] | undefined | null;
type SceneObjectUrlValues = Record<string, SceneObjectUrlValue>;
type CustomTransformOperator = (context: DataTransformContext) => MonoTypeOperatorFunction<DataFrame[]>;
type CustomTransformerDefinition = {
    operator: CustomTransformOperator;
    topic: DataTopic;
} | CustomTransformOperator;
type SceneStateChangedHandler<TState> = (newState: TState, prevState: TState) => void;
type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
interface SceneDataProviderResult {
    data: PanelData;
    origin: SceneDataProvider;
}
interface SceneDataProvider<T extends SceneObjectState = SceneDataState> extends SceneObject<T> {
    setContainerWidth?: (width: number) => void;
    isDataReadyToDisplay?: () => boolean;
    cancelQuery?: () => void;
    getResultsStream(): Observable<SceneDataProviderResult>;
}
interface SceneDataLayerProviderState extends SceneDataState {
    name: string;
    description?: string;
    isEnabled?: boolean;
    isHidden?: boolean;
}
interface SceneDataLayerProvider extends SceneDataProvider<SceneDataLayerProviderState> {
    isDataLayer: true;
}
declare function isDataLayer(obj: SceneObject): obj is SceneDataLayerProvider;
interface DataLayerFilter {
    panelId: number;
}
interface SceneStatelessBehavior<T extends SceneObject = any> {
    (sceneObject: T): CancelActivationHandler | void;
}
type ControlsLayout = 'horizontal' | 'vertical';
interface UseStateHookOptions {
    /**
     * For some edge cases other scene objects want to subscribe to scene object state for objects
     * that are not active, or whose main React Component can be un-mounted. Set this to true
     * to keep the scene object active even if the React component is unmounted.
     *
     * Normally you would not need this but this can be useful in some edge cases.
     *
     * @experimental
     */
    shouldActivateOrKeepAlive?: boolean;
}
interface SceneDataQuery extends DataQuery {
    [key: string]: any;
    timeRangeCompare?: boolean;
}
interface SceneUrlSyncOptions {
    /**
     * This will update the url to contain all scene url state
     * when the scene is initialized. Important for browser history "back" actions.
     */
    updateUrlOnInit?: boolean;
    /**
     * This is only supported by some objects if they implement
     * shouldCreateHistoryStep where they can control what changes
     * url changes should add a new browser history entry.
     */
    createBrowserHistorySteps?: boolean;
}

/**
 *
 * @param path Url to append query params to
 * @param searchObject Query params of the URL
 * @param preserveParams Query params to preserve
 * @returns Url with query params
 */
declare function getUrlWithAppState(path: string, searchObject: UrlQueryMap, preserveParams?: string[]): string;

interface RuntimePanelPluginOptions {
    /**
     * Please specify a pluginId that is unlikely to collide with other plugins.
     */
    pluginId: string;
    plugin: PanelPlugin;
}
/**
 * Provides a way to register runtime panel plugins.
 * Please use a pluginId that is unlikely to collide with other plugins.
 */
declare function registerRuntimePanelPlugin({ pluginId, plugin }: RuntimePanelPluginOptions): void;

declare abstract class SceneObjectBase<TState extends SceneObjectState = SceneObjectState> implements SceneObject<TState> {
    private _isActive;
    private _state;
    private _activationHandlers;
    private _deactivationHandlers;
    private _ref?;
    protected _events?: EventBus;
    protected _parent?: SceneObject;
    protected _subs: Subscription;
    protected _refCount: number;
    protected _variableDependency: SceneVariableDependencyConfigLike | undefined;
    protected _urlSync: SceneObjectUrlSyncHandler | undefined;
    constructor(state: TState);
    /** Current state */
    get state(): TState;
    /** True if currently being active (ie displayed for visual objects) */
    get isActive(): boolean;
    /** Returns the parent, undefined for root object */
    get parent(): SceneObject | undefined;
    /** Returns variable dependency config */
    get variableDependency(): SceneVariableDependencyConfigLike | undefined;
    /** Returns url sync config */
    get urlSync(): SceneObjectUrlSyncHandler | undefined;
    /**
     * Used in render functions when rendering a SceneObject.
     * Wraps the component in an EditWrapper that handles edit mode
     */
    get Component(): SceneComponent<this>;
    private _setParent;
    /**
     * Sometimes you want to move one instance to another parent.
     * This is a way to do that without getting the console warning.
     */
    clearParent(): void;
    /**
     * Subscribe to the scene state subject
     **/
    subscribeToState(handler: SceneStateChangedHandler<TState>): Unsubscribable;
    /**
     * Subscribe to the scene event
     **/
    subscribeToEvent<T extends BusEvent>(eventType: BusEventType<T>, handler: BusEventHandler<T>): Unsubscribable;
    setState(update: Partial<TState>): void;
    /**
     * This handles activation and deactivation of $data, $timeRange and $variables when they change
     * during the active phase of the scene object.
     */
    private _handleActivationOfChangedStateProps;
    private _handleChangedStateActivation;
    private _handleChangedBehaviors;
    publishEvent(event: BusEvent, bubble?: boolean): void;
    getRoot(): SceneObject;
    private _internalActivate;
    private _activateBehavior;
    /**
     * This is primarily called from SceneComponentWrapper when the SceneObject's Component is mounted.
     * But in some scenarios this can also be called directly from another scene object. When called manually from another scene object
     * make sure to call the returned function when the source scene object is deactivated.
     */
    activate(): CancelActivationHandler;
    /**
     * Called by the SceneComponentWrapper when the react component is unmounted.
     * Don't override this, instead use addActivationHandler. The activation handler can return a deactivation handler.
     */
    private _internalDeactivate;
    /**
     * Utility hook to get and subscribe to state
     */
    useState(): TState;
    /** Force a re-render, should only be needed when variable values change */
    forceRender(): void;
    /**
     * Will create new SceneObject with shallow-cloned state, but all state items of type SceneObject are deep cloned
     */
    clone(withState?: Partial<TState>): this;
    /**
     * Allows external code to register code that is executed on activate and deactivate. This allow you
     * to wire up scene objects that need to respond to state changes in other objects from the outside.
     **/
    addActivationHandler(handler: SceneActivationHandler): void;
    /**
     * Loop through state and call callback for each direct child scene object.
     * Checks 1 level deep properties and arrays. So a scene object hidden in a nested plain object will not be detected.
     */
    forEachChild(callback: (child: SceneObjectBase) => void): void;
    /** Returns a SceneObjectRef that will resolve to this object */
    getRef(): SceneObjectRef<this>;
}
/**
 * This hook is always returning model.state instead of a useState that remembers the last state emitted on the subject
 * The reason for this is so that if the model instance change this function will always return the latest state.
 */
declare function useSceneObjectState<TState extends SceneObjectState>(model: SceneObject<TState>, options?: UseStateHookOptions): TState;

declare function cloneSceneObjectState<TState extends SceneObjectState>(sceneState: TState, withState?: Partial<TState>): TState;

declare abstract class RuntimeDataSource<TQuery extends DataQuery$1 = DataQuery$1> extends DataSourceApi<TQuery> {
    constructor(pluginId: string, uid: string);
    testDatasource(): Promise<any>;
}
interface RuntimeDataSourceOptions {
    dataSource: RuntimeDataSource;
}
/**
 * Provides a way to register runtime panel plugins.
 * Please use a pluginId that is unlikely to collide with other plugins.
 */
declare function registerRuntimeDataSource({ dataSource }: RuntimeDataSourceOptions): void;

/**
 * @param root
 * @returns the full scene url state as a object with keys and values
 */
declare function getUrlState(root: SceneObject): SceneObjectUrlValues;
/**
 * Exported util function to sync state from an initial url state.
 * Useful for initializing an embedded scenes with a url state string.
 */
declare function syncStateFromSearchParams(root: SceneObject, urlParams: URLSearchParams): void;

interface FormatRegistryItem extends RegistryItem {
    formatter(value: VariableValue, args: string[], variable: FormatVariable): string;
}
/**
 * Slimmed down version of the SceneVariable interface so that it only contains what the formatters actually use.
 * This is useful as we have some implementations of this interface that does not need to be full scene objects.
 * For example ScopedVarsVariable and LegacyVariableWrapper.
 */
interface FormatVariable {
    state: {
        name: string;
        type: VariableType | string;
        isMulti?: boolean;
        includeAll?: boolean;
    };
    getValue(fieldPath?: string): VariableValue | undefined | null;
    getValueText?(fieldPath?: string): string;
    urlSync?: SceneObjectUrlSyncHandler;
}
declare const formatRegistry: Registry<FormatRegistryItem>;

interface MacroVariableConstructor {
    new (name: string, sceneObject: SceneObject, fullMatch: string, scopedVars?: ScopedVars): FormatVariable;
}

/**
 * Allows you to register a variable expression macro that can then be used in strings with syntax ${<macro_name>.<fieldPath>}
 * Call this on app activation and unregister the macro on deactivation.
 * @returns a function that unregisters the macro
 */
declare function registerVariableMacro(name: string, macro: MacroVariableConstructor): () => void;

declare function renderPrometheusLabelFilters(filters: AdHocVariableFilter[]): string;

declare class AdHocFiltersVariableUrlSyncHandler implements SceneObjectUrlSyncHandler {
    private _variable;
    constructor(_variable: AdHocFiltersVariable);
    private getKey;
    getKeys(): string[];
    getUrlState(): SceneObjectUrlValues;
    updateFromUrl(values: SceneObjectUrlValues): void;
}

interface AdHocFilterWithLabels extends AdHocVariableFilter {
    keyLabel?: string;
    valueLabels?: string[];
}
type AdHocControlsLayout = ControlsLayout | 'combobox';
interface AdHocFiltersVariableState extends SceneVariableState {
    /** Optional text to display on the 'add filter' button */
    addFilterButtonText?: string;
    /** The visible filters */
    filters: AdHocFilterWithLabels[];
    /** Base filters to always apply when looking up keys*/
    baseFilters?: AdHocFilterWithLabels[];
    /** Datasource to use for getTagKeys and getTagValues and also controls which scene queries the filters should apply to */
    datasource: DataSourceRef | null;
    /** Controls if the filters can be changed */
    readOnly?: boolean;
    /**
     * @experimental
     * Controls the layout and design of the label.
     */
    layout?: AdHocControlsLayout;
    /**
     * Defaults to automatic which means filters will automatically be applied to all queries with the same data source as this AdHocFilterSet.
     * In manual mode you either have to use the filters programmatically or as a variable inside query expressions.
     */
    applyMode: 'auto' | 'manual';
    /**
     * Filter out the keys that do not match the regex.
     */
    tagKeyRegexFilter?: RegExp;
    /**
     * Extension hook for customizing the key lookup.
     * Return replace: true if you want to override the default lookup
     * Return replace: false if you want to combine the results with the default lookup
     */
    getTagKeysProvider?: getTagKeysProvider$1;
    /**
     * Extension hook for customizing the value lookup.
     * Return replace: true if you want to override the default lookup.
     * Return replace: false if you want to combine the results with the default lookup
     */
    getTagValuesProvider?: getTagValuesProvider;
    /**
     * Optionally provide an array of static keys that override getTagKeys
     */
    defaultKeys?: MetricFindValue[];
    /**
     * This is the expression that the filters resulted in. Defaults to
     * Prometheus / Loki compatible label filter expression
     */
    filterExpression?: string;
    /**
     * The default builder creates a Prometheus/Loki compatible filter expression,
     * this can be overridden to create a different expression based on the current filters.
     */
    expressionBuilder?: AdHocVariableExpressionBuilderFn;
    /**
     * Whether the filter supports new multi-value operators like =| and !=|
     */
    supportsMultiValueOperators?: boolean;
    /**
     * When querying the datasource for label names and values to determine keys and values
     * for this ad hoc filter, consider the queries in the scene and use them as a filter.
     * This queries filter can be used to ensure that only ad hoc filter options that would
     * impact the current queries are presented to the user.
     */
    useQueriesAsFilterForOptions?: boolean;
    /**
     * @internal state of the new filter being added
     */
    _wip?: AdHocFilterWithLabels;
}
type AdHocVariableExpressionBuilderFn = (filters: AdHocFilterWithLabels[]) => string;
type getTagKeysProvider$1 = (variable: AdHocFiltersVariable, currentKey: string | null) => Promise<{
    replace?: boolean;
    values: GetTagResponse | MetricFindValue[];
}>;
type getTagValuesProvider = (variable: AdHocFiltersVariable, filter: AdHocFilterWithLabels) => Promise<{
    replace?: boolean;
    values: GetTagResponse | MetricFindValue[];
}>;
declare class AdHocFiltersVariable extends SceneObjectBase<AdHocFiltersVariableState> implements SceneVariable<AdHocFiltersVariableState> {
    static Component: typeof AdHocFiltersVariableRenderer;
    private _scopedVars;
    private _dataSourceSrv;
    protected _urlSync: AdHocFiltersVariableUrlSyncHandler;
    constructor(state: Partial<AdHocFiltersVariableState>);
    setState(update: Partial<AdHocFiltersVariableState>): void;
    getValue(): VariableValue | undefined;
    _updateFilter(filter: AdHocFilterWithLabels, update: Partial<AdHocFilterWithLabels>): void;
    _removeFilter(filter: AdHocFilterWithLabels): void;
    _removeLastFilter(): void;
    /**
     * Get possible keys given current filters. Do not call from plugins directly
     */
    _getKeys(currentKey: string | null): Promise<Array<SelectableValue<string>>>;
    /**
     * Get possible key values for a specific key given current filters. Do not call from plugins directly
     */
    _getValuesFor(filter: AdHocFilterWithLabels): Promise<Array<SelectableValue<string>>>;
    _addWip(): void;
    _getOperators(): SelectableValue<string>[];
}
declare function AdHocFiltersVariableRenderer({ model }: SceneComponentProps<AdHocFiltersVariable>): React__default.JSX.Element;

interface ConstantVariableState extends SceneVariableState {
    value: VariableValue;
}
declare class ConstantVariable extends SceneObjectBase<ConstantVariableState> implements SceneVariable<ConstantVariableState> {
    constructor(initialState: Partial<ConstantVariableState>);
    getValue(): VariableValue;
}

interface VariableDependencyConfigOptions<TState extends SceneObjectState> {
    /**
     * State paths to scan / extract variable dependencies from. Leave empty to scan all paths.
     */
    statePaths?: Array<keyof TState | '*'>;
    /**
     * Explicit list of variable names to depend on. Leave empty to scan state for dependencies.
     */
    variableNames?: string[];
    /**
     * Optional way to customize how to handle when a dependent variable changes
     * If not specified the default behavior is to trigger a re-render
     */
    onReferencedVariableValueChanged?: (variable: SceneVariable) => void;
    /**
     * Two scenarios trigger this callback to be called.
     * 1. When any direct dependency changed value
     * 2. In case hasDependencyInLoadingState was called and returned true we really care about any variable update. So in this scenario this callback is called
     *    after any variable update completes. This is to cover scenarios where an object is waiting for indirect dependencies to complete.
     */
    onVariableUpdateCompleted?: () => void;
    /**
     * Optional way to subscribe to all variable value changes, even to variables that are not dependencies.
     */
    onAnyVariableChanged?: (variable: SceneVariable) => void;
}
declare class VariableDependencyConfig<TState extends SceneObjectState> implements SceneVariableDependencyConfigLike {
    private _sceneObject;
    private _options;
    private _state;
    private _dependencies;
    private _statePaths?;
    private _isWaitingForVariables;
    scanCount: number;
    constructor(_sceneObject: SceneObject<TState>, _options: VariableDependencyConfigOptions<TState>);
    /**
     * Used to check for dependency on a specific variable
     */
    hasDependencyOn(name: string): boolean;
    /**
     * This is called whenever any set of variables have new values. It is up to this implementation to check if it's relevant given the current dependencies.
     */
    variableUpdateCompleted(variable: SceneVariable, hasChanged: boolean): void;
    hasDependencyInLoadingState(): boolean;
    getNames(): Set<string>;
    /**
     * Update variableNames
     */
    setVariableNames(varNames: string[]): void;
    setPaths(paths: Array<keyof TState | '*'>): void;
    private scanStateForDependencies;
    private extractVariablesFrom;
}

interface MultiValueVariableState extends SceneVariableState {
    value: VariableValue;
    text: VariableValue;
    options: VariableValueOption[];
    isMulti?: boolean;
    includeAll?: boolean;
    defaultToAll?: boolean;
    allValue?: string;
    placeholder?: string;
    /**
     * For multi value variables, this option controls how many values to show before they are collapsed into +N.
     * Defaults to 5
     */
    maxVisibleValues?: number;
    noValueOnClear?: boolean;
    isReadOnly?: boolean;
}
interface VariableGetOptionsArgs {
    searchFilter?: string;
}
declare abstract class MultiValueVariable<TState extends MultiValueVariableState = MultiValueVariableState> extends SceneObjectBase<TState> implements SceneVariable<TState> {
    protected _urlSync: SceneObjectUrlSyncHandler;
    /**
     * Set to true to skip next value validation to maintain the current value even it it's not among the options (ie valid values)
     */
    skipNextValidation?: boolean;
    /**
     * The source of value options.
     */
    abstract getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]>;
    /**
     * This function is called on when SceneVariableSet is activated or when a dependency changes.
     */
    validateAndUpdate(): Observable<ValidateAndUpdateResult>;
    onCancel(): void;
    /**
     * Check if current value is valid given new options. If not update the value.
     */
    private updateValueGivenNewOptions;
    private getStateUpdateGivenNewOptions;
    /**
     * Values set by initial URL sync needs to survive the next validation and update.
     * This function can intercept and make sure those values are preserved.
     */
    protected interceptStateUpdateAfterValidation(stateUpdate: Partial<MultiValueVariableState>): void;
    getValue(): VariableValue;
    getValueText(): string;
    hasAllValue(): boolean;
    getDefaultMultiState(options: VariableValueOption[]): {
        value: VariableValueSingle[];
        text: string[];
    };
    /**
     * Change the value and publish SceneVariableValueChangedEvent event.
     */
    changeValueTo(value: VariableValue, text?: VariableValue): void;
    private findLabelTextForValue;
    /**
     * This helper function is to counter the contravariance of setState
     */
    private setStateHelper;
    getOptionsForSelect(): VariableValueOption[];
    refreshOptions(): void;
    /**
     * Can be used by subclasses to do custom handling of option search based on search input
     */
    onSearchChange?(searchFilter: string): void;
}

interface CustomVariableState extends MultiValueVariableState {
    query: string;
}
declare class CustomVariable extends MultiValueVariable<CustomVariableState> {
    protected _variableDependency: VariableDependencyConfig<CustomVariableState>;
    constructor(initialState: Partial<CustomVariableState>);
    getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]>;
    static Component: ({ model }: SceneComponentProps<MultiValueVariable>) => React$1.JSX.Element;
}

interface DataSourceVariableState extends MultiValueVariableState {
    /**
     * Include all data source instances with this plugin id
     */
    pluginId: string;
    /**
     * Filter data source instances based on name
     */
    regex: string;
    /**
     * For backwards compatability with old dashboards, will likely be removed
     */
    defaultOptionEnabled?: boolean;
}
declare class DataSourceVariable extends MultiValueVariable<DataSourceVariableState> {
    protected _variableDependency: VariableDependencyConfig<DataSourceVariableState>;
    constructor(initialState: Partial<DataSourceVariableState>);
    getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]>;
    static Component: ({ model }: SceneComponentProps<MultiValueVariable>) => React$1.JSX.Element;
}

interface IntervalVariableState extends SceneVariableState {
    intervals: string[];
    value: string;
    autoEnabled: boolean;
    autoMinInterval: string;
    autoStepCount: number;
    refresh: VariableRefresh;
}
declare class IntervalVariable extends SceneObjectBase<IntervalVariableState> implements SceneVariable<IntervalVariableState> {
    constructor(initialState: Partial<IntervalVariableState>);
    private getKey;
    getUrlState(): {
        [x: string]: string;
    };
    updateFromUrl(values: SceneObjectUrlValues): void;
    getOptionsForSelect(): Array<SelectableValue<string>>;
    getValue(): VariableValue;
    private getAutoRefreshInteval;
    _onChange: (value: SelectableValue<string>) => void;
    validateAndUpdate(): Observable<ValidateAndUpdateResult>;
    static Component: ({ model }: SceneComponentProps<IntervalVariable>) => React__default.JSX.Element;
}

interface TextBoxVariableState extends SceneVariableState {
    value: string;
}
declare class TextBoxVariable extends SceneObjectBase<TextBoxVariableState> implements SceneVariable<TextBoxVariableState> {
    constructor(initialState: Partial<TextBoxVariableState>);
    getValue(): VariableValue;
    setValue(newValue: string): void;
    private getKey;
    getUrlState(): {
        [x: string]: string;
    };
    updateFromUrl(values: SceneObjectUrlValues): void;
    static Component: ({ model }: SceneComponentProps<TextBoxVariable>) => React__default.JSX.Element;
}

interface QueryVariableState extends MultiValueVariableState {
    type: 'query';
    datasource: DataSourceRef | null;
    query: string | SceneDataQuery;
    regex: string;
    refresh: VariableRefresh$1;
    sort: VariableSort;
    /** @internal Only for use inside core dashboards */
    definition?: string;
}
declare class QueryVariable extends MultiValueVariable<QueryVariableState> {
    protected _variableDependency: VariableDependencyConfig<QueryVariableState>;
    constructor(initialState: Partial<QueryVariableState>);
    getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]>;
    private getRequest;
    onSearchChange: (searchFilter: string) => void;
    private _updateOptionsBasedOnSearchFilter;
    static Component: ({ model }: SceneComponentProps<MultiValueVariable>) => React$1.JSX.Element;
}

interface GroupByVariableState extends MultiValueVariableState {
    /** Defaults to "Group" */
    name: string;
    /** The visible keys to group on */
    defaultOptions?: MetricFindValue[];
    /** Base filters to always apply when looking up keys */
    baseFilters?: AdHocVariableFilter[];
    /** Datasource to use for getTagKeys and also controls which scene queries the group by should apply to */
    datasource: DataSourceRef | null;
    /** Controls if the group by can be changed */
    readOnly?: boolean;
    /**
     * @experimental
     * Controls the layout and design of the label.
     * Vertical layout does not yet support operator selector.
     */
    layout?: ControlsLayout;
    /**
     * Defaults to same-datasource which means group by will automatically be applied to all queries with the same data source as this GroupBySet.
     * In manual mode no queries are re-run on changes, and you have to manually apply the filter to whatever queries you want.
     */
    applyMode?: 'auto' | 'manual';
    /**
     * Filter out the keys that do not match the regex.
     */
    tagKeyRegexFilter?: RegExp;
    /**
     * Extension hook for customizing the key lookup.
     * Return replace: true if you want to override the default lookup
     * Return replace: false if you want to combine the results with the default lookup
     */
    getTagKeysProvider?: getTagKeysProvider;
}
type getTagKeysProvider = (set: GroupByVariable, currentKey: string | null) => Promise<{
    replace?: boolean;
    values: MetricFindValue[] | GetTagResponse;
}>;
declare class GroupByVariable extends MultiValueVariable<GroupByVariableState> {
    static Component: typeof GroupByVariableRenderer;
    isLazy: boolean;
    protected _urlSync: SceneObjectUrlSyncHandler;
    validateAndUpdate(): Observable<ValidateAndUpdateResult>;
    private _updateValueGivenNewOptions;
    getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]>;
    constructor(initialState: Partial<GroupByVariableState>);
    /**
     * Get possible keys given current filters. Do not call from plugins directly
     */
    _getKeys: (ds: DataSourceApi) => Promise<any>;
    /**
     * Allows clearing the value of the variable to an empty value. Overrides default behavior of a MultiValueVariable
     */
    getDefaultMultiState(options: VariableValueOption[]): {
        value: VariableValueSingle[];
        text: string[];
    };
}
declare function GroupByVariableRenderer({ model }: SceneComponentProps<MultiValueVariable>): React__default.JSX.Element;

declare function isAdHocVariable(variable: SceneVariable): variable is AdHocFiltersVariable;
declare function isConstantVariable(variable: SceneVariable): variable is ConstantVariable;
declare function isCustomVariable(variable: SceneVariable): variable is CustomVariable;
declare function isDataSourceVariable(variable: SceneVariable): variable is DataSourceVariable;
declare function isIntervalVariable(variable: SceneVariable): variable is IntervalVariable;
declare function isQueryVariable(variable: SceneVariable): variable is QueryVariable;
declare function isTextBoxVariable(variable: SceneVariable): variable is TextBoxVariable;
declare function isGroupByVariable(variable: SceneVariable): variable is GroupByVariable;

interface SceneObjectStateChangedPayload<TState extends SceneObjectState = SceneObjectState> {
    prevState: TState;
    newState: TState;
    partialUpdate: Partial<TState>;
    changedObject: SceneObject<TState>;
}
declare class SceneObjectStateChangedEvent extends BusEventWithPayload<SceneObjectStateChangedPayload> {
    static readonly type = "scene-object-state-change";
}
type UserActionEventType = 'panel-description-shown' | 'panel-status-message-clicked' | 'panel-cancel-query-clicked' | 'panel-menu-shown';
interface UserActionEventPayload {
    origin: SceneObject;
    interaction: UserActionEventType;
}
declare class UserActionEvent extends BusEventWithPayload<UserActionEventPayload> {
    static readonly type = "scene-object-user-action";
}

/**
 * Will walk the scene object graph up to the root looking for the first variable with the specified name
 */
declare function lookupVariable(name: string, sceneObject: SceneObject): SceneVariable | null;

/**
 * Will walk up the scene object graph to the closest $timeRange scene object
 */
declare function getTimeRange(sceneObject: SceneObject): SceneTimeRangeLike;

interface SceneQueryStateControllerState extends SceneObjectState {
    isRunning: boolean;
}
interface SceneQueryControllerLike extends SceneObject<SceneQueryStateControllerState> {
    isQueryController: true;
    cancelAll(): void;
    queryStarted(entry: SceneQueryControllerEntry): void;
    queryCompleted(entry: SceneQueryControllerEntry): void;
}
interface QueryResultWithState {
    state: LoadingState;
}
interface SceneQueryControllerEntry {
    request?: DataQueryRequest;
    type: SceneQueryControllerEntryType;
    origin: SceneObject;
    cancel?: () => void;
}
type SceneQueryControllerEntryType = 'data' | 'annotations' | 'variable' | 'alerts';
declare class SceneQueryController extends SceneObjectBase<SceneQueryStateControllerState> implements SceneQueryControllerLike {
    #private;
    isQueryController: true;
    constructor();
    queryStarted(entry: SceneQueryControllerEntry): void;
    queryCompleted(entry: SceneQueryControllerEntry): void;
    private changeRunningQueryCount;
    cancelAll(): void;
}

interface UrlSyncManagerLike {
    initSync(root: SceneObject): void;
    cleanUp(root: SceneObject): void;
    handleNewLocation(location: Location): void;
    handleNewObject(sceneObj: SceneObject): void;
}
/**
 * Notify the url sync manager of a new object that has been added to the scene
 * that needs to init state from URL.
 */
declare class NewSceneObjectAddedEvent extends BusEventWithPayload<SceneObject> {
    static readonly type = "new-scene-object-added";
}
declare class UrlSyncManager implements UrlSyncManagerLike {
    private _urlKeyMapper;
    private _sceneRoot?;
    private _subs;
    private _lastLocation;
    private _locationService;
    private _paramsCache;
    private _options;
    constructor(_options?: SceneUrlSyncOptions, locationService?: LocationService);
    /**
     * Updates the current scene state to match URL state.
     */
    initSync(root: SceneObject): void;
    cleanUp(root: SceneObject): void;
    handleNewLocation(location: Location): void;
    handleNewObject(sceneObj: SceneObject): void;
    private handleSceneObjectStateChanged;
    getUrlState(root: SceneObject): SceneObjectUrlValues;
}

/**
 * Get the closest node with variables
 */
declare function getVariables(sceneObject: SceneObject): SceneVariables;
/**
 * Will walk up the scene object graph to the closest $data scene object
 */
declare function getData(sceneObject: SceneObject): SceneDataProvider;
/**
 * Will walk up the scene object graph to the closest $layout scene object
 */
declare function getLayout(scene: SceneObject): SceneLayout | null;
/**
 * Interpolates the given string using the current scene object as context.   *
 *
 * Note: the interpolations array will be mutated by adding information about variables that
 * have been interpolated during replacement. Variables that were specified in the target but not found in
 * the list of available variables are also added to the array. See {@link VariableInterpolation} for more details.
 *
 * @param {VariableInterpolation[]} interpolations an optional array that is updated with interpolated variables.
 */
declare function interpolate(sceneObject: SceneObject, value: string | undefined | null, scopedVars?: ScopedVars, format?: string | VariableCustomFormatterFn, interpolations?: VariableInterpolation[]): string;
/**
 * Checks if the variable is currently loading or waiting to update.
 * It also returns true if a dependency of the variable is loading.
 *
 * For example if C depends on variable B which depends on variable A and A is loading this returns true for variable C and B.
 */
declare function hasVariableDependencyInLoadingState(sceneObject: SceneObject): boolean;
/**
 * Returns a scene object from the scene graph with the requested key.
 *
 * Throws error if no key-matching scene object found.
 */
declare function findByKey(sceneObject: SceneObject, key: string): SceneObject<SceneObjectState>;
/**
 * Returns a scene object from the scene graph with the requested key and type.
 *
 * Throws error if no key-matching scene object found.
 * Throws error if the given type does not match.
 */
declare function findByKeyAndType<TargetType extends SceneObject>(sceneObject: SceneObject, key: string, targetType: {
    new (...args: never[]): TargetType;
}): TargetType;
/**
 * This will search the full scene graph, starting with the scene node passed in, then walking up the parent chain. *
 */
declare function findObject(scene: SceneObject, check: (obj: SceneObject) => boolean): SceneObject | null;
/**
 * This will search down the full scene graph, looking for objects that match the provided predicate.
 */
declare function findAllObjects(scene: SceneObject, check: (obj: SceneObject) => boolean): SceneObject[];
/**
 * Will walk up the scene object graph up until the root and collect all SceneDataLayerProvider objects.
 * When localOnly set to true, it will only collect the closest layers.
 */
declare function getDataLayers(sceneObject: SceneObject, localOnly?: boolean): SceneDataLayerProvider[];
interface SceneType<T> extends Function {
    new (...args: never[]): T;
}
/**
 * A utility function to find the closest ancestor of a given type. This function expects
 * to find it and will throw an error if it does not.
 */
declare function getAncestor<ParentType>(sceneObject: SceneObject, ancestorType: SceneType<ParentType>): ParentType;
/**
 * This will search down the full scene graph, looking for objects that match the provided descendentType type.
 */
declare function findDescendents<T extends SceneObject>(scene: SceneObject, descendentType: SceneType<T>): T[];
/**
 * Returns the closest query controller undefined if none found
 */
declare function getQueryController(sceneObject: SceneObject): SceneQueryControllerLike | undefined;
/**
 * Returns the closest SceneObject that has a state property with the
 * name urlSyncManager that is of type UrlSyncManager
 */
declare function getUrlSyncManager(sceneObject: SceneObject): UrlSyncManagerLike | undefined;

declare const sceneGraph: {
    getVariables: typeof getVariables;
    getData: typeof getData;
    getTimeRange: typeof getTimeRange;
    getLayout: typeof getLayout;
    getDataLayers: typeof getDataLayers;
    interpolate: typeof interpolate;
    lookupVariable: typeof lookupVariable;
    hasVariableDependencyInLoadingState: typeof hasVariableDependencyInLoadingState;
    findByKey: typeof findByKey;
    findByKeyAndType: typeof findByKeyAndType;
    findObject: typeof findObject;
    findAllObjects: typeof findAllObjects;
    getAncestor: typeof getAncestor;
    findDescendents: typeof findDescendents;
    getQueryController: typeof getQueryController;
    getUrlSyncManager: typeof getUrlSyncManager;
};

interface ActWhenVariableChangedState extends SceneObjectState {
    variableName: string;
    /**
     * The handler to run when a variable changes.
     * @param variable The variable that changed
     * @param behavior The behavior instance where this onChange handler added to.
     *  You can use this to access the parent SceneObject where this behavior exists.
     *  You can also use this with the sceneGraph util functions to find objects from this scene graph location.
     * @returns Return a cancellation function if you do anything async like issue a query.
     */
    onChange: (variable: SceneVariable, behavior: ActWhenVariableChanged) => (() => void) | void;
}
/**
 * This behavior will run an effect function when specified variables change
 */
declare class ActWhenVariableChanged extends SceneObjectBase<ActWhenVariableChangedState> {
    private _runningEffect;
    protected _variableDependency: VariableDependencyConfig<ActWhenVariableChangedState>;
    private _onVariableChanged;
}

interface CursorSyncState extends SceneObjectState {
    sync: DashboardCursorSync;
}
/**
 * This behavior will provide a cursor sync context within a scene.
 */
declare class CursorSync extends SceneObjectBase<CursorSyncState> {
    constructor(state: Partial<CursorSyncState>);
    getEventsBus: (panel: SceneObject) => PanelContextEventBus;
    getEventsScope(): string;
}
declare class PanelContextEventBus implements EventBus {
    private _source;
    private _eventsOrigin;
    constructor(_source: SceneObject, _eventsOrigin: SceneObject);
    publish<T extends BusEvent>(event: T): void;
    getStream<T extends BusEvent>(eventType: BusEventType<T>): Observable<T>;
    subscribe<T extends BusEvent>(eventType: BusEventType<T>, handler: BusEventHandler<T>): Unsubscribable;
    removeAllListeners(): void;
    newScopedBus(key: string, filter: EventFilterOptions): EventBus;
}

interface LiveNowTimerState extends SceneObjectState {
    enabled: boolean;
}
declare class LiveNowTimer extends SceneObjectBase<LiveNowTimerState> {
    private timerId;
    private static REFRESH_RATE;
    constructor({ enabled }: {
        enabled?: boolean | undefined;
    });
    private _activationHandler;
    enable(): void;
    disable(): void;
    get isEnabled(): boolean;
}

type index$1_ActWhenVariableChanged = ActWhenVariableChanged;
declare const index$1_ActWhenVariableChanged: typeof ActWhenVariableChanged;
type index$1_CursorSync = CursorSync;
declare const index$1_CursorSync: typeof CursorSync;
type index$1_SceneQueryController = SceneQueryController;
declare const index$1_SceneQueryController: typeof SceneQueryController;
type index$1_LiveNowTimer = LiveNowTimer;
declare const index$1_LiveNowTimer: typeof LiveNowTimer;
declare namespace index$1 {
  export {
    index$1_ActWhenVariableChanged as ActWhenVariableChanged,
    index$1_CursorSync as CursorSync,
    index$1_SceneQueryController as SceneQueryController,
    index$1_LiveNowTimer as LiveNowTimer,
  };
}

/**
 * Base class for data layer. Handles common implementation including enabling/disabling layer and publishing results.
 */
declare abstract class SceneDataLayerBase<T extends SceneDataLayerProviderState> extends SceneObjectBase<T> implements SceneDataLayerProvider {
    /**
     * Subscription to query results. Should be set when layer runs a query.
     */
    protected querySub?: Unsubscribable;
    /**
     * Subject to emit results to.
     */
    private _results;
    /**
     * Implement logic for enabling the layer. This is called when layer is enabled or when layer is enabled when activated.
     * Use i.e. to setup subscriptions that will trigger layer updates.
     */
    abstract onEnable(): void;
    /**
     * Implement logic for disabling the layer. This is called when layer is disabled.
     * Use i.e. to unsubscribe from subscriptions that trigger layer updates.
     */
    abstract onDisable(): void;
    /**
     * Implement logic running the layer and setting up the querySub subscription.
     */
    protected abstract runLayer(): void;
    /**
     * Mark data provider as data layer
     */
    isDataLayer: true;
    private _variableValueRecorder;
    protected _variableDependency: VariableDependencyConfig<T>;
    /**
     * For variables support in data layer provide variableDependencyStatePaths with keys of the state to be scanned for variables.
     */
    constructor(initialState: T, variableDependencyStatePaths?: Array<keyof T>);
    protected onActivate(): CancelActivationHandler;
    protected onDeactivate(): void;
    protected onVariableUpdateCompleted(): void;
    cancelQuery(): void;
    protected publishResults(data: PanelData): void;
    getResultsStream(): ReplaySubject<SceneDataProviderResult>;
    private shouldRunLayerOnActivate;
    /**
     * This helper function is to counter the contravariance of setState
     */
    private setStateHelper;
}

interface AnnotationQueryResults {
    state: LoadingState;
    events: AnnotationEvent[];
}

interface AnnotationsDataLayerState extends SceneDataLayerProviderState {
    query: AnnotationQuery;
}
declare class AnnotationsDataLayer extends SceneDataLayerBase<AnnotationsDataLayerState> implements SceneDataLayerProvider {
    static Component: typeof AnnotationsDataLayerRenderer;
    private _scopedVars;
    private _timeRangeSub;
    constructor(initialState: AnnotationsDataLayerState);
    onEnable(): void;
    onDisable(): void;
    runLayer(): void;
    private runWithTimeRange;
    protected resolveDataSource(query: AnnotationQuery): Promise<_grafana_data.DataSourceApi<_grafana_data.DataQuery, _grafana_data.DataSourceJsonData, {}>>;
    protected processEvents(query: AnnotationQuery, events: AnnotationQueryResults): PanelData;
}
declare function AnnotationsDataLayerRenderer({ model }: SceneComponentProps<AnnotationsDataLayer>): React__default.JSX.Element | null;

type index_AnnotationsDataLayer = AnnotationsDataLayer;
declare const index_AnnotationsDataLayer: typeof AnnotationsDataLayer;
declare namespace index {
  export {
    index_AnnotationsDataLayer as AnnotationsDataLayer,
  };
}

interface SceneDataNodeState extends SceneDataState {
    data: PanelData;
}
declare class SceneDataNode extends SceneObjectBase<SceneDataNodeState> implements SceneDataProvider {
    constructor(state?: Partial<SceneDataNodeState>);
    getResultsStream(): rxjs.Observable<SceneDataProviderResult>;
}

interface SceneObjectUrlSyncConfigOptions {
    keys: string[] | (() => string[]);
}
declare class SceneObjectUrlSyncConfig implements SceneObjectUrlSyncHandler {
    private _sceneObject;
    private _keys;
    private _nextChangeShouldAddHistoryStep;
    constructor(_sceneObject: SceneObjectWithUrlSync, _options: SceneObjectUrlSyncConfigOptions);
    getKeys(): string[];
    getUrlState(): SceneObjectUrlValues;
    updateFromUrl(values: SceneObjectUrlValues): void;
    performBrowserHistoryAction(callback: () => void): void;
    shouldCreateHistoryStep(values: SceneObjectUrlValues): boolean;
}

declare class SceneTimeRange extends SceneObjectBase<SceneTimeRangeState> implements SceneTimeRangeLike {
    protected _urlSync: SceneObjectUrlSyncConfig;
    constructor(state?: Partial<SceneTimeRangeState>);
    private _onActivate;
    private refreshIfStale;
    /**
     * Will traverse up the scene graph to find the closest SceneTimeRangeLike with time zone set
     */
    private getTimeZoneSource;
    /**
     * Refreshes time range if it is older than the invalidation interval
     * @param refreshAfterMs invalidation interval (milliseconds)
     * @private
     */
    private refreshRange;
    private calculatePercentOfInterval;
    getTimeZone(): TimeZone;
    onTimeRangeChange: (timeRange: TimeRange) => void;
    onTimeZoneChange: (timeZone: TimeZone) => void;
    onRefresh: () => void;
    getUrlState(): SceneObjectUrlValues;
    updateFromUrl(values: SceneObjectUrlValues): void;
}

/**
 * @internal
 * Used by SceneTimeZoneOverride and main repo PanelTimeRange.
 * Not recommened to be used by plugins directly.
 */
declare abstract class SceneTimeRangeTransformerBase<T extends SceneTimeRangeState> extends SceneObjectBase<T> implements SceneTimeRangeLike {
    constructor(state: T);
    protected getAncestorTimeRange(): SceneTimeRangeLike;
    private _activationHandler;
    protected abstract ancestorTimeRangeChanged(timeRange: SceneTimeRangeState): void;
    getTimeZone(): TimeZone;
    onTimeRangeChange(timeRange: TimeRange): void;
    onTimeZoneChange(timeZone: string): void;
    onRefresh(): void;
}

interface SceneTimeZoneOverrideState extends SceneTimeRangeState {
    timeZone: TimeZone;
}
declare class SceneTimeZoneOverride extends SceneTimeRangeTransformerBase<SceneTimeZoneOverrideState> implements SceneTimeRangeLike {
    constructor(state: Omit<SceneTimeZoneOverrideState, 'from' | 'to' | 'value'>);
    protected ancestorTimeRangeChanged(timeRange: SceneTimeRangeState): void;
    getTimeZone(): TimeZone;
    onTimeZoneChange(timeZone: string): void;
}

interface QueryRunnerState extends SceneObjectState {
    data?: PanelData;
    queries: SceneDataQuery[];
    datasource?: DataSourceRef;
    minInterval?: string;
    maxDataPoints?: number;
    liveStreaming?: boolean;
    maxDataPointsFromWidth?: boolean;
    cacheTimeout?: DataQueryRequest['cacheTimeout'];
    queryCachingTTL?: DataQueryRequest['queryCachingTTL'];
    /**
     * When set to auto (the default) query runner will issue queries on activate (when variable dependencies are ready) or when time range change.
     * Set to manual to have full manual control over when queries are issued. Try not to set this. This is mainly useful for unit tests, or special edge case workflows.
     */
    runQueriesMode?: 'auto' | 'manual';
    dataLayerFilter?: DataLayerFilter;
    _hasFetchedData?: boolean;
}
declare class SceneQueryRunner extends SceneObjectBase<QueryRunnerState> implements SceneDataProvider {
    private _querySub?;
    private _dataLayersSub?;
    private _dataLayersMerger;
    private _timeSub?;
    private _timeSubRange?;
    private _containerWidth?;
    private _variableValueRecorder;
    private _results;
    private _scopedVars;
    private _layerAnnotations?;
    private _resultAnnotations?;
    private _adhocFiltersVar?;
    private _groupByVar?;
    getResultsStream(): ReplaySubject<SceneDataProviderResult>;
    protected _variableDependency: VariableDependencyConfig<QueryRunnerState>;
    constructor(initialState: QueryRunnerState);
    private _onActivate;
    private _handleDataLayers;
    private _onLayersReceived;
    /**
     * This tries to start a new query whenever a variable completes or is changed.
     *
     * We care about variable update completions even when the variable has not changed and even when it is not a direct dependency.
     * Example: Variables A and B (B depends on A). A update depends on time range. So when time change query runner will
     * find that variable A is loading which is a dependency on of variable B so will set _isWaitingForVariables to true and
     * not issue any query.
     *
     * When A completes it's loading (with no value change, so B never updates) it will cause a call of this function letting
     * the query runner know that A has completed, and in case _isWaitingForVariables we try to run the query. The query will
     * only run if all variables are in a non loading state so in other scenarios where a query depends on many variables this will
     * be called many times until all dependencies are in a non loading state.   *
     */
    private onVariableUpdatesCompleted;
    /**
     * Check if value changed is a adhoc filter o group by variable that did not exist when we issued the last query
     */
    private onAnyVariableChanged;
    private _isRelevantAutoVariable;
    private shouldRunQueriesOnActivate;
    private _isDataTimeRangeStale;
    private _onDeactivate;
    setContainerWidth(width: number): void;
    isDataReadyToDisplay(): boolean;
    private subscribeToTimeRangeChanges;
    runQueries(): void;
    private getMaxDataPoints;
    cancelQuery(): void;
    private runWithTimeRange;
    clone(withState?: Partial<QueryRunnerState>): this;
    private prepareRequests;
    private onDataReceived;
    private _combineDataLayers;
    private _setNoDataState;
    /**
     * Walk up the scene graph and find any ExtraQueryProviders.
     *
     * This will return an array of the closest provider of each type.
     */
    private getClosestExtraQueryProviders;
    /**
     * Walk up scene graph and find the closest filterset with matching data source
     */
    private findAndSubscribeToAdHocFilters;
    private _updateExplicitVariableDependencies;
    private isQueryModeAuto;
}

interface DataProviderSharerState extends SceneDataState {
    source: SceneObjectRef<SceneDataProvider>;
}
declare class DataProviderProxy extends SceneObjectBase<DataProviderSharerState> implements SceneDataProvider {
    constructor(state: DataProviderSharerState);
    setContainerWidth(width: number): void;
    isDataReadyToDisplay(): boolean;
    cancelQuery(): void;
    getResultsStream(): Observable<SceneDataProviderResult>;
}

type ExtraQueryDataProcessor = (primary: PanelData, secondary: PanelData) => Observable<PanelData>;
interface ExtraQueryDescriptor {
    req: DataQueryRequest;
    processor?: ExtraQueryDataProcessor;
}
interface ExtraQueryProvider<T extends SceneObjectState> extends SceneObjectBase<T> {
    getExtraQueries(request: DataQueryRequest): ExtraQueryDescriptor[];
    shouldRerun(prev: T, next: T, queries: SceneDataQuery[]): boolean;
}

declare abstract class SceneDataLayerSetBase<T extends SceneDataLayerProviderState> extends SceneObjectBase<T> implements SceneDataLayerProvider {
    /** Mark it as a data layer */
    isDataLayer: true;
    /**
     * Subscription to query results. Should be set when layer runs a query.
     */
    protected querySub?: Unsubscribable;
    /**
     * Subject to emit results to.
     */
    private _results;
    private _dataLayersMerger;
    protected subscribeToAllLayers(layers: SceneDataLayerProvider[]): void;
    private _onLayerUpdateReceived;
    getResultsStream(): Observable<SceneDataProviderResult>;
    cancelQuery(): void;
    /**
     * This helper function is to counter the contravariance of setState
     */
    private setStateHelper;
}
interface SceneDataLayersSetState extends SceneDataLayerProviderState {
    layers: SceneDataLayerProvider[];
}
declare class SceneDataLayerSet extends SceneDataLayerSetBase<SceneDataLayersSetState> implements SceneDataLayerProvider {
    constructor(state: Partial<SceneDataLayersSetState>);
    private _onActivate;
    static Component: ({ model }: SceneComponentProps<SceneDataLayerSet>) => React__default.JSX.Element;
}

interface SceneDataLayerControlsState extends SceneObjectState {
}
declare class SceneDataLayerControls extends SceneObjectBase<SceneDataLayerControlsState> {
    static Component: typeof SceneDataLayerControlsRenderer;
    constructor();
}
declare function SceneDataLayerControlsRenderer({ model }: SceneComponentProps<SceneDataLayerControls>): React__default.JSX.Element | null;

interface SceneDataTransformerState extends SceneDataState {
    /**
     * Array of standard transformation configs and custom transform operators
     */
    transformations: Array<DataTransformerConfig | CustomTransformerDefinition>;
}
/**
 * You can use this as a $data object. It can either transform an inner $data DataProvider or if that is not set it will
 * subscribe to a DataProvider higher up in the scene graph and transform its data.
 *
 * The transformations array supports custom (runtime defined) transformation as well as declarative core transformations.
 * You can manually re-process the transformations by calling reprocessTransformations(). This is useful if you have
 * transformations that depend on other scene object states.
 */
declare class SceneDataTransformer extends SceneObjectBase<SceneDataTransformerState> implements SceneDataProvider {
    private _transformSub?;
    private _results;
    private _prevDataFromSource?;
    /**
     * Scan transformations for variable usage and re-process transforms when a variable values change
     */
    protected _variableDependency: VariableDependencyConfig<SceneDataTransformerState>;
    constructor(state: SceneDataTransformerState);
    private activationHandler;
    private getSourceData;
    setContainerWidth(width: number): void;
    isDataReadyToDisplay(): boolean;
    reprocessTransformations(): void;
    cancelQuery(): void;
    getResultsStream(): ReplaySubject<SceneDataProviderResult>;
    clone(withState?: Partial<SceneDataTransformerState>): this;
    private haveAlreadyTransformedData;
    private transform;
}

/**
 * Will look for a scene object with a behavior that is a SceneQueryController and register the query with it.
 */
declare function registerQueryWithController<T extends QueryResultWithState>(entry: SceneQueryControllerEntry): (queryStream: Observable<T>) => Observable<T>;

interface VariableValueSelectorsState extends SceneObjectState {
    layout?: ControlsLayout;
}
declare class VariableValueSelectors extends SceneObjectBase<VariableValueSelectorsState> {
    static Component: typeof VariableValueSelectorsRenderer;
}
declare function VariableValueSelectorsRenderer({ model }: SceneComponentProps<VariableValueSelectors>): React__default.JSX.Element;
interface VariableSelectProps {
    layout?: ControlsLayout;
    variable: SceneVariable;
    /** To override hide from VariableValueSelectByName  */
    showAlways?: boolean;
    /** To provide an option to hide the label in the variable value selector */
    hideLabel?: boolean;
}
declare function VariableValueSelectWrapper({ variable, layout, showAlways, hideLabel }: VariableSelectProps): React__default.JSX.Element | null;

interface VariableValueControlState extends SceneObjectState {
    layout?: ControlsLayout;
    /** Render the specific select control for a variable */
    variableName: string;
    /** Hide the label in the variable value controller */
    hideLabel?: boolean;
}
declare class VariableValueControl extends SceneObjectBase<VariableValueControlState> {
    static Component: typeof VariableValueControlRenderer;
}
declare function VariableValueControlRenderer({ model }: SceneComponentProps<VariableValueControl>): React__default.JSX.Element | null;

declare class SceneVariableSet extends SceneObjectBase<SceneVariableSetState> implements SceneVariables {
    /** Variables that have changed in since the activation or since the first manual value change */
    private _variablesThatHaveChanged;
    /** Variables that are scheduled to be validated and updated */
    private _variablesToUpdate;
    /** Variables currently updating  */
    private _updating;
    private _variableValueRecorder;
    /**
     * This makes sure SceneVariableSet's higher up in the chain notify us when parent level variables complete update batches.
     **/
    protected _variableDependency: SceneVariableSetVariableDependencyHandler;
    getByName(name: string): SceneVariable | undefined;
    constructor(state: SceneVariableSetState);
    /**
     * Subscribes to child variable value changes, and starts the variable value validation process
     */
    private _onActivate;
    /**
     * Add all variables that depend on the changed variable to the update queue
     */
    private _refreshTimeRangeBasedVariables;
    /**
     * Cancel all currently running updates
     */
    private _onDeactivate;
    /**
     * Look for new variables that need to be initialized
     */
    private _onStateChanged;
    /**
     * If variables changed while in in-active state we don't get any change events, so we need to check for that here.
     */
    private _checkForVariablesThatChangedWhileInactive;
    private _variableNeedsUpdate;
    /**
     * This loops through variablesToUpdate and update all that can.
     * If one has a dependency that is currently in variablesToUpdate it will be skipped for now.
     */
    private _updateNextBatch;
    /**
     * A variable has completed its update process. This could mean that variables that depend on it can now be updated in turn.
     */
    private _validateAndUpdateCompleted;
    cancel(variable: SceneVariable): void;
    private _handleVariableError;
    private _handleVariableValueChanged;
    /**
     * This is called by any parent level variable set to notify scene that an update batch is completed.
     * This is the main mechanism lower level variable set's react to changes on higher levels.
     */
    private _handleParentVariableUpdatesCompleted;
    private _addDependentVariablesToUpdateQueue;
    /**
     * Walk scene object graph and update all objects that depend on variables that have changed
     */
    private _notifyDependentSceneObjects;
    /**
     * Recursivly walk the full scene object graph and notify all objects with dependencies that include any of changed variables
     */
    private _traverseSceneAndNotify;
    /**
     * Return true if variable is waiting to update or currently updating.
     * It also returns true if a dependency of the variable is loading.
     *
     * For example if C depends on variable B which depends on variable A and A is loading this returns true for variable C and B.
     */
    isVariableLoadingOrWaitingToUpdate(variable: SceneVariable): boolean;
}
declare class SceneVariableSetVariableDependencyHandler implements SceneVariableDependencyConfigLike {
    private _variableUpdatesCompleted;
    constructor(_variableUpdatesCompleted: (variable: SceneVariable, hasChanged: boolean) => void);
    private _emptySet;
    getNames(): Set<string>;
    hasDependencyOn(name: string): boolean;
    variableUpdateCompleted(variable: SceneVariable, hasChanged: boolean): void;
}

interface TestVariableState extends MultiValueVariableState {
    query: string;
    delayMs?: number;
    issuedQuery?: string;
    refresh?: VariableRefresh$1;
    throwError?: string;
    optionsToReturn?: VariableValueOption[];
    updateOptions?: boolean;
}
/**
 * This variable is only designed for unit tests and potentially e2e tests.
 */
declare class TestVariable extends MultiValueVariable<TestVariableState> {
    private completeUpdate;
    isGettingValues: boolean;
    getValueOptionsCount: number;
    isLazy: boolean;
    protected _variableDependency: VariableDependencyConfig<TestVariableState>;
    constructor(initialState: Partial<TestVariableState>, isLazy?: boolean);
    getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]>;
    cancel(): void;
    private getOptions;
    /** Useful from tests */
    signalUpdateCompleted(): void;
    static Component: ({ model }: SceneComponentProps<MultiValueVariable>) => React$1.JSX.Element;
}

interface LocalValueVariableState extends SceneVariableState {
    value: VariableValue;
    text: VariableValue;
    isMulti?: boolean;
    includeAll?: boolean;
}
/**
 * This is a special type of variable that is used for repeating panels and layouts to create a local scoped value for a variable
 * that exists in a ancestor SceneVariableSet.
 */
declare class LocalValueVariable extends SceneObjectBase<LocalValueVariableState> implements SceneVariable<LocalValueVariableState> {
    constructor(initialState: Partial<LocalValueVariableState>);
    getValue(): VariableValue;
    getValueText(): string;
    /**
     * Checks the ancestor of our parent SceneVariableSet for loading state of a variable with the same name
     * This function is unit tested from SceneVariableSet tests.
     */
    isAncestorLoading(): boolean;
}

declare function useUrlSync(sceneRoot: SceneObject, options?: SceneUrlSyncOptions): boolean;

interface UrlSyncContextProviderProps extends SceneUrlSyncOptions {
    scene: SceneObject;
    children: React.ReactNode;
}
/**
 * Right now this is actually not defining a context, but think it might in the future (with UrlSyncManager as the context value)
 */
declare function UrlSyncContextProvider({ children, scene, updateUrlOnInit, createBrowserHistorySteps, }: UrlSyncContextProviderProps): React$1.ReactNode;

interface EmbeddedSceneState extends SceneObjectState {
    /**
     * The main content of the scene (usually a SceneFlexLayout)
     */
    body: SceneObject;
    /**
     * Top row of variable selectors, filters, time pickers and custom actions.
     */
    controls?: SceneObject[];
    /**
     * For interoperability (used from EmbeddedSceneWithContext)
     */
    context?: SceneObject;
}
declare class EmbeddedScene extends SceneObjectBase<EmbeddedSceneState> {
    static Component: typeof EmbeddedSceneRenderer;
    constructor(state: EmbeddedSceneState);
}
declare function EmbeddedSceneRenderer({ model }: SceneComponentProps<EmbeddedScene>): React__default.JSX.Element;

declare function VizPanelRenderer({ model }: SceneComponentProps<VizPanel>): React__default.JSX.Element;

interface VizPanelMenuState extends SceneObjectState {
    items?: PanelMenuItem[];
}
declare class VizPanelMenu extends SceneObjectBase<VizPanelMenuState> {
    static Component: typeof VizPanelMenuRenderer;
    addItem(item: PanelMenuItem): void;
    setItems(items: PanelMenuItem[]): void;
}
declare function VizPanelMenuRenderer({ model }: SceneComponentProps<VizPanelMenu>): React__default.JSX.Element;

interface VizPanelState<TOptions = {}, TFieldConfig = {}> extends SceneObjectState {
    /**
     * This is usually a plugin id that references a core plugin or an external plugin. But this can also reference a
     * runtime registered PanelPlugin registered via function registerScenePanelPlugin.
     */
    pluginId: string;
    title: string;
    description?: string;
    options: DeepPartial<TOptions>;
    fieldConfig: FieldConfigSource<DeepPartial<TFieldConfig>>;
    pluginVersion?: string;
    displayMode?: 'default' | 'transparent';
    /**
     * Only shows header on hover, absolutly positioned above the panel.
     */
    hoverHeader?: boolean;
    /**
     * Offset hoverHeader position on the y axis
     */
    hoverHeaderOffset?: number;
    /**
     * Defines a menu in the top right of the panel. The menu object is only activated when the dropdown menu itself is shown.
     * So the best way to add dynamic menu actions and links is by adding them in a behavior attached to the menu.
     */
    menu?: VizPanelMenu;
    /**
     * Defines a menu that renders panel link.
     **/
    titleItems?: React.ReactNode | SceneObject | SceneObject[];
    /**
     * Add action to the top right panel header
     */
    headerActions?: React.ReactNode | SceneObject | SceneObject[];
    /**
     * Mainly for advanced use cases that need custom handling of PanelContext callbacks.
     */
    extendPanelContext?: (vizPanel: VizPanel, context: PanelContext) => void;
    /**
     * @internal
     * Only for use from core to handle migration from old angular panels
     **/
    _UNSAFE_customMigrationHandler?: (panel: PanelModel, plugin: PanelPlugin) => void;
    /** Internal */
    _pluginLoadError?: string;
    /** Internal */
    _pluginInstanceState?: any;
    _renderCounter?: number;
}
declare class VizPanel<TOptions = {}, TFieldConfig extends {} = {}> extends SceneObjectBase<VizPanelState<TOptions, TFieldConfig>> {
    static Component: typeof VizPanelRenderer;
    protected _variableDependency: VariableDependencyConfig<VizPanelState<TOptions, TFieldConfig>>;
    protected _panelContext?: PanelContext;
    private _plugin?;
    private _prevData?;
    private _dataWithFieldConfig?;
    private _structureRev;
    constructor(state: Partial<VizPanelState<TOptions, TFieldConfig>>);
    private _onActivate;
    private _loadPlugin;
    getLegacyPanelId(): number;
    private _pluginLoaded;
    private _getPluginVersion;
    getPlugin(): PanelPlugin | undefined;
    getPanelContext(): PanelContext;
    onTimeRangeChange: (timeRange: AbsoluteTimeRange) => void;
    getTimeRange: (data?: PanelData) => _grafana_data.TimeRange;
    changePluginType(pluginId: string, newOptions?: DeepPartial<{}>, newFieldConfig?: FieldConfigSource): Promise<void>;
    onTitleChange: (title: string) => void;
    onDescriptionChange: (description: string) => void;
    onDisplayModeChange: (displayMode: 'default' | 'transparent') => void;
    onOptionsChange: (optionsUpdate: DeepPartial<TOptions>, replace?: boolean, isAfterPluginChange?: boolean) => void;
    onFieldConfigChange: (fieldConfigUpdate: FieldConfigSource<DeepPartial<TFieldConfig>>, replace?: boolean) => void;
    interpolate: InterpolateFunction;
    getDescription: () => string;
    clearFieldConfigCache(): void;
    /**
     * Called from the react render path to apply the field config to the data provided by the data provider
     */
    applyFieldConfig(rawData?: PanelData): PanelData;
    onCancelQuery: () => void;
    onStatusMessageClick: () => void;
    /**
     * Panel context functions
     */
    private _onSeriesColorChange;
    private _onSeriesVisibilityChange;
    private _onInstanceStateChange;
    private _onToggleLegendSort;
    private buildPanelContext;
}

interface NestedSceneState extends SceneObjectState {
    title: string;
    isCollapsed?: boolean;
    canCollapse?: boolean;
    canRemove?: boolean;
    body: SceneLayout;
    controls?: SceneObject[];
}
/**
 * @internal
 * POC status, don't use this yet
 */
declare class NestedScene extends SceneObjectBase<NestedSceneState> {
    static Component: typeof NestedSceneRenderer;
    onToggle: () => void;
    /** Removes itself from its parent's children array */
    onRemove: () => void;
}
declare function NestedSceneRenderer({ model }: SceneComponentProps<NestedScene>): React__default.JSX.Element;

interface SceneCanvasTextState extends SceneObjectState {
    text: string;
    fontSize?: number;
    align?: 'left' | 'center' | 'right';
    spacing?: number;
}
/**
 * Not a really useful component, just an example of how to create one
 * @internal
 */
declare class SceneCanvasText extends SceneObjectBase<SceneCanvasTextState> {
    protected _variableDependency: VariableDependencyConfig<SceneCanvasTextState>;
    static Component: ({ model }: SceneComponentProps<SceneCanvasText>) => React__default.JSX.Element;
}

interface ToolbarButtonState extends SceneObjectState {
    icon: IconName;
    onClick: () => void;
}
declare class SceneToolbarButton extends SceneObjectBase<ToolbarButtonState> {
    static Component: ({ model }: SceneComponentProps<SceneToolbarButton>) => React__default.JSX.Element;
}
interface SceneToolbarInputState extends SceneObjectState {
    value?: string;
    label?: string;
    onChange: (value: number) => void;
}
declare class SceneToolbarInput extends SceneObjectBase<SceneToolbarInputState> {
    static Component: ({ model }: SceneComponentProps<SceneToolbarInput>) => React__default.JSX.Element;
}

interface SceneTimePickerState extends SceneObjectState {
    hidePicker?: boolean;
    isOnCanvas?: boolean;
}
declare class SceneTimePicker extends SceneObjectBase<SceneTimePickerState> {
    static Component: typeof SceneTimePickerRenderer;
    onZoom: () => void;
    onChangeFiscalYearStartMonth: (month: number) => void;
    toAbsolute: () => void;
    onMoveBackward: () => void;
    onMoveForward: () => void;
}
declare function SceneTimePickerRenderer({ model }: SceneComponentProps<SceneTimePicker>): React__default.JSX.Element | null;

interface SceneRefreshPickerState extends SceneObjectState {
    /**
     * Refresh interval, e.g. 5s, 1m, 2h
     */
    refresh: string;
    autoEnabled?: boolean;
    autoMinInterval?: string;
    autoValue?: string;
    /**
     * List of allowed refresh intervals, e.g. ['5s', '1m']
     */
    intervals?: string[];
    isOnCanvas?: boolean;
    primary?: boolean;
    withText?: boolean;
    /**
     * Overrides the default minRefreshInterval from the grafana config. Can be set to "0s" to remove the minimum refresh interval.
     */
    minRefreshInterval?: string;
}
declare class SceneRefreshPicker extends SceneObjectBase<SceneRefreshPickerState> {
    static Component: typeof SceneRefreshPickerRenderer;
    protected _urlSync: SceneObjectUrlSyncConfig;
    private _intervalTimer;
    private _autoTimeRangeListener;
    private _autoRefreshBlocked;
    constructor(state: Partial<SceneRefreshPickerState>);
    onRefresh: () => void;
    onIntervalChanged: (interval: string) => void;
    getUrlState(): {
        refresh: string | undefined;
    };
    updateFromUrl(values: SceneObjectUrlValues): void;
    private setupAutoTimeRangeListener;
    private calculateAutoRefreshInterval;
    private isTabVisible;
    private setupIntervalTimer;
}
declare function SceneRefreshPickerRenderer({ model }: SceneComponentProps<SceneRefreshPicker>): React__default.JSX.Element;

interface SceneTimeRangeCompareState extends SceneObjectState {
    compareWith?: string;
    compareOptions: Array<{
        label: string;
        value: string;
    }>;
}
declare class SceneTimeRangeCompare extends SceneObjectBase<SceneTimeRangeCompareState> implements ExtraQueryProvider<SceneTimeRangeCompareState> {
    static Component: typeof SceneTimeRangeCompareRenderer;
    protected _urlSync: SceneObjectUrlSyncConfig;
    constructor(state: Partial<SceneTimeRangeCompareState>);
    private _onActivate;
    getCompareOptions: (timeRange: TimeRange) => {
        label: string;
        value: string;
    }[];
    onCompareWithChanged: (compareWith: string) => void;
    onClearCompare: () => void;
    getExtraQueries(request: DataQueryRequest): ExtraQueryDescriptor[];
    shouldRerun(prev: SceneTimeRangeCompareState, next: SceneTimeRangeCompareState, queries: SceneDataQuery[]): boolean;
    getCompareTimeRange(timeRange: TimeRange): TimeRange | undefined;
    getUrlState(): SceneObjectUrlValues;
    updateFromUrl(values: SceneObjectUrlValues): void;
}
declare function SceneTimeRangeCompareRenderer({ model }: SceneComponentProps<SceneTimeRangeCompare>): React__default.JSX.Element;

interface SceneByFrameRepeaterState extends SceneObjectState {
    body: SceneLayout;
    getLayoutChild(data: PanelData, frame: DataFrame, frameIndex: number): SceneObject;
}
declare class SceneByFrameRepeater extends SceneObjectBase<SceneByFrameRepeaterState> {
    constructor(state: SceneByFrameRepeaterState);
    private performRepeat;
    static Component: ({ model }: SceneComponentProps<SceneByFrameRepeater>) => React__default.JSX.Element;
}

interface SceneByVariableRepeaterState extends SceneObjectState {
    body: SceneLayout;
    variableName: string;
    getLayoutChild(option: VariableValueOption): SceneObject;
}
declare class SceneByVariableRepeater extends SceneObjectBase<SceneByVariableRepeaterState> {
    protected _variableDependency: VariableDependencyConfig<SceneByVariableRepeaterState>;
    constructor(state: SceneByVariableRepeaterState);
    private performRepeat;
    static Component: ({ model }: SceneComponentProps<SceneByVariableRepeater>) => React__default.JSX.Element;
}

declare class SceneControlsSpacer extends SceneObjectBase {
    constructor();
    get Component(): (_props: SceneComponentProps<SceneControlsSpacer>) => React__default.JSX.Element;
    static Component: (_props: SceneComponentProps<SceneControlsSpacer>) => React__default.JSX.Element;
}

interface SceneFlexItemStateLike extends SceneFlexItemPlacement, SceneObjectState {
}
interface SceneFlexItemLike extends SceneObject<SceneFlexItemStateLike> {
}
interface SceneFlexLayoutState extends SceneObjectState, SceneFlexItemPlacement {
    children: SceneFlexItemLike[];
}
declare class SceneFlexLayout extends SceneObjectBase<SceneFlexLayoutState> implements SceneLayout {
    static Component: typeof SceneFlexLayoutRenderer;
    toggleDirection(): void;
    isDraggable(): boolean;
}
declare function SceneFlexLayoutRenderer({ model, parentState }: SceneFlexItemRenderProps$1<SceneFlexLayout>): React__default.JSX.Element | null;
interface SceneFlexItemPlacement {
    wrap?: CSSProperties['flexWrap'];
    direction?: CSSProperties['flexDirection'];
    width?: CSSProperties['width'];
    height?: CSSProperties['height'];
    minWidth?: CSSProperties['minWidth'];
    minHeight?: CSSProperties['minHeight'];
    maxWidth?: CSSProperties['maxWidth'];
    maxHeight?: CSSProperties['maxHeight'];
    xSizing?: 'fill' | 'content';
    ySizing?: 'fill' | 'content';
    /**
     * True when the item should rendered but not visible.
     * Useful for conditional display of layout items
     */
    isHidden?: boolean;
    /**
     * Set direction for smaller screens. This defaults to column.
     * This equals media query theme.breakpoints.down('md')
     */
    md?: SceneFlexItemPlacement;
}
interface SceneFlexItemState extends SceneFlexItemPlacement, SceneObjectState {
    body: SceneObject | undefined;
}
interface SceneFlexItemRenderProps$1<T> extends SceneComponentProps<T> {
    parentState?: SceneFlexItemPlacement;
}
declare class SceneFlexItem extends SceneObjectBase<SceneFlexItemState> {
    static Component: typeof SceneFlexItemRenderer;
}
declare function SceneFlexItemRenderer({ model, parentState }: SceneFlexItemRenderProps$1<SceneFlexItem>): React__default.JSX.Element | null;

interface SceneCSSGridLayoutState extends SceneObjectState, SceneCSSGridLayoutOptions {
    children: Array<SceneCSSGridItem | SceneObject>;
    /**
     * True when the item should rendered but not visible.
     * Useful for conditional display of layout items
     */
    isHidden?: boolean;
    /**
     * For media query for sceens smaller than md breakpoint
     */
    md?: SceneCSSGridLayoutOptions;
    /** True when the items should be lazy loaded */
    isLazy?: boolean;
}
interface SceneCSSGridLayoutOptions {
    /**
     * Useful for setting a height on items without specifying how many rows there will be.
     * Defaults to 320px
     */
    autoRows?: CSSProperties['gridAutoRows'];
    /**
     * This overrides the autoRows with a specific row template.
     */
    templateRows?: CSSProperties['gridTemplateRows'];
    /**
     * Defaults to repeat(auto-fit, minmax(400px, 1fr)). This pattern us useful for equally sized items with a min width of 400px
     * and dynamic max width split equally among columns.
     */
    templateColumns: CSSProperties['gridTemplateColumns'];
    /** In Grafana design system grid units (8px)  */
    rowGap: number;
    /** In Grafana design system grid units (8px)  */
    columnGap: number;
    justifyItems?: CSSProperties['justifyItems'];
    alignItems?: CSSProperties['alignItems'];
    justifyContent?: CSSProperties['justifyContent'];
}
declare class SceneCSSGridLayout extends SceneObjectBase<SceneCSSGridLayoutState> implements SceneLayout {
    static Component: typeof SceneCSSGridLayoutRenderer;
    constructor(state: Partial<SceneCSSGridLayoutState>);
    isDraggable(): boolean;
}
declare function SceneCSSGridLayoutRenderer({ model }: SceneCSSGridItemRenderProps<SceneCSSGridLayout>): React__default.JSX.Element | null;
interface SceneCSSGridItemPlacement {
    /**
     * True when the item should rendered but not visible.
     * Useful for conditional display of layout items
     */
    isHidden?: boolean;
    /**
     * Useful for making content span across multiple rows or columns
     */
    gridColumn?: CSSProperties['gridColumn'];
    gridRow?: CSSProperties['gridRow'];
}
interface SceneCSSGridItemState extends SceneCSSGridItemPlacement, SceneObjectState {
    body: SceneObject | undefined;
}
interface SceneCSSGridItemRenderProps<T> extends SceneComponentProps<T> {
    parentState?: SceneCSSGridItemPlacement;
}
declare class SceneCSSGridItem extends SceneObjectBase<SceneCSSGridItemState> {
    static Component: typeof SceneCSSGridItemRenderer;
}
declare function SceneCSSGridItemRenderer({ model, parentState }: SceneCSSGridItemRenderProps<SceneCSSGridItem>): React__default.JSX.Element | null;

declare function SceneGridLayoutRenderer({ model }: SceneComponentProps<SceneGridLayout>): React__default.JSX.Element;

interface SceneGridItemPlacement {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
}
interface SceneGridItemStateLike extends SceneGridItemPlacement, SceneObjectState {
    isResizable?: boolean;
    isDraggable?: boolean;
}
interface SceneGridItemLike extends SceneObject<SceneGridItemStateLike> {
    /**
     * Provide a custom CSS class name for the underlying DOM element when special styling (i.e. for mobile breakpoint) is required.
     **/
    getClassName?(): string;
}

interface SceneGridRowState extends SceneGridItemStateLike {
    title: string;
    isCollapsible?: boolean;
    isCollapsed?: boolean;
    actions?: SceneObject;
    children: SceneGridItemLike[];
}
declare class SceneGridRow extends SceneObjectBase<SceneGridRowState> {
    static Component: typeof SceneGridRowRenderer;
    protected _variableDependency: VariableDependencyConfig<SceneGridRowState>;
    constructor(state: Partial<SceneGridRowState>);
    getGridLayout(): SceneGridLayout;
    onCollapseToggle: () => void;
    getUrlState(): {
        rowc: string;
    };
    updateFromUrl(values: SceneObjectUrlValues): void;
}
declare function SceneGridRowRenderer({ model }: SceneComponentProps<SceneGridRow>): React__default.JSX.Element;

interface SceneGridLayoutState extends SceneObjectState {
    /**
     * Turn on or off dragging for all items. Individual items can still disabled via isDraggable property
     **/
    isDraggable?: boolean;
    /** Enable or disable item resizing */
    isResizable?: boolean;
    isLazy?: boolean;
    /**
     * Fit panels to height of the grid. This will scale down the panels vertically to fit available height.
     * The row height is not changed, only the y position and height of the panels.
     * UNSAFE: This feature is experimental and it might change in the future.
     */
    UNSAFE_fitPanels?: boolean;
    children: SceneGridItemLike[];
}
declare class SceneGridLayout extends SceneObjectBase<SceneGridLayoutState> implements SceneLayout {
    static Component: typeof SceneGridLayoutRenderer;
    private _skipOnLayoutChange;
    private _oldLayout;
    private _loadOldLayout;
    constructor(state: SceneGridLayoutState);
    /**
     * SceneLayout interface. Used for example by VizPanelRenderer
     */
    isDraggable(): boolean;
    getDragClass(): string;
    getDragClassCancel(): string;
    toggleRow(row: SceneGridRow): void;
    ignoreLayoutChange(shouldIgnore: boolean): void;
    onLayoutChange: (layout: ReactGridLayout.Layout[]) => void;
    /**
     * Will also scan row children and return child of the row
     */
    getSceneLayoutChild(key: string): SceneGridItemLike;
    onResizeStop: ReactGridLayout.ItemCallback;
    private pushChildDown;
    /**
     *  We assume the layout array is sorted according to y pos, and walk upwards until we find a row.
     *  If it is collapsed there is no row to add it to. The default is then to return the SceneGridLayout itself
     */
    private findGridItemSceneParent;
    /**
     * Helper func to check if we are dropping a row in between panels of another row
     */
    private isRowDropValid;
    /**
     * This likely needs a slightly different approach. Where we clone or deactivate or and re-activate the moved child
     */
    moveChildTo(child: SceneGridItemLike, target: SceneGridLayout | SceneGridRow): SceneGridItemLike[];
    onDragStart: ReactGridLayout.ItemCallback;
    onDragStop: ReactGridLayout.ItemCallback;
    private toGridCell;
    buildGridLayout(width: number, height: number): ReactGridLayout.Layout[];
}

interface SceneGridItemState extends SceneGridItemStateLike {
    body: SceneObject | undefined;
}
declare class SceneGridItem extends SceneObjectBase<SceneGridItemState> implements SceneGridItemLike {
    static Component: typeof SceneGridItemRenderer;
}
declare function SceneGridItemRenderer({ model }: SceneComponentProps<SceneGridItem>): React__default.JSX.Element | null;

declare function SplitLayoutRenderer({ model }: SceneFlexItemRenderProps<SplitLayout>): React__default.JSX.Element | null;
interface SceneFlexItemRenderProps<T> extends SceneComponentProps<T> {
    parentState?: SceneFlexItemPlacement;
}

interface SplitLayoutState extends SceneObjectState, SceneFlexItemPlacement {
    primary: SceneFlexItemLike;
    secondary?: SceneFlexItemLike;
    direction: 'row' | 'column';
    initialSize?: number;
    primaryPaneStyles?: CSSProperties;
    secondaryPaneStyles?: CSSProperties;
}
declare class SplitLayout extends SceneObjectBase<SplitLayoutState> {
    static Component: typeof SplitLayoutRenderer;
    toggleDirection(): void;
    isDraggable(): boolean;
}

interface SceneRouteMatch<Params extends {
    [K in keyof Params]?: string;
} = {}> {
    params: Params;
    isExact: boolean;
    path: string;
    url: string;
}
interface SceneAppState extends SceneObjectState {
    pages: SceneAppPageLike[];
    name?: string;
    urlSyncOptions?: SceneUrlSyncOptions;
}
interface SceneAppRoute {
    path: string;
    page?: SceneAppPageLike;
    drilldown?: SceneAppDrilldownView;
}
interface SceneAppPageState extends SceneObjectState {
    /** Page title or tab label */
    title: string;
    /** Page subTitle */
    subTitle?: string | React.ReactNode;
    /**
     * Customize title rendering.
     * Please return an unstyled h1 tag here + any additional elements you need.
     **/
    renderTitle?: (title: string) => React.ReactNode;
    /** For an image before title */
    titleImg?: string;
    /** For an icon before title or tab label */
    titleIcon?: IconName$1;
    /** For a tab label suffix */
    tabSuffix?: ComponentType<{
        className?: string;
    }>;
    url: string;
    routePath?: string;
    /** Array of scene object to be rendered at the top right of the page, inline with the page title */
    controls?: SceneObject[];
    hideFromBreadcrumbs?: boolean;
    tabs?: SceneAppPageLike[];
    getScene?: (routeMatch: SceneRouteMatch) => EmbeddedScene;
    drilldowns?: SceneAppDrilldownView[];
    getParentPage?: () => SceneAppPageLike;
    preserveUrlKeys?: string[];
    /**
     * The current initialized scene, this is set by the framework after scene url initialization
     **/
    initializedScene?: SceneObject;
    /**
     * Function that returns a fallback scene app page,
     * to be rendered when url does not match current page exactly or any of tabs or drilldowns.
     */
    getFallbackPage?: () => SceneAppPageLike;
    layout?: PageLayoutType;
}
interface SceneAppPageLike extends SceneObject<SceneAppPageState>, DataRequestEnricher {
    initializeScene(scene: SceneObject): void;
    /**
     * @internal. Please don't call this from plugin code.
     * Will call the state.getScene function with the current routeMatch and will cache the resulting Scene using the routeMatch.url as key.
     */
    getScene(routeMatch: SceneRouteMatch): EmbeddedScene;
    /**
     * @internal. Please don't call this from plugin code.
     * Get drilldown scene. Will call the drilldown.getPage function with the current routeMatch and will cache the resulting page using the routeMatch.url as key.
     */
    getDrilldownPage(drilldown: SceneAppDrilldownView, routeMatch: SceneRouteMatch): SceneAppPageLike;
}
interface SceneAppDrilldownView {
    routePath: string;
    defaultRoute?: boolean;
    getPage: (routeMatch: SceneRouteMatch<any>, parent: SceneAppPageLike) => SceneAppPageLike;
}

/**
 * Responsible for top level pages routing
 */
declare class SceneApp extends SceneObjectBase<SceneAppState> implements DataRequestEnricher {
    enrichDataRequest(): {
        app: string;
    };
    static Component: ({ model }: SceneComponentProps<SceneApp>) => React__default.JSX.Element;
}
/**
 * Caches the the resulting SceneApp returned by the factory function so that it's only called once during the lifetime of the browser tab
 */
declare function useSceneApp(factory: () => SceneApp): SceneApp;

/**
 * Responsible for page's drilldown & tabs routing
 */
declare class SceneAppPage extends SceneObjectBase<SceneAppPageState> implements SceneAppPageLike {
    static Component: typeof SceneAppPageRenderer;
    private _sceneCache;
    private _drilldownCache;
    constructor(state: SceneAppPageState);
    initializeScene(scene: EmbeddedScene): void;
    getScene(routeMatch: SceneRouteMatch): EmbeddedScene;
    getDrilldownPage(drilldown: SceneAppDrilldownView, routeMatch: SceneRouteMatch<{}>): SceneAppPageLike;
    enrichDataRequest(source: SceneObject): Partial<_grafana_data.DataQueryRequest<_grafana_data.DataQuery>> | null;
}
interface SceneAppPageRendererProps extends SceneComponentProps<SceneAppPage> {
    routeProps: RouteComponentProps;
}
declare function SceneAppPageRenderer({ model, routeProps }: SceneAppPageRendererProps): React__default.JSX.Element;

interface SceneReactObjectState<TProps = {}> extends SceneObjectState {
    /**
     * React component to render
     */
    component?: React__default.ComponentType<TProps>;
    /**
     * Props to pass to the component
     */
    props?: TProps;
    /**
     * Alternative to component and props is just to pass a React node
     */
    reactNode?: React__default.ReactNode;
}
/**
 * A utility object that can be used to render any React component or ReactNode
 */
declare class SceneReactObject<TProps = {}> extends SceneObjectBase<SceneReactObjectState<TProps>> {
    static Component: ({ model }: SceneComponentProps<SceneReactObject>) => string | number | true | Iterable<React__default.ReactNode> | React__default.JSX.Element | null;
}

type StandardFieldConfigInterface<T, C, Prefix extends string> = {
    [K in keyof T as `${Prefix}${Capitalize<string & K>}`]: (value: T[K]) => C;
} & {
    [K in Exclude<keyof T, keyof any[]> as `${Prefix}${Capitalize<string & K>}`]: (value: T[K]) => C;
};
type StandardFieldConfig = Pick<FieldConfig, 'color' | 'decimals' | 'displayName' | 'filterable' | 'links' | 'mappings' | 'max' | 'min' | 'noValue' | 'thresholds' | 'unit'>;
interface VizConfig<TOptions = {}, TFieldConfig = {}> {
    pluginId: string;
    pluginVersion: string;
    options: DeepPartial<TOptions>;
    fieldConfig: FieldConfigSource<DeepPartial<TFieldConfig>>;
}

declare class StandardFieldConfigOverridesBuilder<T extends StandardFieldConfigOverridesBuilder<T>> implements StandardFieldConfigInterface<StandardFieldConfig, T, 'override'> {
    protected _overrides: Array<{
        matcher: MatcherConfig;
        properties: Array<{
            id: string;
            value: unknown;
        }>;
    }>;
    overrideColor(value: StandardFieldConfig['color']): T;
    overrideDecimals(value: StandardFieldConfig['decimals']): T;
    overrideDisplayName(value: StandardFieldConfig['displayName']): T;
    overrideFilterable(value: StandardFieldConfig['filterable']): T;
    overrideLinks(value: StandardFieldConfig['links']): T;
    overrideMappings(value: StandardFieldConfig['mappings']): T;
    overrideMax(value: StandardFieldConfig['max']): T;
    overrideMin(value: StandardFieldConfig['min']): T;
    overrideNoValue(value: StandardFieldConfig['noValue']): T;
    overrideThresholds(value: StandardFieldConfig['thresholds']): T;
    overrideUnit(value: StandardFieldConfig['unit']): T;
}

declare class FieldConfigOverridesBuilder<TFieldConfig> extends StandardFieldConfigOverridesBuilder<FieldConfigOverridesBuilder<TFieldConfig>> {
    match(matcher: MatcherConfig): this;
    matchFieldsWithName(name: string): this;
    matchFieldsWithNameByRegex(regex: string): this;
    matchFieldsByType(fieldType: FieldType): this;
    matchFieldsByQuery(refId: string): this;
    matchFieldsByValue(options: FieldValueMatcherConfig): this;
    matchComparisonQuery(refId: string): this;
    overrideCustomFieldConfig<T extends TFieldConfig, K extends keyof T>(id: K, value: T[K]): this;
    build(): {
        matcher: MatcherConfig<any>;
        properties: {
            id: string;
            value: unknown;
        }[];
    }[];
}

declare class VizPanelBuilder<TOptions extends {}, TFieldConfig extends {}> implements StandardFieldConfigInterface<StandardFieldConfig, VizPanelBuilder<TOptions, TFieldConfig>, 'set'> {
    private _state;
    private _fieldConfigBuilder;
    private _panelOptionsBuilder;
    constructor(pluginId: string, pluginVersion: string, defaultOptions?: () => Partial<TOptions>, defaultFieldConfig?: () => TFieldConfig);
    /**
     * Set panel title.
     */
    setTitle(title: VizPanelState['title']): this;
    /**
     * Set panel description.
     */
    setDescription(description: VizPanelState['description']): this;
    /**
     * Set panel display mode.
     */
    setDisplayMode(displayMode: VizPanelState['displayMode']): this;
    /**
     * Set if panel header should be shown on hover.
     */
    setHoverHeader(hoverHeader: VizPanelState['hoverHeader']): this;
    /**
     * Set panel menu scene object.
     */
    setMenu(menu: VizPanelState['menu']): this;
    /**
     * Set scene object or react component to use as panel header actions.
     */
    setHeaderActions(headerActions: VizPanelState['headerActions']): this;
    /**
     * Set color.
     */
    setColor(color: StandardFieldConfig['color']): this;
    /**
     * Set number of decimals to show.
     */
    setDecimals(decimals: StandardFieldConfig['decimals']): this;
    /**
     * Set field display name.
     */
    setDisplayName(displayName: StandardFieldConfig['displayName']): this;
    /**
     * Set the standard field config property filterable.
     */
    setFilterable(filterable: StandardFieldConfig['filterable']): this;
    /**
     * Set data links.
     */
    setLinks(links: StandardFieldConfig['links']): this;
    /**
     * Set value mappings.
     */
    setMappings(mappings: StandardFieldConfig['mappings']): this;
    /**
     * Set the standard field config property max.
     */
    setMax(max: StandardFieldConfig['max']): this;
    /**
     * Set the standard field config property min.
     */
    setMin(min: StandardFieldConfig['min']): this;
    /**
     * Set the standard field config property noValue.
     */
    setNoValue(noValue: StandardFieldConfig['noValue']): this;
    /**
     * Set the standard field config property thresholds.
     */
    setThresholds(thresholds: StandardFieldConfig['thresholds']): this;
    /**
     * Set the standard field config property unit.
     */
    setUnit(unit: StandardFieldConfig['unit']): this;
    setCustomFieldConfig<T extends TFieldConfig, K extends keyof T>(id: K, value: DeepPartial<T[K]>): this;
    setOverrides(builder: (b: FieldConfigOverridesBuilder<TFieldConfig>) => void): this;
    /**
     * Set an individual panel option. This will merge the value with the existing options.
     */
    setOption<T extends TOptions, K extends keyof T>(id: K, value: DeepPartial<T[K]>): this;
    /**
     * Set data provider for the panel.
     */
    setData(data: VizPanelState['$data']): this;
    /**
     * Set time range for the panel.
     */
    setTimeRange(timeRange: VizPanelState['$timeRange']): this;
    /**
     * Set variables for the panel.
     */
    setVariables(variables: VizPanelState['$variables']): this;
    /**
     * Set behaviors for the panel.
     */
    setBehaviors(behaviors: VizPanelState['$behaviors']): this;
    /**
     * Makes it possible to shared config between different builders
     */
    applyMixin(mixin: (builder: this) => void): this;
    /**
     * Build the panel.
     */
    build(): VizPanel<TOptions, TFieldConfig>;
}

declare class PanelOptionsBuilder<TOptions extends {} = {}> {
    private defaultOptions?;
    private _options;
    constructor(defaultOptions?: (() => Partial<TOptions>) | undefined);
    private setDefaults;
    /**
     * Set an individual panel option. This will merge the value with the existing options.
     */
    setOption<T extends TOptions, K extends keyof T>(id: K, value: DeepPartial<T[K]>): this;
    build(): DeepPartial<TOptions>;
}

declare const PanelOptionsBuilders: {
    barchart(): PanelOptionsBuilder<Options>;
    bargauge(): PanelOptionsBuilder<Options$1>;
    datagrid(): PanelOptionsBuilder<Options$2>;
    flamegraph(): PanelOptionsBuilder<{}>;
    gauge(): PanelOptionsBuilder<Options$3>;
    geomap(): PanelOptionsBuilder<Options$4>;
    heatmap(): PanelOptionsBuilder<Options$5>;
    histogram(): PanelOptionsBuilder<Options$6>;
    logs(): PanelOptionsBuilder<Options$7>;
    news(): PanelOptionsBuilder<Options$8>;
    nodegraph(): PanelOptionsBuilder<Options$9>;
    piechart(): PanelOptionsBuilder<Options$a>;
    stat(): PanelOptionsBuilder<Options$b>;
    statetimeline(): PanelOptionsBuilder<Options$c>;
    statushistory(): PanelOptionsBuilder<Options$d>;
    table(): PanelOptionsBuilder<Options$e>;
    text(): PanelOptionsBuilder<Options$f>;
    timeseries(): PanelOptionsBuilder<Options$g>;
    trend(): PanelOptionsBuilder<{}>;
    traces(): PanelOptionsBuilder<Options$h>;
    xychart(): PanelOptionsBuilder<Options$i>;
};

declare class FieldConfigBuilder<TFieldConfig extends {}> implements StandardFieldConfigInterface<StandardFieldConfig, FieldConfigBuilder<TFieldConfig>, 'set'> {
    private defaultFieldConfig?;
    private _fieldConfig;
    private _overridesBuilder;
    constructor(defaultFieldConfig?: (() => TFieldConfig) | undefined);
    private setDefaults;
    /**
     * Set color.
     */
    setColor(color: StandardFieldConfig['color']): this;
    /**
     * Set number of decimals to show.
     */
    setDecimals(decimals: StandardFieldConfig['decimals']): this;
    /**
     * Set field display name.
     */
    setDisplayName(displayName: StandardFieldConfig['displayName']): this;
    /**
     * Set the standard field config property filterable.
     */
    setFilterable(filterable: StandardFieldConfig['filterable']): this;
    /**
     * Set data links.
     */
    setLinks(links: StandardFieldConfig['links']): this;
    /**
     * Set value mappings.
     */
    setMappings(mappings: StandardFieldConfig['mappings']): this;
    /**
     * Set the standard field config property max.
     */
    setMax(max: StandardFieldConfig['max']): this;
    /**
     * Set the standard field config property min.
     */
    setMin(min: StandardFieldConfig['min']): this;
    /**
     * Set the standard field config property noValue.
     */
    setNoValue(noValue: StandardFieldConfig['noValue']): this;
    /**
     * Set the standard field config property thresholds.
     */
    setThresholds(thresholds: StandardFieldConfig['thresholds']): this;
    /**
     * Set the standard field config property unit.
     */
    setUnit(unit: StandardFieldConfig['unit']): this;
    /**
     * Set an individual custom field config value. This will merge the value with the existing custom field config.
     */
    setCustomFieldConfig<T extends TFieldConfig, K extends keyof T>(id: K, value: DeepPartial<T[K]>): this;
    /**
     * Configure overrides for the field config. This will merge the overrides with the existing overrides.
     */
    setOverrides(builder: (b: FieldConfigOverridesBuilder<TFieldConfig>) => void): this;
    setFieldConfigDefaults<T extends keyof StandardFieldConfig>(key: T, value: StandardFieldConfig[T]): this;
    build(): {
        defaults: _grafana_data.FieldConfig<DeepPartial<TFieldConfig>>;
        overrides: {
            matcher: _grafana_schema.MatcherConfig<any>;
            properties: {
                id: string;
                value: unknown;
            }[];
        }[];
    };
}

declare const FieldConfigBuilders: {
    barchart(): FieldConfigBuilder<FieldConfig$1>;
    bargauge(): FieldConfigBuilder<{}>;
    datagrid(): FieldConfigBuilder<{}>;
    flamegraph(): FieldConfigBuilder<{}>;
    gauge(): FieldConfigBuilder<{}>;
    geomap(): FieldConfigBuilder<{}>;
    heatmap(): FieldConfigBuilder<FieldConfig$2>;
    histogram(): FieldConfigBuilder<FieldConfig$3>;
    logs(): FieldConfigBuilder<{}>;
    news(): FieldConfigBuilder<{}>;
    nodegraph(): FieldConfigBuilder<{}>;
    piechart(): FieldConfigBuilder<FieldConfig$4>;
    stat(): FieldConfigBuilder<{}>;
    statetimeline(): FieldConfigBuilder<FieldConfig$5>;
    statushistory(): FieldConfigBuilder<FieldConfig$6>;
    table(): FieldConfigBuilder<TableFieldOptions>;
    text(): FieldConfigBuilder<{}>;
    timeseries(): FieldConfigBuilder<FieldConfig$7>;
    trend(): FieldConfigBuilder<{}>;
    traces(): FieldConfigBuilder<FieldConfig$8>;
    xychart(): FieldConfigBuilder<{}>;
};

declare const PanelBuilders: {
    barchart(): VizPanelBuilder<Options, FieldConfig$1>;
    bargauge(): VizPanelBuilder<Options$1, {}>;
    datagrid(): VizPanelBuilder<Options$2, {}>;
    flamegraph(): VizPanelBuilder<{}, {}>;
    gauge(): VizPanelBuilder<Options$3, {}>;
    geomap(): VizPanelBuilder<Options$4, {}>;
    heatmap(): VizPanelBuilder<Options$5, FieldConfig$2>;
    histogram(): VizPanelBuilder<Options$6, FieldConfig$3>;
    logs(): VizPanelBuilder<Options$7, {}>;
    news(): VizPanelBuilder<Options$8, {}>;
    nodegraph(): VizPanelBuilder<Options$9, {}>;
    piechart(): VizPanelBuilder<Options$a, FieldConfig$4>;
    stat(): VizPanelBuilder<Options$b, {}>;
    statetimeline(): VizPanelBuilder<Options$c, FieldConfig$5>;
    statushistory(): VizPanelBuilder<Options$d, FieldConfig$6>;
    table(): VizPanelBuilder<Options$e, TableFieldOptions>;
    text(): VizPanelBuilder<Options$f, {}>;
    timeseries(): VizPanelBuilder<Options$g, FieldConfig$7>;
    trend(): VizPanelBuilder<{}, {}>;
    traces(): VizPanelBuilder<Options$h, FieldConfig$8>;
    xychart(): VizPanelBuilder<Options$i, {}>;
};

interface Props {
    scene: SceneObject;
}
/**
 * @internal
 * Please don't use from plugins directly.
 * This is already exposed via SceneAppPage and the ?scene-debugger query parameter.
 *
 * This is only exported so that core dashboards can use it.
 */
declare function SceneDebugger({ scene }: Props): React__default.JSX.Element;

interface ControlsLabelProps {
    label: string;
    htmlFor?: string;
    description?: string;
    isLoading?: boolean;
    error?: string;
    icon?: IconName$1;
    layout?: ControlsLayout;
    onCancel?: () => void;
    onRemove?: () => void;
}
declare function ControlsLabel(props: ControlsLabelProps): JSX.Element;

declare function renderSelectForVariable(model: MultiValueVariable): React__default.JSX.Element;

declare class VizConfigBuilder<TOptions extends {}, TFieldConfig extends {}> implements StandardFieldConfigInterface<StandardFieldConfig, VizConfigBuilder<TOptions, TFieldConfig>, 'set'> {
    private _fieldConfigBuilder;
    private _panelOptionsBuilder;
    private _pluginId;
    private _pluginVersion;
    constructor(pluginId: string, pluginVersion: string, defaultOptions?: () => Partial<TOptions>, defaultFieldConfig?: () => TFieldConfig);
    /**
     * Set color.
     */
    setColor(color: StandardFieldConfig['color']): this;
    /**
     * Set number of decimals to show.
     */
    setDecimals(decimals: StandardFieldConfig['decimals']): this;
    /**
     * Set field display name.
     */
    setDisplayName(displayName: StandardFieldConfig['displayName']): this;
    /**
     * Set the standard field config property filterable.
     */
    setFilterable(filterable: StandardFieldConfig['filterable']): this;
    /**
     * Set data links.
     */
    setLinks(links: StandardFieldConfig['links']): this;
    /**
     * Set value mappings.
     */
    setMappings(mappings: StandardFieldConfig['mappings']): this;
    /**
     * Set the standard field config property max.
     */
    setMax(max: StandardFieldConfig['max']): this;
    /**
     * Set the standard field config property min.
     */
    setMin(min: StandardFieldConfig['min']): this;
    /**
     * Set the standard field config property noValue.
     */
    setNoValue(noValue: StandardFieldConfig['noValue']): this;
    /**
     * Set the standard field config property thresholds.
     */
    setThresholds(thresholds: StandardFieldConfig['thresholds']): this;
    /**
     * Set the standard field config property unit.
     */
    setUnit(unit: StandardFieldConfig['unit']): this;
    setCustomFieldConfig<T extends TFieldConfig, K extends keyof T>(id: K, value: DeepPartial<T[K]>): this;
    setOverrides(builder: (b: FieldConfigOverridesBuilder<TFieldConfig>) => void): this;
    /**
     * Set an individual panel option. This will merge the value with the existing options.
     */
    setOption<T extends TOptions, K extends keyof T>(id: K, value: DeepPartial<T[K]>): this;
    /**
     * Build the panel.
     */
    build(): VizConfig<TOptions, TFieldConfig>;
}

declare const VizConfigBuilders: {
    barchart(): VizConfigBuilder<Options, FieldConfig$1>;
    bargauge(): VizConfigBuilder<Options$1, {}>;
    datagrid(): VizConfigBuilder<Options$2, {}>;
    flamegraph(): VizConfigBuilder<{}, {}>;
    gauge(): VizConfigBuilder<Options$3, {}>;
    geomap(): VizConfigBuilder<Options$4, {}>;
    heatmap(): VizConfigBuilder<Options$5, FieldConfig$2>;
    histogram(): VizConfigBuilder<Options$6, FieldConfig$3>;
    logs(): VizConfigBuilder<Options$7, {}>;
    news(): VizConfigBuilder<Options$8, {}>;
    nodegraph(): VizConfigBuilder<Options$9, {}>;
    piechart(): VizConfigBuilder<Options$a, FieldConfig$4>;
    stat(): VizConfigBuilder<Options$b, {}>;
    statetimeline(): VizConfigBuilder<Options$c, FieldConfig$5>;
    statushistory(): VizConfigBuilder<Options$d, FieldConfig$6>;
    table(): VizConfigBuilder<Options$e, TableFieldOptions>;
    text(): VizConfigBuilder<Options$f, {}>;
    timeseries(): VizConfigBuilder<Options$g, FieldConfig$7>;
    trend(): VizConfigBuilder<{}, {}>;
    traces(): VizConfigBuilder<Options$h, FieldConfig$8>;
    xychart(): VizConfigBuilder<Options$i, {}>;
};

declare class SafeSerializableSceneObject implements ScopedVar {
    #private;
    text: string;
    constructor(value: SceneObject);
    toString(): undefined;
    valueOf: () => SceneObject<SceneObjectState>;
    get value(): this;
}

declare const sceneUtils: {
    getUrlWithAppState: typeof getUrlWithAppState;
    registerRuntimePanelPlugin: typeof registerRuntimePanelPlugin;
    registerRuntimeDataSource: typeof registerRuntimeDataSource;
    registerVariableMacro: typeof registerVariableMacro;
    cloneSceneObjectState: typeof cloneSceneObjectState;
    syncStateFromSearchParams: typeof syncStateFromSearchParams;
    getUrlState: typeof getUrlState;
    renderPrometheusLabelFilters: typeof renderPrometheusLabelFilters;
    isAdHocVariable: typeof isAdHocVariable;
    isConstantVariable: typeof isConstantVariable;
    isCustomVariable: typeof isCustomVariable;
    isDataSourceVariable: typeof isDataSourceVariable;
    isIntervalVariable: typeof isIntervalVariable;
    isQueryVariable: typeof isQueryVariable;
    isTextBoxVariable: typeof isTextBoxVariable;
    isGroupByVariable: typeof isGroupByVariable;
};

export { AdHocFiltersVariable, CancelActivationHandler, ConstantVariable, ControlsLabel, ControlsLayout, CustomFormatterVariable, CustomTransformOperator, CustomTransformerDefinition, CustomVariable, CustomVariableValue, DataLayerFilter, DataProviderProxy, DataRequestEnricher, DataSourceVariable, DeepPartial, EmbeddedScene, EmbeddedSceneState, ExtraQueryDataProcessor, ExtraQueryDescriptor, ExtraQueryProvider, FieldConfigBuilder, FieldConfigBuilders, FieldConfigOverridesBuilder, FiltersRequestEnricher, FormatVariable, GroupByVariable, InterpolationFormatParameter, IntervalVariable, LocalValueVariable, MacroVariableConstructor, MultiValueVariable, MultiValueVariableState, NestedScene, NewSceneObjectAddedEvent, PanelBuilders, PanelOptionsBuilders, QueryRunnerState, QueryVariable, RuntimeDataSource, SafeSerializableSceneObject, SceneActivationHandler, SceneApp, SceneAppDrilldownView, SceneAppPage, SceneAppPageLike, SceneAppPageState, SceneAppRoute, SceneByFrameRepeater, SceneByVariableRepeater, SceneCSSGridItem, SceneCSSGridLayout, SceneCanvasText, SceneComponent, SceneComponentProps, SceneControlsSpacer, SceneDataLayerBase, SceneDataLayerControls, SceneDataLayerProvider, SceneDataLayerProviderState, SceneDataLayerSet, SceneDataLayerSetBase, SceneDataNode, SceneDataProvider, SceneDataProviderResult, SceneDataQuery, SceneDataState, SceneDataTransformer, SceneDataTransformerState, SceneDeactivationHandler, SceneDebugger, SceneFlexItem, SceneFlexItemLike, SceneFlexItemState, SceneFlexLayout, SceneGridItem, SceneGridItemLike, SceneGridItemStateLike, SceneGridLayout, SceneGridRow, SceneLayout, SceneLayoutChildOptions, SceneLayoutState, SceneObject, SceneObjectBase, SceneObjectRef, SceneObjectState, SceneObjectStateChangedEvent, SceneObjectStateChangedPayload, SceneObjectUrlSyncConfig, SceneObjectUrlSyncHandler, SceneObjectUrlValue, SceneObjectUrlValues, SceneObjectWithUrlSync, SceneQueryControllerEntry, SceneQueryControllerEntryType, SceneQueryControllerLike, SceneQueryRunner, SceneReactObject, SceneRefreshPicker, SceneRefreshPickerState, SceneRouteMatch, SceneStateChangedHandler, SceneStatelessBehavior, SceneTimePicker, SceneTimeRange, SceneTimeRangeCompare, SceneTimeRangeLike, SceneTimeRangeState, SceneTimeRangeTransformerBase, SceneTimeZoneOverride, SceneToolbarButton, SceneToolbarInput, SceneUrlSyncOptions, SceneVariable, SceneVariableDependencyConfigLike, SceneVariableSet, SceneVariableSetState, SceneVariableState, SceneVariableValueChangedEvent, SceneVariables, SplitLayout, TestVariable, TextBoxVariable, UrlSyncContextProvider, UrlSyncManager, UrlSyncManagerLike, UseStateHookOptions, UserActionEvent, ValidateAndUpdateResult, VariableCustomFormatterFn, VariableDependencyConfig, VariableGetOptionsArgs, VariableValue, VariableValueControl, VariableValueOption, VariableValueSelectWrapper, VariableValueSelectors, VariableValueSingle, VizConfig, VizConfigBuilder, VizConfigBuilders, VizPanel, VizPanelBuilder, VizPanelMenu, VizPanelState, index$1 as behaviors, index as dataLayers, formatRegistry, isCustomVariableValue, isDataLayer, isDataRequestEnricher, isFiltersRequestEnricher, isSceneObject, registerQueryWithController, registerRuntimeDataSource, renderSelectForVariable, sceneGraph, sceneUtils, useSceneApp, useSceneObjectState, useUrlSync };
