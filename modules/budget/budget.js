import { AppDatabase, Stack } from "../../core/db.js";
let db = new AppDatabase();

let appRoot = document.querySelector(".app_root");


let modalOverlay = document.querySelector(".add_transaction_overlay");
let titleInput = document.getElementById("transaction_title");
let numberInput = document.querySelector(".transaction_number");
let typeSelect = document.getElementById("transaction_type_choice");
let categoryInput = document.querySelector(".transaction_category_choice");
let dateInput = document.querySelectorAll(".datepicker_input");

dateInput[0].value = new Date().toISOString().substring(0, 10);
dateInput[1].value = new Date().toISOString().substring(0, 10);



let currentChunkIndex = 0;
const CHUNK_SIZE = 20; // Number of the transaction that we upload each time we scroll
let allTransactionsCache = [];

// TODO: Move API key to .env in production
const apiKey = '4164735517ccf460d9682352';

let cachedRates = null;
let baseCurrency = 'USD';


// Infinite scroll for transactions history
document.addEventListener("scroll", (event) => {
    let historyContainer = document.querySelector(".budget_transactions_history");
    
    if (event.target === historyContainer) {
        let { scrollTop, clientHeight, scrollHeight } = historyContainer;
        
        if (scrollTop + clientHeight >= scrollHeight - 10) {
            renderHistoryChunk(historyContainer);
        }
    }
}, true);


titleInput.addEventListener("input", () => { titleInput.classList.remove("input_error") });

// Limit length for title and amount inputs
titleInput.addEventListener("input", () => {
    if (titleInput.value.length > 11) {
        titleInput.value = titleInput.value.slice(0, 11);
    }
})

numberInput.addEventListener("input", () => { 
    numberInput.classList.remove("input_error") 

    if (numberInput.value < 0) {
        numberInput.value = 0;
    }
    
    if (numberInput.value.length > 9) {
        numberInput.value = numberInput.value.slice(0, 9);
    }
});


document.addEventListener("click", async (event) => {
    
    if (event.target.closest(".delete_transaction_btn")) {
        let deleteBtn = event.target.closest(".delete_transaction_btn");
        let transactionId = deleteBtn.getAttribute("data-id");

        await db.delete("transactions", transactionId);

        await renderTransactions();
        await updateBalance();
        return;
    }


    if (event.target.closest(".add_transaction_btn")) {
        modalOverlay.style.display = "flex";
        if (dateInput) dateInput.value = new Date().toISOString().substring(0, 10);
        return;
    }

    if (event.target.closest(".cancel_transaction") || event.target === modalOverlay) {
        closeModal();
        return;
    }

    if (event.target.closest(".save_transaction")) {
        let title = titleInput.value.trim();
        let amount = Number(numberInput.value);
        let category = categoryInput.value.trim();

        if (amount <= 0) {
            numberInput.classList.add("input_error");
            numberInput.focus();
            return;
        }


        if (!title || title.length > 12) {
            titleInput.classList.add("input_error");
            titleInput.focus();
            return;
        }

        if (amount <= 0 || amount > 99999999) {
            numberInput.classList.add("input_error");
            numberInput.focus();
            return;
        }

        if (category.length > 15) {
            category = category.slice(0, 15);
        }

        let newTransaction = {
            id: Date.now().toString(),
            title: title,
            amount: amount,
            type: typeSelect.value,
            category: categoryInput.value.trim() || "Other",
            date: dateInput[1].value
        };


        let allTx = await db.getAll("transactions");
    
        // Warn the user that he is adding potential same transaction he added before
        let isDuplicate = allTx.some(tx => {
        if (tx.date === newTransaction.date && tx.type === newTransaction.type) {
            let distance = levenshteinDistance(tx.title, newTransaction.title);
            return distance <= 3 && tx.amount === newTransaction.amount;
        }
            return false;
        });

        if (isDuplicate) {
            let confirmSave = confirm("A similar transaction already exists for this date. Are you sure you want to save it?");
            if (!confirmSave) return;
        }

        await db.add("transactions", newTransaction);

        closeModal();

        await renderTransactions();
        await updateBalance();
    }


    // Edit the initial balance
    if (event.target.closest(".budget_edit_balance_btn")) {
        let initialBalanceSpan = document.querySelector(".initial_balance"); 
        let balanceEditBtn = event.target.closest(".budget_edit_balance_btn");

        if (balanceEditBtn.textContent === "Edit initial balance") {
            balanceEditBtn.textContent = "Save";
            
            let currentVal = initialBalanceSpan.textContent.trim() || 0;
            
            initialBalanceSpan.innerHTML = `<input type="number" id="initial_input" value="${currentVal}">`;
            document.getElementById("initial_input").focus();
            return;
        }

        if (balanceEditBtn.textContent === "Save") {
            let inputElement = document.getElementById("initial_input");
            let newValue = Number(inputElement.value) || 0;
            
            localStorage.setItem("initialBalance", newValue);
            
            initialBalanceSpan.innerHTML = newValue;
            balanceEditBtn.textContent = "Edit initial balance";
            
            updateBalance();
            return;
        }
    }
});


