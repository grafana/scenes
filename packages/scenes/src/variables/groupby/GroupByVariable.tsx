import { t } from '@grafana/i18n';
import React, { useEffect, useMemo, useState } from 'react';
import {
  AdHocVariableFilter,
  DataSourceApi,
  // @ts-expect-error (temporary till we update grafana/data)
  DrilldownsApplicability,
  GetTagResponse,
  GrafanaTheme2,
  MetricFindValue,
  SelectableValue,
} from '@grafana/data';
import { allActiveGroupByVariables } from './findActiveGroupByVariablesByUid';
import { DataSourceRef, VariableType } from '@grafana/schema';
import { SceneComponentProps, ControlsLayout, SceneObjectUrlSyncHandler, SceneDataQuery } from '../../core/types';
import { sceneGraph } from '../../core/sceneGraph';
import {
  SceneVariableValueChangedEvent,
  ValidateAndUpdateResult,
  VariableValue,
  VariableValueOption,
  VariableValueSingle,
} from '../types';
import { MultiValueVariable, MultiValueVariableState, VariableGetOptionsArgs } from '../variants/MultiValueVariable';
import { from, lastValueFrom, map, mergeMap, Observable, of, take, tap } from 'rxjs';
import { getDataSource } from '../../utils/getDataSource';
import { components, GroupBase, MenuProps } from 'react-select';
import { InputActionMeta, MultiSelect, Select, useStyles2 } from '@grafana/ui';
import { isArray, isEqual } from 'lodash';
import { dataFromResponse, getQueriesForVariables, handleOptionGroups, responseHasError } from '../utils';
import { OptionWithCheckbox } from '../components/VariableValueSelect';
import { GroupByVariableUrlSyncHandler } from './GroupByVariableUrlSyncHandler';
import { getOptionSearcher } from '../components/getOptionSearcher';
import { getEnrichedFiltersRequest } from '../getEnrichedFiltersRequest';
import { wrapInSafeSerializableSceneObject } from '../../utils/wrapInSafeSerializableSceneObject';
import { DefaultGroupByCustomIndicatorContainer } from './DefaultGroupByCustomIndicatorContainer';
import { GroupByValueContainer, GroupByContainerProps } from './GroupByValueContainer';
import { getInteractionTracker } from '../../core/sceneGraph/getInteractionTracker';
import { GROUPBY_DIMENSIONS_INTERACTION } from '../../performance/interactionConstants';
import { css, cx } from '@emotion/css';
import { GroupByRecommendations } from './GroupByRecommendations';

export interface GroupByVariableState extends MultiValueVariableState {
  /** Defaults to "Group" */
  name: string;
  /** The visible keys to group on */
  // TODO review this type and name (naming is hard)
  defaultOptions?: MetricFindValue[];
  /** Base filters to always apply when looking up keys */
  baseFilters?: AdHocVariableFilter[];
  /** Datasource to use for getTagKeys and also controls which scene queries the group by should apply to */
  datasource: DataSourceRef | null;
  /** Default value set for this groupBy. When this field is set, changing value will allow the user to restore back to this default value */
  defaultValue?: { text: VariableValue; value: VariableValue };
  /** Needed for url sync when passing flag to another dashboard */
  restorable?: boolean;
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
  /**
   * Holds the applicability for each of the selected keys
   */
  keysApplicability?: DrilldownsApplicability[];
  /**
   * state for checking whether drilldown applicability is enabled
   */
  applicabilityEnabled?: boolean;
  /**
   * Whether the input should be wide. For example, this is needed when dashboardAdHocAndGroupByWrapper feature toggle is enabled so that
   * the input fills the remaining space in the row.
   */
  wideInput?: boolean;

  /**
   * enables drilldown recommendations
   */
  drilldownRecommendationsEnabled?: boolean;
}

export type getTagKeysProvider = (
  set: GroupByVariable,
  currentKey: string | null
) => Promise<{ replace?: boolean; values: MetricFindValue[] | GetTagResponse }>;

export class GroupByVariable extends MultiValueVariable<GroupByVariableState> {
  static Component = GroupByVariableRenderer;
  isLazy = true;

  protected _urlSync: SceneObjectUrlSyncHandler = new GroupByVariableUrlSyncHandler(this);

  private _scopedVars = { __sceneObject: wrapInSafeSerializableSceneObject(this) };

  private _recommendations: GroupByRecommendations | undefined;

  public validateAndUpdate(): Observable<ValidateAndUpdateResult> {
    return this.getValueOptions({}).pipe(
      map((options) => {
        this._updateValueGivenNewOptions(options);
        return {};
      })
    );
  }

