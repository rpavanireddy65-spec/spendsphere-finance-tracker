// ===============================
// SPENDSPHERE FINANCE TRACKER
// ===============================


// DATA

let transactions =
    JSON.parse(localStorage.getItem("spendSphereData")) || [];

let budget =
    Number(localStorage.getItem("spendSphereBudget")) || 20000;

let currentType = "income";


// CHARTS

let incomeExpenseChart;
let categoryChart;
let monthlyChart;
let analyticsCategoryChart;


// ===============================
// INITIALIZATION
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("date").value =
        new Date().toISOString().split("T")[0];

    updateDashboard();
    renderTransactions();
    createCharts();
});


// ===============================
// NAVIGATION
// ===============================

function showSection(sectionId, button) {

    document.querySelectorAll(".section").forEach(section => {
        section.classList.remove("active");
    });

    document.getElementById(sectionId).classList.add("active");

    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    if (button) {
        button.classList.add("active");
    }

    const titles = {
        dashboard: "Financial Dashboard",
        transactions: "Transaction History",
        analytics: "Spending Analytics",
        reports: "Financial Reports"
    };

    document.getElementById("pageTitle").textContent =
        titles[sectionId];
}


function showSectionById(sectionId) {

    const buttons = document.querySelectorAll(".nav-btn");

    let targetButton = null;

    buttons.forEach(button => {

        if (button.textContent.toLowerCase().includes(sectionId)) {
            targetButton = button;
        }
    });

    showSection(sectionId, targetButton);
}


// ===============================
// MODAL
// ===============================

function openModal() {

    document
        .getElementById("transactionModal")
        .classList.add("show");
}


function closeModal() {

    document
        .getElementById("transactionModal")
        .classList.remove("show");
}


// ===============================
// TRANSACTION TYPE
// ===============================

function setType(type) {

    currentType = type;

    document
        .getElementById("incomeBtn")
        .classList.remove("active");

    document
        .getElementById("expenseBtn")
        .classList.remove("active");

    if (type === "income") {

        document
            .getElementById("incomeBtn")
            .classList.add("active");

    } else {

        document
            .getElementById("expenseBtn")
            .classList.add("active");
    }
}


// ===============================
// ADD TRANSACTION
// ===============================

document
    .getElementById("transactionForm")
    .addEventListener("submit", function (e) {

        e.preventDefault();

        const description =
            document.getElementById("description").value.trim();

        const amount =
            Number(document.getElementById("amount").value);

        const category =
            document.getElementById("category").value;

        const date =
            document.getElementById("date").value;

        if (!description || amount <= 0 || !date) {

            alert("Please enter valid transaction details.");

            return;
        }

        const transaction = {

            id: Date.now(),

            type: currentType,

            description: description,

            amount: amount,

            category: category,

            date: date
        };

        transactions.push(transaction);

        saveData();

        this.reset();

        document.getElementById("date").value =
            new Date().toISOString().split("T")[0];

        setType("income");

        closeModal();

        updateDashboard();

        renderTransactions();

        createCharts();
    });


// ===============================
// SAVE DATA
// ===============================

function saveData() {

    localStorage.setItem(
        "spendSphereData",
        JSON.stringify(transactions)
    );

    localStorage.setItem(
        "spendSphereBudget",
        budget
    );
}


// ===============================
// CALCULATIONS
// ===============================

function getIncome() {

    return transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
}


function getExpenses() {

    return transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
}


function getBalance() {

    return getIncome() - getExpenses();
}


// ===============================
// DASHBOARD
// ===============================

function updateDashboard() {

    const income = getIncome();

    const expenses = getExpenses();

    const balance = income - expenses;

    const savingRate =
        income > 0
            ? Math.round((balance / income) * 100)
            : 0;


    document.getElementById("totalIncome").textContent =
        formatCurrency(income);

    document.getElementById("totalExpense").textContent =
        formatCurrency(expenses);

    document.getElementById("balance").textContent =
        formatCurrency(balance);

    document.getElementById("savingRate").textContent =
        `${Math.max(0, savingRate)}%`;


    updateBudget();

    generateInsight();

    renderRecentTransactions();

    updateAnalytics();

    updateReport();
}


// ===============================
// BUDGET
// ===============================

function setBudget() {

    const newBudget =
        Number(prompt("Enter your monthly budget:", budget));

    if (!newBudget || newBudget <= 0) {

        return;
    }

    budget = newBudget;

    saveData();

    updateBudget();
}


function updateBudget() {

    const expenses = getExpenses();

    const percentage =
        budget > 0
            ? Math.min((expenses / budget) * 100, 100)
            : 0;

    document.getElementById("budgetText").textContent =
        `${formatCurrency(expenses)} / ${formatCurrency(budget)}`;

    document.getElementById("budgetProgress").style.width =
        percentage + "%";


    const message =
        document.getElementById("budgetMessage");

    if (expenses > budget) {

        message.textContent =
            "⚠️ You have crossed your current budget.";

    } else if (percentage >= 80) {

        message.textContent =
            "⚠️ You are close to your monthly budget.";

    } else {

        message.textContent =
            "✓ Your spending is currently within your budget.";
    }
}


