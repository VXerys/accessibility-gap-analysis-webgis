# HTML Component Structure

HTML organized by semantic sections for better readability and maintenance.

## Component Breakdown

The `index.html` file is organized into these main sections:

### 1. **Document Head** (Lines ~1-24)
```html
<head>
    <!-- Meta tags -->
    <!-- Favicon -->
    <!-- Leaflet CSS -->
    <!-- Google Fonts -->
    <!-- Custom CSS modules -->
</head>
```

### 2. **Splash Screen** (Lines ~27-36)
```html
<div id="splash-screen" class="splash-screen">
    <!-- Loading animation -->
</div>
```

### 3. **Header Section** (Lines ~38-69)
```html
<header class="header">
    <div class="header-container">
        <!-- Brand -->
        <!-- Title & Tags -->
        <!-- Statistics -->
    </div>
</header>
```

### 4. **Main Content** (Lines ~71-194)
```html
<main class="main-content">
    <div class="map-wrapper">
        <!-- Map container -->
        <!-- Loading overlay -->
        <!-- Info panel -->
    </div>
</main>
```

### 5. **Info Panel** (Lines ~81-192)
```html
<div class="info-panel" id="info-panel">
    <!-- Toggle button -->
    <div class="info-content">
        <!-- Research context -->
        <!-- Statistics -->
        <!-- Key findings -->
        <!-- Interactive guide -->
        <!-- Methodology -->
    </div>
</div>
```

### 6. **Footer Section** (Lines ~196-231)
```html
<footer class="footer">
    <div class="footer-content">
        <!-- Footer grid -->
        <!-- Copyright -->
    </div>
</footer>
```

### 7. **Scripts** (Lines ~233-243)
```html
<!-- Leaflet library -->
<!-- Application modules -->
```

## Editing Guidelines

### When Editing Components:

1. **Splash Screen**
   - Lines: ~27-36
   - CSS: `css/splash.css`
   - JS: `js/app.js` (hide logic)

2. **Header**
   - Lines: ~38-69
   - CSS: `css/header.css`
   - JS: None (static content)

3. **Map Container**
   - Lines: ~74-79
   - CSS: `css/map.css`
   - JS: `js/map-initializer.js`

4. **Info Panel**
   - Lines: ~81-192
   - CSS: `css/info-panel.css`
   - JS: `js/ui-utils.js`

5. **Footer**
   - Lines: ~196-231
   - CSS: `css/footer.css`
   - JS: None (static content)

## Best Practices

### HTML Structure:
- ✅ **Semantic HTML5** elements (`<header>`, `<main>`, `<footer>`)
- ✅ **BEM-like class naming** (`.block__element--modifier`)
- ✅ **Accessibility attributes** (`role`, `aria-label`)
- ✅ **Logical grouping** with `<div>` containers
- ✅ **Comments** for section boundaries

### Maintainability:
- Keep related content together
- Use meaningful class names
- Add comments for complex sections
- Follow consistent indentation (4 spaces)
- Maintain separation of concerns (HTML/CSS/JS)

## Component Dependencies

```
index.html
├── CSS Modules
│   ├── variables.css      ← Must load first
│   ├── splash.css
│   ├── header.css
│   ├── map.css
│   ├── info-panel.css
│   ├── components.css
│   ├── footer.css
│   └── animations.css
│
└── JS Modules
    ├── config.js          ← Configuration
    ├── ui-utils.js        ← UI helpers
    ├── marker-utils.js    ← Marker creation
    ├── popup-utils.js     ← Popup creation
    ├── geojson-loader.js  ← Data loading
    ├── map-initializer.js ← Map setup
    └── app.js             ← Entry point
```

## Quick Reference: Line Numbers

| Component | Start | End | Description |
|-----------|-------|-----|-------------|
| Head | 1 | 24 | Meta, styles, fonts |
| Splash | 27 | 36 | Loading screen |
| Header | 38 | 69 | Top navigation |
| Main | 71 | 194 | Map & info panel |
| Footer | 196 | 231 | Bottom section |
| Scripts | 233 | 243 | JS libraries |

## Moving to Template Engine (Future)

If you want to use HTML components/partials in the future, consider:

1. **Static Site Generators**:
   - Eleventy (11ty)
   - Hugo
   - Jekyll

2. **Build Tools**:
   - Parcel (with posthtml-include)
   - Webpack (with html-loader)

3. **Server-Side**:
   - Express + EJS/Pug
   - PHP includes
   - Next.js

Example with includes:
```html
<!-- header.html -->
@@include('./components/header.html')

<!-- main.html -->
@@include('./components/splash.html')
@@include('./components/map.html')
@@include('./components/info-panel.html')

<!-- footer.html -->
@@include('./components/footer.html')
```

## Current Status

✅ **CSS**: Fully modularized (8 files)  
⚠️ **HTML**: Organized but in single file (best for static sites)  
✅ **JS**: Already modularized (7 files)

For a static HTML site, keeping everything in one `index.html` file is actually a **best practice** because:
- No build process required
- Easy to deploy
- Fast loading (single HTTP request)
- Simple to understand structure
