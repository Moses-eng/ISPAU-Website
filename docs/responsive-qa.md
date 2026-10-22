# Responsive verification

The public header keeps Apply for Membership outside the compact navigation, beside the animated hamburger. Compact navigation starts at 1100px. It closes after navigation, outside clicks, Escape or a desktop breakpoint change. Hidden links are inert. Reduced-motion preferences disable menu transitions.

The portal drawer has its own close control, backdrop and Escape handling. Closed drawers are inert on small screens.

## Browser checks

Checked using headless Microsoft Edge at widths 320, 390, 768, 1024 and 1440 pixels with a 900px viewport height:

- Home, About, Membership, Services, Contact, Directory, Privacy and Login.
- No horizontal document overflow or browser runtime errors detected.
- Application button visibility and placement outside navigation.
- Hamburger toggling, Membership dropdown selection, close after navigation and Escape.

Checked applicant, member, membership coordinator, administrator, accounts and decision workspaces at 390, 768 and 1024 pixels, including compact drawer closing. No horizontal document overflow detected.

Phone and tablet homepage screenshots, the open phone menu and the phone member portal were visually reviewed. Corrected mobile hero button heights, directory logo sizing, activity rows, footer spacing and compact layouts. These checks emulate screen sizes; physical-device testing remains a useful release check.

## Manual regression checks

Resize across 720px, 1000px and 1100px; open and close both navigation dropdowns; navigate while the menu is open; confirm the application action remains visible; test Tab and Escape; test portrait and landscape scrolling with the menu open; check reduced motion.
