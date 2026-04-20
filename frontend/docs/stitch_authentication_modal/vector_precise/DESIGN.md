# Design System Strategy: Precision & Depth

## 1. Overview & Creative North Star
**The Creative North Star: "The Digital Laboratory"**

This design system moves beyond the standard "web app" aesthetic to evoke the feeling of a high-performance, precision instrument. We are not building a webpage; we are crafting a digital console for specialized engineering. 

To break the "template" look, we eschew traditional boxy layouts in favor of **Technical Asymmetry** and **Tonal Density**. By utilizing a sophisticated layering of deep charcoals and electric blues, we create a UI that feels "carved" out of the hardware. The interface should feel authoritative, heavy, and extremely precise—where every pixel serves a functional purpose.

## 2. Colors & Surface Logic
The palette is rooted in a deep-sea obsidian, designed to reduce eye strain during long-form technical calculations while providing a high-contrast stage for data.

### Surface Hierarchy & Nesting
Forget flat grids. We use **Tonal Layering** to define space.
*   **Base Layer:** `surface` (#111319) serves as the "infinite" floor of the application.
*   **Primary Workspaces:** Use `surface_container_low` for large calculation zones.
*   **Interactive Modules:** Use `surface_container` or `surface_container_high` for keypad areas or function drawers.
*   **Nesting Rule:** A module (e.g., a memory bank) sitting inside a workspace should be one step higher in the surface tier (e.g., `surface_container_highest` on top of `surface_container`).

### The "No-Line" Rule
**Explicit Instruction:** Do not use `1px solid` borders to define sections. Sectioning is achieved through color shifts. If you need to separate the "History" panel from the "Input" panel, change the background from `surface` to `surface_container_low`. 

### The "Glass & Gradient" Rule
To elevate the "Electric Blue" beyond a flat hex code:
*   **CTAs:** Use a subtle linear gradient from `primary` (#b4c5ff) to `primary_container` (#2563eb) at a 135° angle.
*   **Active States:** Apply a `primary_container` glow (5px blur, 0.4 opacity) to simulate the phosphor illumination of vintage lab equipment.
*   **Glassmorphism:** For floating modals or "Settings" overlays, use `surface_bright` at 70% opacity with a `20px` backdrop-blur.

## 3. Typography
The typography is a dialogue between human-readable instruction and machine-executable logic.

*   **The Display (Space Grotesk):** Used for `display-*` and `headline-*` tokens. This typeface provides a technical, slightly futuristic edge that feels "engineered."
*   **The Interface (Inter):** Used for `title-*`, `body-*`, and `label-*`. It is the "workhorse" for navigational clarity and instructional text.
*   **The Logic (Monospace Fallback):** For all mathematical strings and code outputs, utilize a monospace font (JetBrains Mono/Fira Code) at `body-md` or `body-lg` scales to ensure every character aligns perfectly for error checking.

**Editorial Tip:** Use `label-sm` in all-caps with `0.05em` letter-spacing for non-interactive metadata to mimic the "stenciled" look of industrial hardware.

## 4. Elevation & Depth
In this system, depth is not "shadowy"; it is "illuminated."

*   **The Layering Principle:** Stacking `surface_container_lowest` through `highest` creates a "stepped" architecture. A card doesn't "float" via a shadow; it "lifts" via a lighter background tone.
*   **Ambient Shadows:** If a floating element is required (e.g., a tooltip), use a highly diffused shadow: `0 20px 40px rgba(0, 0, 0, 0.5)`—the shadow color should never be pure black, but rather a darker version of the `surface` color.
*   **The "Ghost Border" Fallback:** If a container feels lost, use the `outline_variant` token at **15% opacity**. This provides a whisper of a boundary that guides the eye without cluttering the technical density.

## 5. Components

### Buttons
*   **Primary:** Gradient-filled (`primary` to `primary_container`), `lg` rounded corners (0.5rem), white text. State: Active elements should have a `1px` outer glow of `primary`.
*   **Secondary:** `surface_container_highest` background, no border. Sharp, functional.
*   **Tertiary:** Text-only (`on_surface_variant`), ghost-border on hover only.

### Input Fields (The "Scientific Entry")
*   **Styling:** Forgo the standard box. Use a `surface_container_lowest` background with a `1px` bottom-only "Ghost Border."
*   **Active State:** The bottom border transitions to `primary` (#2563eb) with a subtle `2px` glow.
*   **Error State:** Text and underline transition to `error` (#ffb4ab).

### Cards & Information Lists
*   **Divider Rule:** Never use horizontal lines. Use `spacing-4` (0.9rem) or `spacing-5` (1.1rem) of vertical whitespace to separate entries.
*   **Visual Grouping:** Group related scientific constants using a `surface_container_low` background "pill" rather than a boxed card.

### Technical Chips
*   **Selection:** Use `secondary_container` for "Result" chips (Green) to indicate a successful calculation.
*   **Action:** Small, `sm` (0.125rem) rounded corners, utilizing `label-sm` typography.

## 6. Do’s and Don’ts

### Do:
*   **Do** prioritize "density." Scientific users prefer seeing more data at once than excessive whitespace. Use `spacing-2` and `spacing-3` for tight data clusters.
*   **Do** use `secondary` (Green) and `tertiary` (Red) sparingly. They are indicators of "Success/Result" and "Error/Critical," not decorative elements.
*   **Do** ensure that monospace math expressions are always `body-lg` or larger for maximum legibility of complex exponents and symbols.

### Don’t:
*   **Don’t** use standard "drop shadows." They feel too "consumer web" for a professional engineering tool.
*   **Don’t** use `none` or `full` roundedness for primary actions. Stick to the `lg` (0.5rem) and `md` (0.375rem) scales to maintain a "sharp but sophisticated" feel.
*   **Don’t** use 100% opaque borders. It creates "visual noise" that competes with the mathematical symbols.