  private _updateValueGivenNewOptions(options: VariableValueOption[]) {
    const { value: currentValue, text: currentText } = this.state;

    const stateUpdate: Partial<MultiValueVariableState> = {
      options,
      loading: false,
      value: currentValue ?? [],
      text: currentText ?? [],
    };

    this.setState(stateUpdate);
  }

  public getValueOptions(args: VariableGetOptionsArgs): Observable<VariableValueOption[]> {
    // When default dimensions are provided, return the static list
    if (this.state.defaultOptions) {
      return of(
        this.state.defaultOptions.map((o) => ({
          label: o.text,
          value: String(o.value),
          group: o.group,
        }))
      );
    }

    this.setState({ loading: true, error: null });

    return from(getDataSource(this.state.datasource, this._scopedVars)).pipe(
      mergeMap((ds) => {
        return from(this._getKeys(ds)).pipe(
          tap((response) => {
            if (responseHasError(response)) {
              this.setState({ error: response.error.message });
            }
          }),
          map((response) => dataFromResponse(response)),
          take(1),
          mergeMap((data) => {
            const a: VariableValueOption[] = data.map((i) => {
              return {
                label: i.text,
                value: i.value ? String(i.value) : i.text,
                group: i.group,
              };
            });
            return of(a);
          })
        );
      })
    );
  }

  public constructor(initialState: Partial<GroupByVariableState>) {
    const behaviors = initialState.$behaviors ?? [];
    const recommendations = initialState.drilldownRecommendationsEnabled ? new GroupByRecommendations() : undefined;

    if (recommendations) {
      behaviors.push(recommendations);
    }

    super({
      isMulti: true,
      name: '',
      value: [],
      text: [],
      options: [],
      datasource: null,
      baseFilters: [],
      applyMode: 'auto',
      layout: 'horizontal',
      type: 'groupby' as VariableType,
      ...initialState,
      noValueOnClear: true,
      $behaviors: behaviors.length > 0 ? behaviors : undefined,
    });

    this._recommendations = recommendations;

    if (this.state.defaultValue) {
      this.changeValueTo(this.state.defaultValue.value, this.state.defaultValue.text, false);
    }

    if (this.state.applyMode === 'auto') {
      this.addActivationHandler(() => {
        allActiveGroupByVariables.add(this);

        return () => allActiveGroupByVariables.delete(this);
      });
    }

    this.addActivationHandler(this._activationHandler);
  }

  private _activationHandler = () => {
    this._verifyApplicability();

    if (this.state.defaultValue) {
      if (this.checkIfRestorable(this.state.value)) {
        this.setState({ restorable: true });
      }
    }

    return () => {
      if (this.state.defaultValue) {
        this.restoreDefaultValues();
      }

      this.setState({ applicabilityEnabled: false });
    };
  };

  /**
   * Gets the GroupByRecommendations behavior if it exists in $behaviors
   */
  public getRecommendations(): GroupByRecommendations | undefined {
    return this._recommendations;
  }

  public getApplicableKeys(): string[] {
    const { value, keysApplicability } = this.state;

    const valueArray = isArray(value) ? value.map(String) : value ? [String(value)] : [];

    if (!keysApplicability || keysApplicability.length === 0) {
      return valueArray;
    }

    const applicableValues = valueArray.filter((val) => {
      const applicability = keysApplicability.find((item) => item.key === val);
      return !applicability || applicability.applicable !== false;
    });

    return applicableValues;
  }

  public async getGroupByApplicabilityForQueries(
    value: VariableValue,
    queries: SceneDataQuery[]
  ): Promise<DrilldownsApplicability[] | undefined> {
    const ds = await getDataSource(this.state.datasource, this._scopedVars);

    // @ts-expect-error (temporary till we update grafana/data)
    if (!ds.getDrilldownsApplicability) {
      return;
    }

    const timeRange = sceneGraph.getTimeRange(this).state.value;

    // @ts-expect-error (temporary till we update grafana/data)
    return await ds.getDrilldownsApplicability({
      groupByKeys: Array.isArray(value) ? value.map((v) => String(v)) : value ? [String(value)] : [],
      queries,
      timeRange,
      scopes: sceneGraph.getScopes(this),
      ...getEnrichedFiltersRequest(this),
    });
  }

  public async _verifyApplicability() {
    const queries = getQueriesForVariables(this);
    const value = this.state.value;

    const response = await this.getGroupByApplicabilityForQueries(value, queries);

    if (!response) {
      return;
    }

    if (!isEqual(response, this.state.keysApplicability)) {
      this.setState({ keysApplicability: response ?? undefined, applicabilityEnabled: true });

      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    } else {
      this.setState({ applicabilityEnabled: true });
    }
  }

