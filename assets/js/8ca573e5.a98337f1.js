"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[95],{876:(e,t,n)=>{n.d(t,{Zo:()=>p,kt:()=>h});var a=n(2784);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function r(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,a,i=function(e,t){if(null==e)return{};var n,a,i={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var s=a.createContext({}),d=function(e){var t=a.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):r(r({},t),e)),n},p=function(e){var t=d(e.components);return a.createElement(s.Provider,{value:t},e.children)},u="mdxType",c={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},m=a.forwardRef((function(e,t){var n=e.components,i=e.mdxType,o=e.originalType,s=e.parentName,p=l(e,["components","mdxType","originalType","parentName"]),u=d(n),m=i,h=u["".concat(s,".").concat(m)]||u[m]||c[m]||o;return n?a.createElement(h,r(r({ref:t},p),{},{components:n})):a.createElement(h,r({ref:t},p))}));function h(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var o=n.length,r=new Array(o);r[0]=m;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l[u]="string"==typeof e?e:i,r[1]=l;for(var d=2;d<o;d++)r[d]=n[d];return a.createElement.apply(null,r)}return a.createElement.apply(null,n)}m.displayName="MDXCreateElement"},5690:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>s,contentTitle:()=>r,default:()=>c,frontMatter:()=>o,metadata:()=>l,toc:()=>d});var a=n(7896),i=(n(2784),n(876));const o={id:"visualizations",title:"Visualizations"},r="Visualizations",l={unversionedId:"visualizations",id:"visualizations",title:"Visualizations",description:"You can add visualizations to your scene by using the scene object class VizPanel.",source:"@site/../docs/visualizations.md",sourceDirName:".",slug:"/visualizations",permalink:"/scenes/docs/visualizations",draft:!1,editUrl:"https://github.com/grafana/scenes/edit/main/docusaurus/website/../docs/visualizations.md",tags:[],version:"current",frontMatter:{id:"visualizations",title:"Visualizations"},sidebar:"sidebar",previous:{title:"Building a scene layout",permalink:"/scenes/docs/scene-layout"},next:{title:"Variables",permalink:"/scenes/docs/variables"}},s={},d=[{value:"Simple <code>VizPanel</code> example",id:"simple-vizpanel-example",level:2},{value:"Data",id:"data",level:2},{value:"Header actions",id:"header-actions",level:2},{value:"Standard Grafana visualizations",id:"standard-grafana-visualizations",level:2},{value:"Step 1. Import the <code>PanelBuilders</code> API",id:"step-1-import-the-panelbuilders-api",level:3},{value:"Step 2. Configure the standard visualization <code>VizPanel</code> object",id:"step-2-configure-the-standard-visualization-vizpanel-object",level:3},{value:"Step 3. Configure data and time range",id:"step-3-configure-data-and-time-range",level:3},{value:"Step 4. Configure panel options",id:"step-4-configure-panel-options",level:3},{value:"Step 5. Configure standard options",id:"step-5-configure-standard-options",level:3},{value:"Step 6. Configure custom field configurations",id:"step-6-configure-custom-field-configurations",level:3},{value:"Step 7. Configure overrides",id:"step-7-configure-overrides",level:3},{value:"<code>matchFieldsWithName(name: string)</code>",id:"matchfieldswithnamename-string",level:4},{value:"<code>matchFieldsWithNameByRegex(regex: string)</code>",id:"matchfieldswithnamebyregexregex-string",level:4},{value:"<code>matchFieldsByType(fieldType: FieldType)</code>",id:"matchfieldsbytypefieldtype-fieldtype",level:4},{value:"<code>matchFieldsByQuery(refId: string)</code>",id:"matchfieldsbyqueryrefid-string",level:4},{value:"<code>matchFieldsByValue(options: FieldValueMatcherConfig)</code>",id:"matchfieldsbyvalueoptions-fieldvaluematcherconfig",level:4},{value:"<code>matchComparisonQuery(refId: string)</code>",id:"matchcomparisonqueryrefid-string",level:4},{value:"Step 8. Build a visualization",id:"step-8-build-a-visualization",level:3},{value:"Step 9. Add the visualization to a scene",id:"step-9-add-the-visualization-to-a-scene",level:3},{value:"Custom visualizations",id:"custom-visualizations",level:2},{value:"Step 1. Define custom panel options and field config",id:"step-1-define-custom-panel-options-and-field-config",level:3},{value:"Step 2. Define the react component that renders custom <code>PanelPlugin</code>",id:"step-2-define-the-react-component-that-renders-custom-panelplugin",level:3},{value:"Step 3. Create <code>PanelPlugin</code> instance and register it with the Scenes library",id:"step-3-create-panelplugin-instance-and-register-it-with-the-scenes-library",level:3},{value:"Step 4. Use custom panel in a scene",id:"step-4-use-custom-panel-in-a-scene",level:3},{value:"Source code",id:"source-code",level:2}],p={toc:d},u="wrapper";function c(e){let{components:t,...n}=e;return(0,i.kt)(u,(0,a.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"visualizations"},"Visualizations"),(0,i.kt)("p",null,"You can add visualizations to your scene by using the scene object class ",(0,i.kt)("inlineCode",{parentName:"p"},"VizPanel"),"."),(0,i.kt)("h2",{id:"simple-vizpanel-example"},"Simple ",(0,i.kt)("inlineCode",{parentName:"h2"},"VizPanel")," example"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"new VizPanel({\n    pluginId: 'timeseries',\n    title: 'Time series',\n    options: {\n        legend: {\n            showLegend: false,\n        }\n    },\n    fieldConfig: {\n        defaults: {\n            unit: 'bytes',\n            min: 0,\n            custom: { lineWidth: 2 fillOpacity: 6 },\n        },\n        overrides: [],\n    }\n})\n")),(0,i.kt)("admonition",{type:"note"},(0,i.kt)("p",{parentName:"admonition"},"The pluginId, ",(0,i.kt)("inlineCode",{parentName:"p"},"timeseries"),", used in the preceding example refers to the core Grafana panel plugin, which is the standard graph visualization for time indexed data. The ",(0,i.kt)("inlineCode",{parentName:"p"},"options")," and ",(0,i.kt)("inlineCode",{parentName:"p"},"fieldConfig")," are the same options you would see\nin a typical dashboard panel when you view the ",(0,i.kt)("strong",{parentName:"p"},"JSON")," tab in the panel inspect drawer. To access this tab, click ",(0,i.kt)("strong",{parentName:"p"},"Inspect > Panel JSON")," in the panel edit menu.")),(0,i.kt)("h2",{id:"data"},"Data"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"VizPanel")," uses the ",(0,i.kt)("inlineCode",{parentName:"p"},"sceneGraph.getData(model)")," call to find and subscribe to the closest parent that has a ",(0,i.kt)("inlineCode",{parentName:"p"},"SceneDataProvider")," object. This means ",(0,i.kt)("inlineCode",{parentName:"p"},"VizPanel")," uses ",(0,i.kt)("inlineCode",{parentName:"p"},"$data")," set on its own level or shares data with other siblings and scene objects if ",(0,i.kt)("inlineCode",{parentName:"p"},"$data")," is set on any parent level."),(0,i.kt)("h2",{id:"header-actions"},"Header actions"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"VizPanel")," has a property named ",(0,i.kt)("inlineCode",{parentName:"p"},"headerActions")," that can be either ",(0,i.kt)("inlineCode",{parentName:"p"},"React.ReactNode")," or a custom ",(0,i.kt)("inlineCode",{parentName:"p"},"SceneObject"),". This property is useful if you want to place links or buttons in the top right corner of the panel header. For example:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},'new VizPanel({\n  pluginId: \'timeseries\',\n  title: \'Time series\',\n  headerActions: (\n    <LinkButton size="sm" variant="secondary" href="scenes/drilldown/url">\n      Drilldown\n    </LinkButton>\n  ),\n});\n')),(0,i.kt)("p",null,"Buttons in the top right corner of the panel header can be used for:"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},"Links to other scenes"),(0,i.kt)("li",{parentName:"ul"},"Buttons that change the current scene (add a drill-down page, for example)"),(0,i.kt)("li",{parentName:"ul"},"A ",(0,i.kt)("inlineCode",{parentName:"li"},"RadioButtonGroup")," that changes the visualization settings")),(0,i.kt)("p",null,"For ",(0,i.kt)("inlineCode",{parentName:"p"},"LinkButton"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"Button"),", and ",(0,i.kt)("inlineCode",{parentName:"p"},"RadioButtonGroup"),', use size="sm" when you place them in the panel header.'),(0,i.kt)("h2",{id:"standard-grafana-visualizations"},"Standard Grafana visualizations"),(0,i.kt)("p",null,"Scenes comes with a helper API, ",(0,i.kt)("inlineCode",{parentName:"p"},"PanelBuilders"),", for building ",(0,i.kt)("a",{parentName:"p",href:"https://grafana.com/docs/grafana/latest/panels-visualizations/visualizations/"},"standard Grafana visualizations"),". These include:"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},"Bar chart"),(0,i.kt)("li",{parentName:"ul"},"Bar gauge"),(0,i.kt)("li",{parentName:"ul"},"Datagrid"),(0,i.kt)("li",{parentName:"ul"},"Flame graph"),(0,i.kt)("li",{parentName:"ul"},"Gauge"),(0,i.kt)("li",{parentName:"ul"},"Geomap"),(0,i.kt)("li",{parentName:"ul"},"Heatmap"),(0,i.kt)("li",{parentName:"ul"},"Histogram"),(0,i.kt)("li",{parentName:"ul"},"Logs"),(0,i.kt)("li",{parentName:"ul"},"News"),(0,i.kt)("li",{parentName:"ul"},"Node graph"),(0,i.kt)("li",{parentName:"ul"},"Pie chart"),(0,i.kt)("li",{parentName:"ul"},"Stat"),(0,i.kt)("li",{parentName:"ul"},"State timeline"),(0,i.kt)("li",{parentName:"ul"},"Status history"),(0,i.kt)("li",{parentName:"ul"},"Table"),(0,i.kt)("li",{parentName:"ul"},"Text"),(0,i.kt)("li",{parentName:"ul"},"Time series"),(0,i.kt)("li",{parentName:"ul"},"Trend"),(0,i.kt)("li",{parentName:"ul"},"Traces"),(0,i.kt)("li",{parentName:"ul"},"XY chart")),(0,i.kt)("p",null,"The ",(0,i.kt)("inlineCode",{parentName:"p"},"PanelBuilders")," API provides support for building ",(0,i.kt)("inlineCode",{parentName:"p"},"VizPanel")," objects for the visualizations listed above, with panel options and field configuration supported."),(0,i.kt)("h3",{id:"step-1-import-the-panelbuilders-api"},"Step 1. Import the ",(0,i.kt)("inlineCode",{parentName:"h3"},"PanelBuilders")," API"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"import { PanelBuilders } from '@grafana/scenes';\n")),(0,i.kt)("h3",{id:"step-2-configure-the-standard-visualization-vizpanel-object"},"Step 2. Configure the standard visualization ",(0,i.kt)("inlineCode",{parentName:"h3"},"VizPanel")," object"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"const myTimeSeriesPanel = PanelBuilders.timeseries().setTitle('My first panel');\n")),(0,i.kt)("h3",{id:"step-3-configure-data-and-time-range"},"Step 3. Configure data and time range"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"const data = new SceneQueryRunner({\n  datasource: {\n    type: 'prometheus',\n    uid: '<PROVIDE_GRAFANA_DS_UID>',\n  },\n  queries: [\n    {\n      refId: 'A',\n      expr: 'rate(prometheus_http_requests_total{}[5m])',\n    },\n  ],\n  $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now' }),\n});\n\nmyTimeSeriesPanel.setData(data);\n")),(0,i.kt)("h3",{id:"step-4-configure-panel-options"},"Step 4. Configure panel options"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"myTimeSeriesPanel.setOption('legend', { asTable: true }).setOption('tooltip', { mode: TooltipDisplayMode.Single });\n")),(0,i.kt)("h3",{id:"step-5-configure-standard-options"},"Step 5. Configure standard options"),(0,i.kt)("p",null,"All Grafana visualizations come with standard options. ",(0,i.kt)("inlineCode",{parentName:"p"},"PanelBuilders")," provides methods for setting each standard option individually.\nRead more about standard options in the official ",(0,i.kt)("a",{parentName:"p",href:"https://grafana.com/docs/grafana/latest/panels-visualizations/configure-standard-options/#standard-options-definitions"},"Grafana documentation"),"."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"myTimeSeriesPanel.setDecimals(2).setUnit('ms');\n")),(0,i.kt)("h3",{id:"step-6-configure-custom-field-configurations"},"Step 6. Configure custom field configurations"),(0,i.kt)("p",null,"Grafana visualizations provide custom, visualization-specific configuration options called ",(0,i.kt)("em",{parentName:"p"},"field configurations"),".\nRead more about field configurations in the official ",(0,i.kt)("a",{parentName:"p",href:"https://grafana.com/docs/grafana/latest/developers/plugins/data-frames/#field-configurations"},"Grafana documentation"),"."),(0,i.kt)("p",null,"Use the ",(0,i.kt)("inlineCode",{parentName:"p"},"setCustomFieldConfig")," method to set value of desired field config property."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"myTimeSeriesPanel.setCustomFieldConfig('lineInterpolation', LineInterpolation.Smooth);\n")),(0,i.kt)("h3",{id:"step-7-configure-overrides"},"Step 7. Configure overrides"),(0,i.kt)("p",null,"Grafana visualizations allow you to customize visualization settings for specific fields or series. This is accomplished by adding an override rule that targets a particular set of fields and that can each define multiple options. Read more about overrides in the official ",(0,i.kt)("a",{parentName:"p",href:"https://grafana.com/docs/grafana/latest/panels-visualizations/configure-overrides/"},"Grafana documentation"),"."),(0,i.kt)("p",null,"Use the ",(0,i.kt)("inlineCode",{parentName:"p"},"setOverrides")," method to set desired field config override. For standard options use ",(0,i.kt)("inlineCode",{parentName:"p"},"override<OptionName>")," method. For custom field config use ",(0,i.kt)("inlineCode",{parentName:"p"},"overrideCustomConfigProperty")," method."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"myTimeSeriesPanel.setOverrides((b) =>\n  b.matchFieldsWithNameByRegex('/metrics/').overrideDecimals(4).overrideCustomFieldConfig('lineWidth', 5)\n);\n")),(0,i.kt)("p",null,"A single override configuration starts with a ",(0,i.kt)("strong",{parentName:"p"},"matcher")," configuration. Thanks to matchers Grafana knows what part of the results the override should be applied to. The following matchers are available:"),(0,i.kt)("h4",{id:"matchfieldswithnamename-string"},(0,i.kt)("inlineCode",{parentName:"h4"},"matchFieldsWithName(name: string)")),(0,i.kt)("p",null,"Select a field from based on provided field name. Properties you add to a rule with this selector are only applied to this single field."),(0,i.kt)("h4",{id:"matchfieldswithnamebyregexregex-string"},(0,i.kt)("inlineCode",{parentName:"h4"},"matchFieldsWithNameByRegex(regex: string)")),(0,i.kt)("p",null,"Specify fields to override with a regular expression. Properties you add to a rule with this selector are applied to all fields where the field name match the regex."),(0,i.kt)("h4",{id:"matchfieldsbytypefieldtype-fieldtype"},(0,i.kt)("inlineCode",{parentName:"h4"},"matchFieldsByType(fieldType: FieldType)")),(0,i.kt)("p",null,"Select fields by type, such as string, numeric, and so on. Properties you add to a rule with this selector are applied to all fields that match the selected type."),(0,i.kt)("h4",{id:"matchfieldsbyqueryrefid-string"},(0,i.kt)("inlineCode",{parentName:"h4"},"matchFieldsByQuery(refId: string)")),(0,i.kt)("p",null,"Select all fields returned by a specific query, such as A, B, or C. Properties you add to a rule with this selector are applied to all fields returned by the selected query."),(0,i.kt)("h4",{id:"matchfieldsbyvalueoptions-fieldvaluematcherconfig"},(0,i.kt)("inlineCode",{parentName:"h4"},"matchFieldsByValue(options: FieldValueMatcherConfig)")),(0,i.kt)("p",null,"Select all fields that match provided value condition configuration. This matchers allows overrides configuration based on condition that is performed against reduced values of a series. You can configure overrides for example for series that have average higher than provided value."),(0,i.kt)("h4",{id:"matchcomparisonqueryrefid-string"},(0,i.kt)("inlineCode",{parentName:"h4"},"matchComparisonQuery(refId: string)")),(0,i.kt)("p",null,"Select all fields returned by a comparison query. Properties you add to a rule with this selector are applied to all fields returned by the comparison query performed for selected query. Read more about ",(0,i.kt)("a",{parentName:"p",href:"/scenes/docs/advanced-time-range-comparison"},"Time range comparison"),"."),(0,i.kt)("h3",{id:"step-8-build-a-visualization"},"Step 8. Build a visualization"),(0,i.kt)("p",null,"Use the ",(0,i.kt)("inlineCode",{parentName:"p"},"build")," method to generate a configured ",(0,i.kt)("inlineCode",{parentName:"p"},"VizPanel")," object:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"const myPanel = myTimeSeriesPanel.build();\n")),(0,i.kt)("h3",{id:"step-9-add-the-visualization-to-a-scene"},"Step 9. Add the visualization to a scene"),(0,i.kt)("p",null,"Create a scene with a layout and add the visualization as a layout child:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"const scene = new EmbeddedScene({\n  body: new SceneFlexLayout({\n    children: [\n      new SceneFlexItem({\n        body: myPanel,\n      }),\n    ],\n  }),\n});\n")),(0,i.kt)("p",null,"This built panel is now ready to be used in a scene."),(0,i.kt)("h2",{id:"custom-visualizations"},"Custom visualizations"),(0,i.kt)("p",null,"If you want to determine how data is visualized in your Grafana app plugin, you can do so in two ways. You always have the option to create a custom ",(0,i.kt)("inlineCode",{parentName:"p"},"SceneObject"),", but you won't get the ",(0,i.kt)("inlineCode",{parentName:"p"},"PanelChrome")," with loading state and other features\nthat ",(0,i.kt)("inlineCode",{parentName:"p"},"VizPanel")," provides. If you want a custom visualization inside a panel frame that should look like the other panels in your scene, then it's best to register a runtime panel plugin."),(0,i.kt)("h3",{id:"step-1-define-custom-panel-options-and-field-config"},"Step 1. Define custom panel options and field config"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"interface CustomVizOptions {\n  mode: string;\n}\n\ninterface CustomVizFieldOptions {\n  numericOption: number;\n}\n\ninterface Props extends PanelProps<CustomVizOptions> {}\n")),(0,i.kt)("h3",{id:"step-2-define-the-react-component-that-renders-custom-panelplugin"},"Step 2. Define the react component that renders custom ",(0,i.kt)("inlineCode",{parentName:"h3"},"PanelPlugin")),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"export function CustomVizPanel(props: Props) {\n  const { options, data } = props;\n\n  return (\n    <div>\n      <h4>\n        CustomVizPanel options: <pre>{JSON.stringify(options)}</pre>\n      </h4>\n      <div>\n        CustomVizPanel field config: <pre>{JSON.stringify(data.series[0]?.fields[0]?.config)}</pre>\n      </div>\n    </div>\n  );\n}\n")),(0,i.kt)("h3",{id:"step-3-create-panelplugin-instance-and-register-it-with-the-scenes-library"},"Step 3. Create ",(0,i.kt)("inlineCode",{parentName:"h3"},"PanelPlugin")," instance and register it with the Scenes library"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"import { sceneUtils } from '@grafana/scenes';\n\nconst myCustomPanel = new PanelPlugin<CustomVizOptions, CustomVizFieldOptions>(CustomVizPanel).useFieldConfig({\n  useCustomConfig: (builder) => {\n    builder.addNumberInput({\n      path: 'numericOption',\n      name: 'Numeric option',\n      description: 'A numeric option',\n      defaultValue: 1,\n    });\n  },\n});\n\nsceneUtils.registerRuntimePanelPlugin({ pluginId: 'my-scene-app-my-custom-viz', plugin: myCustomPanel });\n")),(0,i.kt)("h3",{id:"step-4-use-custom-panel-in-a-scene"},"Step 4. Use custom panel in a scene"),(0,i.kt)("p",null,"You can now use this pluginId in any ",(0,i.kt)("inlineCode",{parentName:"p"},"VizPanel"),". Make sure you specify a pluginId that includes your scene app name and is unlikely to conflict with other Scenes apps."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"const data = new SceneQueryRunner({\n  datasource: {\n    type: 'prometheus',\n    uid: 'gdev-prometheus',\n  },\n  queries: [\n    {\n      refId: 'A',\n      expr: 'rate(prometheus_http_requests_total{}[5m])',\n    },\n  ],\n  $timeRange: new SceneTimeRange({ from: 'now-5m', to: 'now' }),\n});\n\nreturn new EmbeddedScene({\n  $data: data,\n  body: new SceneFlexLayout({\n    children: [\n      new SceneFlexItem({\n        body: new VizPanel({\n          pluginId: 'my-scene-app-my-custom-viz',\n          options: { mode: 'my-custom-mode' },\n          fieldConfig: {\n            defaults: {\n              unit: 'ms',\n              custom: {\n                numericOption: 100,\n              },\n            },\n            overrides: [],\n          },\n        }),\n      }),\n    ],\n  }),\n});\n")),(0,i.kt)("p",null,"For more information, refer to the official ",(0,i.kt)("a",{parentName:"p",href:"https://grafana.com/tutorials/build-a-panel-plugin"},"tutorial on building panel plugins"),". Just remember that for Scenes runtime panel plugins,\nyou don't need a plugin.json file for the panel plugin, as it won't be a standalone plugin that you can use in Dashboards. You'll only be able to reference the plugin inside your Scenes app."),(0,i.kt)("h2",{id:"source-code"},"Source code"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/grafana/scenes/tree/main/docusaurus/docs/visualizations.tsx"},"View the example source code")))}c.isMDXComponent=!0}}]);