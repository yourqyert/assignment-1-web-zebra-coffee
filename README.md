# Zebra Coffee — Web Ordering System

**Front-End Development Course | Assignment #3: Media Queries + Bootstrap Grid**  
**Astana IT University**

---

## 👥 Team Details & Author Information
* **Project Name:** Zebra Coffee Web Platform
* **Authors:** Birzhan Zhanbolatuly (`yourqyert`)
* **Live Deployment URL:** [https://yourqyert.github.io/slmsung-web/](https://yourqyert.github.io/slmsung-web/)

---

## 📌 Project Overview
**Zebra Coffee** is a modern, responsive web application for pre-ordering coffee, desserts, and bakery items. The project fully satisfies all requirements of **Assignment #3**, combining custom CSS Media Queries and the Bootstrap 5.3 Grid & Component system while 100% preserving the signature aesthetic brand design (teal `#01a6b8`, dark `#111111`, clean cards, and smooth transitions).

---

## 🛠 Assignment #3 Requirements & Implementation Details

### Part 1. Media Queries

#### Responsive Typography
* Media queries implemented in `styles.css` adjust font sizes proportionally across different viewport widths:
  * **Desktop (`min-width: 992px`):** Large headings (`h1`: 1.75rem, `h2`: 2.2rem, `h3`: 1.4rem, `p`: 1rem).
  * **Tablet (`551px` – `900px`):** Medium headings (`h2`: 1.8rem, `h3`: 1.25rem, `p`: 0.95rem).
  * **Mobile (`< 550px`):** Compact headings (`h2`: 1.45rem, `h3`: 1.15rem, `p`: 0.85rem).

#### Card Group (Pure Media Queries, No Bootstrap)
* Implemented in `index.html` under the "Популярные позиции" section:
  * **Desktop (`≥ 901px`):** Displays cards in a side-by-side flex row.
  * **Tablet (`551px` – `900px`):** Displays 2 cards per row (`calc(50% - 0.75rem)`).
  * **Mobile (`≤ 550px`):** Stacks cards vertically in 1 column.

---

### Part 2. Bootstrap Grid & Components

#### Bootstrap Grid Layout
* Integrated Bootstrap 5 12-column grid (`container-fluid`, `row`, `col-*`):
  * **Two-column section:** `col-lg-6 col-md-12` showcasing "Особенности сервиса" on `index.html`.
  * **Three-column section:** `col-lg-4 col-md-6 col-sm-12` used inside the seasonal carousel.

#### Bootstrap Spacing Utilities
* Utilized Bootstrap responsive spacing utilities: `m-`, `p-`, `mt-lg-4`, `px-sm-2`, `mb-4`, `mb-5`, `g-4`, `py-3`.

#### Bootstrap Navigation Bar
* Responsive navigation bar with mobile toggler button (`navbar-toggler`) that collapses into a dropdown on smaller screens and displays clean pill links on desktop.

#### Bootstrap Buttons & Button Groups
* Styled with Bootstrap button classes: `btn`, `btn-primary`, `btn-secondary`.
* Stylized category chips implemented using Bootstrap `.btn-group`, `.btn-check`, and `.btn` toggle buttons for category selection, fully preserving brand aesthetics.

#### Bootstrap Carousel (9 Images)
* Implemented in `index.html` (`#coffeeCarousel` with `data-bs-ride="carousel"`):
  * Displays **9 unique images** (`latte.jpeg`, `tashkent-tea.jpeg`, `kruassan.jpeg`, `breakfast1.jpeg`, `cappucino.jpeg`, `berry-tea.jpeg`, `flat-white.jpeg`, `sandwich.jpeg`, `cheesecake.jpg`).
  * Organized into 3 responsive slides (3 items per slide in a Bootstrap grid).
  * Full navigation indicators and controls.

#### Bootstrap Cards
* Styled with `.product-card` and Bootstrap `.card` maintaining brand rounded corners, subtle shadows, and actions.

#### Responsive Form Design (Modal Window)
* Implemented as an interactive Bootstrap Modal (`#orderModal`) triggered by the "Собрать напиток" and "Открыть конструктор" buttons.
* Contains full Bootstrap form controls: `.input-group`, `.form-control`, `.form-select`, `.form-check`, `.form-check-input`.

#### Accessibility & Code Quality
* Valid semantic HTML tags (`<header>`, `<nav>`, `<aside>`, `<main>`, `<section>`, `<footer>`, `<button>`).
* ARIA attributes (`aria-label`, `aria-controls`, `aria-expanded`, `aria-hidden`).
* Descriptive `alt` attributes for all images and accessible contrast ratios.

---

## 📁 Project Structure
```text
slmsung-web/
├── index.html                  # Homepage with Bootstrap Grid, 9-img Carousel & Modal Form
├── gallery.html                # Interactive Showcase Gallery with Bootstrap Navbar
├── profile.html                # User profile card & loyalty stats
├── styles.css                  # Custom styling + Media queries + Bootstrap fine-tuning overrides
├── README.md                   # Assignment documentation & report guide
├── assets/                     # 9+ High-resolution product images & icons
├── component/
│   ├── auth.html               # SMS/Email login
│   └── module.html             # Beverage builder
├── order/
│   ├── payment.html            # Checkout form
│   └── passed.html             # Order success confirmation
└── profile/
    ├── cart.html               # Cart table
    └── order-history.html      # Order history table
```