# 🎨 TürkiyeAI Brand Pack

**Version 1.0 | January 2024**  
**Powered by OrkinosAI**

Complete brand identity system for TürkiyeAI, the AI-powered Turkish travel platform.

---

## 📦 What's Included

This brand pack contains everything you need to implement the TürkiyeAI brand across digital and print media:

### 📁 Directory Structure

```
brand-pack/
├── README.md                           # This file
├── brand-guidelines.md                 # Complete brand guidelines
├── tokens.json                         # Design tokens (colors, typography, spacing)
│
├── css/
│   └── brand.css                       # CSS variables + base styles
│
├── tailwind/
│   └── tailwind.config.js             # Tailwind CSS configuration
│
├── logos/
│   ├── turkiyeai-logo-primary.svg     # Primary logo (full wordmark + mark)
│   ├── turkiyeai-logo-mono.svg        # Monochrome version
│   ├── turkiyeai-mark.svg             # Icon/mark only
│   ├── turkiyeai-logo-concept-2-bougainvillea.svg
│   ├── turkiyeai-logo-concept-3-olive-wave.svg
│   ├── turkiyeai-logo-concept-4-ancient-seal.svg
│   ├── turkiyeai-logo-concept-5-horizon-spark.svg
│   └── powered-by-orkinosai-lockup.svg # Endorsement lockup
│
├── banners/
│   ├── hero-banner-landing.svg        # Website hero (1200x600)
│   ├── linkedin-banner.svg            # LinkedIn cover (1200x627)
│   └── x-banner.svg                   # X/Twitter cover (1500x500)
│
├── social/
│   ├── instagram-post-1.svg           # Instagram post template (1080x1080)
│   └── instagram-story-1.svg          # Instagram story template (1080x1920)
│
├── ui/
│   ├── search-bar.svg                 # Search bar component
│   ├── resort-card.svg                # Destination/resort card
│   └── chat-widget.svg                # AI chat widget interface
│
└── favicons/
    ├── favicon.svg                    # Website favicon (32x32)
    └── app-icon.svg                   # App icon (512x512)
```

---

## 🚀 Quick Start

### For Developers

#### 1. Import CSS Variables

```html
<link rel="stylesheet" href="brand-pack/css/brand.css">
```

Or import in your CSS:

```css
@import url('./brand-pack/css/brand.css');
```

#### 2. Use CSS Variables

```css
.button-primary {
  background-color: var(--color-aegean-blue);
  color: var(--color-pure-white);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
}
```

#### 3. Tailwind CSS Integration

Copy the configuration from `tailwind/tailwind.config.js` or extend your existing config:

```js
// tailwind.config.js
module.exports = {
  // ... your existing config
  theme: {
    extend: {
      // Copy the 'extend' section from brand-pack/tailwind/tailwind.config.js
      colors: {
        'aegean-blue': '#1F6FAF',
        'azure-turquoise': '#2FA4A9',
        // ... rest of colors
      }
    }
  }
}
```

Use in your JSX/HTML:

```jsx
<button className="bg-aegean-blue text-white px-6 py-3 rounded-md font-medium hover:bg-azure-turquoise transition">
  Explore Destinations
</button>
```

#### 4. Design Tokens (JavaScript/JSON)

```javascript
import tokens from './brand-pack/tokens.json';

// Access colors
const primaryColor = tokens.colors.primary['aegean-blue'].value; // "#1F6FAF"

// Access spacing
const buttonPadding = tokens.spacing['6']; // "1.5rem"

// Access typography
const headingFont = tokens.typography.fontFamily.primary.value;
```

---

## 🎨 Color Palette Quick Reference

### Primary Colors
- **Aegean Blue:** `#1F6FAF` - Main brand color
- **Azure Turquoise:** `#2FA4A9` - Secondary brand color

### Accent Colors
- **Soft Coral:** `#F2A38A` - Warm CTAs
- **Bougainvillea Pink:** `#C93A6A` - Important highlights
- **Terracotta Clay:** `#C56A3A` - Mediterranean character

### Nature Colors
- **Olive Green:** `#6F7F4C` - Land, wisdom
- **Sage Green:** `#A8B7A0` - Calm, wellness

### Base Colors
- **Limestone White:** `#F8F9F7` - Primary background
- **Pure White:** `#FFFFFF` - Cards, modals
- **Warm Sand:** `#E6D3B1` - Alternative background

