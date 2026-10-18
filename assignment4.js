const themeRoot = document.documentElement;
let savedTheme = themeRoot.getAttribute("data-bs-theme") || "light";

try {
    savedTheme = window.localStorage.getItem("zebra-color-mode") || savedTheme;
} catch {
}

themeRoot.setAttribute("data-bs-theme", savedTheme);

document.addEventListener("DOMContentLoaded", () => {
    const themeButton = document.querySelector("[data-theme-toggle]");
    const accordionButtons = document.querySelectorAll("[data-accordion-trigger]");
    const authForm = document.querySelector("#auth-form");

    document.querySelectorAll("[data-footer-year]").forEach((year) => {
        year.textContent = String(new Date().getFullYear());
    });

    const footerClocks = document.querySelectorAll("[data-current-time]");
    const clockFormatter = new Intl.DateTimeFormat("ru-RU", {
        dateStyle: "long",
        timeStyle: "medium"
    });
    const updateFooterClock = () => {
        const now = new Date();
        footerClocks.forEach((clock) => {
            clock.dateTime = now.toISOString();
            clock.textContent = clockFormatter.format(now);
        });
    };
    if (footerClocks.length) {
        updateFooterClock();
        window.setInterval(updateFooterClock, 1000);
    }

    const subscriptionDialog = document.querySelector("[data-subscription-dialog]");
    if (subscriptionDialog) {
        const subscriptionForm = subscriptionDialog.querySelector("[data-subscription-form]");
        const subscriptionMessage = subscriptionDialog.querySelector("[data-subscription-message]");
        const openSubscription = document.querySelector("[data-open-subscription]");
        const closeSubscription = subscriptionDialog.querySelector("[data-close-subscription]");

        openSubscription?.addEventListener("click", () => {
            subscriptionDialog.showModal();
            subscriptionDialog.querySelector("input[type='email']")?.focus();
        });
        closeSubscription?.addEventListener("click", () => subscriptionDialog.close());
        subscriptionDialog.addEventListener("click", (event) => {
            if (event.target === subscriptionDialog) subscriptionDialog.close();
        });
        subscriptionForm?.addEventListener("submit", (event) => {
            event.preventDefault();
            if (!subscriptionForm.reportValidity()) return;
            subscriptionMessage.textContent = "Спасибо! Вы подписались на новости Zebra Coffee.";
            subscriptionMessage.hidden = false;
            subscriptionForm.reset();
        });
        subscriptionDialog.addEventListener("close", () => {
            if (!subscriptionMessage) return;
            subscriptionMessage.textContent = "";
            subscriptionMessage.hidden = true;
        });
    }

    if (themeButton) {
        let theme = themeRoot.getAttribute("data-bs-theme") || "light";
        const moonIcon = themeButton.querySelector('[data-theme-icon="moon"]');
        const sunIcon = themeButton.querySelector('[data-theme-icon="sun"]');
        const themeLabel = themeButton.querySelector("[data-theme-label]");

        const applyTheme = () => {
            themeRoot.setAttribute("data-bs-theme", theme);
            const label = theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему";
            themeButton.setAttribute("aria-label", label);
            themeButton.setAttribute("aria-pressed", String(theme === "dark"));
            if (!themeLabel) themeButton.setAttribute("title", label);
            if (themeLabel) themeLabel.textContent = theme === "dark" ? "Светлая" : "Тёмная";
            if (moonIcon && sunIcon) {
                moonIcon.toggleAttribute("hidden", theme === "dark");
                sunIcon.toggleAttribute("hidden", theme !== "dark");
            }
        };

        applyTheme();
        themeButton.addEventListener("click", () => {
            theme = theme === "dark" ? "light" : "dark";
            applyTheme();
            try {
                window.localStorage.setItem("zebra-color-mode", theme);
            } catch {
            }
        });
    }

    accordionButtons.forEach((button) => {
        const answer = document.getElementById(button.getAttribute("aria-controls"));
        const hasAccordionStyles = window.getComputedStyle(answer).display === "grid";

        if (!hasAccordionStyles) answer.hidden = button.getAttribute("aria-expanded") !== "true";

        button.addEventListener("click", () => {
            const isOpen = button.getAttribute("aria-expanded") === "true";
            button.setAttribute("aria-expanded", String(!isOpen));
            answer.setAttribute("aria-hidden", String(isOpen));
            answer.classList.toggle("is-open", !isOpen);
            if (!hasAccordionStyles) answer.hidden = isOpen;
        });
    });

    if (authForm) {
        const email = authForm.querySelector("#auth-email");
        const password = authForm.querySelector("#auth-password");
        const confirmation = authForm.querySelector("#auth-password-confirmation");
        const message = authForm.querySelector("[data-form-message]");

        const validateConfirmation = () => {
            confirmation.setCustomValidity(
                confirmation.value && confirmation.value !== password.value
                    ? "Пароли не совпадают."
                    : ""
            );
        };

        const validatePasswordLength = () => {
            password.setCustomValidity(
                password.value && password.value.length < 8
                    ? "Пароль должен содержать не менее 8 символов."
                    : ""
            );
            validateConfirmation();
        };

        password.addEventListener("input", validatePasswordLength);
        confirmation.addEventListener("input", validatePasswordLength);
        [email, password, confirmation].forEach((field) => {
            field.addEventListener("input", () => field.removeAttribute("aria-invalid"));
        });

        authForm.addEventListener("submit", (event) => {
            event.preventDefault();
            validatePasswordLength();
            const invalidFields = [email, password, confirmation].filter((field) => !field.checkValidity());

            [email, password, confirmation].forEach((field) => {
                field.setAttribute("aria-invalid", String(!field.checkValidity()));
            });

            if (invalidFields.length) {
                message.classList.remove("is-success");
                message.textContent = invalidFields.map((field) => field.validationMessage).join(" ");
                invalidFields[0].focus();
                return;
            }

            message.classList.add("is-success");
            message.textContent = "Проверка пройдена. Форма заполнена корректно.";
            authForm.reset();
        });
    }
});
