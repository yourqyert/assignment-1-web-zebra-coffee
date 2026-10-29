# Zebra Coffee — Web Ordering System

**Front-End Development Course | Assignments #3–5: Responsive Layout + JavaScript**
**Astana IT University**

---

## 👥 Team Details & Author Information
* **Project Name:** Zebra Coffee Web Platform
* **Team:** Zebra Coffee
* **Group:** SE-2507
* **Authors:** Birzhan Zhanbolatuly (`yourqyert`)
* **Live Deployment URL:** [Zebra Coffee](https://yourqyert.github.io/assignment-1-web-zebra-coffee/index.html). Publish the latest local changes to update the deployed version.

---

## 📌 Project Overview
**Zebra Coffee** is a modern, responsive web application for pre-ordering coffee, desserts, and bakery items. The project fully satisfies all requirements of **Assignment #3**, combining custom CSS Media Queries and the Bootstrap 5.3 Grid & Component system while 100% preserving the signature aesthetic brand design (teal `#01a6b8`, dark `#111111`, clean cards, and smooth transitions).

---

## 🛠 Assignment #3 Requirements & Implementation Details

### Part 1. Media Queries

#### Responsive Typography
* Media queries implemented in `additional.css` adjust font sizes proportionally across different viewport widths:
  * **Desktop (`min-width: 992px`):** Large headings (`h1`: 1.75rem, `h2`: 2.2rem, `h3`: 1.4rem, `p`: 1rem).
  * **Tablet (`551px` – `900px`):** Medium headings (`h2`: 1.8rem, `h3`: 1.25rem, `p`: 0.95rem).
  * **Mobile (`< 550px`):** Compact headings (`h2`: 1.45rem, `h3`: 1.15rem, `p`: 0.85rem).

#### Card Group (Pure Media Queries, No Bootstrap)
* Implemented in `index.html` under the "Популярные позиции" section:
  * **Desktop (`≥ 901px`):** Displays cards in a side-by-side flex row.
  * **Tablet (`551px` – `900px`):** Displays 2 cards per row (`calc(50% - 0.75rem)`).
  * **Mobile (`≤ 550px`):** Stacks cards vertically in 1 column.

---

## 🧩 Assignment #4: Introduction to JavaScript

The JavaScript tasks are implemented in the shared `assignment4.js` file and linked from every HTML page. Page-specific controls are initialized only where their matching elements exist.

1. **Form validation:** the registration form at `component/auth.html` checks required values, email format, a minimum eight-character password, and matching password confirmation. Validation feedback is shown beside the form.
2. **FAQ accordion:** three questions on `index.html` expand and collapse their answers with an animated transition and accessible expanded state.
3. **Subscription popup:** the home page footer opens a responsive subscription dialog. It closes from its close button, the backdrop, or Escape, and validates the email before showing a local demo confirmation. The form is not connected to a mailing service.
4. **Background color:** the header theme control switches between Bootstrap's light and dark color modes. The selected mode is remembered between pages.
5. **Current date and time:** shared site footers display live, Russian-formatted date and time using the JavaScript `Date` object. The login page intentionally has no footer, following the requested login-page design.

The shared styles for these components are in `assignment4.css`.

### Dynamic product catalog and order history

Product records are loaded from `back/mock-data.json` by the shared `products.js` script. The home page, gallery, product category filters, and quick-order selector use the same catalog, including names, descriptions, prices, categories, and image paths. Additions from product cards and the quick-order form go into the browser's `localStorage` cart.

When a customer completes the demo checkout, the order saves a snapshot of each selected item (image, name, options, unit price, and quantity). The confirmation page and order history render those saved items with their images. Cart and order data stay in that browser only; this front-end demo does not send orders to a server. Open the project through a local web server so the browser can fetch the JSON file.

## 🧩 Assignment #5: Advanced JavaScript and DOM Manipulation

1. **DOM updates and attributes:** the gallery has an accessible five-star menu rating. Selecting a star updates its selected state, `aria-checked` attributes, and status text, then stores the rating in this browser.
2. **Dynamic styling and animation:** the existing day/night theme control switches Bootstrap color modes. Rating stars animate when selected, and product cards and dialogs use transitions that respect reduced-motion preferences.
3. **Button and keyboard events:** product actions, rating controls, and checkout buttons use `addEventListener`. Arrow keys move through header navigation and rating stars; Home and End move to the first and last item.
4. **Switch and filtering logic:** product lists use a `switch` to select featured, seasonal, or complete catalog data. Category filters update the list without reloading the page.
5. **Callback-based multi-step checkout:** the cart modal has a details step and an order-review step. Next and Back callbacks preserve entered values and update a review of products, options, and total before placing the demo order.
6. **Objects, arrays, loops, and higher-order functions:** catalog records are objects in arrays. `for`, `forEach`, `map`, `filter`, and `reduce` update product lists, ratings, cart items, and totals.
7. **Sound effect:** the gallery offers an optional notification tone generated with the Web Audio API. When enabled, it plays after a rating or a successful add-to-cart action; a new tone replaces the previous one so sounds do not overlap.
8. **Clean structure:** project pages load shared behavior from `assignment4.js` and `products.js`, and styles from the CSS files. Inline style attributes and inline event handlers are not used.

The rating and sound preferences are saved in the current browser. Orders remain a local front-end demonstration and are not transmitted to a payment service or backend.

---

### Part 2. Bootstrap Grid & Components

#### Bootstrap Grid Layout
* Integrated Bootstrap 5 12-column grid (`container-fluid`, `row`, `col-*`):
  * **Two-column section:** `col-lg-6 col-md-12` showcasing "Особенности сервиса" on `index.html`.
  * **Three-column section:** `col-lg-4 col-md-6 col-sm-12` used in the seasonal product grid.

#### Bootstrap Spacing Utilities
* Utilized Bootstrap responsive spacing utilities: `m-`, `p-`, `mt-lg-4`, `px-sm-2`, `mb-4`, `mb-5`, `g-4`, `py-3`.

#### Bootstrap Navigation Bar
* Responsive navigation bar with mobile toggler button (`navbar-toggler`) that collapses into a dropdown on smaller screens and displays clean pill links on desktop.

#### Bootstrap Buttons & Button Groups
* Styled with Bootstrap button classes: `btn`, `btn-primary`, `btn-secondary`.
* Stylized category chips implemented using Bootstrap `.btn-group`, `.btn-check`, and `.btn` toggle buttons for category selection, fully preserving brand aesthetics.

#### Bootstrap Carousel
* The guest-photo carousel on `gallery.html` uses Bootstrap indicators and previous/next controls. Product cards on the home page and gallery are loaded from the shared JSON catalog.

#### Bootstrap Cards
* Styled with `.product-card` and Bootstrap `.card` maintaining brand rounded corners, subtle shadows, and actions.

#### Drink Builder and Cross-Sell Modal
* The drink builder opens from a beverage card's "Настроить и добавить" button. It previews the selected item, lets the customer choose size, syrup, milk, extras, and barista notes, then keeps the modal open with dessert and bakery recommendations.
* Product sizes and add-on prices come from `back/mock-data.json`; the selected configuration is saved with the cart item.

#### Accessibility & Code Quality
* Valid semantic HTML tags (`<header>`, `<nav>`, `<aside>`, `<main>`, `<section>`, `<footer>`, `<button>`).
* ARIA attributes (`aria-label`, `aria-controls`, `aria-expanded`, `aria-hidden`).
* Descriptive `alt` attributes for all images and accessible contrast ratios.

---

## 📁 Project Structure
```text
slmsung-web/
├── index.html                  # Homepage with dynamic products, filters and drink-builder modal
├── gallery.html                # Interactive Showcase Gallery with Bootstrap Navbar
├── profile.html                # User profile card & loyalty stats
├── additional.css              # Site layout, responsive rules and brand styling
├── assignment4.js              # Shared Assignment 4 and 5 interactions
├── assignment4.css             # Shared component and interaction styling
├── products.js                 # Catalog, cart, checkout and order-history rendering
├── back/
│   └── mock-data.json          # Catalog records, categories and mock data
├── README.md                   # Assignment documentation & report guide
├── assets/                     # Product images, logo and hero image
├── component/
│   └── auth.html               # Registration form with validation
├── order/
│   └── passed.html             # Order success confirmation
└── profile/
    ├── cart.html               # Cart table
    └── order-history.html      # Order history table
```
