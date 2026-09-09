import { AppDatabase } from "./db.js";
import { handleLocation } from "./router.js";
import { highlightTransaction } from "../modules/budget/budget.js";
const db = new AppDatabase();

let searchOverlay = document.querySelector(".search_overlay");
let searchInput = document.querySelector(".search_input");
let searchResultsList = document.querySelector(".search_results");
let activeIndex = -1; // Index of the currently focused search result
let searchDateInput = document.getElementById("search_date_input");

const hamburgerToggle = document.getElementById("hamburger-toggle");
const mobileNav = document.getElementById("mobile_nav");


searchResultsList.addEventListener("click", (event) => {
    let clickedOnLi = event.target.closest("li");
    if (clickedOnLi) {
        navigateToResult(clickedOnLi);
    }
});

let openSearchModalBtn = document.querySelectorAll(".open_search_modal_btn");

for (let btn of openSearchModalBtn) {
btn.addEventListener("click", () => {
    searchOverlay.style.display = "flex";
    searchInput.focus();

        hamburgerToggle.checked = false;
        mobileNav.classList.remove("active");
});

}


window.addEventListener("keydown", (event) => {
    // Open the search modal on CTRL + K
    if ((event.ctrlKey || event.metaKey) && event.code === "KeyK") {
        event.preventDefault();
        searchOverlay.style.display = "flex";
        searchInput.focus();
    }
    if (event.key === "Escape") {
        closeSearch();
    }

    // Navigate through search results using keyboard arrows
    if (searchOverlay.style.display === "flex") {
        const items = searchResultsList.querySelectorAll("li");


        if (event.key === "ArrowDown") {
            event.preventDefault();
            if (items.length > 0) { 
                activeIndex++; 
                if (activeIndex >= items.length) { 
                    activeIndex = items.length - 1;
                }
                updateActiveItem(items);
            }
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            if (items.length > 0) {
                activeIndex--;
                if (activeIndex < 0) {
                    activeIndex = 0;
                }
                updateActiveItem(items);
            }
        }

        if (event.key === "Enter") {
            event.preventDefault();
            if (activeIndex >= 0 && items[activeIndex]) {
                const selectedItem = items[activeIndex];
                navigateToResult(selectedItem);
            }
        }
    }
});

// Apply visual focus to the active list item
function updateActiveItem(items) {
    items.forEach(item => item.classList.remove("active"));

    if (activeIndex >= 0 && items[activeIndex]) {
        const currentItem = items[activeIndex];
        currentItem.classList.add("active");
        currentItem.scrollIntoView({ block: "nearest" });
    }
}

// Navigate to the respective module and highlight the target element
function navigateToResult(element) {
    const type = element.dataset.type;
    const id = element.dataset.id;

    if (type === "task") {

        window.location.hash = "kanban"; 
        

        // Trigger highlight animation on the target element
        setTimeout(() => {
            let targetCard = document.querySelector(`.task_card[data-id="${id}"]`);
            if (targetCard) {
                targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
                targetCard.classList.add("highlight_card");
                
                setTimeout(() => {
                    targetCard.classList.remove("highlight_card");
                }, 1500);
            }
        }, 50);
        
    } else if (type === "budget") {
        window.location.hash = "budget";

        setTimeout(() => {
            highlightTransaction(id);
        }, 1500);
    }

    closeSearch();
}


function closeSearch() {
    searchOverlay.style.display = "none";
    searchInput.value = "";
    searchResultsList.innerHTML = "";
    activeIndex = -1; 
}



searchOverlay.addEventListener("click", (event) => {
    let clickedOnOverlay = event.target.className === "search_overlay";
    if (!clickedOnOverlay) return;
    closeSearch();
});


searchInput.addEventListener("input", async () => {
    let searchText = searchInput.value.toLowerCase().trim();
    if (searchText === "") {
        searchResultsList.innerHTML = "";
        return;
    }

    let allTasks = await db.getAll("tasks");
    let allTransactions = await db.getAll("transactions");

    let matchedTasks = allTasks.filter((task) => {
        let titleMatch = task.title && task.title.toLowerCase().includes(searchText);
        let descMatch = task.description && task.description.toLowerCase().includes(searchText);
        return titleMatch || descMatch; 
    });

    let matchedTransactions = allTransactions.filter((item) => {
        const titleMatch = item.title && item.title.toLowerCase().includes(searchText);
        const categoryMatch = item.category && item.category.toLowerCase().includes(searchText);
        const amountMatch = item.amount && String(item.amount).includes(searchText);

        return titleMatch || categoryMatch || amountMatch;
    });

    renderResults(matchedTasks, matchedTransactions);
});



searchDateInput.addEventListener("input", async () => {
    let targetDate = searchDateInput.value;
    
    if (!targetDate) {
        searchResultsList.innerHTML = "";
        return;
    }

    let allTransactions = await db.getAll("transactions");
    
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    let matchedTransactions = binarySearchByDate(allTransactions, targetDate);

    renderResults([], matchedTransactions); 
});



function renderResults(tasks, transactions) {
    searchResultsList.innerHTML = ""; 
    let fragment = new DocumentFragment();

    for (let i = 0; i < tasks.length; i++) {
        let task = tasks[i];
        let li = document.createElement("li");
        
        li.dataset.type = "task";
        li.dataset.id = task.id; 
        li.innerHTML = `<span class="badge task-badge">[Task] </span> ${task.title}`;
        
        fragment.appendChild(li);
    }

    for (let i = 0; i < transactions.length; i++) {
        let transaction = transactions[i];
        let li = document.createElement("li");
        
        li.dataset.type = "budget";
        li.dataset.id = transaction.id;
        li.innerHTML = `<span class="badge budget-badge">[Budget] </span> ${transaction.category}: ${transaction.amount}`;
        
        fragment.appendChild(li);
    }

    if (tasks.length === 0 && transactions.length === 0) {
        let li = document.createElement("li");
        li.textContent = "Nothing found...";
        li.style.color = "gray"; 
        fragment.appendChild(li);
    }

    searchResultsList.appendChild(fragment);
    
    activeIndex = -1;
}



// Binary search for transactions by date (adapted for descending sorted array)
function binarySearchByDate(sortedTransactions, targetDate) {
    let low = 0;
    let high = sortedTransactions.length - 1;
    let targetTime = new Date(targetDate).getTime();

    while (low <= high) {
        let mid = Math.floor((low + high) / 2);
        let midTime = new Date(sortedTransactions[mid].date).getTime();

        if (midTime === targetTime) {
            let results = [];
            results.push(sortedTransactions[mid]);

            let leftPointer = mid - 1;
            while (leftPointer >= 0 && new Date(sortedTransactions[leftPointer].date).getTime() === targetTime) {
                results.push(sortedTransactions[leftPointer]);
                leftPointer--;
            }

            let rightPointer = mid + 1;
            while (rightPointer < sortedTransactions.length && new Date(sortedTransactions[rightPointer].date).getTime() === targetTime) {
                results.push(sortedTransactions[rightPointer]);
                rightPointer++;
            }
            return results;
        }

        if (targetTime < midTime) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return [];
}
