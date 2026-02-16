let state = { accounts: [], categories: [] };
let expenseChart = null;

function formatNumber(number) {
    if (typeof number !== 'number') {
        number = 0;
    }
    return new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(number);
}

export function getState() {
    return state;
}

export function setState(newState) {
    state = newState;
}

export function openModal(modal) {
    modal.classList.add('visible');
    modal.querySelector('input, button, select')?.focus();
}

export function closeModal(modal) {
    modal.classList.remove('visible');
}

export function showErrorToast(message) {
    const toast = document.getElementById('error-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => {
        toast.classList.remove('visible');
    }, 3000);
}

function createAccountElement(account, currencySymbol) {
    const div = document.createElement('div');
    div.className = 'account';
    div.dataset.accountId = account.id;
    div.dataset.accountName = account.name.toLowerCase();

    const transactionsList = account.transactions.map(t => {
        const amountClass = t.amount >= 0 ? 'positive' : 'negative';
        const formattedAmount = `${t.amount >= 0 ? '+' : ''}${formatNumber(Math.abs(t.amount))}`;
        const transactionDate = new Date(t.date).toLocaleDateString();

        return `
            <li class="transaction-item" data-transaction-description="${t.description.toLowerCase()}" data-transaction-category="${(t.category || '').toLowerCase()}">
                <div class="transaction-details">
                    <span class="transaction-description">${t.description}</span>
                    <span class="transaction-date">${t.category} &middot; ${transactionDate}</span>
                </div>
                <div class="transaction-amount ${amountClass}">${currencySymbol}${formattedAmount}</div>
                <div class="transaction-actions">
                    <button class="icon-btn edit-transaction-btn" title="Edit Transaction" 
                        data-transaction-id="${t.id}" 
                        data-transaction-description="${encodeURIComponent(t.description)}" 
                        data-transaction-amount="${t.amount}"
                        data-transaction-category-id="${t.category_id}">
                        <span class="material-icons-outlined">edit</span>
                    </button>
                    <button class="icon-btn delete-btn delete-transaction-btn" title="Delete Transaction" data-transaction-id="${t.id}">
                        <span class="material-icons-outlined">delete</span>
                    </button>
                </div>
            </li>
        `;
    }).join('');

    div.innerHTML = `
        <div class="account-header">
            <a href="/account/${account.id}" class="account-details-link" title="View Details">
                <h3>
                    <span class="material-icons-outlined">account_balance_wallet</span>
                    <span>${account.name}</span>
                </h3>
            </a>
            <div class="account-balance">${currencySymbol}${formatNumber(account.balance)}</div>
            <div class="account-actions">
                <button class="icon-btn add-transaction-to-account-btn" data-account-id="${account.id}" title="Add Transaction">
                    <span class="material-icons-outlined">add</span>
                </button>
                <button class="icon-btn edit-account-btn" data-account-id="${account.id}" data-account-name="${encodeURIComponent(account.name)}" data-account-type="${encodeURIComponent(account.type)}">
                    <span class="material-icons-outlined">edit</span>
                </button>
                <button class="icon-btn delete-btn delete-account-btn" data-account-id="${account.id}">
                    <span class="material-icons-outlined">delete</span>
                </button>
            </div>
        </div>
        <ul class="transactions-list" data-account-id="${account.id}">${transactionsList}</ul>
        ${account.transactions.length > 0 ? `
        <div class="view-all-container">
            <a href="/account/${account.id}" class="view-all-btn">
                <span>View All</span>
                <span class="material-icons-outlined">arrow_forward</span>
            </a>
        </div>` : ''}
    `;
    return div;
}

export function renderAccounts(accounts, accountsContainer, noResultsMessage, currencySymbol) {
    accountsContainer.innerHTML = '';
    noResultsMessage.style.display = 'none';

    if (accounts.length === 0 && document.getElementById('search-bar').value === '') {
        accountsContainer.style.display = "none";
        return;
    }
    accountsContainer.style.display = "grid";

    accounts.forEach(account => {
        const accountElement = createAccountElement(account, currencySymbol);
        accountsContainer.appendChild(accountElement);
    });
}

