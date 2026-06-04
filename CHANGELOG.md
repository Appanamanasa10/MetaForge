# MetaForge — Changelog

All notable changes to MetaForge are documented in this file.

---

## [1.1.0] — 2026-06-04

### 🎨 Design System Improvements
- Added **Inter** font from Google Fonts for premium typography
- Added CSS keyframe animations: `fadeInUp`, `fadeIn`, `slideDown` for page transitions
- Added shimmer skeleton loader animation (`skeleton` CSS class)
- Added `grid-bg` CSS class for subtle grid background on auth pages
- Improved scrollbar styling (slimmer, more refined)
- Added `color-scheme: dark` for native date/number inputs
- Mobile tap targets improved to minimum 44px

### 🏠 Dashboard
- **Analytics cards**: Total Applications, Total Entities, Active Applications stat cards
- **Application search**: Live client-side search with clear button
- **Application sort**: Newest, Oldest, Name A→Z, Name Z→A
- **Edit Application**: Rename and update description via modal dialog
- **Delete Application**: Cascade-deletes entities and records with styled confirmation dialog
- **Duplicate Application**: Creates a copy with "(Copy)" suffix
- **Per-app action menu**: 3-dot dropdown per application card
- **Better empty state**: Uses new `EmptyState` component with call-to-action
- **Better skeleton loaders**: Shimmer animation instead of flat pulse

### 🏗️ Schema Builder
- **Duplicate Entity**: Button to clone current entity's schema with "[Name] Copy" naming
- **Quick-start templates**: 4 built-in schemas (Contact, Product, Task, Employee) via Sparkles dropdown
- **Styled ConfirmDialog**: Replaces `window.confirm` for entity delete
- **Live validation bar**: Green "valid" / red "invalid" status bar under the tab header
- **Field type quick-reference**: Listed in the sidebar panel
- **New Entity button redesigned**: Split into "+" (new blank) and Sparkles (templates)

### 📊 Records Runtime
- **CSV Export**: "Export CSV" button in the table header downloads all visible records
- **Created At column**: New column showing record creation date in every table
- **Total record count badge**: Displayed next to the entity name in the page header
- **ConfirmDialog for delete**: Replaces `window.confirm` for record delete
- **Improved empty state**: Entity-contextual messaging ("No Student records", etc.)
- **Action button visibility**: Action buttons fade in on row hover
- **Better loading skeletons**: Shimmer animation, 4 rows instead of 3

### 🔐 Auth UX
- **Login page**: Show/hide password toggle, inline error banner (instead of toast-only), animated entry, grid background pattern
- **Signup page**: Password strength indicator (4-bar progress), show/hide toggle, inline errors, animated entry
- **Both pages**: Improved card design, better logo treatment, grid background

### 🔔 Notifications
- **Date grouping**: Notifications grouped by Today / Yesterday / This Week / Older
- **Filter tabs**: All / Unread / Read with counts
- **Unread count badge**: Displayed in page header next to title
- **EmptyState component**: Contextual message per filter tab

### ⚙️ Settings
- **Avatar display**: Large gradient initial avatar shown at top of profile section
- **Total Entities stat**: Added to the account overview panel
- **Provider badge**: Auth provider displayed as styled badge
- **Danger Zone**: Sign-out confirmation using ConfirmDialog

### 📁 CSV Import
- **Drag-and-drop upload**: Drop zone accepts `.csv` files directly
- **Visual step progress indicator**: Numbered 3-step progress bar
- **Pre-flight validation**: Shows which rows will fail validation before executing import
- **Field mapping indicators**: CheckCircle / XCircle per field to show mapped/unmapped status
- **Row count in execute button**: "Execute Import (N rows)" for clarity
- **Schema preview on upload step**: Shows expected fields with required indicators

### 🧩 New Shared Components
- `ConfirmDialog` — reusable confirm modal replacing all `window.confirm` calls
- `StatsCard` — analytics stat card used on dashboard
- `EmptyState` — consistent empty state UI across all pages

### 🧭 Navigation
- **Desktop sidebar**: User dropdown menu with Settings and Sign Out links
- **Mobile header**: Hamburger menu with slide-out drawer, replaces basic mobile header
- **User avatar**: Gradient initial avatar in sidebar user section

### 🛠 API Changes
- `PATCH /api/applications` — new endpoint to rename/update application description
- `DELETE /api/applications?id=` — new endpoint with cascade deletion (records → entities → application)

---

## [1.0.0] — Initial Release

- Schema-driven application builder (JSON editor with live validation)
- Runtime entity management (CRUD records, table view, form view)
- NextAuth v4 authentication (credentials + sandbox providers)
- CSV import with column mapping and batch import
- Workflow automation (RECORD_CREATED, RECORD_UPDATED, RECORD_DELETED triggers)
- Notification center with read/unread state
- Account settings page
- Prisma ORM with PostgreSQL
