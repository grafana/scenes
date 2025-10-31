import { t } from '@grafana/i18n';
import React, { useEffect, useMemo, useState } from 'react';
import {
  AdHocVariableFilter,
  DataSourceApi,
  // @ts-expect-error (temporary till we update grafana/data)
  DrilldownsApplicability,
  GetTagResponse,
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
import { InputActionMeta, MultiSelect, Select } from '@grafana/ui';
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
}

export type getTagKeysProvider = (
  set: GroupByVariable,
  currentKey: string | null
) => Promise<{ replace?: boolean; values: MetricFindValue[] | GetTagResponse }>;

export class GroupByVariable extends MultiValueVariable<GroupByVariableState> {
  static Component = GroupByVariableRenderer;
  isLazy = true;

  protected _urlSync: SceneObjectUrlSyncHandler = new GroupByVariableUrlSyncHandler(this);

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

    return from(
      getDataSource(this.state.datasource, {
        __sceneObject: wrapInSafeSerializableSceneObject(this),
      })
    ).pipe(
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
    });

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
    };
  };

  public getApplicableKeys(): VariableValue {
    const { value, keysApplicability } = this.state;

    const valueArray = isArray(value) ? value : value ? [value] : [];

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
    const ds = await getDataSource(this.state.datasource, {
      __sceneObject: wrapInSafeSerializableSceneObject(this),
    });

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
      this.setState({ keysApplicability: response ?? undefined });

      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
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

  /**
   * Allows clearing the value of the variable to an empty value. Overrides default behavior of a MultiValueVariable
   */
  public getDefaultMultiState(options: VariableValueOption[]): { value: VariableValueSingle[]; text: string[] } {
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
  } = model.useState();

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

  return isMulti ? (
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

        model._verifyApplicability();
      }}
      onChange={(newValue, action) => {
        if (action.action === 'clear' && noValueOnClear) {
          model.changeValueTo([], undefined, true);
        }

        setUncommittedValue(newValue);
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
  );
}

const filterNoOp = () => true;

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
