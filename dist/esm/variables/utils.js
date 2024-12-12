import { isEqual } from 'lodash';
import { sceneGraph } from '../core/sceneGraph/index.js';
import { SceneQueryRunner } from '../querying/SceneQueryRunner.js';

function isVariableValueEqual(a, b) {
  if (a === b) {
    return true;
  }
  return isEqual(a, b);
}
function safeStringifyValue(value) {
  const getCircularReplacer = () => {
    const seen = /* @__PURE__ */ new WeakSet();
    return (_, value2) => {
      if (typeof value2 === "object" && value2 !== null) {
        if (seen.has(value2)) {
          return;
        }
        seen.add(value2);
      }
      return value2;
    };
  };
  try {
    return JSON.stringify(value, getCircularReplacer());
  } catch (error) {
    console.error(error);
  }
  return "";
}
function renderPrometheusLabelFilters(filters) {
  return filters.map((filter) => renderFilter(filter)).join(",");
}
function renderFilter(filter) {
  var _a, _b;
  let value = "";
  let operator = filter.operator;
  if (operator === "=|") {
    operator = "=~";
    value = (_a = filter.values) == null ? void 0 : _a.map(escapeLabelValueInRegexSelector).join("|");
  } else if (operator === "!=|") {
    operator = "!~";
    value = (_b = filter.values) == null ? void 0 : _b.map(escapeLabelValueInRegexSelector).join("|");
  } else if (operator === "=~" || operator === "!~") {
    value = escapeLabelValueInRegexSelector(filter.value);
  } else {
    value = escapeLabelValueInExactSelector(filter.value);
  }
  return `${filter.key}${operator}"${value}"`;
}
function escapeLabelValueInExactSelector(labelValue) {
  return labelValue.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"');
}
function escapeLabelValueInRegexSelector(labelValue) {
  return escapeLabelValueInExactSelector(escapeLokiRegexp(labelValue));
}
const RE2_METACHARACTERS = /[*+?()|\\.\[\]{}^$]/g;
function escapeLokiRegexp(value) {
  return value.replace(RE2_METACHARACTERS, "\\$&");
}
function getQueriesForVariables(sourceObject) {
  const runners = sceneGraph.findAllObjects(
    sourceObject.getRoot(),
    (o) => o instanceof SceneQueryRunner
  );
  const applicableRunners = filterOutInactiveRunnerDuplicates(runners).filter((r) => {
    var _a, _b;
    return ((_a = r.state.datasource) == null ? void 0 : _a.uid) === ((_b = sourceObject.state.datasource) == null ? void 0 : _b.uid);
  });
  if (applicableRunners.length === 0) {
    return [];
  }
  const result = [];
  applicableRunners.forEach((r) => {
    result.push(...r.state.queries);
  });
  return result;
}
function filterOutInactiveRunnerDuplicates(runners) {
  const groupedItems = {};
  for (const item of runners) {
    if (item.state.key) {
      if (!(item.state.key in groupedItems)) {
        groupedItems[item.state.key] = [];
      }
      groupedItems[item.state.key].push(item);
    }
  }
  return Object.values(groupedItems).flatMap((group) => {
    const activeItems = group.filter((item) => item.isActive);
    if (activeItems.length === 0 && group.length === 1) {
      return group;
    }
    return activeItems;
  });
}
function escapeUrlPipeDelimiters(value) {
  if (value === null || value === void 0) {
    return "";
  }
  return value = /\|/g[Symbol.replace](value, "__gfp__");
}
function escapeUrlCommaDelimiters(value) {
  if (value === null || value === void 0) {
    return "";
  }
  return /,/g[Symbol.replace](value, "__gfc__");
}
function unescapeUrlDelimiters(value) {
  if (value === null || value === void 0) {
    return "";
  }
  value = /__gfp__/g[Symbol.replace](value, "|");
  value = /__gfc__/g[Symbol.replace](value, ",");
  return value;
}
function toUrlCommaDelimitedString(key, label) {
  if (!label || key === label) {
    return escapeUrlCommaDelimiters(key);
  }
  return [key, label].map(escapeUrlCommaDelimiters).join(",");
}
function dataFromResponse(response) {
  return Array.isArray(response) ? response : response.data;
}
function responseHasError(response) {
  return !Array.isArray(response) && Boolean(response.error);
}
function handleOptionGroups(values) {
  const result = [];
  const groupedResults = /* @__PURE__ */ new Map();
  for (const value of values) {
    const groupLabel = value.group;
    if (groupLabel) {
      let group = groupedResults.get(groupLabel);
      if (!group) {
        group = [];
        groupedResults.set(groupLabel, group);
        result.push({ label: groupLabel, options: group });
      }
      group.push(value);
    } else {
      result.push(value);
    }
  }
  return result;
}

export { dataFromResponse, escapeLabelValueInExactSelector, escapeLabelValueInRegexSelector, escapeUrlCommaDelimiters, escapeUrlPipeDelimiters, getQueriesForVariables, handleOptionGroups, isVariableValueEqual, renderPrometheusLabelFilters, responseHasError, safeStringifyValue, toUrlCommaDelimitedString, unescapeUrlDelimiters };
//# sourceMappingURL=utils.js.map
