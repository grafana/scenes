# Debugging @grafana/scenes in Browser DevTools

When using @grafana/scenes as a linked dependency, you might notice that only JavaScript files are visible in the browser's DevTools, not the original TypeScript source files. Here's how to fix this:

## Enable source maps in your application

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
