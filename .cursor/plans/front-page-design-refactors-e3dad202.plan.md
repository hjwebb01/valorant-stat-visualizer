<!-- e3dad202-0767-4fc6-a5a5-8abcffed95a0 a61bc112-cffd-4430-a4be-1d54bf6b5835 -->
# Front Page Design Refactor Options

## Current State Analysis

- Uses default shadcn-svelte theme with neutral colors
- Two-column grid layout (Top 20 Players table + Player Stats card)
- Standard card components with subtle borders
- Basic typography with system fonts
- Simple color-coded percentile bars

## Design Option 1: Valorant-Inspired Dark Theme

**Color Palette:**

- Primary: Valorant Red (#FF4655) for accents and highlights
- Background: Deep charcoal (#0F1923) to match Valorant's UI
- Cards: Dark slate (#1A2332) with subtle red tint
- Text: Off-white (#E8E8E8) for readability
- Accents: Red-orange (#FF6B6B) for top performers, teal (#00D9FF) for secondary highlights
- Borders: Subtle red glow (#FF465520)

**Typography:**

- Headers: "Rajdhani" or "Orbitron" (gaming fonts) - bold, all caps
- Body: "Inter" or "Roboto" for readability
- Stats: "JetBrains Mono" for monospace numbers

**Layout Changes:**

- Full-width dark background with subtle red gradient overlay
- Cards have glowing red borders on hover
- Table rows have red accent on selected player
- Percentile bars use red gradient instead of solid colors
- Add subtle particle effects or animated background elements
- Profile pictures have red border glow when selected

**Component Styling:**

- Cards: Dark background with red border glow, increased shadow depth
- Table: Dark rows with red hover states, red accent for rank #1
- Stats cards: Gradient backgrounds (dark to red-tinted)
- Percentile bars: Red-to-orange gradient based on performance

---

## Design Option 2: Modern Glassmorphism & Gradients

**Color Palette:**

- Background: Deep purple-blue gradient (#667EEA → #764BA2)
- Cards: Glassmorphism effect - semi-transparent white (#FFFFFF20) with backdrop blur
- Text: Pure white (#FFFFFF) with high contrast
- Accents: Bright cyan (#00F5FF) and magenta (#FF00FF) for highlights
- Borders: Subtle white glow (#FFFFFF30)

**Typography:**

- Headers: "Poppins" - modern, geometric
- Body: "Inter" - clean and readable
- Stats: "Fira Code" for monospace

**Layout Changes:**

- Full-page gradient background (purple to blue)
- Cards use backdrop-filter blur with semi-transparent backgrounds
- Floating card effect with subtle shadows
- Rounded corners increased (xl/2xl)
- Gradient overlay on hover for interactive elements
- Smooth animations and transitions throughout

**Component Styling:**

- Cards: Glass effect with blur, white borders, increased padding
- Table: Transparent rows with hover glow effect
- Stats: Gradient text for percentile rankings
- Percentile bars: Gradient fills (cyan to magenta based on rank)
- Profile pictures: White border glow with blur effect

---

## Design Option 3: Clean Minimalist Professional

**Color Palette:**

- Background: Pure white (#FFFFFF) with subtle gray (#F8F9FA)
- Cards: White with subtle shadow, thin gray borders (#E5E7EB)
- Text: Deep gray (#111827) for headers, medium gray (#6B7280) for body
- Accents: Single accent color - blue (#3B82F6) for all highlights
- Borders: Clean 1px gray lines

**Typography:**

- Headers: "Work Sans" or "DM Sans" - clean, professional
- Body: "Inter" - highly readable
- Stats: "SF Mono" or "Menlo" for monospace

**Layout Changes:**

- Maximum whitespace and breathing room
- Increased padding and margins
- Subtle hover effects (no dramatic color changes)
- Clean separation between sections
- Minimal shadows (subtle elevation)
- Simple, flat design language

**Component Styling:**

- Cards: White background, subtle shadow, increased border radius
- Table: Clean lines, subtle row hover (light gray)
- Stats: Blue accent color for percentile rankings only
- Percentile bars: Simple blue gradient, subtle and professional
- Profile pictures: Thin gray border, clean circular crop

---

## Design Option 4: Gaming Neon Cyberpunk

**Color Palette:**

- Background: Pure black (#000000) with neon grid pattern overlay
- Cards: Dark gray (#1A1A1A) with neon cyan (#00FFFF) borders
- Text: Bright white (#FFFFFF) with cyan glow for headers
- Accents: Neon cyan (#00FFFF), neon pink (#FF00FF), neon green (#00FF00)
- Borders: Glowing neon effects

**Typography:**

- Headers: "Orbitron" or "Exo 2" - futuristic, tech-focused
- Body: "Roboto Mono" or "Courier New" - monospace feel
- Stats: "JetBrains Mono" - terminal aesthetic

**Layout Changes:**

- Dark background with animated grid lines or scanline effect
- Neon glow effects on all interactive elements
- Cards have animated neon borders
- Holographic-style hover effects
- Sharp, angular design elements
- Neon text shadows and glows

**Component Styling:**

- Cards: Dark with neon border glow, sharp corners or slight bevel
- Table: Neon cyan accents, glowing hover states
- Stats: Neon colors (cyan/green/pink) based on percentile tiers
- Percentile bars: Animated neon gradients with glow effect
- Profile pictures: Neon border, optional scanline overlay

---

## Implementation Files

Each design option will modify:

- `src/app.css` - CSS variables for color palette and global styles
- `src/routes/+page.svelte` - Component styling and layout
- `tailwind.config.cjs` - Custom font configurations (if needed)
- `src/lib/components/ui/card/` - Card component overrides
- `src/lib/components/ui/table/` - Table component styling

## Notes

- All options maintain the same functionality and component structure
- Color palettes use CSS custom properties for easy switching
- Typography can be loaded via Google Fonts or self-hosted
- Layout changes focus on spacing, borders, and visual hierarchy
- Interactive states (hover, selected) are enhanced in each option

### To-dos

- [ ] Implement Valorant-inspired dark theme with red accents, gaming fonts, and glowing effects
- [ ] Implement modern glassmorphism design with gradients, backdrop blur, and floating card effects
- [ ] Implement clean minimalist professional design with maximum whitespace and subtle accents
- [ ] Implement gaming neon cyberpunk theme with black background, neon accents, and futuristic typography