### Semantic Colors
- **Success:** `#4A9B6F`
- **Warning:** `#D89E3F`
- **Error:** `#D4594A`
- **Info:** `#2FA4A9`

---

## 🖼️ Logo Usage

### Primary Logo
Use `turkiyeai-logo-primary.svg` for:
- Website headers
- Marketing materials
- Presentations
- Print materials

**Minimum width:** 120px  
**Clear space:** 20px minimum on all sides

### Icon/Mark Only
Use `turkiyeai-mark.svg` for:
- Favicons
- App icons
- Social media profile pictures
- Small spaces (< 100px wide)

**Minimum size:** 32x32px

### Monochrome Version
Use `turkiyeai-logo-mono.svg` for:
- Single-color printing
- Embossing/engraving
- Watermarks
- Limited color reproduction

### Logo Concepts
Five distinct logo concepts are provided for exploration:
1. **Aegean Mosaic** (Primary/Default)
2. **Bougainvillea Compass**
3. **Olive Leaf + Wave**
4. **Ancient Seal**
5. **Horizon Spark**

Choose the concept that best fits your use case or stick with the primary.

### "Powered by OrkinosAI"
**Required placement on:**
- Website footer
- About pages
- App settings
- Marketing materials

Use `powered-by-orkinosai-lockup.svg`

---

## 📱 Social Media Specs

### Instagram
- **Post:** 1080x1080px - Use `instagram-post-1.svg` as template
- **Story:** 1080x1920px - Use `instagram-story-1.svg` as template

### LinkedIn
- **Banner:** 1200x627px - Use `linkedin-banner.svg`

### X/Twitter
- **Header:** 1500x500px - Use `x-banner.svg`

### Profile Pictures
Use `turkiyeai-mark.svg` or `app-icon.svg` cropped to square

---

## 🧩 UI Components

### Search Bar
**File:** `ui/search-bar.svg`  
**Usage:** Homepage search, destination finder  
**Features:** AI badge, search icon, placeholder text

### Resort/Destination Card
**File:** `ui/resort-card.svg`  
**Usage:** Grid layouts, destination listings  
**Features:** Image area, tags, CTA button, location info

### Chat Widget
**File:** `ui/chat-widget.svg`  
**Usage:** AI chat interface  
**Features:** Message bubbles, typing indicator, quick replies

---

## 💻 Code Examples

### HTML with CSS Variables

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <link rel="stylesheet" href="brand-pack/css/brand.css">
</head>
<body>
  <!-- Hero Section -->
  <section class="hero">
    <div class="container">
      <h1>Discover Türkiye with AI</h1>
      <p>Your intelligent travel companion for Turkish destinations</p>
      <button class="btn btn-primary">Start Planning</button>
    </div>
  </section>

  <!-- Card -->
  <div class="card">
    <h3>Bodrum Peninsula</h3>
    <p>Whitewashed beauty meets azure waters</p>
    <button class="btn btn-secondary">Explore</button>
  </div>
</body>
</html>
```

### React with Tailwind

```jsx
import React from 'react';

export default function DestinationCard({ title, description, image }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <img src={image} alt={title} className="w-full h-64 object-cover" />
      <div className="p-6">
        <h3 className="text-2xl font-semibold text-warm-charcoal mb-2">
          {title}
        </h3>
        <p className="text-warm-slate-700 mb-4">
          {description}
        </p>
        <button className="bg-aegean-blue text-white px-6 py-3 rounded-md font-medium hover:bg-azure-turquoise transition">
          Explore Destination
        </button>
      </div>
    </div>
  );
}
```

### CSS Custom Properties

```css
/* Using brand variables */
.hero-section {
  background: linear-gradient(135deg, 
    var(--color-aegean-blue) 0%, 
    var(--color-azure-turquoise) 100%
  );
  padding: var(--space-20) var(--space-4);
  border-radius: var(--radius-2xl);
}