export function renderSummary(summaryData, currencySymbol) {
    const { summaryStats, recentTransactions, expenseBreakdown } = summaryData;

    document.querySelector('#total-income-card p').textContent = `${currencySymbol}${formatNumber(summaryStats.totalIncome)}`;
    document.querySelector('#total-expense-card p').textContent = `${currencySymbol}${formatNumber(summaryStats.totalExpense)}`;
    document.querySelector('#total-balance-card p').textContent = `${currencySymbol}${formatNumber(summaryStats.totalBalance)}`;

    const recentList = document.getElementById('recent-transactions-list');
    recentList.innerHTML = recentTransactions.map(t => {
         const amountClass = t.amount >= 0 ? 'positive' : 'negative';
         const formattedAmount = t.amount >= 0 ? `+${formatNumber(t.amount)}` : formatNumber(t.amount);
         const transactionDate = new Date(t.date).toLocaleDateString();
         return `
            <li class="transaction-item">
                <div class="transaction-details">
                    <span class="transaction-description">${t.description}</span>
                    <span class="transaction-date">${t.category}</span>
                </div>
                <div class="transaction-amount ${amountClass}">${currencySymbol}${formattedAmount}</div>
            </li>
         `;
    }).join('');
     if (recentTransactions.length === 0) {
        recentList.innerHTML = `<li class="empty-list-message" style="display: block; padding: 2rem 0;">No recent transactions.</li>`;
    }

    const chartCanvas = document.getElementById('expense-chart');
    const chartWrapper = document.querySelector('.chart-wrapper');

    if (expenseChart) {
        expenseChart.destroy();
    }
    
    if (expenseBreakdown.length === 0) {
        chartWrapper.innerHTML = `<div class="empty-list-message" style="display: flex; align-items:center; justify-content:center; height: 100%;">No expenses in the last 30 days.</div>`;
        return;
    }
    if (!chartCanvas) {
        chartWrapper.innerHTML = '<canvas id="expense-chart"></canvas>';
    }

    const ctx = document.getElementById('expense-chart').getContext('2d');
    const styles = getComputedStyle(document.documentElement);

    const baseColors = [
        'hsl(216, 90%, 65%)',  // Blue
        'hsl(160, 80%, 55%)',  // Mint
        'hsl(45, 95%, 60%)',   // Yellow
        'hsl(25, 95%, 65%)',   // Orange
        'hsl(340, 85%, 65%)',  // Pink
        'hsl(270, 80%, 70%)',  // Purple
        'hsl(190, 85%, 60%)',  // Cyan
        'hsl(10, 85%, 65%)',   // Red-Orange
        'hsl(120, 50%, 65%)',  // Green
        'hsl(240, 60%, 70%)',  // Indigo
    ];

    const generateColors = (count) => {
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        return colors;
    };

    const chartColors = generateColors(expenseBreakdown.length);
    const borderColor = styles.getPropertyValue('--background').trim(); 
    
    // Sort logic could go here if needed, e.g. sort by total desc

    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: expenseBreakdown.map(e => e.category),
            datasets: [{
                label: 'Expenses',
                data: expenseBreakdown.map(e => e.total),
                backgroundColor: chartColors,
                borderColor: borderColor,
                borderWidth: 2,
                borderRadius: 4, 
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 15,
                        color: styles.getPropertyValue('--muted-foreground').trim(),
                        font: {
                            family: "'Inter', sans-serif",
                            size: 11
                        }
                    }
                },
                tooltip: {
                    backgroundColor: styles.getPropertyValue('--card').trim().replace('0.6', '0.98'),
                    titleColor: styles.getPropertyValue('--foreground').trim(),
                    bodyColor: styles.getPropertyValue('--foreground').trim(),
                    titleFont: { family: "'Inter', sans-serif", size: 13, weight: '600' },
                    bodyFont: { family: "'Inter', sans-serif", size: 12 },
                    padding: 12,
                    cornerRadius: 8,
                    borderColor: styles.getPropertyValue('--border').trim(),
                    borderWidth: 1,
                    displayColors: true,
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += `${currencySymbol}${formatNumber(context.parsed)}`;
                            }
                            return label;
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
}


