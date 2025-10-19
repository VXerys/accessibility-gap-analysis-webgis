# Project Architecture Documentation

## 📁 Directory Structure

```
kecamatan-gunungpuyuh-gis/
│
├── index.html                 # Main HTML file (entry point)
│
├── css/                       # Stylesheets (Modular CSS)
│   ├── README.md             # CSS architecture guide
│   ├── variables.css         # Design tokens & CSS variables
│   ├── splash.css            # Splash screen styles
│   ├── header.css            # Header & navigation
│   ├── map.css               # Map container & Leaflet
│   ├── info-panel.css        # Info sidebar panel
│   ├── components.css        # Reusable UI components
│   ├── footer.css            # Footer section
│   └── animations.css        # Keyframes & animations
│
├── js/                        # JavaScript (Modular ES6+)
│   ├── README.md             # JS architecture guide
│   ├── config.js             # Configuration & constants
│   ├── ui-utils.js           # UI utility functions
│   ├── marker-utils.js       # Marker creation utilities
│   ├── popup-utils.js        # Popup creation utilities
│   ├── geojson-loader.js     # GeoJSON data loading
│   ├── map-initializer.js    # Map initialization
│   └── app.js                # Application entry point
│
├── components/                # HTML component documentation
│   └── README.md             # HTML structure guide
│
├── map.geojson               # Kecamatan boundary data
├── sd-smp-sma.geojson        # Education facilities data
│
├── README.md                 # Project documentation
├── ARCHITECTURE.md           # Architecture details
├── CONTRIBUTORS.md           # Team members
├── CHANGELOG-V2.md           # Version history
├── QUICK-START.md            # Quick start guide
└── IMPLEMENTATION-COMPLETE.md # Implementation notes

```

## 🏗️ Architecture Overview

### Layer 1: Presentation (HTML)
- **File**: `index.html`
- **Purpose**: Semantic HTML structure
- **Sections**:
  - Splash screen (loading)
  - Header (branding & stats)
  - Main content (map & info panel)
  - Footer (credits & links)

### Layer 2: Styling (CSS Modules)
- **Folder**: `css/`
- **Purpose**: Modular, maintainable styles
- **Approach**: Component-based architecture
- **Benefits**:
  - Easy to find and edit specific styles
  - Prevents CSS conflicts
  - Better caching (smaller files)
  - Clear separation of concerns

### Layer 3: Behavior (JavaScript Modules)
- **Folder**: `js/`
- **Purpose**: Interactive functionality
- **Pattern**: Module pattern with separation of concerns
- **Benefits**:
  - Reusable functions
  - Easier testing
  - Clear dependencies
  - Better maintainability

### Layer 4: Data (GeoJSON)
- **Files**: `*.geojson`
- **Purpose**: Geographic data storage
- **Format**: Standard GeoJSON specification

## 📊 Data Flow

```
1. User opens index.html
   ↓
2. Load CSS modules (variables → components → animations)
   ↓
3. Load JS modules (config → utils → initializer → app)
   ↓
4. app.js initializes application
   ↓
5. map-initializer.js creates Leaflet map
   ↓
6. geojson-loader.js fetches GeoJSON data
   ↓
7. marker-utils.js creates markers
   ↓
8. popup-utils.js binds popups
   ↓
9. ui-utils.js manages UI interactions
   ↓
10. Application ready!
```

## 🎨 CSS Architecture

### Import Order (Critical!)
```html
<!-- 1. Variables first (defines CSS custom properties) -->
<link rel="stylesheet" href="css/variables.css">

<!-- 2. Splash screen (highest z-index) -->
<link rel="stylesheet" href="css/splash.css">

<!-- 3. Header -->
<link rel="stylesheet" href="css/header.css">

<!-- 4. Map container -->
<link rel="stylesheet" href="css/map.css">

<!-- 5. Info panel -->
<link rel="stylesheet" href="css/info-panel.css">

<!-- 6. Reusable components -->
<link rel="stylesheet" href="css/components.css">

<!-- 7. Footer -->
<link rel="stylesheet" href="css/footer.css">

<!-- 8. Animations last -->
<link rel="stylesheet" href="css/animations.css">
```

### Why This Order?
1. **Variables** must load first (other files use them)
2. **Splash** has highest z-index (covers everything)
3. **Header → Main → Footer** follows document flow
4. **Animations** last (can override if needed)

## 🔧 JavaScript Architecture

### Module Dependencies
```
config.js (independent)
   ↓
ui-utils.js (uses config)
marker-utils.js (uses config)
popup-utils.js (uses config)
   ↓
geojson-loader.js (uses marker-utils, popup-utils)
   ↓
map-initializer.js (uses all above)
   ↓
app.js (entry point, orchestrates everything)
```

