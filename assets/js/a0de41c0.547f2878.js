"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[695],{876:(e,t,n)=>{n.d(t,{Zo:()=>p,kt:()=>b});var a=n(2784);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var s=a.createContext({}),c=function(e){var t=a.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},p=function(e){var t=c(e.components);return a.createElement(s.Provider,{value:t},e.children)},d="mdxType",u={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},m=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,o=e.originalType,s=e.parentName,p=l(e,["components","mdxType","originalType","parentName"]),d=c(n),m=r,b=d["".concat(s,".").concat(m)]||d[m]||u[m]||o;return n?a.createElement(b,i(i({ref:t},p),{},{components:n})):a.createElement(b,i({ref:t},p))}));function b(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var o=n.length,i=new Array(o);i[0]=m;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l[d]="string"==typeof e?e:r,i[1]=l;for(var c=2;c<o;c++)i[c]=n[c];return a.createElement.apply(null,i)}return a.createElement.apply(null,n)}m.displayName="MDXCreateElement"},111:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>s,contentTitle:()=>i,default:()=>u,frontMatter:()=>o,metadata:()=>l,toc:()=>c});var a=n(7896),r=(n(2784),n(876));const o={id:"advanced-variables",title:"Variables in custom scene objects"},i=void 0,l={unversionedId:"advanced-variables",id:"advanced-variables",title:"Variables in custom scene objects",description:"Variables lay the foundation for interactive dashboards. They allow dynamic configuration of which data is queried.",source:"@site/../docs/advanced-variables.md",sourceDirName:".",slug:"/advanced-variables",permalink:"/scenes/docs/advanced-variables",draft:!1,editUrl:"https://github.com/grafana/scenes/edit/main/docusaurus/website/../docs/advanced-variables.md",tags:[],version:"current",frontMatter:{id:"advanced-variables",title:"Variables in custom scene objects"},sidebar:"sidebar",previous:{title:"Data and time range in custom scene objects",permalink:"/scenes/docs/advanced-data"},next:{title:"Behaviors",permalink:"/scenes/docs/advanced-behaviors"}},s={},c=[{value:"Use variables in a custom scene object",id:"use-variables-in-a-custom-scene-object",level:2},{value:"Step 1. Build a custom scene object",id:"step-1-build-a-custom-scene-object",level:3},{value:"Step 2. Build a scene with <code>TextInterpolator</code>",id:"step-2-build-a-scene-with-textinterpolator",level:3},{value:"Step 3. Add a variable to a scene",id:"step-3-add-a-variable-to-a-scene",level:3},{value:"Step 4. Add variables support to the <code>TextInterpolator</code> object",id:"step-4-add-variables-support-to-the-textinterpolator-object",level:3},{value:"Step 5. Interpolate <code>text</code> property in the component",id:"step-5-interpolate-text-property-in-the-component",level:3},{value:"Source code",id:"source-code",level:2}],p={toc:c},d="wrapper";function u(e){let{components:t,...n}=e;return(0,r.kt)(d,(0,a.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"/scenes/docs/variables"},"Variables")," lay the foundation for interactive dashboards. They allow dynamic configuration of which data is queried."),(0,r.kt)("p",null,"In addition to standard variables support, Scenes provides an API to make ",(0,r.kt)("a",{parentName:"p",href:"/scenes/docs/advanced-custom-scene-objects"},"custom scene objects")," work with variables. This API offers many more possibilities for dashboard creators."),(0,r.kt)("h2",{id:"use-variables-in-a-custom-scene-object"},"Use variables in a custom scene object"),(0,r.kt)("p",null,"Follow these steps to make a custom scene object reactive to variables."),(0,r.kt)("h3",{id:"step-1-build-a-custom-scene-object"},"Step 1. Build a custom scene object"),(0,r.kt)("p",null,"Start by building a custom scene object that will display provided text."),(0,r.kt)("p",null,"This object will:"),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},"Have a simple state that contains a string value (",(0,r.kt)("inlineCode",{parentName:"li"},"text")," property)."),(0,r.kt)("li",{parentName:"ol"},"Render a ",(0,r.kt)("inlineCode",{parentName:"li"},"textarea")," for state modifications and a preformatted text block for displaying the current value of the ",(0,r.kt)("inlineCode",{parentName:"li"},"text")," state.")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-tsx"},"import { SceneObjectState, SceneObjectBase, SceneComponentProps } from '@grafana/scenes';\nimport { TextArea } from '@grafana/ui';\n\ninterface TextInterpolatorState extends SceneObjectState {\n  text: string;\n}\n\nclass TextInterpolator extends SceneObjectBase<TextInterpolatorState> {\n  static Component = TextInterpolatorRenderer;\n\n  constructor(text: string) {\n    super({ text });\n  }\n\n  onTextChange = (text: string) => {\n    this.setState({ text });\n  };\n}\n\nfunction TextInterpolatorRenderer({ model }: SceneComponentProps<TextInterpolator>) {\n  const { text } = model.useState();\n  return (\n    <div>\n      <div style={{ marginBottom: 8 }}>\n        <TextArea defaultValue={text} onBlur={(e) => model.onTextChange(e.currentTarget.value)} />\n      </div>\n      <pre>{model.state.text}</pre>\n    </div>\n  );\n}\n")),(0,r.kt)("h3",{id:"step-2-build-a-scene-with-textinterpolator"},"Step 2. Build a scene with ",(0,r.kt)("inlineCode",{parentName:"h3"},"TextInterpolator")),(0,r.kt)("p",null,"Create a simple scene with ",(0,r.kt)("inlineCode",{parentName:"p"},"TextInterpolator"),":"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-tsx"},"const scene = new EmbeddedScene({\n  body: new SceneFlexLayout({\n    direction: 'column',\n    children: [\n      new SceneFlexItem({\n        minHeight: 300,\n        body: new TextInterpolator('Hello world'),\n      }),\n    ],\n  }),\n});\n")),(0,r.kt)("h3",{id:"step-3-add-a-variable-to-a-scene"},"Step 3. Add a variable to a scene"),(0,r.kt)("p",null,"Define a custom variable and add it to the scene:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-tsx"},"const greetingsVar = new CustomVariable({\n  name: 'greetings',\n  query: 'Hello , Hola , Bonjour , Ahoj',\n});\n\nconst scene = new EmbeddedScene({\n  $variables: new SceneVariableSet({ variables: [greetingsVar] }),\n  controls: [new VariableValueSelectors({})],\n  body: new SceneFlexLayout({\n    direction: 'column',\n    children: [\n      new SceneFlexItem({\n        minHeight: 300,\n        body: new TextInterpolator('Hello world'),\n      }),\n    ],\n  }),\n});\n")),(0,r.kt)("h3",{id:"step-4-add-variables-support-to-the-textinterpolator-object"},"Step 4. Add variables support to the ",(0,r.kt)("inlineCode",{parentName:"h3"},"TextInterpolator")," object"),(0,r.kt)("p",null,"Use ",(0,r.kt)("inlineCode",{parentName:"p"},"VariableDependencyConfig")," to make ",(0,r.kt)("inlineCode",{parentName:"p"},"TextInterpolator")," reactive to variable changes. Define a ",(0,r.kt)("inlineCode",{parentName:"p"},"protected _variableDependency")," instance property in ",(0,r.kt)("inlineCode",{parentName:"p"},"TextInterpolator")," that's an instance of ",(0,r.kt)("inlineCode",{parentName:"p"},"VariableDependencyConfig"),":"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-tsx"},"class TextInterpolator extends SceneObjectBase<TextInterpolatorState> {\n  static Component = TextInterpolatorRenderer;\n\n  protected _variableDependency = new VariableDependencyConfig(this, {\n    statePaths: ['text'],\n  });\n\n  constructor(text: string) {\n    super({ text });\n  }\n\n  onTextChange = (text: string) => {\n    this.setState({ text });\n  };\n}\n")),(0,r.kt)("p",null,(0,r.kt)("inlineCode",{parentName:"p"},"VariableDependencyConfig")," accepts an object with the following configuration options:"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"statePaths")," - Configures which properties of the object state can contain variables."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"onReferencedVariableValueChanged")," - Configures a callback that will be executed when variable(s) that the object depends on are changed.")),(0,r.kt)("admonition",{type:"note"},(0,r.kt)("p",{parentName:"admonition"},"If ",(0,r.kt)("inlineCode",{parentName:"p"},"onReferencedVariableValueChanged")," is not specified for the ",(0,r.kt)("inlineCode",{parentName:"p"},"VariableDependencyConfig"),", the object will re-render on variable change by default.")),(0,r.kt)("h3",{id:"step-5-interpolate-text-property-in-the-component"},"Step 5. Interpolate ",(0,r.kt)("inlineCode",{parentName:"h3"},"text")," property in the component"),(0,r.kt)("p",null,"In the ",(0,r.kt)("inlineCode",{parentName:"p"},"TextInterpolatorRenderer")," component, use the ",(0,r.kt)("inlineCode",{parentName:"p"},"sceneGraph.interpolate")," helper to replace variables in the ",(0,r.kt)("inlineCode",{parentName:"p"},"text")," property when the variable changes:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-tsx"},"function TextInterpolatorRenderer({ model }: SceneComponentProps<TextInterpolator>) {\n  const { text } = model.useState();\n  const interpolatedText = sceneGraph.interpolate(model, text);\n\n  return (\n    <div>\n      <div style={{ marginBottom: 8 }}>\n        <TextArea defaultValue={text} onBlur={(e) => model.onTextChange(e.currentTarget.value)} />\n      </div>\n      <pre>{interpolatedText}</pre>\n    </div>\n  );\n}\n")),(0,r.kt)("p",null,"The preceding code will render a scene with a template variable, text input, and a preformatted text block. Modify the text in the text input to ",(0,r.kt)("inlineCode",{parentName:"p"},"${greetings} World!"),", and the preformatted text box will update. Change the variable value at the top of the scene, and that will also update the preformatted text block."),(0,r.kt)("h2",{id:"source-code"},"Source code"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/grafana/scenes/tree/main/docusaurus/docs/advanced-variables.tsx"},"View the example source code")))}u.isMDXComponent=!0}}]);