export function handleSearch(query, noResultsMessage) {
    let hasVisibleAccounts = false;
    document.querySelectorAll('.account').forEach(account => {
        const accountName = account.dataset.accountName;
        let accountHasVisibleTransactions = false;

        account.querySelectorAll('.transaction-item').forEach(transaction => {
            const transactionDescription = transaction.dataset.transactionDescription;
            const transactionCategory = transaction.dataset.transactionCategory;
            const isMatch = transactionDescription.includes(query) || transactionCategory.includes(query);
            transaction.style.display = isMatch ? '' : 'none';
            if (isMatch) accountHasVisibleTransactions = true;
        });

        const isAccountMatch = accountName.includes(query) || accountHasVisibleTransactions;
        account.style.display = isAccountMatch ? '' : 'none';
        if (isAccountMatch) hasVisibleAccounts = true;
    });
    noResultsMessage.style.display = hasVisibleAccounts ? 'none' : 'block';
}

export function renderCategories(incomeContainer, expenseContainer, categories, deleteCallback) {
    incomeContainer.innerHTML = '';
    expenseContainer.innerHTML = '';

    const incomeCategories = categories.filter(c => c.type === 'income');
    const expenseCategories = categories.filter(c => c.type === 'expense');

    incomeContainer.parentElement.querySelector('.empty-list-message').style.display = incomeCategories.length === 0 ? 'block' : 'none';
    expenseContainer.parentElement.querySelector('.empty-list-message').style.display = expenseCategories.length === 0 ? 'block' : 'none';

    const createCategoryItem = (cat) => {
        const item = document.createElement('li');
        item.className = 'category-item';
        item.innerHTML = `<span>${cat.name}</span>`;
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = `<span class="material-icons-outlined">close</span>`;
        deleteBtn.onclick = () => deleteCallback(cat.id);
        item.appendChild(deleteBtn);
        return item;
    };

    incomeCategories.forEach(cat => incomeContainer.appendChild(createCategoryItem(cat)));
    expenseCategories.forEach(cat => expenseContainer.appendChild(createCategoryItem(cat)));
}


export function populateCategoryDropdown(selectElement, categories, type, selectedId = null) {
    selectElement.innerHTML = '<option value="">Uncategorized</option>';
    categories
        .filter(c => c.type === type)
        .forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.name;
            if (c.id == selectedId) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        });
}

