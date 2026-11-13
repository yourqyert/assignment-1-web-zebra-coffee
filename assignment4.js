const themeRoot = document.documentElement;
let savedTheme = themeRoot.getAttribute("data-bs-theme") || "light";

try {
    savedTheme = window.localStorage.getItem("zebra-color-mode") || savedTheme;
} catch {
}

themeRoot.setAttribute("data-bs-theme", savedTheme);

let savedBackgroundHue = null;
try {
    const storedHue = window.localStorage.getItem("zebra-random-background");
    if (storedHue !== null && Number.isInteger(Number(storedHue)) && Number(storedHue) >= 0 && Number(storedHue) <= 359) {
        savedBackgroundHue = Number(storedHue);
    }
} catch {
}

if (savedBackgroundHue !== null) {
    themeRoot.style.setProperty("--zebra-random-hue", String(savedBackgroundHue));
    themeRoot.setAttribute("data-random-background", "true");
}

document.addEventListener("DOMContentLoaded", () => {
    const stripWhitespace = (value) => value.replace(/\s/g, "");
    let navAudioContext = null;

    const playNavSound = async () => {
        const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextConstructor) return;

        try {
            navAudioContext ||= new AudioContextConstructor();
            if (navAudioContext.state === "suspended") await navAudioContext.resume();

            const oscillator = navAudioContext.createOscillator();
            const volume = navAudioContext.createGain();
            const now = navAudioContext.currentTime;
            oscillator.type = "triangle";
            oscillator.frequency.setValueAtTime(880, now);
            oscillator.frequency.exponentialRampToValueAtTime(660, now + 0.09);
            volume.gain.setValueAtTime(0.0001, now);
            volume.gain.exponentialRampToValueAtTime(0.12, now + 0.008);
            volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
            oscillator.connect(volume);
            volume.connect(navAudioContext.destination);
            oscillator.start(now);
            oscillator.stop(now + 0.12);
        } catch {
        }
    };

    document.addEventListener("input", (event) => {
        const field = event.target;
        if (!(field instanceof HTMLInputElement) || !field.hasAttribute("data-no-whitespace")) return;

        const originalValue = field.value;
        const normalizedValue = stripWhitespace(originalValue);
        if (normalizedValue === originalValue) return;

        const selectionStart = field.selectionStart;
        const selectionEnd = field.selectionEnd;
        field.value = normalizedValue;

        if (selectionStart !== null && selectionEnd !== null) {
            const cleanStart = stripWhitespace(originalValue.slice(0, selectionStart)).length;
            const cleanEnd = stripWhitespace(originalValue.slice(0, selectionEnd)).length;
            field.setSelectionRange(cleanStart, cleanEnd);
        }
    });

    document.addEventListener("keydown", (event) => {
        const directions = {
            ArrowRight: 1,
            ArrowDown: 1,
            ArrowLeft: -1,
            ArrowUp: -1
        };
        const direction = directions[event.key];
        if (!direction || event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return;

        const activeElement = document.activeElement;
        const isPageUnfocused = !activeElement
            || activeElement === document.body
            || activeElement === document.documentElement;
        const nav = document.querySelector(".nav-menu");
        if (!nav || (!isPageUnfocused && !nav.contains(activeElement))) return;

        const navItems = Array.from(nav.querySelectorAll(
            ".header-nav-icon-link, [data-theme-toggle], [data-background-random]"
        )).filter((item) => {
            const style = window.getComputedStyle(item);
            return !item.disabled
                && item.getClientRects().length > 0
                && style.visibility !== "hidden"
                && style.display !== "none";
        });
        if (!navItems.length) return;

        const focusedIndex = navItems.indexOf(activeElement);
        const activePageIndex = navItems.findIndex((item) => item.matches(".header-nav-icon-link.active"));
        const currentIndex = focusedIndex !== -1 ? focusedIndex : activePageIndex;
        const nextIndex = currentIndex === -1
            ? direction > 0 ? 0 : navItems.length - 1
            : (currentIndex + direction + navItems.length) % navItems.length;

        event.preventDefault();
        navItems[nextIndex].focus({ preventScroll: true });
        playNavSound();
    });

    const themeButton = document.querySelector("[data-theme-toggle]");
    const backgroundButton = document.querySelector("[data-background-random]");
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
        const subscriptionEmail = subscriptionForm?.querySelector("[name='email']");
        const subscriptionButton = subscriptionForm?.querySelector(".subscription-submit");
        const openSubscription = document.querySelector("[data-open-subscription]");
        const closeSubscription = subscriptionDialog.querySelector("[data-close-subscription]");
        let subscriptionWasInteractedWith = false;

        const updateSubscriptionButton = (showError = subscriptionWasInteractedWith) => {
            if (!subscriptionEmail || !subscriptionButton) return false;
            const normalizedEmail = stripWhitespace(subscriptionEmail.value).trim();
            const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail);
            const isLoading = subscriptionButton.classList.contains("is-loading");
            subscriptionButton.disabled = !isValid || isLoading;

            if (isValid) {
                subscriptionEmail.removeAttribute("aria-invalid");
                if (!isLoading && subscriptionMessage?.classList.contains("is-error")) {
                    subscriptionMessage.textContent = "";
                    subscriptionMessage.classList.remove("is-error");
                    subscriptionMessage.hidden = true;
                }
            } else if (showError && !isLoading && subscriptionMessage) {
                subscriptionEmail.setAttribute("aria-invalid", "true");
                subscriptionMessage.classList.remove("is-success", "is-demo");
                subscriptionMessage.classList.add("is-error");
                subscriptionMessage.textContent = normalizedEmail
                    ? "Введите корректный адрес электронной почты."
                    : "Укажите электронную почту для подписки.";
                subscriptionMessage.hidden = false;
            }

            return isValid;
        };
        updateSubscriptionButton(false);
        subscriptionEmail?.addEventListener("input", () => {
            subscriptionWasInteractedWith = true;
            updateSubscriptionButton(true);
        });
        subscriptionEmail?.addEventListener("blur", () => {
            subscriptionWasInteractedWith = true;
            updateSubscriptionButton(true);
        });

        openSubscription?.addEventListener("click", () => {
            subscriptionDialog.showModal();
            subscriptionDialog.querySelector("[name='email']")?.focus();
        });
        closeSubscription?.addEventListener("click", () => subscriptionDialog.close());
        subscriptionDialog.addEventListener("click", (event) => {
            if (event.target === subscriptionDialog) subscriptionDialog.close();
        });
        if (subscriptionForm && !(window.jQuery && subscriptionForm.hasAttribute("data-jquery-submit"))) {
            subscriptionForm.addEventListener("submit", (event) => {
                event.preventDefault();
                const email = subscriptionEmail;
                const submitButton = subscriptionButton;
                const submitLabel = subscriptionForm.querySelector("[data-subscription-submit-label]");
                if (submitButton.disabled || submitButton.classList.contains("is-loading")) return;

                email.value = stripWhitespace(email.value).trim();
                subscriptionWasInteractedWith = true;
                if (!updateSubscriptionButton(true)) {
                    email.focus();
                    return;
                }
                submitButton.disabled = true;
                submitButton.classList.add("is-loading");
                email.readOnly = true;
                submitLabel.textContent = "Подождите…";
                subscriptionMessage.classList.remove("is-success", "is-demo", "is-error");
                subscriptionMessage.textContent = "Отправляем запрос…";
                subscriptionMessage.hidden = false;

                window.setTimeout(() => {
                    submitButton.disabled = false;
                    submitButton.classList.remove("is-loading");
                    email.readOnly = false;
                    submitLabel.textContent = "Подписаться";
                    subscriptionMessage.textContent = "Спасибо! Вы успешно подписались на новости Zebra Coffee.";
                    subscriptionMessage.classList.remove("is-demo", "is-error");
                    subscriptionMessage.classList.add("is-success");
                    subscriptionForm.reset();
                    subscriptionWasInteractedWith = false;
                    updateSubscriptionButton();
                    if (subscriptionDialog.open) subscriptionDialog.close();
                    window.dispatchEvent(new CustomEvent("zebra:subscription-success"));
                }, 1200);
            });
        }
        subscriptionDialog.addEventListener("close", () => {
            if (!subscriptionMessage) return;
            subscriptionEmail?.removeAttribute("aria-invalid");
            if (subscriptionEmail) subscriptionEmail.readOnly = false;
            subscriptionWasInteractedWith = false;
            subscriptionMessage.textContent = "";
            subscriptionMessage.classList.remove("is-success", "is-demo", "is-error");
            subscriptionMessage.hidden = true;
            updateSubscriptionButton();
        });
    }

    if (backgroundButton) {
        backgroundButton.addEventListener("click", () => {
            const storedHue = themeRoot.style.getPropertyValue("--zebra-random-hue");
            const currentHue = storedHue ? Number(storedHue) : null;
            const nextHue = currentHue === null
                ? Math.floor(Math.random() * 360)
                : (currentHue + 60 + Math.floor(Math.random() * 241)) % 360;
            themeRoot.style.setProperty("--zebra-random-hue", String(nextHue));
            themeRoot.setAttribute("data-random-background", "true");
            try {
                window.localStorage.setItem("zebra-random-background", String(nextHue));
            } catch {
            }
            backgroundButton.setAttribute("aria-label", "Цвет фона изменён. Сменить ещё раз");
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

    const navigationMenu = document.querySelector("#main-header .nav-menu");
    navigationMenu?.addEventListener("keydown", (event) => {
        const currentItem = event.target.closest(".header-nav-icon-link, .header-theme-toggle, .header-background-toggle");
        if (!currentItem) return;

        const items = Array.from(navigationMenu.querySelectorAll(".header-nav-icon-link, .header-theme-toggle, .header-background-toggle"))
            .filter((item) => item.getClientRects().length > 0 && !item.disabled);
        const currentIndex = items.indexOf(currentItem);
        if (currentIndex === -1) return;

        let nextIndex = currentIndex;
        switch (event.key) {
            case "ArrowRight":
            case "ArrowDown":
                nextIndex = (currentIndex + 1) % items.length;
                break;
            case "ArrowLeft":
            case "ArrowUp":
                nextIndex = (currentIndex - 1 + items.length) % items.length;
                break;
            case "Home":
                nextIndex = 0;
                break;
            case "End":
                nextIndex = items.length - 1;
                break;
            default:
                return;
        }

        event.preventDefault();
        items[nextIndex]?.focus();
        if (event.key.startsWith("Arrow")) playNavSound();
    });

    let soundsEnabled = false;
    try {
        soundsEnabled = window.localStorage.getItem("zebra-sounds-enabled") === "true";
    } catch {
    }

    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    let audioContext = null;
    let activeOscillator = null;
    const playNotificationSound = () => {
        if (!soundsEnabled || !AudioContextConstructor) return;

        try {
            audioContext ||= new AudioContextConstructor();
            if (audioContext.state === "suspended") void audioContext.resume();

            if (activeOscillator) {
                try {
                    activeOscillator.stop();
                } catch {
                }
            }

            const now = audioContext.currentTime;
            const oscillator = audioContext.createOscillator();
            const volume = audioContext.createGain();
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(587.33, now);
            oscillator.frequency.setValueAtTime(783.99, now + 0.1);
            volume.gain.setValueAtTime(0.0001, now);
            volume.gain.exponentialRampToValueAtTime(0.045, now + 0.02);
            volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
            oscillator.connect(volume);
            volume.connect(audioContext.destination);
            oscillator.start(now);
            oscillator.stop(now + 0.33);
            activeOscillator = oscillator;
            oscillator.addEventListener("ended", () => {
                if (activeOscillator === oscillator) activeOscillator = null;
            }, { once: true });
        } catch (error) {
            console.warn("Не удалось воспроизвести звуковое уведомление.", error);
        }
    };

    window.addEventListener("zebra:notification", playNotificationSound);

    const soundButton = document.querySelector("[data-sound-toggle]");
    if (soundButton) {
        const updateSoundButton = () => {
            soundButton.setAttribute("aria-pressed", String(soundsEnabled));
            soundButton.textContent = soundsEnabled ? "Звук включён" : "Звук выключен";
        };

        if (!AudioContextConstructor) {
            soundButton.disabled = true;
            soundButton.textContent = "Звук недоступен";
        } else {
            updateSoundButton();
            soundButton.addEventListener("click", () => {
                soundsEnabled = !soundsEnabled;
                updateSoundButton();
                try {
                    window.localStorage.setItem("zebra-sounds-enabled", String(soundsEnabled));
                } catch {
                }
                if (soundsEnabled) playNotificationSound();
            });
        }
    }

    const ratingPanel = document.querySelector("[data-menu-rating]");
    if (ratingPanel) {
        const stars = Array.from(ratingPanel.querySelectorAll("[data-rating-star]"));
        const ratingMessage = ratingPanel.querySelector("[data-rating-message]");
        let rating = 0;
        try {
            rating = Number(window.localStorage.getItem("zebra-menu-rating")) || 0;
        } catch {
        }

        const updateRating = () => {
            for (let index = 0; index < stars.length; index += 1) {
                const star = stars[index];
                const value = Number(star.dataset.ratingStar);
                const selected = value <= rating;
                star.classList.toggle("is-selected", selected);
                star.setAttribute("aria-checked", String(value === rating));
                star.tabIndex = value === rating || (!rating && value === 1) ? 0 : -1;
            }
            ratingMessage.textContent = rating
                ? `Вы оценили меню на ${rating} из 5. Спасибо!`
                : "Пока без оценок — оставьте первую.";
        };

        const selectRating = (value) => {
            if (!Number.isInteger(value) || value < 1 || value > stars.length) return;
            rating = value;
            updateRating();
            try {
                window.localStorage.setItem("zebra-menu-rating", String(rating));
            } catch {
            }
            window.dispatchEvent(new Event("zebra:notification"));
        };

        stars.forEach((star, index) => {
            star.addEventListener("click", () => selectRating(Number(star.dataset.ratingStar)));
            star.addEventListener("keydown", (event) => {
                let nextIndex = index;
                switch (event.key) {
                    case "ArrowRight":
                    case "ArrowUp":
                        nextIndex = (index + 1) % stars.length;
                        break;
                    case "ArrowLeft":
                    case "ArrowDown":
                        nextIndex = (index - 1 + stars.length) % stars.length;
                        break;
                    case "Home":
                        nextIndex = 0;
                        break;
                    case "End":
                        nextIndex = stars.length - 1;
                        break;
                    default:
                        return;
                }

                event.preventDefault();
                stars[nextIndex].focus();
                selectRating(Number(stars[nextIndex].dataset.ratingStar));
            });
        });

        updateRating();
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
        const name = authForm.querySelector("#auth-name");
        const email = authForm.querySelector("#auth-email");
        const phone = authForm.querySelector("#auth-phone");
        const password = authForm.querySelector("#auth-password");
        const confirmation = authForm.querySelector("#auth-password-confirmation");
        const message = authForm.querySelector("[data-form-message]");
        const title = document.querySelector("[data-auth-title]");
        const subtitle = document.querySelector("[data-auth-subtitle]");
        const submit = authForm.querySelector("[data-auth-submit]");
        const switches = document.querySelectorAll("[data-auth-switch]");
        const signupFields = authForm.querySelectorAll("[data-signup-only]");

        const setMode = (mode) => {
            const signup = mode === "signup";
            authForm.dataset.authMode = mode;
            signupFields.forEach((field) => { field.hidden = !signup; });
            if (confirmation) confirmation.autocomplete = signup ? "new-password" : "off";
            if (password) password.autocomplete = signup ? "new-password" : "current-password";
            title.textContent = signup ? "Создайте аккаунт" : "Войдите в аккаунт";
            subtitle.textContent = signup ? "Зарегистрируйтесь, чтобы видеть данные профиля и оформлять заказы." : "Введите данные, указанные при регистрации.";
            submit.textContent = signup ? "Зарегистрироваться" : "Войти";
            switches.forEach((button) => {
                const active = button.dataset.authSwitch === mode;
                button.setAttribute("aria-pressed", String(active));
                button.classList.toggle("btn-info", active);
                button.classList.toggle("text-white", active);
                button.classList.toggle("btn-outline-secondary", !active);
            });
            message.textContent = "";
            message.classList.remove("is-success");
            [name, email, phone, password, confirmation].filter(Boolean).forEach((field) => field.removeAttribute("aria-invalid"));
        };

        switches.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.authSwitch)));

        const validateRegistration = () => {
            const signup = authForm.dataset.authMode === "signup";
            const fields = signup ? [name, email, phone, password, confirmation] : [email, password];
            const values = fields.map((field) => stripWhitespace(field.value));
            fields.forEach((field, index) => {
                field.value = values[index];
            });
            const passwordError = !values[signup ? 3 : 1]
                ? "Введите пароль."
                : !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(values[signup ? 3 : 1])
                    ? "Пароль: минимум 8 символов, заглавная и строчная буквы и цифра."
                    : "";
            const errors = signup ? [
                !values[0] ? "Укажите имя." : "",
                !values[1] ? "Укажите электронную почту." : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values[1]) ? "Введите корректный адрес электронной почты." : "",
                !values[2] ? "Укажите номер телефона." : !/^\+?\d[\d\s()-]{8,17}$/.test(values[2]) ? "Введите телефон в формате +7 700 123 45 67." : "",
                passwordError,
                !values[4] ? "Повторите пароль." : values[4] !== values[3] ? "Пароли не совпадают." : ""
            ] : [
                !values[0] ? "Укажите электронную почту." : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values[0]) ? "Введите корректный адрес электронной почты." : "",
                passwordError
            ];
            fields.forEach((field, index) => {
                field.setAttribute("aria-invalid", String(Boolean(errors[index])));
            });
            return { errors, fields, values, signup };
        };

        [name, email, phone, password, confirmation].filter(Boolean).forEach((field) => {
            field.addEventListener("input", () => {
                field.removeAttribute("aria-invalid");
                message.textContent = "";
                message.classList.remove("is-success");
            });
        });

        authForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const { errors, fields, values, signup } = validateRegistration();
            const firstInvalidIndex = errors.findIndex(Boolean);

            if (firstInvalidIndex !== -1) {
                message.classList.remove("is-success");
                message.textContent = errors[firstInvalidIndex];
                fields[firstInvalidIndex].focus();
                return;
            }

            let user;
            try { user = JSON.parse(window.localStorage.getItem("zebra-user") || "null"); } catch { user = null; }
            if (signup) {
                if (user && user.email.toLowerCase() === values[1].toLowerCase()) {
                    setMode("login");
                    email.value = values[1];
                    message.textContent = "Этот email уже зарегистрирован. Войдите в аккаунт.";
                    return;
                }
                user = { name: values[0], email: values[1], phone: values[2], password: values[3] };
                window.localStorage.setItem("zebra-user", JSON.stringify(user));
            } else if (!user || user.email.toLowerCase() !== values[0].toLowerCase() || user.password !== values[1]) {
                message.textContent = "Email или пароль не совпадают. Проверьте данные или зарегистрируйтесь.";
                return;
            }
            window.localStorage.setItem("zebra-session", "active");
            message.classList.add("is-success");
            message.textContent = signup ? "Аккаунт создан. Открываем профиль…" : "Вход выполнен. Открываем профиль…";
            window.location.href = "../profile.html";
        });
    }

    const profileName = document.querySelector("[data-profile-name]");
    if (profileName) {
        let user;
        try { user = JSON.parse(window.localStorage.getItem("zebra-user") || "null"); } catch { user = null; }
        if (user && window.localStorage.getItem("zebra-session") === "active") {
            profileName.textContent = user.name;
            document.querySelector("[data-profile-email]").textContent = user.email;
            document.querySelector("[data-profile-phone]").textContent = user.phone;
        } else {
            profileName.textContent = "Гость";
            document.querySelector("[data-profile-email]").textContent = "Войдите или создайте аккаунт";
            document.querySelector("[data-profile-phone]").textContent = "—";
        }
        document.querySelector("[data-profile-logout]")?.addEventListener("click", () => {
            window.localStorage.removeItem("zebra-session");
            window.location.href = "component/auth.html";
        });
    }

    const coffeeApiCard = document.querySelector("[data-coffee-api]");
    if (coffeeApiCard) {
        const loadCoffeeTip = async () => {
            const status = coffeeApiCard.querySelector("[data-api-status]");
            const title = coffeeApiCard.querySelector("[data-api-title]");
            const description = coffeeApiCard.querySelector("[data-api-description]");
            const ingredients = coffeeApiCard.querySelector("[data-api-ingredients]");
            status.textContent = "Загружаем идеи напитков…";
            try {
                const response = await fetch("https://api.sampleapis.com/coffee/hot");
                if (!response.ok) throw new Error("HTTP " + response.status);
                const drinks = await response.json();
                if (!Array.isArray(drinks) || !drinks.length) throw new Error("Пустой ответ API");
                const drink = drinks[Math.floor(Math.random() * drinks.length)];
                title.textContent = drink.title || "Кофейная идея";
                description.textContent = drink.description || "Вдохновитесь новой кофейной комбинацией.";
                ingredients.textContent = Array.isArray(drink.ingredients) ? drink.ingredients.join(" · ") : "";
                status.textContent = "Идея из открытого Coffee API · обновляется при загрузке страницы";
            } catch {
                title.textContent = "Классический капучино";
                description.textContent = "Эспрессо, горячее молоко и воздушная молочная пена — беспроигрышное сочетание.";
                ingredients.textContent = "эспрессо · молоко · молочная пена";
                status.textContent = "Не удалось подключиться к API. Показана локальная рекомендация.";
            }
        };
        loadCoffeeTip();
        coffeeApiCard.querySelector("[data-api-refresh]")?.addEventListener("click", loadCoffeeTip);
    }
});
