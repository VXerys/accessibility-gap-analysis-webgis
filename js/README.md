# JavaScript Modules Documentation

## Struktur File

Aplikasi ini menggunakan **modular architecture** untuk memisahkan concerns dan meningkatkan maintainability.

```
js/
├── config.js              # Konfigurasi aplikasi
├── ui-utils.js            # Utilities untuk UI (loading, error)
├── marker-utils.js        # Utilities untuk marker custom
├── popup-utils.js         # Utilities untuk popup content
├── geojson-loader.js      # Loader dan processor GeoJSON
├── map-initializer.js     # Inisialisasi map dan layers
└── app.js                 # Entry point aplikasi
```

## Dependency Order

File-file harus diload dalam urutan ini (sudah diatur di `index.html`):

1. **config.js** - Konfigurasi global
2. **ui-utils.js** - UI utilities
3. **marker-utils.js** - Marker creation
4. **popup-utils.js** - Popup generation
5. **geojson-loader.js** - Data loading (depends on: ui-utils, marker-utils, popup-utils)
6. **map-initializer.js** - Map setup (depends on: config, geojson-loader)
7. **app.js** - Application entry point (depends on: map-initializer)

---

## 1. config.js

**Purpose**: Centralized configuration management

**Exports**: `MapConfig` object

**Contents**:
- Map center coordinates
- Zoom levels (default, min, max)
- Base map configurations (OSM, Satellite)
- GeoJSON data source paths
- Layer names for UI
- Control positions

**Why separate?**
- Easy to modify settings without touching logic
- Single source of truth for configuration
- Can be easily replaced with environment-specific configs

---

## 2. ui-utils.js

**Purpose**: User interface utilities

**Exports**: `UIUtils` object

**Methods**:
- `showLoading()` - Show loading indicator
- `hideLoading()` - Hide loading indicator
- `showError(message)` - Display error notification

**Why separate?**
- Reusable UI components
- Consistent error/loading handling
- Easy to update UI behavior globally

---

## 3. marker-utils.js

**Purpose**: Custom marker creation and styling

**Exports**: `MarkerUtils` object

**Contents**:
- `iconConfig` - Icon configurations by school type
- `getIconConfig(props)` - Determine icon based on properties
- `createMarker(feature, latlng, dataSource)` - Create custom Leaflet marker

**Why separate?**
- Encapsulates marker styling logic
- Easy to modify icon colors/symbols
- Consistent marker appearance

---

## 4. popup-utils.js

**Purpose**: Popup content generation

**Exports**: `PopupUtils` object

**Methods**:
- `generatePopupContent(props, dataSource)` - Generate content based on feature
- `createPopupHTML(title, content, color)` - Format HTML for popup

**Why separate?**
- Centralized popup formatting
- Easy to modify popup appearance
- Consistent popup structure

---

## 5. geojson-loader.js

**Purpose**: Load and process GeoJSON data

**Exports**: `GeoJSONLoader` object

**Methods**:
- `loadData(map, layers)` - Main loading orchestrator
- `fetchGeoJSON(url)` - Fetch single GeoJSON file
- `processGeoJSONData(data, layers, dataSource)` - Process and add to map
- `getFeatureStyle(feature)` - Style for line/polygon features
- `bindFeaturePopup(feature, layer, layers, dataSource)` - Attach popup and layer

**Dependencies**: 
- UIUtils (loading states)
- MarkerUtils (create markers)
- PopupUtils (generate popups)
- MapConfig (data source paths)

**Why separate?**
- Complex data loading logic isolated
- Easier to debug data issues
- Can be extended for more data sources

---

## 6. map-initializer.js

**Purpose**: Initialize Leaflet map with all components

**Exports**: `MapInitializer` object

**Methods**:
- `init()` - Main initialization function
- `createBaseLayers(map)` - Setup base map layers
- `createOverlayLayers(map)` - Setup overlay layer groups
- `addLayerControl(map, baseMaps, overlayMaps)` - Add layer switcher

**Dependencies**:
- MapConfig (configuration)
- GeoJSONLoader (load data)
- UIUtils (error handling)

**Why separate?**
- Clear initialization flow
- Modular setup process
- Easy to add/remove map components

---

## 7. app.js

**Purpose**: Application entry point

**Exports**: None (IIFE)

**Function**:
- Wait for DOM ready
- Initialize the map via `MapInitializer.init()`
- Handle initialization errors

**Why separate?**
- Clean entry point
- Handles DOM ready state
- Single place to start the app

---

## Benefits of This Architecture

### ✅ **Maintainability**
- Each file has a single responsibility
- Easy to find and fix bugs
- Changes are isolated to specific modules

### ✅ **Readability**
- Small, focused files (50-120 lines each)
- Clear naming and structure
- Easy to understand flow

### ✅ **Testability**
- Each module can be tested independently
- Mock dependencies easily
- Clear input/output contracts

### ✅ **Scalability**
- Easy to add new features
- Can add new modules without touching existing ones
- Clear extension points

### ✅ **Reusability**
- Utility modules can be used in other projects
- Consistent patterns across modules
- No code duplication

---

## Best Practices Applied

1. **Separation of Concerns**: Each file handles one aspect
2. **Single Responsibility Principle**: Each module does one thing well
3. **Dependency Management**: Clear dependencies between modules
4. **Naming Conventions**: Descriptive names (PascalCase for modules, camelCase for methods)
5. **Comments & Documentation**: JSDoc-style comments throughout
6. **Error Handling**: Proper try-catch and error messages
7. **Configuration Management**: Centralized config
8. **Modularity**: Can swap implementations without changing interfaces

---

## Migration from Monolithic map.js

**Before**: 351 lines in single file
**After**: 7 files, each ~50-100 lines

| File | Lines | Purpose |
|------|-------|---------|
| config.js | ~60 | Configuration |
| ui-utils.js | ~60 | UI utilities |
| marker-utils.js | ~90 | Marker creation |
| popup-utils.js | ~75 | Popup generation |
| geojson-loader.js | ~115 | Data loading |
| map-initializer.js | ~120 | Map initialization |
| app.js | ~25 | Entry point |

**Total**: ~545 lines (with extensive comments and documentation)

---

## Future Enhancements

With this modular structure, it's easy to add:

- **search-utils.js** - Add search functionality
- **routing-utils.js** - Add routing/directions
- **cluster-utils.js** - Add marker clustering
- **filter-utils.js** - Add layer filtering
- **export-utils.js** - Add data export features
- **analytics.js** - Add usage analytics

Each new feature can be a separate module without touching existing code!

---

## How to Extend

### Adding a New Layer Type

1. Update `MapConfig.layerNames` in **config.js**
2. Add layer group in `createOverlayLayers()` in **map-initializer.js**
3. Add icon config in `MarkerUtils.iconConfig` in **marker-utils.js**
4. Add popup logic in `PopupUtils.generatePopupContent()` in **popup-utils.js**

### Adding a New Base Map

1. Add configuration to `MapConfig.baseMaps` in **config.js**
2. Add layer creation in `createBaseLayers()` in **map-initializer.js**

### Changing Marker Style

1. Modify `MarkerUtils.createMarker()` in **marker-utils.js**
2. All markers will automatically update!

---

**File dibuat**: October 19, 2025
**Versi**: 1.0.0
