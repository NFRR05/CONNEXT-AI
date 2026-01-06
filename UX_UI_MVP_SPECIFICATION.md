# CONNEXT AI - UX/UI MVP Specification Document

## Design System Foundation

### Color Palette
- **Background**: White (#FFFFFF) with subtle gradient overlay
- **Grid Pattern**: Light gray grid pattern (InfiniteGrid component) - opacity 0.05 base, 0.4 on hover
- **Primary Color**: Dark blue/slate (HSL: 222.2 47.4% 11.2%)
- **Text Primary**: Dark gray/black (HSL: 222.2 84% 4.9%)
- **Text Secondary/Muted**: Medium gray (HSL: 215 20.2% 65.1%)
- **Borders**: Light gray (HSL: 214.3 31.8% 91.4%) with 50% opacity
- **Cards**: White background with 80% opacity, backdrop blur (glassmorphism effect)
- **Accent/Highlight**: Primary color at 10-20% opacity for hover states
- **Success/Active**: Green (#10B981 or similar)
- **Warning/Error**: Red (#EF4444 or similar)

### Typography
- **Font Family**: Inter (Google Fonts)
- **H1 (Page Titles)**: 36px (2.25rem), font-weight 700, tracking -0.02em, line-height 1.2
- **H2 (Section Titles)**: 24px (1.5rem), font-weight 600, line-height 1.3
- **H3 (Card Titles)**: 18px (1.125rem), font-weight 600, line-height 1.4
- **Body Text**: 14px (0.875rem), font-weight 400, line-height 1.5
- **Small Text/Metadata**: 12px (0.75rem), font-weight 400, line-height 1.4
- **Mono Font**: For IDs, phone numbers, codes - 14px, font-family monospace

### Spacing System
- **Base Unit**: 4px
- **xs**: 4px (0.25rem)
- **sm**: 8px (0.5rem)
- **md**: 16px (1rem)
- **lg**: 24px (1.5rem)
- **xl**: 32px (2rem)
- **2xl**: 48px (3rem)
- **3xl**: 64px (4rem)

### Layout Structure

#### Sidebar (Left Navigation)
- **Width**: 256px (16rem) fixed on desktop
- **Background**: White with 70% opacity, backdrop blur
- **Height**: 100vh (full viewport height)
- **Border**: Right border, 1px, light gray (border/50 opacity)
- **Padding**: 
  - Logo area: 24px horizontal, 16px vertical (h-16 = 64px total height)
  - Navigation items: 12px horizontal, 16px vertical padding per item
  - Item spacing: 4px vertical gap between items
- **Mobile**: Hidden by default, slides in from left with overlay (256px width)

#### Main Content Area
- **Max Width**: 1280px (80rem) container
- **Padding**: 
  - Desktop: 32px (2rem)
  - Tablet: 24px (1.5rem)
  - Mobile: 16px (1rem)
- **Margin Left**: 
  - Desktop: 256px (sidebar width)
  - Mobile: 0px
- **Background**: Transparent (grid pattern visible through)

#### Cards/Containers
- **Background**: White with 80% opacity, backdrop blur-xl
- **Border**: 1px solid, light gray at 50% opacity
- **Border Radius**: 12px (0.75rem)
- **Shadow**: Large shadow (shadow-xl) for depth
- **Padding**: 
  - Card Header: 24px (1.5rem)
  - Card Content: 24px (1.5rem)
  - Card Footer: 24px (1.5rem)

---

## Page Specifications

### 1. SIDEBAR NAVIGATION

#### Layout
- **Position**: Fixed left, top 0, z-index 40
- **Background**: White 70% opacity, backdrop-blur-2xl
- **Height**: 100vh
- **Width**: 256px (16rem)

#### Logo Section (Top)
- **Height**: 64px (4rem)
- **Padding**: 24px horizontal (px-6)
- **Border Bottom**: 1px, light gray, 50% opacity
- **Logo Text**: 
  - Size: 20px (text-xl)
  - Weight: 700 (font-bold)
  - Color: Primary color gradient (from-primary via-primary/90 to-primary/60)
  - Text: "CONNEXT AI"

#### Navigation Items
- **Container Padding**: 12px horizontal (px-3), 16px vertical (py-4)
- **Item Spacing**: 4px vertical (space-y-1)
- **Item Padding**: 12px horizontal (px-3), 10px vertical (py-2.5)
- **Border Radius**: 8px (rounded-lg)
- **Icon**: 
  - Size: 20x20px
  - Position: Left side, 12px gap from text
  - Style: Black icons (opacity 60% default, 100% on active/hover)
- **Active State**:
  - Background: Primary color at 10% opacity
  - Text Color: Primary color
  - Left border indicator: 4px wide, primary color, rounded-right-full
  - Icon opacity: 100%
- **Hover State**:
  - Background: Accent color at 5% opacity
  - Text Color: Foreground
  - Icon opacity: 80%

#### User Info Footer (Bottom)
- **Position**: Absolute bottom, 16px from bottom (bottom-4)
- **Width**: Full width minus 24px horizontal padding
- **Padding**: 12px (p-3)
- **Background**: White 60% opacity, backdrop blur
- **Border**: 1px, light gray, 50% opacity
- **Border Radius**: 8px (rounded-lg)
- **Text**: 12px, medium weight, muted color, capitalize role

---

### 2. DASHBOARD PAGE (Client & Admin)

#### Page Header Section
- **Padding Bottom**: 32px (space-y-8 from content)
- **Layout**: Flex row, space-between, items-center
- **Title**:
  - Size: 36px (text-4xl)
  - Weight: 700 (font-bold)
  - Tracking: -0.02em (tracking-tight)
  - Margin Bottom: 4px
- **Subtitle**:
  - Size: 14px (text-sm) on mobile, 16px (text-base) on desktop
  - Color: Muted foreground
  - Margin Top: 8px
- **Action Button** (if present):
  - Position: Right side
  - Size: Default button (h-10, px-4)
  - Variant: Outline or default

#### Stats Cards Grid
- **Layout**: Grid, 4 columns on desktop, 2 on tablet, 1 on mobile
- **Gap**: 16px (gap-4)
- **Card Structure**:
  - **Header**: 
    - Flex row, space-between, items-center
    - Padding: 24px (p-6)
    - Border Bottom: 1px, light gray, 50% opacity (border-b, pb-2)
    - Title: 14px, medium weight, muted color
    - Icon: 16x16px, muted color, right side
  - **Content**: 
    - Padding: 24px (p-6), padding-top 0 (pt-0)
    - Value: 24px (text-2xl), bold weight
    - Change indicator: 12px, flex items-center, gap 4px
    - Positive: Green color
    - Negative: Red color
  - **Hover**: Subtle scale or shadow increase, cursor pointer
  - **Link**: Entire card is clickable

#### Quick Actions Card
- **Layout**: Grid, 2 columns on desktop, 1 on mobile
- **Gap**: 16px (gap-4)
- **Card Structure**:
  - Standard card with header and content
  - **Buttons**: 
    - Full width (w-full)
    - Left-aligned text (justify-start)
    - Variant: Outline
    - Icon: 16x16px, left side, 8px gap (mr-2)
    - Spacing: 8px vertical gap between buttons

#### Recent Activity/System Status Card
- Same structure as Quick Actions
- **Items**: 
  - Padding: 12px (p-3)
  - Border Radius: 8px (rounded-lg)
  - Background: White 60% opacity on hover
  - Border: 1px, light gray, 50% opacity
  - Flex row, space-between
  - Label: Muted color
  - Value: Medium weight, status color (green for online/healthy)

---

### 3. AGENTS LIST PAGE

#### Page Header
- Same as Dashboard header structure
- Title: "Agents & Workflows" or "My Agents"
- Subtitle: Description of the page

#### Agents Grid
- **Layout**: Grid, 3 columns on desktop (lg:grid-cols-3), 2 on tablet (sm:grid-cols-2), 1 on mobile
- **Gap**: 16px (gap-4)
- **Card Structure**:
  - Standard glass card
  - **Header**:
    - Flex column on mobile, row on desktop
    - Space-between, items-start
    - Gap: 8px
    - **Title**: 
      - Size: 18px (text-lg)
      - Weight: 600 (font-semibold)
      - Break words (break-words)
      - Margin bottom: 4px
    - **Description/Email**: 
      - Size: 12px on mobile, 14px on desktop
      - Color: Muted
      - Break words
    - **Badge** (Status):
      - Position: Top right on desktop, below title on mobile
      - Variant: Default (active) or Outline (inactive)
      - Icon: 12px, 4px gap (mr-1)
      - Padding: 4px horizontal, 2px vertical
  - **Content**:
    - Padding: 24px (p-6)
    - Spacing: 12px vertical (space-y-3)
    - **Info Rows**:
      - Flex items-center, gap 8px
      - Icon: 16x16px, muted color
      - Label: 12px on mobile, 14px on desktop, muted color
      - Value: 12px, monospace font for IDs/numbers
      - Break-all for long values
    - **Buttons Section**:
      - Flex column, gap 8px
      - Full width buttons
      - Size: Small (h-9)
      - Variant: Outline
      - Icon: 16x16px, left side, 8px gap

#### Empty State
- Centered card
- **Padding**: 48px vertical (py-12)
- **Icon**: 48x48px, muted color, margin bottom 16px
- **Title**: 18px, semibold, margin bottom 8px
- **Description**: 14px, muted color, centered, margin bottom 16px
- **Action Button**: Default variant

---

### 4. AGENT DETAIL PAGE

#### Page Header
- **Layout**: Flex row, space-between, items-center
- **Left Side**:
  - Flex items-center, gap 16px
  - Back button: Ghost variant, icon only, 40x40px (h-10 w-10)
  - Title: 36px (text-4xl), bold, tracking-tight
  - Subtitle: 14px, muted, margin-top 4px
- **Right Side**:
  - Flex items-center, gap 12px
  - Badge: Default variant, padding 6px horizontal, 6px vertical
  - Action buttons: Default/destructive variants

#### Overview Cards (Top Section)
- **Layout**: Grid, 3 columns on desktop (md:grid-cols-3), 1 on mobile
- **Gap**: 24px (gap-6)
- **Card Structure**:
  - Standard glass card
  - **Header**:
    - Padding bottom: 12px (pb-3)
    - Flex items-center, gap 12px
    - Icon: 24x24px
    - Title: 18px (text-lg), semibold
    - Margin bottom: 8px
  - **Content**:
    - Standard padding
    - Value: 
      - For text: 14px, medium weight
      - For numbers/IDs: 18px (text-lg), monospace, semibold
      - For badges: Default badge styling

#### Main Content Grid
- **Layout**: Grid, 3 columns on desktop (lg:grid-cols-3)
- **Left Column**: 2/3 width (lg:col-span-2)
- **Right Column**: 1/3 width
- **Gap**: 24px (gap-6)
- **Left Column Spacing**: 24px vertical (space-y-6)

#### Workflow Information Card (Left Column)
- Standard card structure
- **Header**:
  - Flex items-center, gap 12px
  - Icon: 24x24px
  - Title and description stack
- **Content**:
  - Spacing: 16px vertical (space-y-4)
  - **Status Badge**: 
    - Default variant
    - Padding: 8px horizontal, 4px vertical (px-3 py-1)
    - Icon: 16x16px, dark variant (white icon), 6px gap (mr-1.5)
  - **Info Sections** (if workflow exists):
    - Border top: 1px, light gray, 50% opacity, 8px padding top (pt-2)
    - Spacing: 12px vertical (space-y-3)
    - **Info Row**:
      - Flex items-start, gap 12px
      - Icon: 20x20px, margin-top 2px (mt-0.5)
      - Content: Flex-1, min-width-0
      - Label: 12px, medium weight, muted, margin-bottom 4px
      - Value: 14px, monospace for IDs, break-all
  - **Empty State** (if no workflow):
    - Flex items-start, gap 12px
    - Padding: 8px vertical (py-2)
    - Icon: 20x20px, opacity 50%, margin-top 2px
    - Text: 14px, muted color

#### System Prompt Card (Left Column)
- Standard card structure
- **Header**: Same as workflow card
- **Content**:
  - Padding: 16px (p-4)
  - Background: White 60% opacity, backdrop blur
  - Border: 1px, light gray, 50% opacity
  - Border Radius: 8px (rounded-lg)
  - Text: 14px, whitespace-pre-wrap, line-height 1.6 (leading-relaxed)

#### Form Data / Workflow Config Cards (Left Column)
- **Layout**: Grid, 2 columns on desktop (md:grid-cols-2), 1 on mobile
- **Gap**: 24px (gap-6)
- **Card Structure**:
  - Standard card
  - **Header**:
    - Flex items-center, gap 12px
    - Icon: 20x20px
    - Title: 16px (text-base), semibold
  - **Content**:
    - Padding: 12px (p-3)
    - Background: White 60% opacity, backdrop blur
    - Border: 1px, light gray, 50% opacity
    - Border Radius: 8px
    - Max Height: 256px (max-h-64)
    - Overflow: Auto
    - **Pre/Code**:
      - Font: Monospace
      - Size: 12px (text-xs)
      - Whitespace: pre-wrap
      - Word Break: break-words

#### Voice Settings Card (Right Column)
- Standard card structure
- **Header**: Icon + title, icon 20x20px
- **Content**:
  - Spacing: 16px vertical (space-y-4)
  - **Field**:
    - Label: 12px, medium weight, muted, margin-bottom 8px
    - Value: Badge outline variant

#### Metadata Card (Right Column)
- Standard card structure
- **Header**: Icon + title, icon 20x20px
- **Content**:
  - Spacing: 12px vertical (space-y-3)
  - **Date Row**:
    - Flex items-start, gap 12px
    - Icon: 18x18px, margin-top 2px
    - Content:
      - Label: 12px, medium weight, muted
      - Value: 14px, formatted date (long format: "January 15, 2024")
  - **Separator**: Border top, 1px, light gray, 50% opacity, 8px padding top

---

### 5. LEADS PAGE

#### Page Header
- Same structure as Dashboard

#### Leads List
- **Layout**: Single column, vertical stack
- **Gap**: 16px (gap-4)
- **Lead Card Structure**:
  - Standard glass card
  - **Content Padding**: 24px (pt-6, p-6)
  - **Layout**: Flex column, gap 8px
  - **Top Section**:
    - Flex items-start, space-between
    - **Left Side**:
      - Flex column, gap 8px, flex-1
      - **Badges Row**: Flex items-center, gap 8px, flex-wrap
      - **Phone Number**: 
        - Flex items-center, gap 8px
        - Icon: 16x16px, muted color
        - Text: 14px
      - **Summary**: 
        - 14px, muted color
        - Line clamp 2 (line-clamp-2)
      - **Metadata Row**: 
        - Flex items-center, gap 16px
        - Font: 12px (text-xs), muted color
        - Icons: 12x12px (h-3 w-3)
        - Flex items-center, gap 4px

#### Empty State
- Same structure as Agents empty state

---

### 6. REQUESTS PAGE

#### Page Header
- Same structure with action button on right (e.g., "New Request")

#### Requests List
- **Layout**: Single column, vertical stack
- **Gap**: 16px (gap-4)
- **Request Card Structure**:
  - Standard glass card
  - **Header**:
    - Flex column on mobile, row on desktop
    - Space-between, items-start
    - Gap: 12px
    - **Left Side**:
      - Flex column, gap 8px, flex-1
      - **Title**: 18px, semibold, break-words
      - **Metadata Row**: 
        - Flex items-center, gap 8px, flex-wrap
        - Badges + description text
        - Description: 12px on mobile, 14px on desktop
    - **Right Side**: 
      - Button: Outline variant, small size
      - Full width on mobile, auto on desktop
  - **Content** (if description exists):
    - Standard padding
    - Text: 14px, muted, line-clamp-2
  - **Admin Notes Section** (if exists and not pending):
    - Padding: 12px (p-3)
    - Background: White 60% opacity, backdrop blur
    - Border: 1px, light gray, 50% opacity
    - Border Radius: 8px
    - Label: 14px, medium weight, margin-bottom 4px
    - Text: 14px, muted color

#### Empty State
- Same structure with action button to create first request

---

### 7. REQUEST DETAIL PAGE (Admin Review)

#### Page Header
- Same structure as Agent Detail

#### Review Modal/Card
- **Layout**: Centered, max-width 768px (max-w-2xl)
- **Background**: Overlay (black 50% opacity, backdrop blur)
- **Card**: Standard glass card, full width, max-height 90vh, overflow-y auto
- **Structure**:
  - Standard header + content
  - **Request Details Section**:
    - Label: 14px, medium weight
    - Content Box: 
      - Padding: 16px (p-4)
      - Background: White 60% opacity, backdrop blur
      - Border: 1px, light gray, 50% opacity
      - Border Radius: 8px
      - Spacing: 8px vertical (space-y-2)
      - **Detail Row**:
        - Label: Medium weight
        - Value: Regular weight
        - Multi-line values: Margin-top 4px, break-words
  - **Workflow Preview Section** (if create request):
    - Label + Toggle Button row
    - Button: Outline, small size
    - Preview Box: Same styling as Request Details
    - Max Height: 384px (max-h-96)
    - Overflow: Auto
    - Pre/Code: 12px monospace, pre-wrap, break-words
  - **Admin Notes Textarea**:
    - Full width
    - Background: White 60% opacity, backdrop blur
    - Border: 1px, light gray, 50% opacity
    - Focus: Border color changes to primary
    - Rows: 4
    - Padding: 12px
  - **Action Buttons**:
    - Flex row, gap 8px
    - Full width on mobile, auto on desktop
    - Flex-1 on mobile for primary actions
    - Approve: Default variant
    - Reject: Destructive variant
    - Cancel: Outline variant

---

## Component Specifications

### Buttons
- **Default**: 
  - Background: Primary color
  - Text: White
  - Padding: 10px vertical, 16px horizontal (h-10 px-4)
  - Border Radius: 6px (rounded-md)
  - Shadow: Large, primary color at 20% opacity
- **Outline**:
  - Background: White 60% opacity, backdrop blur
  - Border: 1px, border color, 50% opacity
  - Text: Foreground
  - Hover: Background 80% opacity, border stays same
- **Ghost**:
  - Background: Transparent
  - Hover: Accent color at 5% opacity
- **Destructive**:
  - Background: Red/destructive color
  - Text: White
  - Same padding and radius as default

### Badges
- **Default**:
  - Background: Primary color
  - Text: White
  - Padding: 4px horizontal, 2px vertical (px-2 py-0.5)
  - Border Radius: 9999px (rounded-full)
  - Font: 12px (text-xs)
  - Icon: 12px, 4px gap (mr-1)
- **Outline**:
  - Background: Transparent
  - Border: 1px, border color
  - Text: Foreground
  - Same padding and radius

### Icons
- **Source**: SVG files from /icons directory
- **Light Background** (default):
  - Color: Black
  - Opacity: 60% default, 100% on active/hover
  - No filters
- **Dark Background** (variant="dark"):
  - Filter: brightness(0) invert(1)
  - Opacity: 90%
  - Used in badges with primary background
- **Sizes**:
  - Small: 16x16px (h-4 w-4)
  - Medium: 20x20px (h-5 w-5)
  - Large: 24x24px (h-6 w-6)
  - Extra Large: 48x48px (h-12 w-12)

### Loading States
- **Spinner**: 
  - Size: 48x48px (h-12 w-12)
  - Border: 2px, primary color, transparent background
  - Animation: Spin
  - Centered in container
- **Text**: 14px, muted color, centered below spinner
- **Container**: Flex column, items-center, justify-center, min-height 400px

### Empty States
- **Icon**: 48x48px, muted color, opacity 50%, margin-bottom 16px
- **Title**: 18px, semibold, margin-bottom 8px
- **Description**: 14px, muted color, centered, margin-bottom 16px (or 24px if button present)
- **Action Button**: Default variant (if applicable)

---

## Responsive Breakpoints

- **Mobile**: < 640px (sm)
  - Sidebar: Hidden, slide-in menu
  - Single column layouts
  - Reduced padding (16px)
  - Stacked header elements
  - Full-width buttons

- **Tablet**: 640px - 1024px (md)
  - Sidebar: Visible, fixed
  - 2-column grids for cards
  - Standard padding (24px)
  - Horizontal header elements

- **Desktop**: > 1024px (lg)
  - Full sidebar visible
  - 3-4 column grids
  - Maximum padding (32px)
  - Optimal spacing and layout

---

## Interaction States

### Hover
- **Cards**: Subtle shadow increase, slight scale (1.01) or border color change
- **Buttons**: Background color darkens by 10% or opacity increases
- **Links**: Underline or color change
- **Navigation Items**: Background color change, icon opacity increase

### Active/Focus
- **Buttons**: Slight scale down (0.98)
- **Inputs**: Ring outline, 2px, primary color
- **Navigation**: Primary background at 10% opacity, left border indicator

### Disabled
- **Opacity**: 50%
- **Cursor**: not-allowed
- **No interactions**: Pointer events none

---

## Animation & Transitions

- **Duration**: 200ms (duration-200) for most interactions
- **Timing**: ease-in-out
- **Transitions**: 
  - Colors: transition-colors
  - Transform: transition-transform
  - All: transition-all (for complex states)
- **Sidebar Slide**: 300ms (duration-300), ease-in-out
- **Spinner**: Infinite spin animation

---

## Accessibility

- **Focus Indicators**: Visible outline rings on interactive elements
- **Color Contrast**: Minimum 4.5:1 for text
- **Touch Targets**: Minimum 44x44px for mobile
- **Screen Readers**: Proper aria-labels on icons and buttons
- **Keyboard Navigation**: All interactive elements keyboard accessible

---

## Notes for Designer

1. **Glassmorphism Effect**: Cards should have a subtle glass-like appearance with backdrop blur and semi-transparent white backgrounds
2. **Grid Background**: The InfiniteGrid component provides a subtle animated grid pattern - design should complement this
3. **Icon System**: Only 4 icons currently in public/icons - design should account for icon reuse and suggest icon placements
4. **Data Density**: Balance between information density and whitespace - important data should be prominent
5. **Visual Hierarchy**: Use size, weight, and color to establish clear hierarchy
6. **Consistency**: All pages should follow the same spacing, typography, and component patterns
7. **Mobile First**: Design should work well on mobile, then enhance for larger screens

---

## Deliverables Expected

1. **High-fidelity mockups** for each page type:
   - Dashboard (client & admin)
   - Agents List (client & admin)
   - Agent Detail (client & admin)
   - Leads List
   - Requests List
   - Request Detail/Review
   - Sidebar Navigation

2. **Component library** showing:
   - All button variants and states
   - Card variations
   - Badge variants
   - Form inputs
   - Loading states
   - Empty states

3. **Design specifications** including:
   - Exact hex/rgb colors
   - Exact pixel measurements
   - Font sizes and weights
   - Spacing values
   - Border radius values
   - Shadow specifications

4. **Responsive layouts** showing:
   - Mobile view (375px)
   - Tablet view (768px)
   - Desktop view (1280px)

