import { renderKanbanBoard } from "../modules/kanban/kanban.js";
import { polyfill } from "https://esm.sh/mobile-drag-drop";
import { updateBalance, renderTransactions } from "../modules/budget/budget.js";

// Initialize mobile drag-and-drop polyfill
polyfill({
    holdToDrag: 300
});

window.addEventListener("touchmove", function () { }, { passive: false });

document.addEventListener("click", (event) => {
    let link = event.target.closest("a");
    if (link) {
        let linkPath = link.getAttribute("href");
        if (linkPath && (linkPath.startsWith("/") || linkPath.startsWith("#"))) {
            event.preventDefault();
            let route = linkPath.replace("#", "").replace("/", "");
            window.location.hash = route;
        }
    }
});

const hamburgerToggle = document.getElementById("hamburger-toggle");
const mobileNav = document.getElementById("mobile_nav");



// Dynamically render main content based on the current route
export async function handleLocation() {
    let mainBlock = document.querySelector(".app_root");
    let route = window.location.hash.replace("#", "") || "home";


    switch (route) {
        case "kanban":
            mainBlock.innerHTML = `
            <div class="kanban_board">
                <div class="kanban_column" data-status="todo">
                    <div class="column_header">For execution - <span class="task_count">0</span></div>
                    <div class="column_tasks">
                    </div>

                    <button class="add_task_btn" data-status="todo">+</button>
                </div>

                <div class="kanban_column" data-status="in_progress">
                    <div class="column_header">In progress - <span class="task_count">0</span></div>
                    <div class="column_tasks">
                    
                    </div>
                    <button class="add_task_btn" data-status="in_progress">+</button>
                </div>

                <div class="kanban_column" data-status="done">
                    <div class="column_header">Finished - <span class="task_count">0</span></div>
                    <div class="column_tasks">

                    </div>

                    <button class="add_task_btn" data-status="done">+</button>
                </div>

                    
            </div>`;

            await renderKanbanBoard();
            break;
        case "budget":
            mainBlock.innerHTML = `
                <div class="budget_block"> 

                    <div class="budget_analytics | budget_info_block">
    
                        <div class="chart_section">
                            <canvas id="budget_donut" width="200" height="200"></canvas>
                            <div class="chart_legend">
                                <p>Total Income: <strong class="text_income" id="total_in_text">0</strong></p>
                                <p>Total Expenses: <strong class="text_expense" id="total_out_text">0</strong></p>
                            </div>
                        </div>

                        <div class="sliding_window_section">
                            <h3>Peak Activity</h3>
                            <p class="window_desc">Find the maximum amount spent or earned in consecutive transactions.</p>
        
                            <select id="window_size_select">
                                <option value="7" selected>7 Transactions</option>
                                <option value="14">14 Transactions</option>
                                <option value="30">30 Transactions</option>
                            </select>

                            <div class="window_results">
                                <p>Max Spent: <strong class="text_expense" id="window_max_spent">0</strong></p>
                                <p>Max Earned: <strong class="text_income" id="window_max_earned">0</strong></p>
                            </div>
                        </div>

                    </div>
            


                    
                    <div class="budget_balance | budget_info_block">
                     <h2> Balance </h2>

                     <h1 class="budget_balance_number">Current Balance: <span class="current_balance"> </span> </h1>

                     <h3 class="initial_balance_block">Initial Balance: <span class="initial_balance">0</span> </h3> 

                    <div class="currency_widget">
                        <div class="currency_status" id="currency_status">Loading rates...</div>
    
                        <div class="currency_conversions" id="currency_conversions">
                            <span>Balance in: </span>
                            <select id="target_currency" disabled>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="RUB">RUB (₽)</option>
                                <option value="JPY">JPY (¥)</option>
                            </select>
                            <strong>= <span id="converted_amount">0</span></strong>
                        </div>
                    </div>

                     <button class="budget_edit_balance_btn | budget_btn">Edit initial balance</button>
                    </div>

                    <div class="budget_income | budget_info_block">
                        <h4 class="income_number">0</h2>
                    </div>
                    
                    <div class="budget_costs | budget_info_block">
                        <h4 class="costs_number">0</h2>
                    </div>

                    <div class="budget_history | budget_info_block">
                        <h2> Transaction history </h2>

                        <div class="budget_transactions_history">
                        
                        </div>

                        <button class="add_transaction_btn | budget_btn">Add transaction</button>
                    </div>
            
                </div>
            `;
            await updateBalance();
            await renderTransactions();
            break;
        case "home":
            mainBlock.innerHTML = `
            <div id="home_block">

            <h1> How to use </h1>

            <h2>Kanban Board (Task Manager)</h2>
                <ul> 
                    <li><span class="bold_text">Task Management & Organization:</span> Create tasks with titles and detailed descriptions. Organize them across status columns for clear workflow visibility.</li>
                    <li><span class="bold_text">Drag-and-Drop Workflow:</span> Effortlessly move task cards between columns using smooth drag-and-drop mechanics.</li>
                    <li><span class="bold_text">Task Dependencies:</span> Define relationships between tasks when one item requires the completion of another.</li>
                    <li><span class="bold_text">Cycle Detection:</span> The system analyzes the dependency graph and automatically blocks circular references (e.g., Task A depending on Task B while Task B depends on Task A) to prevent logical planning deadlocks.</li>
                </ul>
            
                <h2> Budget Tracker </h2>

                <ul>
                <li><span class="bold_text">Balance Management:</span> Set an initial balance and log all incoming or outgoing transactions. All data stays private and persists locally in your browser using IndexedDB.</li>
                <li><span class="bold_text">Smart Statement Parser:</span> Paste raw bank SMS text or upload statement files (.txt, .csv). Regular Expressions (RegEx) automatically extract the date, amount, transaction type (income/expense), and clean up vendor titles.</li>
                <li><span class="bold_text">Fuzzy Duplicate Protection:</span> Powered by the Levenshtein Distance algorithm, the app checks new entries against existing records. If a similar transaction exists on the same date with the same amount (even with minor typos or terminal ID differences), the system alerts you before saving.</li>
                <li><span class="bold_text">Binary Search & Auto-Highlight (O(log n)):</span> Search records by title, category, or date. Date-based lookups utilize binary search over sorted data. Clicking a search result automatically fetches the necessary history chunk, scrolls directly to the item, and triggers a visual highlight.</li>
                <li><span class="bold_text">Infinite Scroll History:</span> Transaction history is loaded in optimized chunks of 20 items to maintain high UI performance regardless of dataset size.</li>
                <li><span class="bold_text">Canvas Visualization:</span> A dynamic Donut Chart rendered on HTML5 Canvas automatically updates to display your real-time income vs. expense ratio.</li>
                <li><span class="bold_text">Peak Activity Analysis (Sliding Window O(n)):</span> Select an interval (7, 14, or 30 transactions) to run a Sliding Window algorithm that finds your highest spending and earning streaks in a single pass.</li>
                <li><span class="bold_text">Multi-Currency Conversion:</span> Select a target currency (EUR, GBP, RUB, JPY) to convert your current balance using live exchange rates. Built with defensive network error handling and an AbortController timeout—if the API fails or takes longer than 3 seconds, the UI gracefully falls back without freezing.</li>
                </ul>
            </div>`;
            break;

    }

           hamburgerToggle.checked = false;
        mobileNav.classList.remove("active");
}

if (!window.location.hash) {
    window.location.hash = "home";
}

await handleLocation();
// Handle browser navigation (back/forward)
window.addEventListener("hashchange", handleLocation);