export function renderRecurringTransactions(container, items, currencySymbol, editCallback, deleteCallback, toggleCallback) {
    container.innerHTML = '';
    document.getElementById('recurring-empty-message').style.display = items.length === 0 ? 'block' : 'none';

    items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'recurring-item';
        if (!item.is_active) li.classList.add('inactive');
        
        const amountClass = item.amount >= 0 ? 'positive' : 'negative';
        const formattedAmount = `${currencySymbol}${formatNumber(Math.abs(item.amount))}`;
        const nextDueDate = new Date(item.next_due_date).toLocaleDateString();

        const isDebt = item.payment_type === 'debt';
        const badgeHtml = isDebt 
            ? `<span class="recurring-item-badge"><span class="material-icons-outlined">credit_card</span>Debt</span>` 
            : '';
        
        let progressHtml = '';
        if (isDebt && item.total_amount) {
            const percent = item.progress_percent || 0;
            const paid = item.paid_amount || 0;
            const total = item.total_amount;
            const remaining = Math.max(0, total - paid);
            const paymentsLeft = item.payments_remaining || 0;
            
            const freqLabels = { daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year' };
            const freqLabelsPlural = { daily: 'days', weekly: 'weeks', monthly: 'months', yearly: 'years' };
            const freqLabel = paymentsLeft === 1 ? (freqLabels[item.frequency] || 'payment') : (freqLabelsPlural[item.frequency] || 'payments');
            
            progressHtml = `
                <div class="debt-progress-container">
                    <div class="debt-progress-bar">
                        <div class="debt-progress-fill" style="width: ${percent}%"></div>
                    </div>
                    <div class="debt-progress-info">
                        <span>${currencySymbol}${formatNumber(paid)} / ${currencySymbol}${formatNumber(total)}</span>
                        <span>${paymentsLeft > 0 ? `~${paymentsLeft} ${freqLabel} left` : (percent >= 100 ? 'Paid off!' : '')}</span>
                    </div>
                </div>
            `;
        }

        li.innerHTML = `
            <div class="recurring-item-header">
                <span class="recurring-item-name">${item.name} ${badgeHtml}</span>
                <span class="recurring-item-amount ${amountClass}">${formattedAmount}</span>
            </div>
            ${progressHtml}
            <div class="recurring-item-details">
                <span class="recurring-item-info">Next: ${nextDueDate} &bull; ${item.account_name}</span>
                <div class="recurring-item-actions">
                    <button class="icon-btn edit-recurring-btn" title="Edit"><span class="material-icons-outlined">edit</span></button>
                    <button class="icon-btn toggle-recurring-btn" title="${item.is_active ? 'Pause' : 'Resume'}"><span class="material-icons-outlined">${item.is_active ? 'pause' : 'play_arrow'}</span></button>
                    <button class="icon-btn delete-btn delete-recurring-btn" title="Delete"><span class="material-icons-outlined">delete</span></button>
                </div>
            </div>
        `;
        li.querySelector('.edit-recurring-btn').addEventListener('click', () => editCallback(item));
        li.querySelector('.delete-recurring-btn').addEventListener('click', () => deleteCallback(item.id));
        li.querySelector('.toggle-recurring-btn').addEventListener('click', () => toggleCallback(item.id));

        container.appendChild(li);
    });
}

export function populateRecurringForm(item) {
    document.getElementById('recurring-transaction-id').value = item.id;
    document.getElementById('recurring-form-title').textContent = 'Edit Recurring Transaction';
    document.getElementById('recurring-name').value = item.name;

    const amount = parseFloat(item.amount);
    const type = amount >= 0 ? 'income' : 'expense';
    document.getElementById(`type-${type}-recurring`).checked = true;
    document.getElementById('recurring-amount').value = Math.abs(amount);

    document.getElementById('recurring-account-select').value = item.account_id;
    
    const event = new Event('change', { bubbles: true });
    document.getElementById(`type-${type}-recurring`).dispatchEvent(event);
    
    document.getElementById('recurring-category-select').value = item.category_id || '';
    
    document.getElementById('recurring-frequency-select').value = item.frequency;

    document.getElementById('recurring-start-date').value = item.start_date.split('T')[0];
    document.getElementById('recurring-end-date').value = item.end_date ? item.end_date.split('T')[0] : '';
    
    // Handle payment type
    const paymentType = item.payment_type || 'standard';
    document.getElementById('recurring-payment-type').value = paymentType;
    
    document.querySelectorAll('.recurring-type-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.paymentType === paymentType);
    });
    
    const isDebt = paymentType === 'debt';
    document.getElementById('debt-details-section').style.display = isDebt ? '' : 'none';
    document.getElementById('debt-calc-section').style.display = isDebt ? '' : 'none';
    document.getElementById('debt-calculator-info').style.display = isDebt ? '' : 'none';
    document.getElementById('recurring-income-expense-toggle').style.display = isDebt ? 'none' : '';
    
    if (isDebt) {
        document.getElementById('recurring-total-amount').value = item.total_amount || '';
        document.getElementById('recurring-paid-amount').value = item.paid_amount || 0;
        // Force expense for debt
        document.getElementById('type-expense-recurring').checked = true;
        // Default to by-amount method when editing
        document.querySelector('input[name="debt-method"][value="by-amount"]').checked = true;
        const amountInput = document.getElementById('recurring-amount');
        amountInput.readOnly = false;
        amountInput.classList.remove('auto-calculated');
        const freqNames = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };
        amountInput.placeholder = `${freqNames[item.frequency] || ''} Payment Amount`;
        document.getElementById('debt-amount-label').textContent = `${freqNames[item.frequency] || ''} Payment Amount`;
    }

    // Switch to form view on mobile
    document.querySelectorAll('.recurring-view-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.view === 'form');
    });
    document.querySelectorAll('[data-view-panel]').forEach(panel => {
        panel.style.display = panel.dataset.viewPanel === 'form' ? '' : 'none';
    });

    document.getElementById('save-recurring-btn').textContent = 'Save Changes';
    document.getElementById('cancel-recurring-edit-btn').style.display = 'inline-flex';
}

