document.addEventListener('DOMContentLoaded', () => {
    const expenseForm = document.getElementById('expense-form');
    const expensesTableBody = document.querySelector('#expenses-table tbody');
    const totalExpensesElement = document.getElementById('total-expenses');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const htmlElement = document.documentElement;

    let dailyChart, paymentChart;

    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

    // Função para alternar o tema
    function toggleTheme() {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggleBtn.querySelector('i').className = `fas fa-${newTheme === 'light' ? 'moon' : 'sun'}`;
        updateCharts();
    }

    // Define o tema inicial
    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlElement.setAttribute('data-theme', savedTheme);
    themeToggleBtn.querySelector('i').className = `fas fa-${savedTheme === 'light' ? 'moon' : 'sun'}`;

    themeToggleBtn.addEventListener('click', toggleTheme);

    function renderExpenses() {
        expensesTableBody.innerHTML = '';
        let total = 0;

        expenses.forEach((expense, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${expense.description}</td>
                <td>R$ ${expense.amount.toFixed(2).replace('.', ',')}</td>
                <td>${expense.date}</td>
                <td>${expense.method}</td>
                <td><button class="btn-delete" data-index="${index}"><i class="fas fa-trash-alt"></i></button></td>
            `;
            expensesTableBody.appendChild(row);
            total += expense.amount;
        });

        totalExpensesElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
        setupDeleteButtons();
        updateCharts();
    }

    function saveExpenses() {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    }

    function setupDeleteButtons() {
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.closest('.btn-delete').dataset.index;
                expenses.splice(index, 1);
                saveExpenses();
                renderExpenses();
            });
        });
    }

    function updateCharts() {
        const isDarkMode = htmlElement.getAttribute('data-theme') === 'dark';
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--light-text-color').trim();
        const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
        const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim();
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();

        // Dados para o gráfico de gastos diários (últimos 30 dias)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailyData = expenses
            .filter(e => new Date(e.date) >= thirtyDaysAgo)
            .reduce((acc, expense) => {
                const date = expense.date;
                acc[date] = (acc[date] || 0) + expense.amount;
                return acc;
            }, {});

        const dailyLabels = Object.keys(dailyData).sort();
        const dailyValues = dailyLabels.map(label => dailyData[label]);

        if (dailyChart) {
            dailyChart.destroy();
        }
        dailyChart = new Chart(document.getElementById('daily-expenses-chart'), {
            type: 'line',
            data: {
                labels: dailyLabels,
                datasets: [{
                    label: 'Gasto (R$)',
                    data: dailyValues,
                    backgroundColor: `${primaryColor}20`,
                    borderColor: primaryColor,
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: textColor }
                    }
                }
            }
        });

        // Dados para o gráfico de métodos de pagamento
        const paymentData = expenses.reduce((acc, expense) => {
            acc[expense.method] = (acc[expense.method] || 0) + expense.amount;
            return acc;
        }, {});

        const paymentLabels = Object.keys(paymentData);
        const paymentValues = paymentLabels.map(label => paymentData[label]);

        const paymentColors = [
            primaryColor,
            secondaryColor,
            accentColor
        ];

        if (paymentChart) {
            paymentChart.destroy();
        }
        paymentChart = new Chart(document.getElementById('payment-method-chart'), {
            type: 'pie',
            data: {
                labels: paymentLabels,
                datasets: [{
                    data: paymentValues,
                    backgroundColor: paymentColors,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: textColor }
                    }
                }
            }
        });
    }

    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const description = document.getElementById('expense-description').value;
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const date = document.getElementById('expense-date').value;
        const method = document.getElementById('expense-method').value;

        const newExpense = {
            description,
            amount,
            date,
            method
        };

        expenses.push(newExpense);
        saveExpenses();
        renderExpenses();
        expenseForm.reset();
    });

    renderExpenses();
});