# Tagged runtime transformations and promotion plan

## Summary

Split ad-hoc transformation behavior into two explicit stages:

1. Scenes runs owner-tagged transformations outside dashboard state.
2. Grafana can promote a tagged runtime transformation into an ordinary user transformation after checking user intent and permissions.

This keeps runtime behavior available to viewers and editors without dirtying a dashboard. Promotion intentionally changes dashboard state, participates in undo and redo, appears in the transformation editor, and persists like any other user transformation.

The design reuses the existing system transformation pipeline instead of introducing a separate runtime layer model.

## Goals

- Allow multiple independent owners to contribute temporary transformations without replacing each other's values.
- Allow viewers to use visualization interactions backed by runtime transformations.
- Allow editors to use the same runtime behavior without immediately changing dashboard state.
- Let Grafana promote an owner-tagged runtime transformation into `state.transformations` after checking permissions and user intent.
- Prevent the runtime and promoted copies of the same transformation from running together.
- Preserve normal dashboard dirty-state, undo, save, reload, clone, and editor behavior after promotion.
- Keep existing `SystemTransformationsProvider` behavior compatible.

## Non-goals

- A general-purpose runtime layer framework.
- More runtime phases than the existing system transformation positions require.
- Source-frame-aware runtime suppliers owned by `SceneDataTransformer`.
- A separate frozen runtime-layer snapshot API.
- Per-owner supplier memoization.
- Automatic variable interpolation for runtime transformations.
- Stage-input access or restoration of values removed by earlier transformations.
- Permission enforcement inside Scenes.

## Shared terminology

- **Tag**: A stable owner-defined identifier for one logical transformation contribution, for example `table:column-filter`.
- **Runtime transformation**: A tagged transformation that affects the active pipeline but is not part of scene state.
- **Promoted transformation**: A tagged transformation stored in `state.transformations` and treated as user dashboard configuration.
- **Owner**: The plugin or Grafana feature responsible for updating a tag.

Tags identify ownership. Transformation IDs continue to identify transformation implementations in the Grafana transformation registry.

## Stage 1: Tagged runtime system transformations

### Objective

Allow plugins and Grafana features to add, update, and remove temporary transformations without changing dashboard state.

### Scenes API

Add an owner-tagged mutation API to `SceneDataTransformer`. Exact naming can be finalized during implementation, but the intended contract is:

```ts
transformer.upsertRuntimeTransformations({
  tag: 'table:column-filter',
  transformations,
});

transformer.removeRuntimeTransformations('table:column-filter');
```

The API accepts transformation values directly. It does not accept a supplier callback.

### Storage and ownership

- Store runtime contributions outside `SceneDataTransformer.state`.
- Store one ordered transformation group per tag.
- Upserting an existing tag replaces only that tag's group.
- Removing a tag removes only that tag's group.
- Removing a missing tag is a no-op.
- Preserve the original registration order when an existing tag is updated.
- A removed tag that is later re-added receives a new position at the end.

### Pipeline order

Reuse the existing system transformation pipeline:

1. Provider prepend transformations.
2. Saved user transformations.
3. Provider append transformations.
4. Tagged runtime transformations in tag registration order.

The first version supports this final runtime position only. Add another position only after a concrete consumer requires it.

### Resolved transformation metadata

- Add an optional owner tag to resolved system transformation metadata.
- Keep existing provider `origin` and `position` metadata.
- Untagged provider transformations remain valid and unchanged.
- Expose tagged runtime transformations through the existing resolved-system-transformation inspection path.
- Do not add a separate runtime-layer introspection API.

### Update behavior

- If the transformer is active, an upsert or removal reprocesses the current source frames.
- Runtime updates must not issue a new datasource query.
- If the transformer is inactive, record the new runtime value and apply it on the next activation.
- It is acceptable to recompose all runtime groups on an update. Selective per-owner memoization is not required.
- Runtime transformation execution errors follow the existing transformation pipeline error behavior.

### State and lifecycle behavior

- Runtime transformations never enter `state.transformations`.
- Runtime changes do not publish a transformation configuration state update.
- Runtime changes do not dirty a dashboard.
- Runtime transformations are absent from `toJSON()` and dashboard serialization.
- Runtime transformations are not copied to scene clones or duplicated panels.
- Owners are responsible for removing their tag when their runtime behavior ends.

