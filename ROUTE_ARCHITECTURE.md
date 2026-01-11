# Aiverse Route Architecture

## Route Organization

### Core City Districts (Static Routes)
These are the main themed districts of the AI City with custom visual designs and features:

- `/districts/commerce` - Commerce District (Neon Dreams & Trading Streams)
- `/districts/automation` - Automation District (AI Workflow Hub)
- `/districts/lore` - Lore District (Ancient Wisdom & Consciousness)
- `/districts/supplier` - Supplier Harbor (Product Gateway)

**Purpose**: These routes provide unique, branded experiences for the core city districts with custom UI, animations, and features specific to each district's theme.

### User-Generated Microstores (Dynamic Route)
- `/districts/[slug]` - Dynamic microstore pages

**Purpose**: Database-driven pages for user-created storefronts and microstores within districts.

### Design Decision
The static routes are intentionally separate from the dynamic route because:
1. Core districts need unique branding and custom experiences
2. Static routes allow for optimized performance and SEO
3. Dynamic routes handle the variable user-generated content
4. Clear separation between "city infrastructure" and "user content"

### Pipeline Integration
Both route types integrate with the same cross-cutting features:
- MiniMap overlay
- AI Citizens
- Page transitions
- Mood-responsive atmosphere
- Memory echo system

## Route Protection

### Development Routes
The following routes are blocked in production via middleware:
- `/test-auth` - Authentication testing
- `/test-pricing` - Pricing/currency testing

These routes return 404 in production environments and show development warnings in development mode.