// ===============================
// INSIGHTS
// ===============================

function generateInsight() {

    const insight =
        document.getElementById("insightText");

    if (transactions.length === 0) {

        insight.textContent =
            "Add transactions and SpendSphere will automatically analyze your spending.";

        return;
    }


    const expenses =
        transactions.filter(t => t.type === "expense");


    if (expenses.length === 0) {

        insight.textContent =
            "You have income recorded but no expenses yet. Keep tracking your spending.";

        return;
    }


    const categories = {};

    expenses.forEach(t => {

        categories[t.category] =
            (categories[t.category] || 0) + t.amount;
    });


    const topCategory =
        Object.entries(categories)
            .sort((a, b) => b[1] - a[1])[0];


    const total =
        getExpenses();


    const percentage =
        Math.round((topCategory[1] / total) * 100);


    insight.textContent =
        `${topCategory[0]} is your highest spending category at ${formatCurrency(topCategory[1])}, which is ${percentage}% of your total expenses.`;
}


// ===============================
// RECENT TRANSACTIONS
// ===============================

function renderRecentTransactions() {

    const container =
        document.getElementById("recentTransactions");

    const recent =
        [...transactions]
            .sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            )
            .slice(0, 5);


    if (recent.length === 0) {

        container.innerHTML =
            `<p style="color:#7b8494;">
                No transactions yet. Add your first transaction.
            </p>`;

        return;
    }


    container.innerHTML =
        recent.map(createTransactionHTML).join("");
}


// ===============================
// TRANSACTION LIST
// ===============================

function renderTransactions() {

    const container =
        document.getElementById("transactionList");

    const search =
        document
            .getElementById("searchInput")
            ?.value
            .toLowerCase() || "";


    const filtered =
        transactions.filter(t =>

            t.description
                .toLowerCase()
                .includes(search) ||

            t.category
                .toLowerCase()
                .includes(search)
        );


    if (filtered.length === 0) {

        container.innerHTML =
            `<p style="color:#7b8494;">
                No transactions found.
            </p>`;

        return;
    }


    container.innerHTML =
        [...filtered]
            .sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            )
            .map(createTransactionHTML)
            .join("");
}


function createTransactionHTML(t) {

    const icon =
        t.type === "income"
            ? "💰"
            : "💸";


    return `

        <div class="transaction">

            <div class="transaction-left">

                <div class="transaction-icon">
                    ${icon}
                </div>

                <div class="transaction-info">

                    <strong>
                        ${escapeHTML(t.description)}
                    </strong>

                    <span>
                        ${t.category} • ${t.date}
                    </span>

                </div>

            </div>


            <div>

                <span class="${
                    t.type === "income"
                        ? "amount-income"
                        : "amount-expense"
                }">

                    ${
                        t.type === "income"
                            ? "+"
                            : "-"
                    }

                    ${formatCurrency(t.amount)}

                </span>

                <button
                    class="delete-btn"
                    onclick="deleteTransaction(${t.id})">

                    Delete

                </button>

            </div>

        </div>
    `;
}


// ===============================
// DELETE
// ===============================

function deleteTransaction(id) {

    transactions =
        transactions.filter(t => t.id !== id);

    saveData();

    updateDashboard();

    renderTransactions();

    createCharts();
}


// ===============================
// ANALYTICS
// ===============================

function updateAnalytics() {

    const expenses =
        transactions.filter(t => t.type === "expense");


    const amounts =
        expenses.map(t => t.amount);


    const highest =
        amounts.length
            ? Math.max(...amounts)
            : 0;


    const average =
        amounts.length
            ? amounts.reduce((a, b) => a + b, 0) / amounts.length
            : 0;


    const categories = {};

    expenses.forEach(t => {

        categories[t.category] =
            (categories[t.category] || 0) + t.amount;
    });


    const top =
        Object.entries(categories)
            .sort((a, b) => b[1] - a[1])[0];


    document.getElementById("highestExpense").textContent =
        formatCurrency(highest);

    document.getElementById("averageExpense").textContent =
        formatCurrency(Math.round(average));

    document.getElementById("transactionCount").textContent =
        transactions.length;

    document.getElementById("topCategory").textContent =
        top ? top[0] : "None";
}


// ===============================
// CHARTS
// ===============================

function createCharts() {

    createIncomeExpenseChart();

    createCategoryChart();

    createMonthlyChart();

    createAnalyticsCategoryChart();
}


function destroyChart(chart) {

    if (chart) {

        chart.destroy();
    }
}