export function resetRecurringForm() {
    document.getElementById('recurring-transaction-id').value = '';
    document.getElementById('recurring-form-title').textContent = 'Add New Recurring Transaction';
    document.getElementById('recurring-name').value = '';
    document.getElementById('recurring-amount').value = '';
    document.getElementById('type-expense-recurring').checked = true;
    
    const event = new Event('change', { bubbles: true });
    document.getElementById('type-expense-recurring').dispatchEvent(event);

    if (document.getElementById('recurring-account-select').options.length > 0) {
        document.getElementById('recurring-account-select').selectedIndex = 0;
    }
    if (document.getElementById('recurring-category-select').options.length > 0) {
        document.getElementById('recurring-category-select').selectedIndex = 0;
    }
    
    document.getElementById('recurring-frequency-select').value = 'monthly';
    document.getElementById('recurring-start-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('recurring-end-date').value = '';

    // Reset payment type
    document.getElementById('recurring-payment-type').value = 'standard';
    document.querySelectorAll('.recurring-type-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.paymentType === 'standard');
    });
    document.getElementById('debt-details-section').style.display = 'none';
    document.getElementById('debt-calc-section').style.display = 'none';
    document.getElementById('debt-calculator-info').style.display = 'none';
    document.getElementById('recurring-income-expense-toggle').style.display = '';
    document.getElementById('recurring-total-amount').value = '';
    document.getElementById('recurring-paid-amount').value = '0';
    
    // Reset amount input state
    const amountInput = document.getElementById('recurring-amount');
    amountInput.readOnly = false;
    amountInput.classList.remove('auto-calculated');
    amountInput.placeholder = 'Amount';
    
    // Reset debt method radio
    const byAmountRadio = document.querySelector('input[name="debt-method"][value="by-amount"]');
    if (byAmountRadio) byAmountRadio.checked = true;

    // Switch back to list view on mobile
    document.querySelectorAll('.recurring-view-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.view === 'list');
    });
    document.querySelectorAll('[data-view-panel]').forEach(panel => {
        panel.style.display = panel.dataset.viewPanel === 'list' ? '' : 'none';
    });

    document.getElementById('save-recurring-btn').textContent = 'Add Recurring Transaction';
    document.getElementById('cancel-recurring-edit-btn').style.display = 'none';
}

export function populateAccountDropdown(selectElement, accounts) {
    selectElement.innerHTML = '';
    accounts.forEach(acc => {
        const option = document.createElement('option');
        option.value = acc.id;
        option.textContent = acc.name;
        selectElement.appendChild(option);
    });
}