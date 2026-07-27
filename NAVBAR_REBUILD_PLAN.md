# CRAVE Navbar Rebuild Plan

## Objective
Rebuild the navbar to ensure Home, Menu, and Rewards links remain visible at ALL viewport widths (mobile, tablet, laptop, desktop). The hamburger menu should ONLY contain secondary navigation items.

## Target Structure

### Always Visible (Outside Hamburger)
- CRAVE Logo
- Home
- Menu
- Rewards
- Hamburger Button (☰)

### Hamburger Drawer Content (Secondary Navigation Only)
- About
- Reservation
- VIP
- Contact
- Tracking
- Profile
- Login
- Register

## Responsive Behavior
- **Desktop/Laptop**: Logo left → Home → Menu → Rewards → Hamburger right
- **Tablet**: Same structure with adjusted spacing/font sizes
- **Mobile**: Same structure with compact spacing/font sizes
- **Small Mobile**: Same structure with minimal spacing/font sizes

**CRITICAL**: Home/Menu/Rewards must NEVER be hidden in the hamburger at any breakpoint.

## Implementation Steps

### Phase 1: Investigation
1. Inspect all HTML files to determine navbar implementation pattern
2. Check if navbar is shared via component or duplicated in each file
3. Identify existing navbar CSS selectors and JavaScript
4. Map all existing navbar-related code

### Phase 2: Shared Component Update
1. Update `components/shared-navbar.html` with correct structure
2. Update `components/shared-navbar.css` for responsive behavior
3. Ensure hamburger contains only secondary navigation
4. Remove Home/Menu/Rewards from mobile menu

### Phase 3: HTML File Updates
1. Update all customer-facing HTML files to use correct navbar structure
2. Ensure consistent implementation across all pages
3. Verify all links point to existing pages

### Phase 4: Cleanup
1. Search for and remove old navbar JavaScript
2. Remove duplicate navbar implementations
3. Ensure only ONE active navbar implementation

### Phase 5: Verification
1. Search all HTML files for old navbar markup
2. Search all JS files for old navbar initialization
3. Search all CSS files for old navbar selectors
4. Confirm single navbar implementation
5. Verify Home/Menu/Rewards visibility at all breakpoints
6. Verify hamburger contains only secondary links
7. Run JavaScript syntax checks

## Files to Update

### Primary Files
- `components/shared-navbar.html`
- `components/shared-navbar.css`

### HTML Files (Customer-Facing)
- index.html
- menu.html
- about.html
- rewards.html
- vip.html
- contact.html
- reservation.html
- tracking.html
- profile.html
- login.html
- register.html
- cart.html
- checkout.html
- order.html
- menu-bolt.html

### Admin/Internal Files (if they use navbar)
- admin.html
- kitchen.html

## Success Criteria
- [ ] Home/Menu/Rewards visible at mobile width (< 480px)
- [ ] Home/Menu/Rewards visible at tablet width (768px - 1024px)
- [ ] Home/Menu/Rewards visible at desktop width (> 1024px)
- [ ] Hamburger opens only secondary links
- [ ] Hamburger closes correctly
- [ ] All links point to existing pages
- [ ] Only one navbar implementation exists
- [ ] No old navbar JavaScript remains
- [ ] All JavaScript syntax checks pass
