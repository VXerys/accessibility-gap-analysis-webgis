# Arsitektur Aplikasi

## Diagram Dependency

```
┌─────────────────────────────────────────────────────────────┐
│                         index.html                          │
│                                                             │
│  Loads JavaScript modules in order:                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       1. config.js                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ MapConfig:                                           │  │
│  │  - center, zoom, minZoom, maxZoom                   │  │
│  │  - baseMaps (OSM, Satellite)                        │  │
│  │  - dataSources (GeoJSON paths)                      │  │
│  │  - layerNames, controls                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      2. ui-utils.js                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ UIUtils:                                             │  │
│  │  - showLoading()                                     │  │
│  │  - hideLoading()                                     │  │
│  │  - showError(message)                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    3. marker-utils.js                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ MarkerUtils:                                         │  │
│  │  - iconConfig (colors, symbols)                      │  │
│  │  - getIconConfig(props)                              │  │
│  │  - createMarker(feature, latlng, dataSource)         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    4. popup-utils.js                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ PopupUtils:                                          │  │
│  │  - generatePopupContent(props, dataSource)           │  │
│  │  - createPopupHTML(title, content, color)            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   5. geojson-loader.js                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ GeoJSONLoader:                                       │  │
│  │  Uses: MapConfig, UIUtils, MarkerUtils, PopupUtils  │  │
│  │                                                      │  │
│  │  - loadData(map, layers)                             │  │
│  │  - fetchGeoJSON(url)                                 │  │
│  │  - processGeoJSONData(data, layers, dataSource)      │  │
│  │  - getFeatureStyle(feature)                          │  │
│  │  - bindFeaturePopup(...)                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  6. map-initializer.js                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ MapInitializer:                                      │  │
│  │  Uses: MapConfig, GeoJSONLoader, UIUtils            │  │
│  │                                                      │  │
│  │  - init()                                            │  │
│  │  - createBaseLayers(map)                             │  │
│  │  - createOverlayLayers(map)                          │  │
│  │  - addLayerControl(map, baseMaps, overlayMaps)       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       7. app.js                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Main Entry Point (IIFE):                            │  │
│  │  Uses: MapInitializer                               │  │
│  │                                                      │  │
│  │  - Wait for DOMContentLoaded                         │  │
│  │  - Call MapInitializer.init()                        │  │
│  │  - Handle initialization errors                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Leaflet Map Created                     │
│                                                             │
│  ✓ Base layers (OSM, Satellite)                            │
│  ✓ Overlay layers (SDN, SMP, SMA, Universitas, etc)        │
│  ✓ Custom markers with icons                               │
│  ✓ Popups with formatted content                           │
│  ✓ Layer control, zoom control, scale                      │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
User opens index.html
        │
        ▼
Load Leaflet library
        │
        ▼
Load JavaScript modules (config → utils → initializer → app)
        │
        ▼
DOMContentLoaded event fires
        │
        ▼
app.js calls MapInitializer.init()
        │
        ├─▶ Create Leaflet map instance
        │
        ├─▶ Create base layers (OSM, Satellite)
        │
        ├─▶ Create overlay layer groups
        │
        ├─▶ Add controls (zoom, layers, scale)
        │
        └─▶ GeoJSONLoader.loadData()
                │
                ├─▶ Show loading indicator
                │
                ├─▶ Fetch map.geojson
                │       │
                │       └─▶ Process features
                │           ├─▶ Create markers (MarkerUtils)
                │           ├─▶ Generate popups (PopupUtils)
                │           └─▶ Add to appropriate layers
                │
                ├─▶ Fetch sd-smp-sma.geojson
                │       │
                │       └─▶ Process features
                │           ├─▶ Create markers (MarkerUtils)
                │           ├─▶ Generate popups (PopupUtils)
                │           └─▶ Add to appropriate layers
                │
                └─▶ Hide loading indicator
                        │
                        ▼
                Map ready for user interaction!
```

## Module Relationships

```
                    ┌─────────────┐
                    │   config    │
                    │  (Global)   │
                    └──────┬──────┘
                           │ used by all
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ ui-utils │    │  marker  │    │  popup   │
    │          │    │  -utils  │    │  -utils  │
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
         └───────┬───────┴───────┬───────┘
                 │               │
                 ▼               ▼
          ┌────────────────────────┐
          │   geojson-loader       │
          │  (Uses all utilities)  │
          └───────────┬────────────┘
                      │
                      ▼
          ┌────────────────────────┐
          │   map-initializer      │
          │  (Orchestrates setup)  │
          └───────────┬────────────┘
                      │
                      ▼
          ┌────────────────────────┐
          │        app.js          │
          │    (Entry point)       │
          └────────────────────────┘
```

## Execution Timeline

```
Time  │  Module           │  Action
──────┼──────────────────┼─────────────────────────────────
0ms   │  Browser         │  Load index.html
      │                  │  Load Leaflet CSS/JS
──────┼──────────────────┼─────────────────────────────────
10ms  │  config.js       │  Define MapConfig
──────┼──────────────────┼─────────────────────────────────
15ms  │  ui-utils.js     │  Define UIUtils
──────┼──────────────────┼─────────────────────────────────
20ms  │  marker-utils.js │  Define MarkerUtils
──────┼──────────────────┼─────────────────────────────────
25ms  │  popup-utils.js  │  Define PopupUtils
──────┼──────────────────┼─────────────────────────────────
30ms  │  geojson-loader  │  Define GeoJSONLoader
──────┼──────────────────┼─────────────────────────────────
35ms  │  map-initializer │  Define MapInitializer
──────┼──────────────────┼─────────────────────────────────
40ms  │  app.js          │  Register DOMContentLoaded listener
──────┼──────────────────┼─────────────────────────────────
100ms │  app.js          │  DOMContentLoaded fired
      │                  │  Call MapInitializer.init()
──────┼──────────────────┼─────────────────────────────────
105ms │  MapInitializer  │  Create Leaflet map
      │                  │  Add base layers
      │                  │  Create layer groups
      │                  │  Add controls
──────┼──────────────────┼─────────────────────────────────
110ms │  GeoJSONLoader   │  Show loading indicator
      │                  │  Start fetching GeoJSON files
──────┼──────────────────┼─────────────────────────────────
200ms │  GeoJSONLoader   │  GeoJSON files loaded
      │                  │  Process features
      │  MarkerUtils     │  Create custom markers
      │  PopupUtils      │  Generate popup content
      │                  │  Add to layer groups
──────┼──────────────────┼─────────────────────────────────
250ms │  UIUtils         │  Hide loading indicator
──────┼──────────────────┼─────────────────────────────────
      │  Map             │  ✓ Ready for user interaction!
```

## Best Practices Demonstrated

1. **Separation of Concerns**: Each module handles specific responsibility
2. **Dependency Injection**: Modules receive dependencies as parameters
3. **Single Responsibility Principle**: Each function does one thing
4. **DRY (Don't Repeat Yourself)**: Reusable utilities
5. **Progressive Enhancement**: Graceful loading and error handling
6. **Configuration Management**: Centralized config
7. **Error Handling**: Try-catch blocks and user feedback
8. **Documentation**: JSDoc comments and README files
9. **Naming Conventions**: Clear, descriptive names
10. **Modular Architecture**: Easy to extend and maintain

---

**Dibuat**: October 19, 2025
