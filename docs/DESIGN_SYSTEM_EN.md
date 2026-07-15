# Design System and Responsive Rules

## Visual direction

- premium, modern and conversion-oriented;
- feminine without cliché;
- charcoal, warm ivory, dusty rose and restrained gold;
- authentic mothers in a premium daytime gym;
- no aggressive bodybuilding look;
- no generic discount-flyer appearance.

## Core colors

The exact values are implemented as CSS custom properties in `frontend/src/styles/landing.css` and `admin.css`. Developers must change tokens rather than scatter new colors.

Primary roles:

- charcoal: hero, FAQ and high-contrast cards;
- ivory: body sections;
- rose: CTA and besties emphasis;
- gold: price/member-card badges and fine highlights;
- dark ink: headings and body copy.

## Responsive behavior

### Desktop, approximately 1280–1920 px

- three-part hero: copy, image and offers;
- editorial horizontal rhythm;
- benefits in five columns;
- two pricing cards side by side;
- four-step process in one row;
- FAQ in two columns.

### Tablet, approximately 768–1279 px

- hero content remains prominent;
- offer cards reflow beneath or beside image according to available width;
- section grids reduce columns;
- touch targets remain at least 44 px.

### Mobile, 320–767 px

- one-column reading order;
- besties offer receives priority in the pricing area;
- full-width buttons;
- sticky bottom CTA with safe-area padding;
- modal becomes a bottom sheet;
- FAQ becomes one column;
- admin table becomes mobile lead cards;
- no horizontal page scrolling.

## Image rules

- use supplied WebP files;
- preserve focal point on faces;
- do not bake public text into hero images;
- maintain the dark left-side gradient for legibility;
- use lazy loading below the fold;
- retain intrinsic width/height to reduce layout shift.

## Accessibility rules

- maintain keyboard operation;
- visible focus styles;
- semantic headings;
- form labels linked through nesting;
- status and error text, not color alone;
- reduced-motion safe behavior;
- screen-reader-friendly dialog title and live regions;
- minimum contrast appropriate to final colors.
