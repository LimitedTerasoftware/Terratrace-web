# Tricad — Design System

**Project:** Tricad Admin Dashboard (BharatNet Field Operations Tracker)  
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS v3  
**Theme:** Light/Dark (class-based, `darkMode: 'class'`)  
**Font:** Satoshi (self-hosted, woff2/woff/ttf)  
**Icon Library:** Lucide React + custom SVGs  

---

## 1. Color Tokens

All tokens defined in `tailwind.config.cjs`. Dark variants noted inline.

| Token | Hex | Role |
|---|---|---|
| `primary` | `#3C50E0` | Brand blue — buttons, links, active states, chart accents |
| `secondary` | `#80CAEE` | Light blue — secondary accents |
| `black` (DEFAULT) | `#1C2434` | Page text, headings |
| `black-2` | `#010101` | Pure black |
| `body` | `#64748B` | Body / muted text (light) |
| `bodydark` | `#AEB7C0` | Body text (dark mode) |
| `bodydark1` | `#DEE4EE` | Sidebar nav labels |
| `bodydark2` | `#8A99AF` | Sidebar section labels, sub-nav text |
| `white` | `#FFFFFF` | Surfaces (light) |
| `whiten` | `#F1F5F9` | Page background (light) |
| `whiter` | `#F5F7FD` | Subtle surface |
| `gray` (DEFAULT) | `#EFF4FB` | Input bg, calendar hover, tag bg |
| `gray-2` | `#F7F9FC` | — |
| `gray-3` | `#FAFAFA` | — |
| `graydark` | `#333A48` | Sidebar nav hover/active bg |
| `stroke` | `#E2E8F0` | Borders (light) |
| `strokedark` | `#2E3A47` | Borders (dark) |
| `form-strokedark` | `#3d4d60` | Form borders (dark) |
| `form-input` | `#1d2a39` | Form input bg (dark) |
| `boxdark` | `#24303F` | Card/panel bg (dark) |
| `boxdark-2` | `#1A222C` | Deeper dark surface |
| `success` | `#219653` | Success states |
| `danger` | `#D34053` | Error / danger |
| `warning` | `#FFA70B` | Warning |
| `red` (DEFAULT) | `#FB5454` | Inline red |
| `meta-1` | `#DC3545` | Alert red |
| `meta-3` | `#10B981` | Green (approved / completed) |
| `meta-4` | `#313D4A` | Dark hover bg (dark mode nav) |
| `meta-5` | `#259AE6` | Info blue |
| `meta-6` | `#FFBA00` | Amber / trophy |
| `meta-7` | `#FF6766` | Coral |
| `meta-8` | `#F0950C` | Orange |
| `meta-10` | `#0FADCF` | Cyan |

**Semantic usage in dashboards (Tailwind utility classes, not tokens):**

| Meaning | Light | Dark |
|---|---|---|
| Completed / Approved | `text-green-600` | same |
| Pending / In-progress | `text-orange-600` | same |
| Rejected / At-risk | `text-red-600` | same |
| Row highlight — warning | `bg-orange-50` | — |
| Row highlight — danger | `bg-red-50` | — |
| Row highlight — success | `bg-green-50` | — |

---

## 2. Typography

**Font family:** `font-satoshi` → `'Satoshi', sans-serif`  
**Base:** `font-normal text-base text-body bg-whiten` (set on `body`)

### Weight Scale
| Weight | Name | Usage |
|---|---|---|
| 300 | Light | Rarely used |
| 400 | Regular | Body text |
| 500 | Medium | Labels, sub-headings |
| 700 | Bold | Headings, KPI values |
| 900 | Black | Display (unused in app) |

### Size Scale (custom tokens)
| Token | Size / Line-height | Usage |
|---|---|---|
| `text-title-xxl` | 44px / 55px | — |
| `text-title-xl` | 36px / 45px | — |
| `text-title-lg` | 28px / 35px | — |
| `text-title-md` | 24px / 30px | Page titles |
| `text-title-sm` | 20px / 26px | Section titles |
| `text-title-xsm` | 18px / 24px | Card titles |
| `text-base` | 16px | Body default |
| `text-sm` | 14px | Table cells, labels |
| `text-xs` | 12px | Badges, captions, table headers |

### In-App Patterns
| Element | Classes |
|---|---|
| Page title (Dashboard) | `text-2xl font-bold text-gray-900` |
| Page title (Survey Dashboard) | `text-lg font-bold text-gray-900` |
| Section heading | `text-lg font-semibold text-gray-900` |
| Card sub-label | `text-sm text-gray-600` |
| Table header | `text-xs font-medium text-gray-500 uppercase tracking-wider` |
| Table cell | `text-sm text-gray-900` |
| Sidebar nav item | `text-sm font-medium text-bodydark1` |
| Sidebar sub-item | `text-sm font-medium text-bodydark2` |
| KPI value | `text-3xl font-bold` + accent color |
| KPI label | `text-sm text-gray-600` |

