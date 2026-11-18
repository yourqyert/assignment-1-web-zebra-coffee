$(document).ready(function () {
    console.log("jQuery is ready!");
    const isValidSubscriptionEmail = (value) => {
        const parts = value.split("@");
        if (parts.length !== 2) return false;

        const [localPart, domain] = parts;
        const localPartPattern = /^[A-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Z0-9!#$%&'*+/=?^_`{|}~-]+)*$/i;
        const domainLabelPattern = /^[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?$/i;
        const domainLabels = domain.split(".");
        const topLevelDomain = domainLabels[domainLabels.length - 1] || "";

        return localPartPattern.test(localPart)
            && domainLabels.length >= 2
            && topLevelDomain.length >= 2
            && domainLabels.every((label) => label.length <= 63 && domainLabelPattern.test(label));
    };

    const $window = $(window);
    const $menuSearch = $("#menu-search");
    const $suggestions = $("#menu-suggestions");
    const $toast = $("[data-site-toast]");
    let toastTimer;
    let countersStarted = false;
    let suggestionsOpen = false;
    const autoOpenedFaqs = new Set();

    function escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function showToast(message) {
        if (!$toast.length) return;
        window.clearTimeout(toastTimer);
        $toast.stop(true, true).text(message).addClass("is-visible").attr("aria-hidden", "false");
        toastTimer = window.setTimeout(function () {
            $toast.fadeOut(220, function () {
                $toast.removeClass("is-visible").css("display", "").attr("aria-hidden", "true");
            });
        }, 2200);
    }

    function loadVisibleImages() {
        const viewportBottom = $window.scrollTop() + $window.height() + 180;
        $("img[data-lazy-src]").each(function () {
            const $image = $(this);
            if (!$image.is(":visible")) return;
            const position = $image.offset();
            if (!position || position.top > viewportBottom) return;

            const source = $image.attr("data-lazy-src");
            $image.removeAttr("data-lazy-src");
            $image.one("load", function () { $image.addClass("is-loaded"); });
            $image.one("error", function () { $image.addClass("is-loaded"); });
            $image.attr("src", source);
        });
    }

    function getProductCards() {
        return $("[data-product-list] .product-card");
    }

    function closeSuggestions(returnFocus) {
        suggestionsOpen = false;
        $suggestions.prop("hidden", true).children().attr("aria-selected", "false");
        $menuSearch.attr("aria-expanded", "false");
        if (returnFocus) $menuSearch.trigger("focus");
    }

    function chooseSuggestion($option) {
        if (!$option || !$option.length) return;
        $menuSearch.val($option.text()).trigger("input");
        closeSuggestions(true);
    }

    function focusSuggestion(index) {
        const $options = $suggestions.children('[role="option"]');
        if (!$options.length) return;
        const safeIndex = (index + $options.length) % $options.length;
        $options.attr("aria-selected", "false").eq(safeIndex).attr("aria-selected", "true").trigger("focus");
    }

    function updateMenuSearch() {
        const query = ($menuSearch.val() || "").trim().toLocaleLowerCase("ru");
            const matchedNames = [];
        let visibleCount = 0;

        getProductCards().each(function () {
            const $card = $(this);
            const searchableText = $card.text().toLocaleLowerCase("ru");
            const name = $card.find("h4, h3").first().text().trim();
            const isMatch = !query || searchableText.includes(query);
            $card.parent().toggleClass("d-none", !isMatch);
            if (isMatch) {
                visibleCount += 1;
                if (name && !matchedNames.some((matchedName) => matchedName.toLocaleLowerCase("ru") === name.toLocaleLowerCase("ru"))) {
                    matchedNames.push(name);
                }
            }
        });

        if ($menuSearch.length) {
            $("#menu-search-status").text(query
                ? `Найдено позиций: ${visibleCount}`
                : `В меню ${visibleCount} позиций`);
            $suggestions.empty();
            matchedNames.slice(0, 5).forEach(function (name) {
                $("<li>").attr({ role: "option", tabindex: "-1", "aria-selected": "false" }).text(name).appendTo($suggestions);
            });
            const shouldOpen = Boolean(query && matchedNames.length && suggestionsOpen);
            $suggestions.prop("hidden", !shouldOpen);
            $menuSearch.attr("aria-expanded", String(shouldOpen));
            if (query && visibleCount === 0) $("#menu-search-status").text("Ничего не найдено. Попробуйте другой запрос.");
        }

        loadVisibleImages();
    }

    function highlightFaq(query) {
        const $faqText = $(".faq-question-text, .faq-answer p");
        $faqText.find(".jquery-search-match").each(function () {
            $(this).replaceWith(document.createTextNode($(this).text()));
        });

        const cleanQuery = query.trim();
        if (!cleanQuery) return;
        const pattern = new RegExp("(" + escapeRegExp(cleanQuery) + ")", "ig");
        $faqText.each(function () {
            const text = $(this).text();
            if (!pattern.test(text)) {
                pattern.lastIndex = 0;
                return;
            }
            pattern.lastIndex = 0;
            $(this).html(text.replace(pattern, '<mark class="jquery-search-match">$1</mark>'));
            pattern.lastIndex = 0;
        });
    }

    function updateFaqAutoOpen(query) {
        const cleanQuery = (query || "").trim().toLocaleLowerCase("ru");

        $(".faq-item").each(function () {
            const $item = $(this);
            const button = $item.find("[data-accordion-trigger]")[0];
            const answerText = $item.find(".faq-answer").text().toLocaleLowerCase("ru");
            const shouldOpen = Boolean(cleanQuery && answerText.includes(cleanQuery));
            const isOpen = button.getAttribute("aria-expanded") === "true";

            if (shouldOpen && !isOpen) {
                button.click();
                autoOpenedFaqs.add(button);
            } else if (!shouldOpen && autoOpenedFaqs.has(button)) {
                if (isOpen) button.click();
                autoOpenedFaqs.delete(button);
            }
        });
    }

    function updateScrollProgress() {
        const scrollableHeight = document.documentElement.scrollHeight - $window.height();
        const progress = scrollableHeight > 0 ? Math.min(100, ($window.scrollTop() / scrollableHeight) * 100) : 0;
        $("[data-scroll-progress]").css("width", progress + "%");
    }

    function startCountersWhenVisible() {
        if (countersStarted) return;
        const $visibleCounters = $("[data-count-to]").filter(function () {
            return $(this).offset().top < $window.scrollTop() + $window.height();
        });
        if (!$visibleCounters.length) return;
        countersStarted = true;
        $visibleCounters.each(function () {
            const $counter = $(this);
            const target = Number($counter.attr("data-count-to"));
            $({ value: 0 }).animate({ value: target }, {
                duration: 1100,
                easing: "swing",
                step: function () { $counter.text(Math.floor(this.value)); },
                complete: function () { $counter.text(target); }
            });
        });
    }

    $menuSearch.on("input", function () {
        suggestionsOpen = true;
        updateMenuSearch();
    });
    $menuSearch.on("keydown", function (event) {
        const $options = $suggestions.children('[role="option"]');
        if (event.key === "ArrowDown" && $options.length) {
            event.preventDefault();
            suggestionsOpen = true;
            $suggestions.prop("hidden", false);
            focusSuggestion(0);
        } else if (event.key === "ArrowUp" && $options.length) {
            event.preventDefault();
            suggestionsOpen = true;
            $suggestions.prop("hidden", false);
            focusSuggestion($options.length - 1);
        } else if (event.key === "Enter" && !$suggestions.prop("hidden") && $options.length) {
            event.preventDefault();
            chooseSuggestion($options.first());
        } else if (event.key === "Escape") {
            if (!$suggestions.prop("hidden")) event.preventDefault();
            closeSuggestions(false);
        }
    });
    $suggestions.on("click", '[role="option"]', function () {
        chooseSuggestion($(this));
    });
    $suggestions.on("keydown", '[role="option"]', function (event) {
        const $options = $suggestions.children('[role="option"]');
        const index = $options.index(this);
        if (event.key === "ArrowDown") {
            event.preventDefault();
            focusSuggestion(index + 1);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            if (index === 0) $menuSearch.trigger("focus");
            else focusSuggestion(index - 1);
        } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            chooseSuggestion($(this));
        } else if (event.key === "Escape") {
            event.preventDefault();
            closeSuggestions(true);
        }
    });
    $(document).on("click", function (event) {
        if (!$(event.target).closest(".menu-search-panel").length) closeSuggestions(false);
    });
    $("[data-category-filters]").on("change", "input[type='radio']", function () {
        closeSuggestions(false);
    });

    $("#faq-search").on("input", function () {
        const query = $(this).val();
        highlightFaq(query);
        updateFaqAutoOpen(query);
    });

    $window.on("scroll", function () {
        updateScrollProgress();
        loadVisibleImages();
        startCountersWhenVisible();
    });
    $window.on("resize", updateScrollProgress);
    updateScrollProgress();
    startCountersWhenVisible();

    const productLists = document.querySelectorAll("[data-product-list]");
    if (productLists.length) {
        const productObserver = new MutationObserver(function () {
            updateMenuSearch();
            loadVisibleImages();
            updateScrollProgress();
        });
        productLists.forEach(function (list) {
            productObserver.observe(list, { childList: true, subtree: true });
        });
    }
    updateMenuSearch();
    loadVisibleImages();

    window.addEventListener("zebra:cart-added", function (event) {
        showToast((event.detail?.name || "Позиция") + " добавлен в корзину");
    });
    window.addEventListener("zebra:notification", function () {
        if (!$toast.text().trim()) showToast("Корзина обновлена");
    });
    window.addEventListener("zebra:subscription-success", function () {
        showToast("Вы успешно подписались на новости Zebra Coffee");
    });

    $("[data-subscription-form]").on("submit", function (event) {
        event.preventDefault();
        const $form = $(this);
        const $email = $form.find("[name='email']");
        const email = $email.val().replace(/\s/g, "").trim();
        $email.val(email);
        const isValidEmail = isValidSubscriptionEmail(email);
        const $message = $form.find("[data-subscription-message]");
        const $button = $form.find(".subscription-submit");
        const $label = $form.find("[data-subscription-submit-label]");
        if ($button.hasClass("is-loading")) return;
        if (!isValidEmail) {
            $email.attr("aria-invalid", "true");
            $button.prop("disabled", true);
            $message.removeClass("is-success is-demo").addClass("is-error").text(email
                ? "Введите корректный адрес электронной почты."
                : "Укажите электронную почту для подписки.").prop("hidden", false);
            $email.trigger("focus");
            return;
        }
        if ($button.prop("disabled")) return;

        $button.prop("disabled", true).addClass("is-loading");
        $email.prop("readonly", true);
        $label.text("Подождите…");
        $message.removeClass("is-success is-demo is-error").text("Отправляем запрос…").prop("hidden", false);

        window.setTimeout(function () {
            $button.removeClass("is-loading");
            $email.prop("readonly", false);
            $label.text("Подписаться");
            if (!isValidEmail) {
                $email.attr("aria-invalid", "true").trigger("focus");
                $message.removeClass("is-success is-demo").addClass("is-error").text("Введите корректный адрес электронной почты.").prop("hidden", false);
                return;
            }

            $email.removeAttr("aria-invalid");
            $message.text("Спасибо! Вы успешно подписались на новости Zebra Coffee.").removeClass("is-demo is-error").addClass("is-success").prop("hidden", false);
            $form[0].reset();
            $button.prop("disabled", true);
            $email.removeAttr("aria-invalid");
            const dialog = $form.closest("dialog")[0];
            if (dialog?.open) dialog.close();
            window.dispatchEvent(new CustomEvent("zebra:subscription-success"));
        }, 1200);
    });
});