  // This method is related to the defaultValue property. We check if the current value
  // is different from the default value. If it is, the groupBy will show a button
  // allowing the user to restore the default values.
  public checkIfRestorable(values: VariableValue) {
    const originalValues = isArray(this.state.defaultValue?.value)
      ? this.state.defaultValue?.value
      : this.state.defaultValue?.value
      ? [this.state.defaultValue?.value]
      : [];
    const vals = isArray(values) ? values : [values];

    if (vals.length !== originalValues.length) {
      return true;
    }

    return !isEqual(vals, originalValues);
  }

  public restoreDefaultValues() {
    this.setState({ restorable: false });

    if (!this.state.defaultValue) {
      return;
    }

    this.changeValueTo(this.state.defaultValue.value, this.state.defaultValue.text, true);
  }

  /**
   * Get possible keys given current filters. Do not call from plugins directly
   */
  public _getKeys = async (ds: DataSourceApi) => {
    // TODO:  provide current dimensions?
    const override = await this.state.getTagKeysProvider?.(this, null);

    if (override && override.replace) {
      return override.values;
    }

    if (this.state.defaultOptions) {
      return this.state.defaultOptions.concat(dataFromResponse(override?.values ?? []));
    }

    if (!ds.getTagKeys) {
      return [];
    }

    const queries = getQueriesForVariables(this);

    const otherFilters = this.state.baseFilters || [];
    const timeRange = sceneGraph.getTimeRange(this).state.value;
    const response = await ds.getTagKeys({
      filters: otherFilters,
      queries,
      timeRange,
      scopes: sceneGraph.getScopes(this),
      ...getEnrichedFiltersRequest(this),
    });
    if (responseHasError(response)) {
      this.setState({ error: response.error.message });
    }

    let keys = dataFromResponse(response);
    if (override) {
      keys = keys.concat(dataFromResponse(override.values));
    }

    const tagKeyRegexFilter = this.state.tagKeyRegexFilter;
    if (tagKeyRegexFilter) {
      keys = keys.filter((f) => f.text.match(tagKeyRegexFilter));
    }

    return keys;
  };

  public async _verifyApplicabilityAndStoreRecentGrouping() {
    await this._verifyApplicability();

    if (!this._recommendations) {
      return;
    }

    const applicableValues = this.getApplicableKeys();
    if (applicableValues.length === 0) {
      return;
    }

    this._recommendations.storeRecentGrouping(applicableValues);
  }

  /**
   * Allows clearing the value of the variable to an empty value. Overrides default behavior of a MultiValueVariable
   */
  public getDefaultMultiState(options: VariableValueOption[]) {
    return { value: [], text: [] };
  }
}