### Grafana integration

- Plugins and Grafana features may use tagged runtime transformations regardless of dashboard edit permission.
- Runtime transformations are presented as read-only system transformations where transformation inspection is available.
- Grafana remains responsible for plugin feature flags and determining the active runtime configuration.
- Grafana must use a stable, namespaced tag for each independently managed behavior.

### Stage 1 tests

#### Scenes unit tests

- Two tags contribute transformations without overwriting each other.
- Updating one tag preserves every other tag.
- Removing one tag preserves every other tag.
- Updating a tag preserves its original execution position.
- Removing and re-adding a tag moves it to the end.
- Provider prepend, user, provider append, and runtime transformations execute in the documented order.
- Runtime changes reprocess existing source frames without running the datasource query.
- Changes made while inactive apply on activation.
- Runtime contributions do not modify `state.transformations` or serialized scene state.
- Clones do not inherit runtime contributions or their applied output.
- Existing provider behavior and resolved-system-transformation inspection remain compatible.

#### Grafana integration tests

- A viewer interaction can update rendered output through a runtime transformation.
- A runtime transformation does not mark the dashboard dirty.
- Runtime transformations appear as read-only system transformations in applicable inspection and editor surfaces.
- Multiple Grafana features can own different tags on the same panel.

### Stage 1 deliverable

Stage 1 ships independently. It provides runtime behavior for viewers and editors without defining persistence or promotion.

## Stage 2: Promote runtime transformations to user state

### Objective

Allow core Grafana to convert visualization-driven runtime behavior into ordinary persisted dashboard configuration after checking user intent and editor permissions.

### Persistent tag contract

Before implementing promotion, define a first-class ownership metadata field for persisted transformations.

Requirements:

- The field is distinct from the transformation registry `id`.
- The field is namespaced and stable across a dashboard reload.
- Legacy dashboard serialization preserves it.
- Dashboard schema v2 serialization preserves it.
- Transformation editors preserve it when updating a configuration object.
- Unknown or untagged transformations continue to behave normally.

Do not rely on an arbitrary unknown top-level property. Legacy serialization may preserve it while schema v2 drops it. Do not store ownership metadata inside transformation-specific `options`.

The final schema name is a design decision. The examples in this document use `tag`.

### Scenes API

Add a state-writing API with this intended contract:

```ts
transformer.upsertAdHocTransformations({
  tag: 'table:column-filter',
  transformations,
});
```

Behavior:

- Find all saved transformations owned by the tag.
- If the tag exists, replace its group at the position of its first existing entry.
- If the tag does not exist, append the group after existing user transformations.
- Preserve all untagged transformations and transformations owned by other tags.
- Treat an empty transformation list as removal of the promoted group.
- Publish one state update and run one transformation pass.
- Reprocess current source frames without issuing a datasource query.

### Runtime suppression

- A promoted state transformation suppresses runtime transformations with the same tag.
- State wins whenever runtime and promoted values temporarily coexist.
- Suppression happens while composing the pipeline, preventing double application without requiring callers to coordinate two separate asynchronous updates.
- Removing the promoted state group reveals any runtime contribution that the owner still publishes for that tag.
- When the user clears the visualization behavior completely, Grafana must remove both the promoted group and the owner's runtime contribution.

### Grafana permission and interaction behavior

Scenes remains permission-agnostic. Core Grafana chooses the operation:

- A viewer uses `upsertRuntimeTransformations` only.
- An editor may use runtime transformations for temporary or preview behavior.
- After a permitted user action or explicit promotion, Grafana calls `upsertAdHocTransformations`.
- A user without edit permission remains on the runtime path.
- Promotion is never automatic solely because the dashboard is in edit mode.

### Behavior after promotion

A promoted transformation is a normal user transformation:

- It marks the dashboard dirty.
- It participates in undo and redo.
- It appears in transformation counts and editors.
- The user can edit, disable, reorder, or delete it.
- It is saved in legacy and schema v2 dashboards.
- It survives reload, scene cloning, panel duplication, and dashboard duplication.
- It is included in compatibility APIs that expose user transformations.