.card {
  background: var(--color-pure-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
}

.heading-large {
  font-size: var(--text-5xl);
  font-weight: var(--font-semibold);
  color: var(--color-warm-charcoal);
  line-height: var(--leading-tight);
}
```

---

## 📐 Design Specifications

### Spacing Scale
Based on 4px base unit:
- `1` = 4px
- `2` = 8px
- `3` = 12px
- `4` = 16px
- `6` = 24px
- `8` = 32px
- `12` = 48px
- `16` = 64px

### Border Radius
- `sm` = 4px
- `base` = 8px
- `md` = 12px (recommended for cards)
- `lg` = 16px (recommended for buttons)
- `xl` = 20px
- `2xl` = 24px
- `full` = 9999px (pills, circles)

### Shadows
- `sm` - Subtle card elevation
- `base` - Default shadow
- `md` - Medium elevation (recommended for cards)
- `lg` - High elevation (modals)
- `xl` - Very high elevation
- `2xl` - Maximum elevation

### Typography Scale
- **Body:** 16px (base)
- **Small:** 14px (sm)
- **H5:** 20px (xl)
- **H4:** 24px (2xl)
- **H3:** 30px (3xl)
- **H2:** 36px (4xl)
- **H1:** 48px (5xl)
- **Hero:** 72px (7xl)

---

## ✅ Best Practices

### Colors
- ✅ Use Aegean Blue and Azure Turquoise as primary colors
- ✅ Use warm accents (coral, pink) sparingly for CTAs
- ✅ Maintain WCAG AA contrast ratios (4.5:1 minimum)
- ✅ Use Limestone White as primary background
- ❌ Don't use neon or oversaturated colors
- ❌ Don't mix too many accent colors on one screen

### Typography
- ✅ Use Inter for all text
- ✅ Maintain clear hierarchy (H1 > H2 > H3 > body)
- ✅ Use 16px as base body text size
- ✅ Use semibold (600) for headings
- ❌ Don't use more than 3 font weights per page
- ❌ Don't use font sizes smaller than 14px for body text

### Layout
- ✅ Use generous whitespace
- ✅ Maintain consistent spacing scale
- ✅ Use soft rounded corners (12-20px)
- ✅ Keep layouts clean and organized
- ❌ Don't cram too much content in small spaces
- ❌ Don't use sharp corners for main UI elements

### Imagery
- ✅ Use high-quality, authentic Turkish photography
- ✅ Show real destinations and experiences
- ✅ Maintain Mediterranean color palette
- ❌ Don't use generic stock photos
- ❌ Don't use low-quality or dated images

---

## 🔧 Tools & Resources

### Fonts
- **Inter:** Download from [Google Fonts](https://fonts.google.com/specimen/Inter) or [rsms.me/inter](https://rsms.me/inter/)

### Design Tools
- All SVG files are compatible with:
  - Figma
  - Adobe Illustrator
  - Sketch
  - Any SVG editor

### Color Tools
- [Coolors.co](https://coolors.co) - Generate color palettes
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) - Test contrast ratios
- [Color Hunt](https://colorhunt.co) - Color inspiration

### Development Tools
- [Tailwind CSS](https://tailwindcss.com) - CSS framework
- [PostCSS](https://postcss.org) - CSS processing
- [React](https://react.dev) - UI framework

---

## 📝 Changelog

### Version 1.0 (January 2024)
- Initial brand pack release
- 5 logo concepts
- Complete design token system
- CSS and Tailwind integration
- Marketing asset templates
- UI component templates
- Comprehensive brand guidelines

---

## 📞 Support & Questions

**Brand Guidelines:**  
See `brand-guidelines.md` for detailed usage rules

**Technical Issues:**  
brand@turkiyeai.travel

**OrkinosAI Platform:**  
[www.orkinosai.com](http://www.orkinosai.com)

**Website:**  
[turkiyeai.travel](http://turkiyeai.travel)

---

## 📄 License & Usage

© 2024 OrkinosAI Ltd. All rights reserved.

**TürkiyeAI brand assets** are proprietary to OrkinosAI Ltd and are provided for use in connection with the TürkiyeAI platform only.

**Permitted Use:**
- ✅ TürkiyeAI website and applications
- ✅ Official marketing materials
- ✅ Partner integrations (with approval)
- ✅ Press and media coverage

**Prohibited Use:**
- ❌ Modification of logo or brand assets
- ❌ Use for competing services
- ❌ Unauthorized commercial use
- ❌ Misrepresentation of brand or services

For licensing inquiries: legal@orkinosai.com

---

**TürkiyeAI** – Your AI Travel Expert for Türkiye  
**Powered by OrkinosAI** 🌊