export function GroupByVariableRenderer({ model }: SceneComponentProps<GroupByVariable>) {
  const {
    value,
    text,
    key,
    isMulti = true,
    maxVisibleValues,
    noValueOnClear,
    options,
    includeAll,
    allowCustomValue = true,
    defaultValue,
    keysApplicability,
    drilldownRecommendationsEnabled,
  } = model.useState();

  const recommendations = model.getRecommendations();

  const styles = useStyles2(getStyles);

  const values = useMemo<Array<SelectableValue<VariableValueSingle>>>(() => {
    const arrayValue = isArray(value) ? value : [value];
    const arrayText = isArray(text) ? text : [text];

    return arrayValue.map((value, idx) => ({
      value,
      label: String(arrayText[idx] ?? value),
    }));
  }, [value, text]);

  const [isFetchingOptions, setIsFetchingOptions] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // To not trigger queries on every selection we store this state locally here and only update the variable onBlur
  const [uncommittedValue, setUncommittedValue] = useState(values);

  const optionSearcher = useMemo(() => getOptionSearcher(options, includeAll), [options, includeAll]);

  const hasDefaultValue = defaultValue !== undefined;

  // Detect value changes outside
  useEffect(() => {
    setUncommittedValue(values);
  }, [values]);

  const onInputChange = (value: string, { action }: InputActionMeta) => {
    if (action === 'input-change') {
      setInputValue(value);
      if (model.onSearchChange) {
        model.onSearchChange!(value);
      }
      return value;
    }

    if (action === 'input-blur') {
      setInputValue('');
      return '';
    }

    return inputValue;
  };

  const filteredOptions = useMemo(
    () => handleOptionGroups(optionSearcher(inputValue).map(toSelectableValue)),
    [optionSearcher, inputValue]
  );

  const WideInputWrapper = (children: React.ReactNode) => <div className={styles.selectWrapper}>{children}</div>;

  const select = isMulti ? (
    <ConditionalWrapper condition={model.state.wideInput ?? false} wrapper={WideInputWrapper}>
      <MultiSelect<VariableValueSingle>
        aria-label={t(
          'grafana-scenes.variables.group-by-variable-renderer.aria-label-group-by-selector',
          'Group by selector'
        )}
        data-testid={`GroupBySelect-${key}`}
        id={key}
        placeholder={t(
          'grafana-scenes.variables.group-by-variable-renderer.placeholder-group-by-label',
          'Group by label'
        )}
        width="auto"
        className={cx(drilldownRecommendationsEnabled && styles.selectStylesInWrapper)}
        allowCustomValue={allowCustomValue}
        inputValue={inputValue}
        value={uncommittedValue}
        noMultiValueWrap={true}
        maxVisibleValues={maxVisibleValues ?? 5}
        tabSelectsValue={false}
        virtualized
        options={filteredOptions}
        filterOption={filterNoOp}
        closeMenuOnSelect={false}
        isOpen={isOptionsOpen}
        isClearable={true}
        hideSelectedOptions={false}
        isLoading={isFetchingOptions}
        components={{
          Option: OptionWithCheckbox,
          Menu: WideMenu,
          ...(hasDefaultValue
            ? {
                IndicatorsContainer: () => <DefaultGroupByCustomIndicatorContainer model={model} />,
              }
            : {}),
          MultiValueContainer: ({ innerProps, children }: React.PropsWithChildren<GroupByContainerProps>) => (
            <GroupByValueContainer innerProps={innerProps} keysApplicability={keysApplicability}>
              {children}
            </GroupByValueContainer>
          ),
        }}
        onInputChange={onInputChange}
        onBlur={() => {
          model.changeValueTo(
            uncommittedValue.map((x) => x.value!),
            uncommittedValue.map((x) => x.label!),
            true
          );

          const restorable = model.checkIfRestorable(uncommittedValue.map((v) => v.value!));

          if (restorable !== model.state.restorable) {
            model.setState({ restorable: restorable });
          }

          model._verifyApplicabilityAndStoreRecentGrouping();
        }}
        onChange={(newValue, action) => {
          if (action.action === 'clear' && noValueOnClear) {
            model.changeValueTo([], undefined, true);
          }

          setUncommittedValue(newValue);
          setInputValue('');
        }}
        onOpenMenu={async () => {
          const profiler = getInteractionTracker(model);
          profiler?.startInteraction(GROUPBY_DIMENSIONS_INTERACTION);

          setIsFetchingOptions(true);
          await lastValueFrom(model.validateAndUpdate());
          setIsFetchingOptions(false);
          setIsOptionsOpen(true);

          profiler?.stopInteraction();
        }}
        onCloseMenu={() => {
          setIsOptionsOpen(false);
        }}
      />
      ) : (
      <Select
        aria-label={t(
          'grafana-scenes.variables.group-by-variable-renderer.aria-label-group-by-selector',
          'Group by selector'
        )}
        data-testid={`GroupBySelect-${key}`}
        id={key}
        placeholder={t(
          'grafana-scenes.variables.group-by-variable-renderer.placeholder-group-by-label',
          'Group by label'
        )}
        width="auto"
        className={cx(drilldownRecommendationsEnabled && styles.selectStylesInWrapper)}
        inputValue={inputValue}
        value={uncommittedValue && uncommittedValue.length > 0 ? uncommittedValue : null}
        allowCustomValue={allowCustomValue}
        noMultiValueWrap={true}
        maxVisibleValues={maxVisibleValues ?? 5}
        tabSelectsValue={false}
        virtualized
        options={filteredOptions}
        filterOption={filterNoOp}
        closeMenuOnSelect={true}
        isOpen={isOptionsOpen}
        isClearable={true}
        hideSelectedOptions={false}
        noValueOnClear={true}
        isLoading={isFetchingOptions}
        components={{ Menu: WideMenu }}
        onInputChange={onInputChange}
        onChange={(newValue, action) => {
          if (action.action === 'clear') {
            setUncommittedValue([]);
            if (noValueOnClear) {
              model.changeValueTo([]);
            }
            return;
          }
          if (newValue?.value) {
            setUncommittedValue([newValue]);

            model.changeValueTo([newValue.value], newValue.label ? [newValue.label] : undefined);
          }
        }}
        onOpenMenu={async () => {
          const profiler = getInteractionTracker(model);
          profiler?.startInteraction(GROUPBY_DIMENSIONS_INTERACTION);

          setIsFetchingOptions(true);
          await lastValueFrom(model.validateAndUpdate());
          setIsFetchingOptions(false);
          setIsOptionsOpen(true);

          profiler?.stopInteraction();
        }}
        onCloseMenu={() => {
          setIsOptionsOpen(false);
        }}
      />
    </ConditionalWrapper>
  ) : (
    <ConditionalWrapper condition={model.state.wideInput ?? false} wrapper={WideInputWrapper}>
      <Select
        aria-label={t(
          'grafana-scenes.variables.group-by-variable-renderer.aria-label-group-by-selector',
          'Group by selector'
        )}
        data-testid={`GroupBySelect-${key}`}
        id={key}
        placeholder={t(
          'grafana-scenes.variables.group-by-variable-renderer.placeholder-group-by-label',
          'Group by label'
        )}
        width="auto"
        inputValue={inputValue}
        value={uncommittedValue && uncommittedValue.length > 0 ? uncommittedValue : null}
        allowCustomValue={allowCustomValue}
        noMultiValueWrap={true}
        maxVisibleValues={maxVisibleValues ?? 5}
        tabSelectsValue={false}
        virtualized
        options={filteredOptions}
        filterOption={filterNoOp}
        closeMenuOnSelect={true}
        isOpen={isOptionsOpen}
        isClearable={true}
        hideSelectedOptions={false}
        noValueOnClear={true}
        isLoading={isFetchingOptions}
        components={{ Menu: WideMenu }}
        onInputChange={onInputChange}
        onChange={(newValue, action) => {
          if (action.action === 'clear') {
            setUncommittedValue([]);
            if (noValueOnClear) {
              model.changeValueTo([]);
            }
            return;
          }
          if (newValue?.value) {
            setUncommittedValue([newValue]);
            model.changeValueTo([newValue.value], newValue.label ? [newValue.label] : undefined);
          }
        }}
        onOpenMenu={async () => {
          const profiler = getInteractionTracker(model);
          profiler?.startInteraction(GROUPBY_DIMENSIONS_INTERACTION);

          setIsFetchingOptions(true);
          await lastValueFrom(model.validateAndUpdate());
          setIsFetchingOptions(false);
          setIsOptionsOpen(true);

          profiler?.stopInteraction();
        }}
        onCloseMenu={() => {
          setIsOptionsOpen(false);
        }}
      />
    </ConditionalWrapper>
  );

  if (!recommendations) {
    return select;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.recommendations}>
        <recommendations.Component model={recommendations} />
      </div>

      {select}
    </div>
  );
}