function closeModal() {
        titleInput.value = "";
        numberInput.value = "";
        categoryInput.value = "";
        modalOverlay.style.display = "none";
}



export async function updateBalance() {
    let initialSpan = document.querySelector(".initial_balance");
    let currentBalanceSpan = document.querySelector(".current_balance");
    
    if (!initialSpan || !currentBalanceSpan) return;

    let initial = Number(localStorage.getItem("initialBalance")) || 0;
    initialSpan.textContent = initial;

    let allTx = await db.getAll("transactions");

    let totalIncome = allTx
        .filter(tx => tx.type === "income")
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

    let totalExpense = allTx
        .filter(tx => tx.type === "expense")
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

    let currentBalance = initial + totalIncome - totalExpense;
    currentBalanceSpan.textContent = currentBalance;

    let incomeBlock = document.querySelector(".income_number");
    let costsBlock = document.querySelector(".costs_number");

    if (incomeBlock) {
        incomeBlock.innerHTML = `<h2> Income </h2> <h2 class="income_number">+${totalIncome}</h2>`;
    }
    if (costsBlock) {
        costsBlock.innerHTML = `<h2> Expenses </h2> <h2 class="costs_number">-${totalExpense}</h2>`;
    }


    let totalInText = document.getElementById("total_in_text");
    let totalOutText = document.getElementById("total_out_text");
    if (totalInText) totalInText.textContent = totalIncome;
    if (totalOutText) totalOutText.textContent = totalExpense;

    await updatePeakActivity(7);
    drawDonutChart(totalIncome, totalExpense);

    initCurrencyWidget(currentBalance);
}

document.addEventListener("change", (event) => {
    if (event.target.id === "target_currency") {
        let currentBalance = parseFloat(document.querySelector(".current_balance").textContent) || 0;
        let amountEl = document.getElementById("converted_amount");
        
        calculateConversion(currentBalance, event.target.value, amountEl);
    }
});

export async function renderTransactions() {
    let historyContainer = document.querySelector(".budget_transactions_history");
    if (!historyContainer) return;

    historyContainer.innerHTML = "";
    currentChunkIndex = 0;

    let allTx = await db.getAll("transactions");
    allTransactionsCache = allTx.sort((a, b) => new Date(b.date) - new Date(a.date));

    renderHistoryChunk(historyContainer);
}

