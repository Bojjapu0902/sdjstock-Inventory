# Design System

All styling lives in `src/styles/custom.css`. Bootstrap 5.3.2 handles the grid system and utilities. Custom CSS variables (design tokens) override and extend Bootstrap.

---

## CSS Custom Properties (Design Tokens)

### Color Palette

```css
/* Brand / Primary */
--fsp-primary:        #4F46E5;   /* Indigo — primary actions, active states */
--fsp-primary-dark:   #3730A3;   /* Darker indigo for hover states */
--fsp-primary-light:  #E0E7FF;   /* Light indigo for backgrounds */

/* Sidebar */
--fsp-sidebar:        #1E1B4B;   /* Deep navy-purple sidebar background */
--fsp-sidebar-hover:  #2D2A6B;   /* Hover state in sidebar */
--fsp-sidebar-active: #312E81;   /* Active nav item in sidebar */
--fsp-sidebar-text:   rgba(255, 255, 255, 0.80);

/* Semantic Colors */
--fsp-success:        #10B981;   /* Green */
--fsp-warning:        #F59E0B;   /* Amber */
--fsp-danger:         #EF4444;   /* Red */
--fsp-info:           #3B82F6;   /* Blue */

/* Neutrals */
--fsp-bg:             #F8FAFC;   /* App background */
--fsp-surface:        #FFFFFF;   /* Card/panel surface */
--fsp-border:         #E2E8F0;   /* Default border color */
--fsp-text:           #1E293B;   /* Primary text */
--fsp-text-muted:     #64748B;   /* Secondary / muted text */
```

### Spacing & Layout

```css
--fsp-sidebar-w:      260px;     /* Sidebar expanded width */
--fsp-sidebar-w-sm:   72px;      /* Sidebar collapsed width */
--fsp-header-h:       64px;      /* Header height */
```

### Shadows

```css
--fsp-shadow-xs:      0 1px 2px rgba(0,0,0,.05);
--fsp-shadow-sm:      0 1px 3px rgba(0,0,0,.10), 0 1px 2px rgba(0,0,0,.06);
--fsp-shadow-md:      0 4px 6px rgba(0,0,0,.07), 0 2px 4px rgba(0,0,0,.06);
--fsp-shadow-lg:      0 10px 15px rgba(0,0,0,.10), 0 4px 6px rgba(0,0,0,.05);
--fsp-shadow-card:    0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04);
```

### Border Radius

```css
--fsp-radius-sm:      6px;
--fsp-radius-md:      10px;
--fsp-radius-lg:      14px;
--fsp-radius-xl:      20px;
```

### Transitions

```css
--fsp-transition:     0.22s cubic-bezier(0.4, 0, 0.2, 1);
```

---

## Component CSS Classes

### Cards

```css
.fsp-card              /* White surface, shadow, border-radius */
.fsp-card-header       /* Card top section with title */
.fsp-card-body         /* Card content area */
```

### Tables

```css
.fsp-table             /* Styled table wrapper */
.fsp-table th          /* Header cells — indigo text, light bg */
.fsp-table td          /* Data cells */
.fsp-table tbody tr:hover  /* Hover row highlight */
```

### Form Controls

```css
.fsp-input             /* Text input */
.fsp-select            /* Select dropdown */
.fsp-label             /* Form label */
.fsp-form-group        /* Label + input wrapper */
```

### Stock Bar (Progress Indicator)

```css
.stock-bar-bg          /* Grey background track */
.stock-bar-fill        /* Colored fill */
.stock-bar-fill.low    /* Red fill — ≤25% */
.stock-bar-fill.medium /* Amber fill — 26–55% */
.stock-bar-fill.high   /* Green fill — >55% */
```

### Status Badges

```css
.status-badge          /* Base pill style */
.status-badge.success  /* Green */
.status-badge.warning  /* Amber */
.status-badge.danger   /* Red */
.status-badge.info     /* Blue */
.status-badge.primary  /* Indigo */
.status-badge.neutral  /* Grey */
```

### Page Structure

```css
.page-header           /* Page title + action button row */
.page-tabs             /* Tab navigation row */
.tab-btn               /* Individual tab button */
.tab-btn.active        /* Active tab — indigo underline */
```

### Filter Toolbar

```css
.filter-toolbar        /* Flexbox row for filters */
.filter-search         /* Search input with icon */
.filter-select         /* Dropdown filter */
```

### KPI Cards

```css
.kpi-card              /* Metric tile base */
.kpi-icon              /* Circular icon container */
.kpi-value             /* Large metric number */
.kpi-label             /* Metric label text */
.kpi-trend             /* Trend row (arrow + text) */
.kpi-trend.up          /* Green for positive trend */
.kpi-trend.down        /* Red for negative trend */
```

### Sidebar

```css
.sidebar               /* Dark nav panel */
.sidebar.collapsed     /* Icon-only mode */
.sidebar-nav-item      /* Individual nav link */
.sidebar-nav-item.active /* Current page highlight */
.sidebar-section-label /* Section group heading */
```

### Layout

```css
.layout-root           /* Full-height flex container */
.layout-content        /* Main area right of sidebar */
.layout-main           /* Scrollable page content */
.header                /* Fixed top bar */
```

---

## Design Principles

1. **No inline styles** — all styles use CSS variables or Bootstrap utilities.
2. **CSS variables for theming** — changing `--fsp-primary` propagates to all components.
3. **Bootstrap for grid** — `col-md-*`, `d-flex`, `gap-*`, etc. from Bootstrap 5.
4. **Transitions** — all interactive elements use `--fsp-transition` for smooth animations.
5. **Mobile-first breakpoints** — responsive at Bootstrap's `md` (768px) and `lg` (992px) breakpoints.

---

## Recharts Integration

Charts use Recharts components with colors pulled from the design token palette:

| Chart Type | Pages Used |
|---|---|
| `LineChart` | Dashboard (stock trend) |
| `BarChart` | Dashboard, Inventory, PurchaseOrders, Wastage, Reports |
| `PieChart` / `Cell` | Dashboard (category donut), Wastage (by reason) |

Chart colors match the CSS variable palette:
- Primary: `#4F46E5`
- Success: `#10B981`
- Warning: `#F59E0B`
- Info: `#3B82F6`
- Purple: `#8B5CF6`
- Pink: `#EC4899`
- Cyan: `#06B6D4`
- Orange: `#F97316`