const ConditionalWrapper = ({
  condition,
  wrapper,
  children,
}: {
  condition: boolean;
  wrapper: (children: React.ReactNode) => React.ReactElement;
  children: React.ReactNode;
}) => {
  return condition ? wrapper(children) : <>{children}</>;
};

const filterNoOp = () => true;

// custom minWidth menu component to fit custom value message
function WideMenu<Option, IsMulti extends boolean, Group extends GroupBase<Option>>(
  props: MenuProps<Option, IsMulti, Group>
) {
  return (
    <components.Menu {...props}>
      <div style={{ minWidth: '220px' }}>{props.children}</div>
    </components.Menu>
  );
}

function toSelectableValue(input: VariableValueOption): SelectableValue<VariableValueSingle> {
  const { label, value, group } = input;
  const result: SelectableValue<VariableValueSingle> = {
    label,
    value,
  };

  if (group) {
    result.group = group;
  }

  return result;
}

const getStyles = (theme: GrafanaTheme2) => ({
  selectWrapper: css({
    display: 'flex',
    minWidth: 0,
    width: '100%',
  }),
  // Fix for noMultiValueWrap grid layout - prevent pills from stretching
  // when the select is full width. The grid layout uses gridAutoFlow: column
  // which stretches items by default.
  fullWidthMultiSelect: css({
    width: '100%',
    // Target the value container (has data-testid) which uses grid layout
    '& [data-testid]': {
      gridAutoColumns: 'max-content',
      justifyItems: 'start',
    },
  }),
  wrapper: css({
    display: 'flex',
  }),
  selectStylesInWrapper: css({
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    border: `1px solid ${theme.colors.border.strong}`,
    borderLeft: 'none',
  }),
  recommendations: css({
    display: 'flex',
    alignItems: 'center',
    paddingInline: theme.spacing(0.5),
    borderTop: `1px solid ${theme.colors.border.strong}`,
    borderBottom: `1px solid ${theme.colors.border.strong}`,
    backgroundColor: theme.components.input.background,
    '& button': {
      borderRadius: 0,
      height: '100%',
      margin: 0,
      paddingInline: theme.spacing(0.5),
    },
  }),
});