### Load Order in HTML
```html
<script src="js/config.js"></script>
<script src="js/ui-utils.js"></script>
<script src="js/marker-utils.js"></script>
<script src="js/popup-utils.js"></script>
<script src="js/geojson-loader.js"></script>
<script src="js/map-initializer.js"></script>
<script src="js/app.js"></script>
```

## 📱 Responsive Design

### Breakpoints
- **Desktop**: > 1024px (full features)
- **Tablet**: 768px - 1024px (adapted layout)
- **Mobile**: 480px - 768px (bottom panel)
- **Small**: < 480px (compact UI)

### Mobile-First Approach
```css
/* Base styles for mobile */
.element { ... }

/* Tablet and up */
@media (min-width: 768px) { ... }

/* Desktop */
@media (min-width: 1024px) { ... }
```

## 🎯 Best Practices Applied

### HTML
✅ Semantic HTML5 elements  
✅ Accessibility attributes (ARIA)  
✅ Meaningful class names  
✅ Logical document structure  

### CSS
✅ CSS variables for theming  
✅ BEM-inspired naming  
✅ Mobile-first responsive  
✅ Modular file structure  
✅ Component-based architecture  

### JavaScript
✅ Module pattern  
✅ Separation of concerns  
✅ Reusable functions  
✅ Clear naming conventions  
✅ Error handling  

## 🔄 Development Workflow

### Adding New Features

1. **Plan the structure**
   - Which layer does it belong to?
   - What components are needed?

2. **HTML Changes**
   - Edit `index.html`
   - Follow semantic structure
   - Add appropriate classes

3. **CSS Changes**
   - Choose appropriate CSS module
   - Or create new module if needed
   - Use CSS variables
   - Add to import list in HTML

4. **JavaScript Changes**
   - Create new module or edit existing
   - Follow module pattern
   - Add to script list in HTML
   - Respect dependencies

5. **Testing**
   - Test on desktop
   - Test on mobile
   - Check responsiveness
   - Verify functionality

## 📦 Deployment

### Static Hosting (Current)
- Upload all files to web server
- No build process required
- Works on GitHub Pages, Netlify, Vercel

### Files to Deploy
```
✅ index.html
✅ css/ (all files)
✅ js/ (all files)
✅ *.geojson
❌ components/ (documentation only)
❌ *.md (documentation only)
❌ .git/ (not needed)
```

## 🚀 Performance Optimization

### Current Optimizations
- ✅ Modular CSS (better caching)
- ✅ Modular JS (better caching)
- ✅ CSS animations (GPU accelerated)
- ✅ Lazy loading for map data
- ✅ Optimized asset sizes

### Future Improvements
- ⏳ Minify CSS/JS files
- ⏳ Combine files with build tool
- ⏳ Image optimization
- ⏳ Service worker for offline
- ⏳ Bundle with Webpack/Parcel

## 📚 Documentation Structure

```
README.md                    → Project overview
ARCHITECTURE.md             → This file (architecture)
css/README.md               → CSS architecture
js/README.md                → JS architecture
components/README.md        → HTML structure
CONTRIBUTORS.md             → Team info
CHANGELOG-V2.md             → Version history
QUICK-START.md              → Getting started
```

## 🎓 Learning Resources

### For Understanding This Architecture
- [CSS Architecture](https://www.smashingmagazine.com/2018/05/guide-css-layout/)
- [JavaScript Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [BEM Methodology](https://en.bem.info/methodology/)
- [Mobile-First Design](https://www.browserstack.com/guide/how-to-implement-mobile-first-design)

## 🛠️ Maintenance Guide

### Regular Tasks
1. **Update dependencies**: Check Leaflet version
2. **Review styles**: Remove unused CSS
3. **Code quality**: Run validators
4. **Documentation**: Keep READMEs updated
5. **Testing**: Test on new devices/browsers

### Common Issues
- **CSS not loading**: Check import order
- **JS errors**: Check script order
- **Map not showing**: Check Leaflet CDN
- **Styles conflict**: Check specificity

## ✅ Migration Complete!

### What Changed
- ❌ **Before**: Single 1400+ line `style.css`
- ✅ **After**: 8 modular CSS files (~150-300 lines each)

### Benefits
1. **Easier maintenance** - Find styles quickly
2. **Better collaboration** - No merge conflicts
3. **Improved caching** - Browser caches smaller files
4. **Clear organization** - Purpose-based structure
5. **Best practices** - Industry-standard approach

---

**Last Updated**: October 2025  
**Version**: 2.0 (Modular Architecture)  
**Team**: VXerys & Contributors