function renderHistoryChunk(container) {
    let chunk = allTransactionsCache.slice(currentChunkIndex, currentChunkIndex + CHUNK_SIZE);
    
    if (chunk.length === 0) return;

    chunk.forEach(tx => {
        let transactionHTML = `
            <div class="transaction_item ${tx.type}" data-id="${tx.id}">
                <div class="transaction_info">
                    <h4>${tx.title}</h4>
                    <span class="transaction_date">${tx.category} • ${tx.date}</span>
                </div>
                <div class="transaction_amounts">
                    <span class="transaction_money">${tx.type === 'income' ? '+' : '-'}${tx.amount}</span>
                    <button class="delete_transaction_btn" data-id="${tx.id}">
                        <img src="../../public/delete-forever-svgrepo-com.svg" alt="delete">
                    </button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML("beforeend", transactionHTML);
    });

    currentChunkIndex += CHUNK_SIZE;
}

// Highlight the searched transaction
export function highlightTransaction(targetId) {
    let container = document.querySelector(".budget_transactions_history");
    if (!container) return;

    let targetIndex = allTransactionsCache.findIndex(tx => tx.id === targetId);
    if (targetIndex === -1) return; 

    while (currentChunkIndex <= targetIndex) {
        renderHistoryChunk(container);
    }

    setTimeout(() => {
        let targetElement = document.querySelector(`.transaction_item[data-id="${targetId}"]`);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
            targetElement.classList.add("highlight_card");
            
            setTimeout(() => {
                targetElement.classList.remove("highlight_card");
            }, 1500);
        }
    }, 50);
}


// Handle bank statement file import
document.getElementById("import_text").addEventListener("input", (e) => {
    parseBankStatement(e.target.value);
});

document.getElementById("import_file").addEventListener("change", (event) => {
    let file = event.target.files[0];
    if (!file) return;

    let reader = new FileReader();
    
    reader.onload = (e) => {
        let extractedText = e.target.result;
        
        document.getElementById("import_text").value = extractedText;
        
        parseBankStatement(extractedText);
    };
    
    reader.readAsText(file);
});


// Bank statement text parser
function parseBankStatement(text) {

    let isIncome = /\+|crediting|adding|added|transfer from|payout|receipt|intake|return|refund/i.test(text);
    let isExpense = /-|payment|purchase|debiting|commission|retail|withdrawal/i.test(text);
    
    if (isIncome && !isExpense) {
        typeSelect.value = "income";
    } else {
        typeSelect.value = "expense";
    }

    let amountMatch = text.match(/[+-]?\s*(\d+[.,]?\d{0,2})\b(?=\s*(rub|usd|eur|gbp|\\$|€)?)/i);
    
    let dateMatch = text.match(/\b(\d{2})[\./-](\d{2})[\./-](\d{4})\b/);

    if (amountMatch) {
        let rawAmount = amountMatch[1].replace(/\s/g, '').replace(',', '.');
        numberInput.value = parseFloat(rawAmount);
        numberInput.style.borderColor = "#4CAF50";
    }

    if (dateMatch) {
        let [_, day, month, year] = dateMatch;
        dateInput[1].value = `${year}-${month}-${day}`;
    }

    let cleanTitle = text;
    
    if (amountMatch) cleanTitle = cleanTitle.replace(amountMatch[0], "");
    if (dateMatch) cleanTitle = cleanTitle.replace(dateMatch[0], "");
    
    cleanTitle = cleanTitle.replace(/\b\d{2}:\d{2}(:\d{2})?\b/g, "");
    cleanTitle = cleanTitle.replace(/rub|usd|eur|balance|rest|card\s\*\d{4}/gi, "");
    cleanTitle = cleanTitle.replace(/payment|debiting|adding|refund|transfer/gi, "");
    
    cleanTitle = cleanTitle.replace(/^[^\wa-zA-Z]+|[^\wa-zA-Z]+$/gi, "").trim();
    cleanTitle = cleanTitle.replace(/\s{2,}/g, " ");

    if (cleanTitle) {
        titleInput.value = cleanTitle.substring(0, 12);
    } else {
        titleInput.value = "Bank TX";
    }
}




// Calculate Levenshtein Distance between strings (used for duplicate detection)
function levenshteinDistance(str1, str2) {
    let a = str1.toLowerCase();
    let b = str2.toLowerCase();
    
    let matrix = [];
    
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[b.length][a.length];
}





export function drawDonutChart(income, expense) {
    let canvas = document.getElementById("budget_donut");
    if (!canvas) return;
    
    let ctx = canvas.getContext("2d");
    let width = canvas.width;
    let height = canvas.height;
    
    let centerX = width / 2;
    let centerY = height / 2;
    let radius = Math.min(centerX, centerY) - 10; 

    ctx.clearRect(0, 0, width, height);

    let total = income + expense;

    if (total === 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = "#A9A9A9";
        ctx.fill();
    } else {
        let incomeAngle = (income / total) * 2 * Math.PI;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, 0, incomeAngle);
        ctx.fillStyle = "#8ED598";
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, incomeAngle, 2 * Math.PI);
        ctx.fillStyle = "#DF8B8B"; 
        ctx.fill();
    }

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.65, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.globalCompositeOperation = "source-over";
}


// Calculate peak expense/income using a sliding window algorithm
export function calculateSlidingWindow(transactions, windowSize) {
    if (!transactions || transactions.length === 0) {
        return { maxIncome: 0, maxExpense: 0 };
    }

    let k = Math.min(windowSize, transactions.length);

    let currentIncomeSum = 0;
    let currentExpenseSum = 0;

    for (let i = 0; i < k; i++) {
        if (transactions[i].type === "income") {
            currentIncomeSum += transactions[i].amount;
        } else if (transactions[i].type === "expense") {
            currentExpenseSum += transactions[i].amount;
        }
    }

    let maxIncome = currentIncomeSum;
    let maxExpense = currentExpenseSum;

    for (let i = k; i < transactions.length; i++) {
        let addedTx = transactions[i];
        let removedTx = transactions[i - k];

        if (addedTx.type === "income") currentIncomeSum += addedTx.amount;
        if (addedTx.type === "expense") currentExpenseSum += addedTx.amount;

        if (removedTx.type === "income") currentIncomeSum -= removedTx.amount;
        if (removedTx.type === "expense") currentExpenseSum -= removedTx.amount;

        maxIncome = Math.max(maxIncome, currentIncomeSum);
        maxExpense = Math.max(maxExpense, currentExpenseSum);
    }

    return { maxIncome, maxExpense };
}


export async function updatePeakActivity(windowSize = 7) {
    let maxSpentEl = document.getElementById("window_max_spent");
    let maxEarnedEl = document.getElementById("window_max_earned");
    
    if (!maxSpentEl || !maxEarnedEl) return;

    let allTx = await db.getAll("transactions");
    allTx.sort((a, b) => new Date(b.date) - new Date(a.date));

    let { maxIncome, maxExpense } = calculateSlidingWindow(allTx, windowSize);

    maxSpentEl.textContent = maxExpense;
    maxEarnedEl.textContent = maxIncome;
}


// Initialize and update currency conversion widget
export async function initCurrencyWidget(currentBalance) {
    let statusEl = document.getElementById("currency_status");
    let selectEl = document.getElementById("target_currency");
    let amountEl = document.getElementById("converted_amount");

    if (cachedRates) {
        calculateConversion(currentBalance, selectEl.value, amountEl);
        return;
    }


    let controller = new AbortController();
    let timerId = setTimeout(() => controller.abort(), 3000);

    try {
        statusEl.textContent = "Fetching rates...";

        let url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`;

        let response = await fetch(url, {signal: controller.signal});

        if (!response.ok) throw new Error("API Error");

        let data = await response.json();
        cachedRates = data.conversion_rates;

        statusEl.style.display = "none";
        selectEl.disabled = false;

        calculateConversion(currentBalance, selectEl.value, amountEl);
    } catch (err) {
        console.log("API Error", err);
        statusEl.textContent = "Rates unavailable (Offline/Timeout)";
        statusEl.style.color = "#DF8B8B";
    } finally {
        clearTimeout(timerId);
    }
}

function calculateConversion(balance, targetCurrency, element) {
    if (!cachedRates || !cachedRates[targetCurrency]) return;

    let rate = cachedRates[targetCurrency];

    let result = balance * rate;

    element.textContent = result.toFixed(2) + " " + targetCurrency;
}