// INCOME VS EXPENSE

function createIncomeExpenseChart() {

    destroyChart(incomeExpenseChart);

    const ctx =
        document
            .getElementById("incomeExpenseChart")
            .getContext("2d");


    incomeExpenseChart =
        new Chart(ctx, {

            type: "bar",

            data: {

                labels: ["Income", "Expenses", "Balance"],

                datasets: [{

                    label: "Amount",

                    data: [
                        getIncome(),
                        getExpenses(),
                        Math.max(getBalance(), 0)
                    ],

                    borderRadius: 10

                }]
            },

            options: {

                responsive: true,

                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
}


// CATEGORY

function createCategoryChart() {

    destroyChart(categoryChart);

    const ctx =
        document
            .getElementById("categoryChart")
            .getContext("2d");


    const categories = {};


    transactions
        .filter(t => t.type === "expense")
        .forEach(t => {

            categories[t.category] =
                (categories[t.category] || 0) + t.amount;
        });


    categoryChart =
        new Chart(ctx, {

            type: "doughnut",

            data: {

                labels: Object.keys(categories),

                datasets: [{

                    data: Object.values(categories)

                }]
            },

            options: {
                responsive: true
            }
        });
}


// MONTHLY

function createMonthlyChart() {

    destroyChart(monthlyChart);

    const ctx =
        document
            .getElementById("monthlyChart")
            .getContext("2d");


    const months = {};

    transactions
        .filter(t => t.type === "expense")
        .forEach(t => {

            const month =
                t.date.substring(0, 7);

            months[month] =
                (months[month] || 0) + t.amount;
        });


    monthlyChart =
        new Chart(ctx, {

            type: "line",

            data: {

                labels: Object.keys(months),

                datasets: [{

                    label: "Expenses",

                    data: Object.values(months),

                    tension: 0.4,

                    fill: true

                }]
            },

            options: {
                responsive: true
            }
        });
}


// ANALYTICS CATEGORY

function createAnalyticsCategoryChart() {

    destroyChart(analyticsCategoryChart);

    const ctx =
        document
            .getElementById("analyticsCategoryChart")
            .getContext("2d");


    const categories = {};


    transactions
        .filter(t => t.type === "expense")
        .forEach(t => {

            categories[t.category] =
                (categories[t.category] || 0) + t.amount;
        });


    analyticsCategoryChart =
        new Chart(ctx, {

            type: "bar",

            data: {

                labels: Object.keys(categories),

                datasets: [{

                    label: "Spending",

                    data: Object.values(categories),

                    borderRadius: 8

                }]
            },

            options: {

                responsive: true,

                indexAxis: "y"
            }
        });
}


// ===============================
// REPORT
// ===============================

function updateReport() {

    const income = getIncome();

    const expense = getExpenses();

    const balance = income - expense;


    document.getElementById("reportIncome").textContent =
        formatCurrency(income);

    document.getElementById("reportExpense").textContent =
        formatCurrency(expense);

    document.getElementById("reportBalance").textContent =
        formatCurrency(balance);


    const body =
        document.getElementById("reportTableBody");


    body.innerHTML =
        transactions
            .slice()
            .sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            )
            .map(t => `

                <tr>

                    <td>${t.date}</td>

                    <td>${escapeHTML(t.description)}</td>

                    <td>${t.category}</td>

                    <td>${t.type}</td>

                    <td>
                        ${formatCurrency(t.amount)}
                    </td>

                </tr>

            `)
            .join("");
}


// ===============================
// CSV EXPORT
// ===============================

function downloadCSV() {

    if (transactions.length === 0) {

        alert("No transactions to export.");

        return;
    }


    let csv =
        "Date,Description,Category,Type,Amount\n";


    transactions.forEach(t => {

        csv +=
            `"${t.date}","${t.description}","${t.category}","${t.type}","${t.amount}"\n`;
    });


    const blob =
        new Blob([csv], {
            type: "text/csv"
        });


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "spendsphere-report.csv";

    link.click();

    URL.revokeObjectURL(url);
}


// ===============================
// THEME
// ===============================

function toggleTheme() {

    document.body.classList.toggle("dark");

    localStorage.setItem(
        "spendSphereTheme",
        document.body.classList.contains("dark")
            ? "dark"
            : "light"
    );
}


if (
    localStorage.getItem("spendSphereTheme")
    === "dark"
) {

    document.body.classList.add("dark");
}


// ===============================
// CLEAR DATA
// ===============================

function clearAllData() {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete all transactions?"
        );

    if (!confirmDelete) return;

    transactions = [];

    saveData();

    updateDashboard();

    renderTransactions();

    createCharts();
}


// ===============================
// UTILITIES
// ===============================

function formatCurrency(amount) {

    return "₹" +
        Number(amount).toLocaleString("en-IN", {
            maximumFractionDigits: 0
        });
}


function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}