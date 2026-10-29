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
        const openSubscription = document.querySelector("[data-open-subscription]");
        const closeSubscription = subscriptionDialog.querySelector("[data-close-subscription]");

        openSubscription?.addEventListener("click", () => {
            subscriptionDialog.showModal();
            subscriptionDialog.querySelector("[name='email']")?.focus();
        });
        closeSubscription?.addEventListener("click", () => subscriptionDialog.close());
        subscriptionDialog.addEventListener("click", (event) => {
            if (event.target === subscriptionDialog) subscriptionDialog.close();
        });
        subscriptionForm?.addEventListener("submit", (event) => {
            event.preventDefault();
            const email = subscriptionForm.querySelector("[name='email']");
            const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
            email.setAttribute("aria-invalid", String(!isValidEmail));
            if (!isValidEmail) {
                subscriptionMessage.classList.remove("is-success");
                subscriptionMessage.textContent = email.value.trim()
                    ? "Введите корректный адрес электронной почты."
                    : "Укажите электронную почту для подписки.";
                subscriptionMessage.hidden = false;
                email.focus();
                return;
            }
            subscriptionMessage.textContent = "Спасибо! Вы подписались на новости Zebra Coffee.";
            subscriptionMessage.classList.add("is-success");
            subscriptionMessage.hidden = false;
            subscriptionForm.reset();
            email.removeAttribute("aria-invalid");
        });
        subscriptionDialog.addEventListener("close", () => {
            if (!subscriptionMessage) return;
            subscriptionMessage.textContent = "";
            subscriptionMessage.classList.remove("is-success");
            subscriptionMessage.hidden = true;
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
        const email = authForm.querySelector("#auth-email");
        const password = authForm.querySelector("#auth-password");
        const confirmation = authForm.querySelector("#auth-password-confirmation");
        const message = authForm.querySelector("[data-form-message]");

        const validateRegistration = () => {
            const values = [email.value.trim(), password.value, confirmation.value];
            const errors = [
                !values[0]
                    ? "Укажите электронную почту."
                    : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values[0])
                        ? "Введите корректный адрес электронной почты."
                        : "",
                !values[1]
                    ? "Введите пароль."
                    : values[1].length < 8
                        ? "Пароль должен содержать не менее 8 символов."
                        : "",
                !values[2]
                    ? "Повторите пароль."
                    : values[2] !== values[1]
                        ? "Пароли не совпадают."
                        : ""
            ];
            [email, password, confirmation].forEach((field, index) => {
                field.setAttribute("aria-invalid", String(Boolean(errors[index])));
            });
            return errors;
        };

        [email, password, confirmation].forEach((field) => {
            field.addEventListener("input", () => {
                field.removeAttribute("aria-invalid");
                message.textContent = "";
                message.classList.remove("is-success");
            });
        });

        authForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const errors = validateRegistration();
            const firstInvalidIndex = errors.findIndex(Boolean);

            if (firstInvalidIndex !== -1) {
                message.classList.remove("is-success");
                message.textContent = errors[firstInvalidIndex];
                [email, password, confirmation][firstInvalidIndex].focus();
                return;
            }

            message.classList.add("is-success");
            message.textContent = "Проверка пройдена. Форма заполнена корректно.";
            authForm.reset();
            [email, password, confirmation].forEach((field) => field.removeAttribute("aria-invalid"));
        });
    }
});