---

## 3. Spacing & Sizing

Standard Tailwind scale applies. Custom tokens used in the app:

| Token | Value | Where used |
|---|---|---|
| `p-6.5` | 1.625rem | Form section padding |
| `py-4 px-6.5` | — | Card header padding |
| `gap-1.5` | 0.375rem | Sidebar submenu item gap |
| `gap-4.5` | 1.125rem | Form field gaps |
| `w-64` | 16rem | Sidebar expanded width |
| `w-18` | — (≈72px) | Sidebar collapsed width |
| `h-16` | 4rem | Sidebar header height |
| `h-15` | 3.75rem | Calendar header row |
| `h-90` | 22.5rem | Map container height |
| `max-w-7xl` | — | Main content max-width |
| `max-w-4xl` | — | Privacy Policy max-width |

---

## 4. Shadows & Borders

| Token | Value | Usage |
|---|---|---|
| `shadow-default` | `0px 8px 13px -3px rgba(0,0,0,0.07)` | Cards, map container |
| `shadow-card` | `0px 1px 3px rgba(0,0,0,0.12)` | Compact cards |
| `shadow-card-2` | `0px 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `shadow-sm` (Tailwind) | — | Dashboard section cards |
| `border-stroke` | `#E2E8F0` | All borders (light) |
| `border-strokedark` | `#2E3A47` | All borders (dark) |
| `border-[1.5px]` | — | Form inputs |
| `border-l-2` | — | Sidebar submenu left accent |
| `border-l-[3px]` | — | Calendar event left bar |
| `rounded-sm` | 2px | Cards (TailAdmin base) |
| `rounded-lg` | 8px | Dashboard cards, buttons |
| `rounded-md` | 6px | Selects, filter inputs |
| `rounded-full` | — | Badges, avatars |

---

## 5. Animations

| Name | Definition | Usage |
|---|---|---|
| `animate-fadeIn` (CSS) | opacity 0→1 + translateY(-10→0), 0.3s ease-in-out | Dropdowns |
| `animate-pulse` (CSS) | opacity 1→0.5→1, 2s cubic-bezier(0.4,0,0.6,1) | Loading states |
| `fade-in` (Tailwind) | fadeIn 0.7s ease-in-out | Page transitions |
| `fade-up` (Tailwind) | translateY(20→0) + opacity, 0.7s ease-out | Content reveals |
| `float` (Tailwind) | translateY(0→-20px), 6s ease-in-out infinite | Decorative elements |
| `pulse-slow` (Tailwind) | scale(1→1.05), 3s ease-in-out infinite | Subtle emphasis |
| `rotating` (Tailwind) | rotate 360°, 30s linear infinite | Loader |
| `spin-1.5 / spin-2 / spin-3` | 1.5s / 2s / 3s linear infinite | Loading spinners |

---

## 6. Layout

```
┌─────────────────────────────────────────────┐
│  Sidebar (fixed, left)  │  Main Content      │
│  Expanded:  w-64        │  flex-1            │
│  Collapsed: w-18        │  bg-whiten         │
│  bg-black / dark:boxdark│  overflow-y-auto   │
└─────────────────────────────────────────────┘
```

- Sidebar is `fixed left-0 top-0 z-9999 h-screen`
- Main content offset left by sidebar width via margin/padding
- Page shell: `min-h-screen bg-gray-50` (dashboards) or `bg-whiten` (standard pages)
- Content max-width: `max-w-7xl mx-auto`
- Standard page gap: `gap-4 md:gap-6 2xl:gap-7.5`
- Grid system: 12-column (`grid-cols-12`) for dashboard widgets

---

## 7. Components

### 7.1 Sidebar

| Part | Key Styles |
|---|---|
| Shell | `fixed left-0 top-0 z-9999 h-screen bg-black dark:bg-boxdark transition-all duration-300` |
| Toggle button | `absolute -right-4 top-10 w-6 h-6 bg-white border border-gray-200 rounded-lg shadow-md` |
| Logo area | `h-16 px-4` — full logo `w-[180px]` expanded, favicon `w-[30px]` collapsed |
| Section label | `text-sm font-semibold text-bodydark2 mb-4 ml-4` |
| Nav group trigger | `flex items-center justify-between py-2 px-3 rounded-lg text-bodydark1 hover:bg-graydark dark:hover:bg-meta-4` |
| Nav group — active | `bg-graydark dark:bg-meta-4` |
| Submenu container | `bg-black/20 dark:bg-boxdark/30 rounded-md py-2 border-l-2 border-gray-600 ml-2` |
| Sub-item | `flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium text-bodydark2 hover:text-white hover:bg-graydark/30` |
| Sub-item — active | `!text-white bg-graydark/50` |
| Scrollbar | `width: 6px`, thumb `rgba(75,85,99,0.6)`, `border-radius: 3px` |
| Bottom profile area | `px-2 pb-4 mt-auto` |

