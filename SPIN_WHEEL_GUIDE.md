# Spin Wheel Configuration Guide

## Overview
The spin wheel now features **perfect proportional segments** based on winning chances, with **clean, non-overlapping images** positioned at the edges of each segment.

## How It Works

### Segment Sizing
- Each segment's **area is proportional** to its winning chance percentage
- Total of all chances **must equal 100%**
- Example: 5 companies with 20% each = perfect equal segments

### Color & Styling
- **20 distinct colors** auto-assigned to each segment
- **Gradients** for visual depth
- **White borders** between segments
- **Drop shadows** for 3D effect

### Image Positioning
- Images are positioned **at the edge** of each segment (not overlapping)
- **Circular frames** with white borders (64px)
- **Clipped perfectly** within circles using SVG clipPath
- **Company names** displayed below images

### Percentage Display
- Each segment shows **winning probability %**
- Visible only if segment size > 20° (avoids clutter)
- Company label truncated to 8 characters if needed

## Data Structure Required

### Item Object Format
```javascript
{
  name: "Company Name",              // String (displayed as label)
  image: "https://url/to/image.png", // Image URL (for logo)
  chance: 20                         // Number (0-100, total must = 100)
}
```

### Example: 5 Companies Equal Chance
```javascript
items = [
  { name: "Company A", image: "...", chance: 20 },
  { name: "Company B", image: "...", chance: 20 },
  { name: "Company C", image: "...", chance: 20 },
  { name: "Company D", image: "...", chance: 20 },
  { name: "Company E", image: "...", chance: 20 }
]
```

### Example: Weighted Chances
```javascript
items = [
  { name: "Premium", image: "...", chance: 35 },
  { name: "Standard", image: "...", chance: 30 },
  { name: "Basic", image: "...", chance: 20 },
  { name: "Special", image: "...", chance: 15 }
]
```

## Visual Breakdown

```
    20% Segment = 72° arc
    ↓
    ┌─────────────────────┐
    │  Company Logo○      │  (Image at segment edge)
    │  Company Name       │  (Label below)
    └─────────────────────┘
    
    Segment Color: Gradient fill
    Segment Border: White outline
    Drop Shadow: Under segment
```

## Best Practices

✅ **DO:**
- Keep image file sizes small (< 100KB) for fast loading
- Use square images (logo/badge) not rectangular
- Ensure total chance = 100%
- Use 3-20 companies per wheel

❌ **DON'T:**
- Mix chance values that don't sum to 100%
- Use extremely large images (causes slow rendering)
- Have more than 20 segments (too crowded)
- Use transparent/white logos (won't show on light segments)

## Rotation & Animation
- Segments rotate smoothly during spin (4-second animation)
- Landing position calculated based on weighted probability
- Center "SPIN" button remains static (not affected by rotation)

## Component Props

```javascript
<SpinWheel 
  items={campaign.items}    // Array of item objects
  rotation={rotation}       // Current rotation in degrees
/>
```

The rotation prop is applied via CSS transform and updates smoothly via Tailwind transitions.
