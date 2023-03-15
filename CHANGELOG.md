# 0.0.21 (2023-03-15)

**VizPanel supports menus**

You can now provide menu items to `VizPanel` object.

Example:

```tsx
const panel = new VizPanel({
  pluginId: 'timeseries',
  menuItems: [
    {
      text: 'Menu item',
      href: 'http://url.com',
    },
    {
      text: 'Manu item with submenu',
      onClick: () => {
        alert('Clicked!');
      },
      subMenu: [
        {
          text: 'Submenu item',
          onClick: () => {
            alert('Submenu item clicked');
          },
        },
      ],
    },
  ],
  // ...
});
```

# 0.0.19 (2023-03-15)

**SceneQueryRunner no longer has transformations**

Instead you have to use SceneDataTransformer and set its internal $data property to the SceneQueryRunner to get the same effect.

Example:

```tsx
 $data: new SceneDataTransformer({
    $data: new SceneQueryRunner({...}),
    transformations: [
      {
        id: 'reduce',
        options: {
          reducers: ['mean'],
        },
      },
    ],
  }),
```

SceneDataTransformer can still be used to transform parent scoped data, it will look for this if there is no $data property set.

The reasons for this change it to have more control over when only transformations should be re-processed (to not issue query again when only a dependency on the transforms changed).
It also removes some duplication between SceneQueryRunner and SceneDataTransformer. There is also a new interface SceneDataProvider.

```ts
export interface SceneDataProvider extends SceneObject<SceneDataState> {
  setContainerWidth?: (width: number) => void;
}
```

Change PR
https://github.com/grafana/scenes/pull/55