---

### 7.2 Page Header

Two variants used across the app:

**Variant A — Plain title** (Dashboard, Executive Dashboard)
```
text-2xl font-bold text-gray-900
subtitle: text-sm text-gray-500
```

**Variant B — Icon + title** (Route List Manager, Remarks History, Survey Dashboard)
```
Icon: 40×40 bg-blue-600 rounded-lg flex items-center justify-center (white Lucide icon inside)
Title: text-lg/xl font-bold text-gray-900
Subtitle: text-sm text-gray-500
Breadcrumb: top-right, text-sm, active segment in primary blue
```

Header action buttons sit top-right (see Button component).

---

### 7.3 Breadcrumb

```
Dashboard / Route List
```
- Container: top-right of page header
- Separator: ` / ` plain text
- Inactive: `text-sm text-gray-500`
- Active (last): `text-sm text-primary font-medium`

---

### 7.4 Filter Bar

Shell: `bg-white rounded-lg shadow-sm border mb-6 p-5`  
Layout: `flex items-center justify-between gap-3`

| Element | Styles |
|---|---|
| Native select | `px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 min-w-[140px]` |
| Date input | `px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 w-40` |
| Search input | `border border-stroke rounded-lg pl-10 pr-4 py-2 text-sm` with search icon left |
| Reset button | `px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50` — icon only with tooltip on hover |
| Clear Filters | `text-red-500` text + × icon, no background |
| "to" separator | `text-gray-500 text-sm` between date inputs |

---

### 7.5 Tab Switcher

Used in: Survey Dashboard, Construction Dashboard (Table / Charts / Insights), Executive Dashboard (All / Survey / Construction / Installation), Time filter (Today / Week / Month / Custom).

```
Shell:    bg-gray-100 rounded-lg p-1 inline-flex
Item:     px-4 py-1 text-sm rounded text-gray-600
Active:   bg-white text-gray-900 shadow-sm
```

Time filter active tab uses `bg-orange-500 text-white font-medium` instead.

---

### 7.6 Button

| Variant | Classes |
|---|---|
| Primary (Export) | `flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm` |
| Secondary (Schedule) | `flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm` |
| Form submit | `flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90` |
| Ghost / outline | `px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50` |
| Excel export | `bg-green-600 text-white px-3 py-2 rounded text-sm` with grid icon |
| Preview | `bg-white border text-sm px-3 py-2 rounded` with eye icon |
| Auto Mode / Update | `rounded px-4 py-2 text-sm font-medium` — muted bg |

Icon + label buttons: `gap-2` between icon (`w-4 h-4`) and text.

---

### 7.7 KPI Card

Used in: all dashboards, main dashboard summary row.

```
Shell:    p-4 (inside a grid row, no individual card border)
Value:    text-3xl font-bold + semantic color (green/orange/red/blue/purple)
Sub-text: text-xs text-gray-500 mb-1 (unit or comparison)
Label:    text-sm font-medium text-gray-700
Icon:     w-4 h-4 text-gray-500 (optional, Lucide)
```

Divider between KPI row and performance bar: `border-t border-gray-200 px-6 py-3`

**Main dashboard KPI card** (larger standalone card):
```
Shell:    bg-white rounded-lg border shadow-sm p-4
Value:    text-2xl–3xl font-bold
Sub-text: text-xs text-gray-500 (e.g. "-100.0% vs yesterday")
Icon bg:  bg-blue-50 rounded-lg p-2 (top-right corner)
```

---

### 7.8 Badge / Pill

All badges: `inline-flex px-2 py-1 text-xs font-medium rounded-full`

| Variant | Classes |
|---|---|
| Status — Excellent | `bg-green-100 text-green-800` |
| Status — Good | `bg-blue-100 text-blue-800` |
| Status — Needs Attention | `bg-red-100 text-red-800` |
| Risk — Low | `bg-green-100 text-green-800` |
| Risk — Medium | `bg-yellow-100 text-yellow-800` |
| Risk — High | `bg-red-100 text-red-800` |
| Version (e.g. 2.1.1) | `bg-blue-100 text-blue-800` |
| Type tag (Block Installation) | `bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium` |
| Multi-select tag | `border-[.5px] border-stroke bg-gray px-2.5 py-1.5 text-sm font-medium rounded dark:bg-white/30` |

