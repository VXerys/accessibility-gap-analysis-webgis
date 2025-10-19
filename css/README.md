# CSS Architecture

CSS files organized by functionality for better maintainability.

## File Structure

```
css/
├── variables.css      # CSS variables & design tokens
├── splash.css         # Splash screen & loading animations
├── header.css         # Header & navigation
├── map.css           # Map container & Leaflet customizations
├── info-panel.css    # Info sidebar panel
├── components.css    # Reusable UI components
├── footer.css        # Footer section
└── animations.css    # Global animations & keyframes
```

## Import Order

Files should be imported in the following order in `index.html`:

1. **variables.css** - Must be first (defines CSS variables)
2. **splash.css** - Splash screen (highest z-index)
3. **header.css** - Header section
4. **map.css** - Map container
5. **info-panel.css** - Info panel
6. **components.css** - UI components
7. **footer.css** - Footer section
8. **animations.css** - Animations (can be last)

## Naming Convention

- **BEM-inspired**: `.block__element--modifier`
- **Semantic names**: Describe purpose, not appearance
- **Kebab-case**: `.info-panel`, `.stat-card`

## Responsive Breakpoints

- **Desktop**: > 1024px
- **Tablet**: 768px - 1024px
- **Mobile**: 480px - 768px
- **Small Mobile**: < 480px

## Design Tokens

All colors, shadows, and spacing use CSS variables defined in `variables.css`.

### Example Usage:
```css
.my-element {
    color: var(--primary-color);
    box-shadow: var(--shadow-lg);
    border-radius: var(--radius-md);
}
```

## Best Practices

1. **Use CSS variables** for consistent theming
2. **Mobile-first** approach in responsive design
3. **Minimize specificity** - avoid deep nesting
4. **Group related properties** (layout, typography, colors)
5. **Comment sections** for clarity
6. **Use transitions** from variables for consistency

## Adding New Styles

1. Choose appropriate file or create new one
2. Follow existing naming conventions
3. Use CSS variables when possible
4. Add responsive rules if needed
5. Test across breakpoints
6. Update this README if adding new file