### Subsequent visualization interactions

- A later visualization interaction finds the transformation by tag and updates it in place.
- Updating it preserves the position selected by the user.
- If the user deleted it, the next visualization interaction may create a new group at the end.
- If the user edited its owned options, a later visualization interaction may replace those owned options.
- Transformations and options outside the owner's tag remain untouched.

Grafana should document which options are owned by the visualization interaction if an editor can also modify them manually.

### Editor and mutation API updates

All whole-array transformation writers must preserve ownership metadata. This includes:

- Classic transformation editing.
- The next-generation query and transformation editor.
- Bulk reorder, disable, and delete actions.
- Dashboard mutation APIs.
- Panel plugin migrations that replace transformation arrays.
- Compatibility wrappers.

The promoted entries remain visible and editable. These consumers should preserve their metadata rather than filter the entries out.

### Serialization updates

- Add the tag field to the canonical transformation schema.
- Update legacy model conversion to preserve the field deliberately.
- Update schema v2 conversion in both directions.
- Add compatibility handling for dashboards without tags.
- Verify snapshot dashboards and repeated panels.
- Verify library panel save and restore behavior.

### Stage 2 tests

#### Scenes unit tests

- Promotion replaces the effective runtime group without applying both copies.
- A promoted group is appended on first insertion.
- Later upserts replace the group in place.
- Upserting one tag preserves untagged transformations and other tags.
- An empty upsert removes only the matching promoted group.
- Removing a promoted group reveals a still-active runtime contribution with the same tag.
- Promotion produces one state update and does not rerun the datasource query.
- Promoted transformations survive scene cloning while runtime transformations do not.

#### Grafana integration tests

- Viewer interactions affect output without dirtying or saving the dashboard.
- An unauthorized user cannot promote runtime behavior.
- An authorized promotion marks the dashboard dirty.
- Undo and redo transition between the expected runtime and promoted behavior without duplication.
- The transformation editor displays and edits the promoted transformation.
- Reordering is preserved by a later visualization upsert.
- Deleting the promoted transformation follows the documented runtime fallback behavior.
- Legacy save and reload preserve the tag.
- Schema v2 save and reload preserve the tag.
- After reload, a visualization interaction updates the existing transformation rather than creating a duplicate.
- Panel and dashboard duplication copy promoted transformations but not runtime contributions.

### Stage 2 deliverable

Stage 2 ships only after tag persistence and editor preservation work across Grafana's supported dashboard formats.

## Implementation sequence

1. Replace the runtime-layer implementation in PR #1650 with the Stage 1 tagged runtime contribution API.
2. Keep the existing system transformation provider and pipeline behavior intact.
3. Add focused Scenes tests for tagged ownership, ordering, state isolation, activation, cloning, and query avoidance.
4. Integrate one Grafana consumer behind its existing feature control and validate viewer behavior.
5. Define and land the persistent transformation tag in the Grafana schema.
6. Update Grafana serializers, editors, mutation APIs, migrations, and compatibility wrappers to preserve the tag.
7. Add the Scenes state upsert and runtime-suppression behavior.
8. Add Grafana permission checks and the visualization promotion flow.
9. Validate legacy dashboards, schema v2 dashboards, snapshots, repeated panels, library panels, duplication, undo, and reload.

## Decisions to finalize before Stage 2 implementation

1. The persisted metadata field name and schema shape.
2. Whether one tag can own multiple transformation entries. This plan assumes yes.
3. Which visualization interactions promote automatically and which require explicit confirmation.
4. Which transformation options remain visualization-owned after the user edits the promoted entry.
5. The exact behavior when a promoted transformation is deleted while its owner still publishes a runtime contribution.

## Completion criteria

The proposal is complete when:

- Viewers can use tagged runtime transformations without dashboard state changes.
- Editors can use the same runtime behavior before promotion.
- Grafana can promote an authorized interaction into user transformation state.
- Runtime and promoted copies never run together.
- Promoted transformations behave like normal user transformations across editing, dirty tracking, undo, saving, reload, cloning, and duplication.
- Existing system transformation providers remain compatible.