---

### 7.9 Avatar

| Variant | Classes |
|---|---|
| Initials (generated) | `h-10 w-10 rounded-full` — via `ui-avatars.com` with `background=0D8ABC` |
| Photo | `h-10 w-10 rounded-full object-cover` |
| Small (table) | `h-8 w-8 rounded-full` |
| Rank badge overlay | `w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white` — gold/silver/bronze bg |

---

### 7.10 Data Table

**react-data-table-component** with custom styles:

| Part | Value |
|---|---|
| Header cell font | 11px, weight 500, uppercase, letter-spacing 0.5px |
| Header cell color | `#9CA3AF` |
| Header cell bg | `#F9FAFB` |
| Header border-bottom | `1px solid #E5E7EB` |
| Header padding | `12px 16px` |
| Cell font | 14px, color `#111827` |
| Cell border-bottom | `1px solid #F3F4F6` |
| Cell padding | `12px 16px` |
| Row hover | `background: #F9FAFB` |
| Pagination border-top | `1px solid #E5E7EB`, min-height `56px` |

**Row action links:** `text-blue-600 hover:text-blue-800 text-sm` — "Reassign", "Split", `···` (MoreHorizontal icon `w-4 h-4 text-gray-400`)

**Standard HTML table** (DPR / Calendar):  
`divide-y divide-gray-100`, header `border-b border-gray-200 text-sm font-medium text-gray-700 px-4 py-3`, cell `px-4 py-3 text-sm text-gray-700`

Row color variants: plain / `bg-orange-50` / `bg-red-50` / `bg-green-50`

---

### 7.11 Progress Bar

**Linear:**
```
Track:  w-full bg-gray-200 rounded-full h-2 (or h-3, h-6 for larger)
Fill:   h-{same} rounded-full bg-{color}-500
        green = completed, orange = in-progress, red = pending/failed, blue = KM performance
```

**Stacked (stage-wise):**
```
Track:  flex h-8 rounded-lg overflow-hidden bg-gray-200
Fills:  bg-green-500 / bg-orange-500 / bg-red-500 — width set via inline style %
        Text inside fill: text-white text-xs font-medium (visible if segment > 10%)
```

---

### 7.12 Chart Components

All charts use inline SVG (custom) or ApexCharts.

| Chart | Usage | Key Colors |
|---|---|---|
| Donut (Users widget) | `w-32 h-32`, SVG circles, `stroke-width: 12` | `#3C50E0` (active), `#10B981` (total), `#FFBA00` (inactive) |
| Line (KM Progress Trend) | ApexCharts area/line | `#3b82f6` stroke, `#f3f4f6` grid |
| Circular gauge (SLA %) | SVG `r=40 stroke-width=12`, track `#e5e7eb`, fill `#10b981` | Value centered: `text-2xl font-bold` |
| Pipeline funnel | `flex items-center gap-8` — colored boxes `w-32 rounded-lg p-6 text-white` | blue / orange / purple / green -500 |
| QC Pie | SVG circles, `r=35 stroke-width=20` | green / red / yellow -500 |
| Inline sparkline | SVG `polyline` + dots, `stroke="#f97316" stroke-width=3` | orange-500 |

ApexCharts dark mode overrides via `.apexcharts-*` classes in `style.css`.

---

### 7.13 Form Inputs

All inputs share this base pattern:

```
rounded(-lg) border-[1.5px] border-stroke bg-transparent py-3 px-5
text-black outline-none transition
focus:border-primary active:border-primary
disabled:cursor-default disabled:bg-whiter
dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary
```

| State | Border |
|---|---|
| Default | `border-stroke` (`#E2E8F0`) |
| Focus / Active | `border-primary` (`#3C50E0`) |
| Disabled | `border-stroke` + `bg-whiter`, `dark:bg-black` |

**Label:** `mb-2.5 block text-black dark:text-white` (required mark: `text-meta-1`)  
**Textarea:** same pattern, `rows={6}`  
**File input:** `file:mr-5 file:border-0 file:border-r file:border-stroke file:bg-whiter file:py-3 file:px-5 file:hover:bg-primary/10`

---

### 7.14 Toggle / Switcher

Dark mode switcher in sidebar bottom: compact, `ul` wrapper.  
General switcher pattern: custom CSS checkbox styled as pill toggle, checked state uses `bg-primary`.

---

