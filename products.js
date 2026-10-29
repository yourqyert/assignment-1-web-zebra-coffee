(() => {
    const scriptUrl = document.currentScript?.src || new URL("products.js", window.location.href).href;
    const scriptDirectory = new URL(".", scriptUrl);
    const dataUrl = new URL("back/mock-data.json", scriptDirectory);
    const CART_KEY = "zebra-cart-v1";
    const ORDERS_KEY = "zebra-orders-v1";
    let products = [];
    let categories = [];
    let builderOptions = { sizes: [], syrups: [], milks: [], extras: [] };
    let builderModalElement = null;
    let builderModal = null;
    let builderProduct = null;
    let selectedCategory = "all";

    const readStorage = (key, fallback) => {
        try {
            const value = JSON.parse(window.localStorage.getItem(key));
            return value ?? fallback;
        } catch {
            return fallback;
        }
    };

    const writeStorage = (key, value) => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    };

    const getCart = () => readStorage(CART_KEY, []);
    const getOrders = () => readStorage(ORDERS_KEY, []);
    const productById = (id) => products.find((product) => String(product.id) === String(id));
    const imageUrl = (path) => new URL(path, scriptUrl).href;
    const priceText = (price) => `${new Intl.NumberFormat("ru-RU").format(price)} ₸`;

    function createElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function showLoadError(error) {
        const openedAsFile = window.location.protocol === "file:";
        const messageText = openedAsFile
            ? "Страница открыта как file://. Браузер запрещает читать соседний JSON-файл. Запустите HTTP-сервер из корня проекта: python -m http.server 8000, затем откройте http://localhost:8000/."
            : "Не удалось загрузить меню. Проверьте, что сервер отдаёт back/mock-data.json из папки проекта.";
        document.querySelectorAll("[data-product-list]").forEach((list) => {
            const message = createElement("p", "text-danger mb-1", messageText);
            const details = createElement("small", "d-block text-muted", error?.message || "Неизвестная ошибка загрузки каталога.");
            list.replaceChildren(message, details);
        });
    }

    async function loadCatalog() {
        try {
            const response = await fetch(dataUrl, { cache: "no-store" });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (!Array.isArray(data.goods) || !Array.isArray(data.categories)) {
                throw new Error("JSON должен содержать массивы goods и categories");
            }
            return data;
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            throw new Error(`${dataUrl.pathname}: ${reason}`);
        }
    }

    function createProductCard(product, gallery = false) {
        const column = createElement("div", gallery ? "col-xxl-3 col-lg-4 col-md-6 col-12 d-flex" : "col-lg-3 col-md-6 col-12 d-flex");
        const card = createElement("article", `product-card card h-100 w-100 p-3 text-center border shadow-sm${gallery ? " gallery-item" : ""}`);
        const image = createElement("img", gallery
            ? "product-card-image gallery-product-image card-img-top w-100 mx-auto mb-3"
            : "product-card-image card-img-top mx-auto mb-3 rounded-4");
        image.src = imageUrl(product.image);
        image.alt = product.name;
        image.loading = "lazy";
        image.width = gallery ? 480 : 140;
        image.height = gallery ? 240 : 140;
        image.classList.add("product-card-image-contain");
        if (gallery) image.classList.add("gallery-product-image-fixed");

        const body = createElement("div", `card-body p-0 d-flex flex-column${gallery ? " gallery-product-body" : ""}`);
        const title = createElement("h4", `card-title fw-bold mb-1${gallery ? " gallery-product-title fs-5" : " fs-6"}`, product.name);
        const highlight = createElement("p", `item-sub text-info-emphasis fw-bold small mb-2${gallery ? " gallery-product-highlight" : ""}`, `${product.highlight || "Zebra Coffee"} · ${priceText(product.price)}`);
        const description = createElement("p", `card-text description text-secondary small mb-3${gallery ? " gallery-product-description" : ""}`, product.description);
        body.append(title, highlight, description);

        if (gallery && Array.isArray(product.options) && product.options.length) {
            const options = createElement("ul", "gallery-product-options small mb-3 text-start");
            product.options.forEach((option) => options.append(createElement("li", "mb-1", option)));
            body.append(options);
        }

        const price = createElement("p", "price fw-bold text-info fs-5 mt-auto mb-3", priceText(product.price));
        const isDrink = ["coffee", "cold_coffee", "tea"].includes(product.category);
        const button = createElement("button", "btn btn-primary fw-bold w-100 mt-auto", isDrink ? "Настроить и добавить" : "Добавить в корзину");
        button.type = "button";
        button.dataset.addToCart = "";
        button.dataset.productId = String(product.id);
        button.setAttribute("aria-label", isDrink
            ? `Настроить ${product.name}, ${priceText(product.price)}`
            : `Добавить в корзину: ${product.name}, ${priceText(product.price)}`);
        body.append(price, button);
        card.append(image, body);
        column.append(card);
        return column;
    }

    function filtered(list) {
        return selectedCategory === "all"
            ? list
            : list.filter((product) => product.category === selectedCategory);
    }

    function renderProductLists() {
        document.querySelectorAll("[data-product-list]").forEach((list) => {
            const kind = list.dataset.productList;
            let items;
            switch (kind) {
                case "featured":
                    items = products.filter((product) => product.featured);
                    break;
                case "seasonal":
                    items = products.filter((product) => product.seasonal);
                    break;
                case "all":
                default:
                    items = products;
                    break;
            }
            items = filtered(items);

            if (!items.length) {
                list.replaceChildren(createElement("p", "col-12 text-muted", "В этой категории пока нет позиций."));
                return;
            }

            const fragment = document.createDocumentFragment();
            items.forEach((product) => fragment.append(createProductCard(product, kind === "all")));
            list.replaceChildren(fragment);
        });
    }

    function renderCategoryFilters() {
        document.querySelectorAll("[data-category-filters]").forEach((container) => {
            const all = { id: "all", name: "Все товары", icon: "☕" };
            [all, ...categories].forEach((category) => {
                const input = createElement("input");
                input.type = "radio";
                input.className = "btn-check";
                input.name = `category-${container.id || "catalog"}`;
                input.id = `filter-${container.id || "catalog"}-${category.id}`;
                input.checked = category.id === "all";

                const label = createElement("label", "btn btn-outline-dark rounded-pill px-3 py-2 btn-chip", `${category.icon} ${category.name}`);
                label.htmlFor = input.id;
                input.addEventListener("change", () => {
                    selectedCategory = category.id;
                    renderProductLists();
                });
                container.append(input, label);
            });
        });
    }

    function getCartItem(product, quantity = 1, customizations = []) {
        const addOnTotal = customizations.reduce((sum, item) => sum + (item.price || 0), 0);
        return {
            productId: String(product.id),
            name: product.name,
            image: product.image,
            unitPrice: product.price + addOnTotal,
            quantity,
            customizations: customizations.map((item) => item.name)
        };
    }

    function addToCart(product, customizations = []) {
        const cart = getCart();
        const item = getCartItem(product, 1, customizations);
        const signature = JSON.stringify([item.productId, item.unitPrice, item.customizations]);
        const existing = cart.find((entry) => JSON.stringify([entry.productId, entry.unitPrice, entry.customizations || []]) === signature);
        if (existing) existing.quantity += 1;
        else cart.push(item);
        if (!writeStorage(CART_KEY, cart)) {
            window.alert("Браузер запретил сохранить корзину. Разрешите локальное хранилище и попробуйте ещё раз.");
            return false;
        }
        renderCart();
        window.dispatchEvent(new Event("zebra:notification"));
        return true;
    }

    function cartTotal(cart = getCart()) {
        return cart.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
    }

    function renderCart() {
        const tbody = document.querySelector("#cart-lines");
        if (!tbody) return;

        const cart = getCart();
        const table = document.querySelector("#cart-table");
        const empty = document.querySelector("#cart-empty");
        const total = cartTotal(cart);
        if (table) table.hidden = cart.length === 0;
        if (empty) empty.hidden = cart.length > 0;
        tbody.replaceChildren();

        cart.forEach((item) => {
            const product = productById(item.productId) || item;
            const row = createElement("tr");
            const productCell = createElement("td", "cart-product-cell");
            const productWrap = createElement("div", "d-flex align-items-center gap-3");
            const image = createElement("img", "cart-product-thumb rounded-3");
            image.src = imageUrl(product.image || productById(item.productId)?.image || "assets/logo.png");
            image.alt = product.name || item.name || "Товар";
            image.width = 56;
            image.height = 56;
            const name = createElement("strong", "", item.name || product.name);
            productWrap.append(image, name);
            productCell.append(productWrap);

            const optionsCell = createElement("td", "text-muted small", (item.customizations || []).join(" · ") || "Стандартная подача");
            const quantityCell = createElement("td", "cart-quantity", String(item.quantity));
            const priceCell = createElement("td", "cart-line-price fw-bold", priceText(item.unitPrice * item.quantity));
            row.append(productCell, optionsCell, quantityCell, priceCell);
            tbody.append(row);
        });

        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        document.querySelectorAll("[data-cart-subtotal], [data-cart-total], [data-cart-pay], [data-cart-checkout-submit]").forEach((element) => {
            if (element.matches("[data-cart-subtotal], [data-cart-total]")) element.textContent = priceText(total);
            if (element.matches("[data-cart-pay]")) {
                element.textContent = `Оформить заказ · ${priceText(total)}`;
                element.disabled = count === 0;
            }
            if (element.matches("[data-cart-checkout-submit]")) {
                element.textContent = `Подтвердить заказ · ${priceText(total)}`;
                element.disabled = count === 0;
            }
        });
        document.querySelectorAll("[data-cart-count]").forEach((element) => element.textContent = String(count));
    }

    function renderOrderHistory() {
        const target = document.querySelector("#order-history-list");
        if (!target) return;

        const orders = getOrders();
        target.replaceChildren();
        if (!orders.length) {
            const empty = createElement("div", "order-history-empty text-center p-4");
            empty.append(createElement("h3", "h5 fw-bold", "Заказов пока нет"));
            empty.append(createElement("p", "text-muted mb-3", "Выберите товары в меню — после оформления они появятся здесь с фотографиями."));
            const link = createElement("a", "btn btn-primary", "Открыть меню");
            link.href = "../gallery.html";
            empty.append(link);
            target.append(empty);
            return;
        }

        orders.forEach((order) => {
            const card = createElement("article", "order-history-card card mb-3 p-3 p-md-4");
            const heading = createElement("div", "order-history-heading d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3");
            const identity = createElement("div");
            identity.append(createElement("h3", "h5 fw-bold mb-1", `Заказ ${order.code}`));
            const time = createElement("time", "small text-muted", new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt)));
            time.dateTime = order.createdAt;
            identity.append(time);
            heading.append(identity, createElement("strong", "order-history-total", priceText(order.total)));
            card.append(heading);

            const list = createElement("ul", "order-history-items list-unstyled mb-0");
            (order.items || []).forEach((item) => {
                const product = productById(item.productId) || item;
                const line = createElement("li", "order-history-item d-flex align-items-center gap-3 py-2");
                const image = createElement("img", "order-history-image rounded-3");
                image.src = imageUrl(item.image || product.image || "assets/logo.png");
                image.alt = item.name || product.name || "Товар заказа";
                image.loading = "lazy";
                const details = createElement("div", "flex-grow-1");
                details.append(createElement("strong", "d-block", item.name || product.name));
                const extra = [...(item.customizations || []), `Количество: ${item.quantity}`].join(" · ");
                details.append(createElement("span", "small text-muted", extra));
                const lineTotal = createElement("strong", "order-history-line-total", priceText(item.unitPrice * item.quantity));
                line.append(image, details, lineTotal);
                list.append(line);
            });
            card.append(list);
            target.append(card);
        });
    }

    function saveOrder(form) {
        const cart = getCart();
        if (!cart.length) return false;

        const now = new Date();
        const code = `ZC-${String(now.getTime()).slice(-6)}`;
        const order = {
            code,
            createdAt: now.toISOString(),
            total: cartTotal(cart),
            paymentMethod: document.querySelector("#pay-method")?.value || "cash",
            pickupTime: document.querySelector("#pickup-time")?.value || "now",
            items: cart.map((item) => ({ ...item }))
        };
        const orders = getOrders();
        orders.unshift(order);
        if (!writeStorage(ORDERS_KEY, orders)) {
            window.alert("Не удалось сохранить заказ в этом браузере. Проверьте настройки хранилища.");
            return false;
        }
        writeStorage(CART_KEY, []);
        const destination = new URL("order/passed.html", scriptUrl);
        destination.searchParams.set("order", code);
        window.location.assign(destination.href);
        return true;
    }

    function renderConfirmation() {
        const codeTarget = document.querySelector("#order-number");
        if (!codeTarget) return;
        const code = new URLSearchParams(window.location.search).get("order");
        const order = getOrders().find((entry) => entry.code === code);
        if (!order) {
            codeTarget.textContent = "—";
            const message = document.querySelector("#order-message");
            if (message) message.textContent = "Откройте эту страницу после оформления заказа из корзины.";
            return;
        }
        codeTarget.textContent = order.code;
        const items = document.querySelector("#confirmation-products");
        if (items) {
            items.replaceChildren();
            order.items.forEach((item) => {
                const row = createElement("div", "d-flex align-items-center gap-3 py-2");
                const image = createElement("img", "order-history-image rounded-3");
                image.src = imageUrl(item.image);
                image.alt = item.name;
                row.append(image, createElement("span", "", `${item.name} × ${item.quantity}`));
                items.append(row);
            });
        }
    }

    function createBuilderModal() {
        const host = document.createElement("div");
        host.innerHTML = `
            <div class="modal fade" id="drinkBuilderModal" tabindex="-1" aria-labelledby="drinkBuilderTitle" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable drink-builder-dialog">
                    <div class="modal-content drink-builder-modal">
                        <div class="modal-header drink-builder-header">
                            <div>
                                <span class="drink-builder-eyebrow">ZEBRA COFFEE</span>
                                <h2 class="modal-title" id="drinkBuilderTitle" data-builder-title>Соберите свой напиток</h2>
                            </div>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
                        </div>
                        <div class="modal-body drink-builder-body">
                            <div data-builder-config>
                                <div class="drink-builder-layout">
                                    <div class="drink-builder-art" data-builder-art data-size="s">
                                        <img data-builder-image alt="" src="">
                                        <span class="drink-builder-volume" data-builder-volume></span>
                                    </div>
                                    <div class="drink-builder-controls">
                                        <div class="drink-builder-product-type" data-builder-category></div>
                                        <h3 class="drink-builder-product-name" data-builder-name></h3>
                                        <p class="drink-builder-description" data-builder-description></p>

                                        <fieldset class="builder-fieldset">
                                            <legend>Размер чашки</legend>
                                            <div class="builder-size-options" data-builder-sizes></div>
                                        </fieldset>

                                        <div class="builder-fieldset">
                                            <label id="builder-syrup-label">Сироп</label>
                                            <div class="dropdown builder-dropdown">
                                                <button class="builder-dropdown-toggle" id="builder-syrup-toggle" type="button" data-bs-toggle="dropdown" data-builder-dropdown-toggle aria-expanded="false" aria-labelledby="builder-syrup-label builder-syrup-current">
                                                    <span id="builder-syrup-current" data-builder-dropdown-label>Без сиропа</span>
                                                    <span class="builder-dropdown-chevron" aria-hidden="true"></span>
                                                </button>
                                                <div class="dropdown-menu builder-dropdown-menu" id="builder-syrup" data-builder-syrup data-builder-menu role="menu" aria-labelledby="builder-syrup-toggle"></div>
                                            </div>
                                        </div>
                                        <div class="builder-fieldset">
                                            <label id="builder-milk-label">Молоко</label>
                                            <div class="dropdown builder-dropdown">
                                                <button class="builder-dropdown-toggle" id="builder-milk-toggle" type="button" data-bs-toggle="dropdown" data-builder-dropdown-toggle aria-expanded="false" aria-labelledby="builder-milk-label builder-milk-current">
                                                    <span id="builder-milk-current" data-builder-dropdown-label></span>
                                                    <span class="builder-dropdown-chevron" aria-hidden="true"></span>
                                                </button>
                                                <div class="dropdown-menu builder-dropdown-menu" id="builder-milk" data-builder-milk data-builder-menu role="menu" aria-labelledby="builder-milk-toggle"></div>
                                            </div>
                                        </div>
                                        <fieldset class="builder-fieldset builder-extras-fieldset">
                                            <legend>Дополнительно</legend>
                                            <div class="builder-extra-options" data-builder-extras></div>
                                        </fieldset>
                                        <div class="builder-fieldset builder-note-fieldset">
                                            <label for="builder-note">Указания бариста</label>
                                            <textarea class="form-control" id="builder-note" data-builder-note rows="2" placeholder="Например: поменьше льда, без сахара"></textarea>
                                        </div>
                                        <div class="builder-price-row">
                                            <span>Итого за напиток</span>
                                            <strong data-builder-price></strong>
                                        </div>
                                        <button type="button" class="btn btn-primary drink-builder-add" data-builder-add>Добавить напиток</button>
                                    </div>
                                </div>
                            </div>

                            <section class="builder-upsell" data-builder-upsell hidden aria-live="polite">
                                <div class="builder-upsell-intro">
                                    <span class="builder-upsell-check" aria-hidden="true">✓</span>
                                    <div>
                                        <p class="drink-builder-eyebrow mb-1">ДОБАВЛЕНО В КОРЗИНУ</p>
                                        <h3 data-builder-success></h3>
                                        <p>К кофе отлично подойдут свежая выпечка и десерт.</p>
                                    </div>
                                </div>
                                <div class="builder-upsell-grid" data-builder-recommendations></div>
                                <div class="builder-upsell-actions">
                                    <button type="button" class="btn builder-neutral-button" data-bs-dismiss="modal">Продолжить выбор</button>
                                    <a class="btn builder-neutral-button" data-builder-cart-link>Перейти в корзину</a>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.append(host.firstElementChild);
        builderModalElement = document.querySelector("#drinkBuilderModal");
        builderModal = window.bootstrap?.Modal.getOrCreateInstance(builderModalElement);
        populateBuilderControls();

        builderModalElement.querySelectorAll("[data-builder-sizes] input, [data-builder-extras] input, [data-builder-note]").forEach((control) => {
            control.addEventListener("change", updateBuilderPrice);
            control.addEventListener("input", updateBuilderPrice);
        });
        builderModalElement.querySelectorAll("[data-builder-menu]").forEach((menu) => {
            menu.addEventListener("click", (event) => {
                const option = event.target.closest("[data-builder-option-id]");
                if (!option) return;
                setBuilderDropdown(menu, option.dataset.builderOptionId);
                const toggle = menu.closest(".builder-dropdown").querySelector("[data-builder-dropdown-toggle]");
                window.bootstrap?.Dropdown.getOrCreateInstance(toggle).hide();
                updateBuilderPrice();
            });
        });
        builderModalElement.querySelector("[data-builder-add]").addEventListener("click", addConfiguredDrink);
        builderModalElement.querySelector("[data-builder-recommendations]").addEventListener("click", addRecommendation);
        builderModalElement.addEventListener("hidden.bs.modal", resetBuilderView);
    }

    function populateBuilderControls() {
        const sizes = builderModalElement.querySelector("[data-builder-sizes]");
        sizes.replaceChildren();
        builderOptions.sizes.forEach((size, index) => {
            const label = createElement("label", "builder-size-option");
            const input = createElement("input");
            input.type = "radio";
            input.name = "builder-size";
            input.value = size.id;
            input.checked = index === 0;
            const content = createElement("span", "builder-size-content");
            content.append(createElement("strong", "", size.label));
            content.append(createElement("span", "", `${size.volume} мл`));
            content.append(createElement("small", "", size.price ? `+${priceText(size.price)}` : "Базовый"));
            label.append(input, content);
            sizes.append(label);
        });

        populateBuilderDropdown("[data-builder-syrup]", [
            { id: "", name: "Без сиропа", price: 0 },
            ...builderOptions.syrups
        ], "");
        populateBuilderDropdown("[data-builder-milk]", builderOptions.milks, builderOptions.milks[0]?.id || "");

        const extras = builderModalElement.querySelector("[data-builder-extras]");
        builderOptions.extras.forEach((extra) => {
            const label = createElement("label", "builder-extra-option");
            const input = createElement("input");
            input.type = "checkbox";
            input.value = extra.id;
            const name = createElement("span", "", extra.name);
            const price = createElement("strong", "", `+${priceText(extra.price)}`);
            label.append(input, name, price);
            extras.append(label);
        });
    }

    function populateBuilderDropdown(selector, options, selectedId) {
        const menu = builderModalElement.querySelector(selector);
        menu.replaceChildren();
        options.forEach((option) => {
            const label = option.price ? `${option.name} · +${priceText(option.price)}` : option.name;
            const button = createElement("button", "dropdown-item", label);
            button.type = "button";
            button.dataset.builderOptionId = String(option.id ?? "");
            button.setAttribute("role", "menuitemradio");
            button.setAttribute("aria-checked", "false");
            menu.append(button);
        });
        setBuilderDropdown(menu, selectedId);
    }

    function setBuilderDropdown(menu, optionId) {
        const options = [...menu.querySelectorAll("[data-builder-option-id]")];
        const selected = options.find((option) => option.dataset.builderOptionId === String(optionId)) || options[0];
        if (!selected) return;
        menu.dataset.value = selected.dataset.builderOptionId;
        menu.closest(".builder-dropdown").querySelector("[data-builder-dropdown-label]").textContent = selected.textContent;
        options.forEach((option) => {
            const isSelected = option === selected;
            option.classList.toggle("active", isSelected);
            option.setAttribute("aria-checked", String(isSelected));
        });
    }

    function builderSelection() {
        const sizeId = builderModalElement.querySelector("[name='builder-size']:checked")?.value;
        const size = builderOptions.sizes.find((item) => item.id === sizeId) || builderOptions.sizes[0];
        const syrupId = builderModalElement.querySelector("[data-builder-syrup]").dataset.value;
        const milkId = builderModalElement.querySelector("[data-builder-milk]").dataset.value;
        const syrup = builderOptions.syrups.find((item) => item.id === syrupId);
        const milk = builderOptions.milks.find((item) => item.id === milkId);
        const extras = [...builderModalElement.querySelectorAll("[data-builder-extras] input:checked")]
            .map((input) => builderOptions.extras.find((item) => item.id === input.value))
            .filter(Boolean);
        const customizations = [{ name: `Размер ${size.label} · ${size.volume} мл`, price: size.price }];
        if (syrup) customizations.push({ name: `Сироп: ${syrup.name}`, price: syrup.price });
        if (milk && milk.price) customizations.push({ name: milk.name, price: milk.price });
        extras.forEach((extra) => customizations.push({ name: extra.name, price: extra.price }));
        const note = builderModalElement.querySelector("[data-builder-note]").value.trim();
        if (note) customizations.push({ name: `Бариста: ${note}`, price: 0 });
        return { size, customizations };
    }

    function updateBuilderPrice() {
        if (!builderProduct) return;
        const { size } = builderSelection();
        const addOns = builderSelection().customizations.reduce((total, item) => total + item.price, 0);
        const image = builderModalElement.querySelector("[data-builder-image]");
        image.dataset.size = size.id;
        builderModalElement.querySelector("[data-builder-art]").dataset.size = size.id;
        builderModalElement.querySelector("[data-builder-volume]").textContent = `${size.label} · ${size.volume} мл`;
        builderModalElement.querySelector("[data-builder-price]").textContent = priceText(builderProduct.price + addOns);
        builderModalElement.querySelector("[data-builder-add]").textContent = `Добавить напиток · ${priceText(builderProduct.price + addOns)}`;
    }

    function showDrinkBuilder(product) {
        if (!builderModal) return;
        builderProduct = product;
        builderModalElement.querySelector("[data-builder-config]").hidden = false;
        builderModalElement.querySelector("[data-builder-upsell]").hidden = true;
        builderModalElement.querySelector("[data-builder-title]").textContent = "Соберите свой напиток";
        builderModalElement.querySelector("[data-builder-name]").textContent = product.name;
        builderModalElement.querySelector("[data-builder-description]").textContent = product.description;
        const category = categories.find((item) => item.id === product.category);
        builderModalElement.querySelector("[data-builder-category]").textContent = `${category?.icon || "☕"} ${category?.name || "Напиток"}`;
        const image = builderModalElement.querySelector("[data-builder-image]");
        image.src = imageUrl(product.image);
        image.alt = product.name;
        image.dataset.size = builderOptions.sizes[0]?.id || "s";
        builderModalElement.querySelector("[name='builder-size']").checked = true;
        setBuilderDropdown(builderModalElement.querySelector("[data-builder-syrup]"), "");
        setBuilderDropdown(builderModalElement.querySelector("[data-builder-milk]"), builderOptions.milks[0]?.id || "");
        builderModalElement.querySelectorAll("[data-builder-extras] input").forEach((input) => { input.checked = false; });
        builderModalElement.querySelector("[data-builder-note]").value = "";
        updateBuilderPrice();
        builderModal.show();
    }

    function addConfiguredDrink() {
        if (!builderProduct) return;
        const { customizations } = builderSelection();
        if (!addToCart(builderProduct, customizations)) return;

        builderModalElement.querySelector("[data-builder-config]").hidden = true;
        builderModalElement.querySelector("[data-builder-upsell]").hidden = false;
        builderModalElement.querySelector("[data-builder-title]").textContent = "Добавим что-нибудь к заказу?";
        builderModalElement.querySelector("[data-builder-success]").textContent = `${builderProduct.name} уже в корзине`;
        builderModalElement.querySelector("[data-builder-cart-link]").href = new URL("profile/cart.html", scriptUrl).href;
        renderRecommendations();
    }

    function renderRecommendations() {
        const target = builderModalElement.querySelector("[data-builder-recommendations]");
        target.replaceChildren();
        products.filter((product) => ["desserts", "bakery"].includes(product.category)).slice(0, 4).forEach((product) => {
            const card = createElement("article", "builder-recommendation");
            const image = createElement("img", "builder-recommendation-image");
            image.src = imageUrl(product.image);
            image.alt = product.name;
            image.loading = "lazy";
            const details = createElement("div", "builder-recommendation-details");
            details.append(createElement("strong", "", product.name));
            details.append(createElement("span", "", priceText(product.price)));
            const button = createElement("button", "btn builder-neutral-button builder-recommendation-add", "Добавить");
            button.type = "button";
            button.dataset.upsellId = String(product.id);
            button.setAttribute("aria-label", `Добавить ${product.name} в корзину`);
            card.append(image, details, button);
            target.append(card);
        });
    }

    function addRecommendation(event) {
        const button = event.target.closest("[data-upsell-id]");
        if (!button) return;
        const product = productById(button.dataset.upsellId);
        if (!product || !addToCart(product)) return;
        button.textContent = "Добавлено ✓";
        button.disabled = true;
        const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
        builderModalElement.querySelector("[data-builder-cart-link]").textContent = `В корзину · ${count} поз.`;
    }

    function resetBuilderView() {
        if (!builderModalElement) return;
        builderModalElement.querySelector("[data-builder-config]").hidden = false;
        builderModalElement.querySelector("[data-builder-upsell]").hidden = true;
        builderModalElement.querySelector("[data-builder-title]").textContent = "Соберите свой напиток";
        builderProduct = null;
    }

    function setupCheckoutSteps(paymentForm) {
        const steps = Array.from(paymentForm.querySelectorAll("[data-checkout-step]"));
        if (steps.length < 2) return;

        const progressItems = Array.from(paymentForm.querySelectorAll("[data-checkout-progress]"));
        const checkoutModal = document.querySelector("#paymentModal");
        const nameField = paymentForm.querySelector("#client-name");
        const emailField = paymentForm.querySelector("#client-email");
        const validationMessage = paymentForm.querySelector("[data-checkout-message]");
        let currentStep = 1;

        const checkoutErrors = () => {
            const name = nameField.value.trim();
            const email = emailField.value.trim();
            return [
                name ? "" : "Укажите имя для заказа.",
                !email ? "Укажите электронную почту для чека."
                    : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? ""
                        : "Введите корректный адрес электронной почты."
            ];
        };

        const validateCheckoutDetails = (focusInvalid = true) => {
            const errors = checkoutErrors();
            const fields = [nameField, emailField];
            fields.forEach((field, index) => field.setAttribute("aria-invalid", String(Boolean(errors[index]))));
            const invalidIndex = errors.findIndex(Boolean);
            if (invalidIndex !== -1) {
                validationMessage.textContent = errors[invalidIndex];
                validationMessage.hidden = false;
                if (focusInvalid) fields[invalidIndex].focus();
                return false;
            }
            validationMessage.textContent = "";
            validationMessage.hidden = true;
            return true;
        };

        [nameField, emailField].forEach((field) => {
            field.addEventListener("input", () => {
                if (!validationMessage.hidden) validateCheckoutDetails(false);
            });
        });

        const showStep = (step, focusHeading = true) => {
            currentStep = step;
            steps.forEach((panel) => {
                const isCurrent = Number(panel.dataset.checkoutStep) === step;
                panel.hidden = !isCurrent;
                panel.setAttribute("aria-hidden", String(!isCurrent));
            });
            progressItems.forEach((item) => {
                if (Number(item.dataset.checkoutProgress) === step) item.setAttribute("aria-current", "step");
                else item.removeAttribute("aria-current");
            });

            if (focusHeading) {
                const focusTarget = step === 1
                    ? paymentForm.querySelector("#client-name")
                    : paymentForm.querySelector("#checkout-review-title");
                focusTarget?.focus();
            }
        };

        const updateReview = () => {
            const cart = getCart();
            const setSummary = (selector, value) => {
                const target = paymentForm.querySelector(selector);
                if (target) target.textContent = value;
            };
            setSummary("[data-checkout-name]", paymentForm.querySelector("#client-name").value.trim());
            setSummary("[data-checkout-email]", paymentForm.querySelector("#client-email").value.trim());
            setSummary("[data-checkout-payment]", paymentForm.querySelector("#pay-method").selectedOptions[0]?.textContent.trim() || "—");
            setSummary("[data-checkout-pickup]", paymentForm.querySelector("#pickup-time").selectedOptions[0]?.textContent.trim() || "—");
            setSummary("[data-checkout-total]", priceText(cartTotal(cart)));

            const itemList = paymentForm.querySelector("[data-checkout-items]");
            itemList.replaceChildren();
            cart.forEach((item) => {
                const row = createElement("li", "checkout-review-item");
                const details = createElement("div", "checkout-review-item-details");
                const product = productById(item.productId) || item;
                details.append(createElement("strong", "", `${item.name || product.name} × ${item.quantity}`));
                if (item.customizations?.length) {
                    details.append(createElement("span", "", item.customizations.join(" · ")));
                }
                row.append(details, createElement("strong", "", priceText(item.unitPrice * item.quantity)));
                itemList.append(row);
            });
        };

        const nextButton = paymentForm.querySelector("[data-checkout-next]");
        const backButton = paymentForm.querySelector("[data-checkout-back]");
        nextButton?.addEventListener("click", () => {
            if (!validateCheckoutDetails()) return;
            updateReview();
            showStep(2);
        });
        backButton?.addEventListener("click", () => showStep(1));
        checkoutModal?.addEventListener("show.bs.modal", () => showStep(1, false));

        paymentForm.addEventListener("submit", (event) => {
            event.preventDefault();

            if (currentStep === 1) {
                if (!validateCheckoutDetails()) return;
                updateReview();
                showStep(2);
                return;
            }

            if (!validateCheckoutDetails(false)) {
                showStep(1);
                validateCheckoutDetails();
                return;
            }

            saveOrder(paymentForm);
        });
    }

    function wireInteractions() {
        document.addEventListener("click", (event) => {
            const button = event.target.closest("[data-add-to-cart]");
            if (!button) return;
            const product = productById(button.dataset.productId);
            if (!product) return;
            if (["coffee", "cold_coffee", "tea"].includes(product.category)) {
                showDrinkBuilder(product);
                return;
            }
            if (addToCart(product)) {
                const originalText = button.textContent;
                button.textContent = "Добавлено ✓";
                window.setTimeout(() => { button.textContent = originalText; }, 1300);
            }
        });

        document.addEventListener("input", (event) => {
            const note = event.target.closest("[data-builder-note]");
            if (note && note.value.length > 180) note.value = note.value.slice(0, 180);
        });

        const paymentForm = document.querySelector("#payment-form");
        if (paymentForm) setupCheckoutSteps(paymentForm);
    }

    async function initialize() {
        try {
            const data = await loadCatalog();
            products = data.goods;
            categories = data.categories;
            builderOptions = data.builderOptions || builderOptions;
            createBuilderModal();
            renderCategoryFilters();
            renderProductLists();
            renderCart();
            renderOrderHistory();
            renderConfirmation();
            wireInteractions();
        } catch (error) {
            console.error("Products could not be loaded from mock-data.json", error);
            showLoadError(error);
        }
    }

    document.addEventListener("DOMContentLoaded", initialize, { once: true });
})();
