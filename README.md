# Zebra Coffee — Web Ordering System

**Front-End Development Course | Assignment #1: HTML & CSS Basics**  
**Astana IT University**

---

## 👥 Team Details & Page Responsibilities
* **Project Name:** Zebra Coffee Web Store
* **Team Structure:**
    * **Birzhan Zhanbolatuly** 
        * `index.html` — Homepage showcase, coffee & pastry grid, hero banner.
        * `profile.html` — User status card, loyalty stats, author bio and links.
        * `component/module.html` — Beverage builder & configurator (`<details>`, radio buttons, checkboxes).
        * `component/auth.html` — Phone/SMS authentication view.
        * `profile/cart.html` — Cart summary with a 4-column data table.
        * `profile/order-history.html` — Historical orders log with an itemized table.
        * `order/payment.html` — Checkout & payment options form.
        * `order/passed.html` — Order confirmation screen with active ID.
        * `css/style.css` — Core design system, resets, typography, and responsive grids.

---

## 📌 Project Overview
**Zebra Coffee** is a lightweight web showcase and pre-ordering platform.

---

## 🛠 Step-by-Step Task Achievements

### Part 1: HTML Structure
1. **HTML Boilerplate (Step 1):** Complete boilerplate on all 7 pages with `<!DOCTYPE html>`, `<html lang="ru">`, `<meta charset="UTF-8">`, viewport tags, and unique `<title>` attributes.
2. **Semantic Hierarchy & Content (Step 2):** Logical layout structure using `<header>`, `<nav>`, `<main>`, `<section>`, and `<footer>` containers, paired with structured headings (`<h1>` to `<h4>`) and an author bio block.
3. **Lists, Images & Navigation (Step 3):** Global navigation menu styled with `<ul>`, step configuration powered by `<ol>`, and optimized image cards with valid `alt` tags.
4. **Data Tables (Step 4):** Fully styled multi-column tables in `profile/cart.html` and `profile/order-history.html` structured with `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, and `<td>`.
5. **HTML Forms & Inputs (Step 5):** Text inputs, email inputs, selects, radio buttons, checkboxes, textareas, and submit buttons styled across the payment and builder pages.

### Part 2: External Styling with CSS
1. **CSS Linking (Step 7):** Centralized styling in `css/style.css` linked across all pages using relative paths.
2. **Selector Diversity (Step 8):** Full demonstration of element, class, ID, and descendant selectors.
3. **Palette & Typography (Step 9):** Cohesive modern dark-accent scheme (`#111111`, `#01a6b8`, `#f4f5f7`) with smooth `:hover` transitions and reset link decorations.
4. **Box Model & Layout (Step 10–13):** Sticky header navigation, universal box reset (`box-sizing: border-box`), circular avatars (`border-radius: 50%`), and focus rings on form controls.

---

## 📁 Directory Structure
```text
slmsung-web/
├── index.html                  # Homepage showcase
├── profile.html                # User profile & loyalty stats
├── css/
│   └── style.css               # External stylesheet
├── assets/                     # Image assets
├── component/
│   ├── auth.html               # Authentication page
│   └── module.html             # Beverage builder
├── order/
│   ├── payment.html            # Checkout & payment form
│   └── passed.html             # Success order confirmation
└── profile/
    ├── cart.html               # Cart table
    └── order-history.html      # Order history table