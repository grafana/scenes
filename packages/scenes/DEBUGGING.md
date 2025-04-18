# Debugging @grafana/scenes in Browser DevTools

When using @grafana/scenes as a linked dependency, you might notice that only JavaScript files are visible in the browser's DevTools, not the original TypeScript source files. Here's how to fix this:

## Option 1: Enable source maps in your application

Add the following to your application's webpack configuration to ensure source maps work correctly with linked packages:

```javascript
// In your webpack.config.js
module.exports = {
  // ... existing config
  resolve: {
    // ... existing resolve config
    alias: {
      // ... existing aliases
      '@grafana/scenes': '/absolute/path/to/scenes/packages/scenes/src'
    }
  }
};
```

## Option 2: Configure browser DevTools

In Chrome/Edge DevTools:

1. Open DevTools (F12)
2. Go to Settings (gear icon)
3. Under "Sources", check "Enable JavaScript source maps" and "Enable CSS source maps"
4. Also enable "Auto-reload generated source maps"
5. Add the path to your @grafana/scenes source in the "Workspace" tab
