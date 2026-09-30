import "../core/router.js";
import "../core/db.js";
import "../core/search.js";
import "../modules/kanban/kanban.js";
import "../modules/budget/budget.js";
import { updatePeakActivity } from "../modules/budget/budget.js";


// Load and apply saved theme preference (dark / light)
let savedTheme = localStorage.getItem("theme");
if (savedTheme) {
    document.body.className = savedTheme;
}

let switchThemeButton = document.querySelectorAll(".switch_theme input");
let isDarkSaved = savedTheme === "dark_theme";

switchThemeButton.forEach((btn) => {
    btn.checked = isDarkSaved;

    btn.addEventListener("change", () => {
        let isDark = document.body.classList.toggle("dark_theme");
        localStorage.setItem("theme", isDark ? "dark_theme" : "");

        switchThemeButton.forEach((otherBtn) => {
            otherBtn.checked = isDark;
        });
    });
});



// Recalculate peak activity (sliding window) on transaction range change
document.addEventListener("change", async (event) => {
    if (event.target.id === "window_size_select") {
        let selectedSize = Number(event.target.value);
        await updatePeakActivity(selectedSize);
    }
});





// Mobile hamburger menu toggle logic

const hamburgerToggle = document.getElementById("hamburger-toggle");
const mobileNav = document.getElementById("mobile_nav");

hamburgerToggle.addEventListener("change", () => {
    mobileNav.classList.toggle("active", hamburgerToggle.checked);
});

document.addEventListener("click", (event) => {
    if (!event.target.closest(".mobile_menu")) {
        hamburgerToggle.checked = false;
        mobileNav.classList.remove("active");
    }
});