### 7.15 Map Container

**Standard map card:**
```
col-span-12 xl:col-span-7
rounded-sm border border-stroke bg-white py-2 px-2 shadow-default
dark:border-strokedark dark:bg-boxdark
height: 370px (Google Maps) or fills parent (Route Builder)
```

**GIS Inventory / Route Builder left panel:**
```
width: ~310px, fixed left, bg-white, border-r border-gray-200
Sections: header (title + subtitle), action buttons, collapsible groups (District/Division, Data Layers)
Group header: text-xs font-semibold uppercase tracking-wider + collapse toggle
Search input inside panel: full-width, border border-gray-200 rounded
Tree item: text-sm with expand chevron + checkbox
```

**Map action buttons (zoom/fullscreen):** `w-7.5 h-7.5 rounded border border-stroke bg-white hover:bg-primary hover:text-white text-2xl`

---

### 7.16 Toast / Notification

Success toast (Route Builder, top-right):
```
bg-white border-l-4 border-green-500 rounded shadow-md px-4 py-3
Icon:    CheckCircle, text-green-500
Title:   font-semibold text-gray-900 text-sm
Body:    text-gray-600 text-sm
Close:   × top-right, text-gray-400 hover:text-gray-600
```

---

### 7.17 Alert / Risk Card

Used in Executive Dashboard sidebar and Insights tab:
```
flex items-start gap-3 p-3 rounded-lg border
bg-red-50 border-red-200     → critical
bg-orange-50 border-orange-200 → warning
Icon:  w-5 h-5 text-{color}-500 mt-0.5 (AlertTriangle)
Title: text-sm font-medium text-{color}-800
Body:  text-xs text-{color}-600
```

---

### 7.18 Milestone List Item

Used in Executive Dashboard right column:
```
flex items-center gap-3
Dot:   w-3 h-3 rounded-full flex-shrink-0
       green = on track, orange = at risk, red = delayed, gray = pending
Title: text-sm font-medium text-gray-900
Sub:   text-xs text-{color}-600 (status + date)
```

---

## 8. Pages → Component Map

| Page | Components Used |
|---|---|
| Main Dashboard | Filter bar, Survey summary table, KPI strip, Donut chart, Google Map |
| Route List | Page header (B), Filter bar, Search, Data table, Checkbox |
| Route Builder | Map (full-screen), Map sidebar panel, File upload, Point legend, Toast, Line summary popup |
| UG Survey Dashboard | Page header (B), Filter bar, KPI cards, Tab switcher, Data table (react-data-table), Avatar, Badge, Action links |
| Construction Dashboard | Page header (B), Filter bar, Tab switcher, KPI strip, Data table, Progress bar, Circular gauge, Pie chart, Sparkline |
| Executive Dashboard | Page header (A), Filter bar, Tab switcher, Project cards (colored bg), Pipeline funnel, Stacked progress, Donut chart, Line chart, Risk heatmap, Alert cards, Milestone list, Contractor ranking |
| DPR Report | Page header (A), HTML tables, Risk pill badge, Pipeline funnel, Trend icons |
| GIS Inventory | Map (full-screen), Map sidebar panel (District tree + Data Layers) |
| Remarks History (Logs) | Page header (B), Filter bar, Data table, Badge (type tag) |
| Calendar | Breadcrumb, HTML table calendar, Event card |
| Form Elements | Breadcrumb, All input variants, Checkbox, Toggle, Date picker, File upload, Multi-select |
| Privacy Policy | Dark full-page layout (`bg-neutral-950`), prose only |
| 404 Not Found | `bg-white dark:bg-boxdark`, centered, primary button |

---

## 9. Third-Party Libraries

| Library | Version / Notes | Custom Overrides |
|---|---|---|
| ApexCharts | via `react-apexcharts` | Legend, axis, tooltip, gridline colors overridden in `style.css` for dark mode |
| Flatpickr | `flatpickr/dist/flatpickr.min.css` | Calendar, day hover, selected day all overridden for dark mode in `style.css` |
| JSVectorMap | `jsvectormap/dist/jsvectormap.css` | Zoom buttons restyled via `.map-btn .jvm-zoom-btn` |
| react-data-table-component | — | Full `customStyles` object per dashboard (see §7.10) |
| Google Maps JS API | via `@react-google-maps/api` | No style override; key via `VITE_GOOGLE_MAPS_API_KEY` |
| Lucide React | `v0.383.0` | Used at `w-4 h-4` to `w-6 h-6`, color via Tailwind `text-*` |
| file-saver | — | KMZ download in GIS Inventory |
| React Router DOM | v6 | `matchPath` used for sidebar active state detection |
