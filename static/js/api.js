export async function fetchDashboardData() {
    const response = await fetch('/api/dashboard');
    if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
    }
    return response.json();
}

export async function addAccount(name, type, balance) {
    const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, balance }),
    });
    return response.json();
}

export async function updateAccount(accountId, name, type) {
    await fetch(`/api/accounts/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type }),
    });
}

export async function deleteAccount(accountId) {
    await fetch(`/api/accounts/${accountId}`, { method: 'DELETE' });
}

export async function addTransaction(accountId, description, amount, categoryId) {
    const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId, description, amount, category_id: categoryId }),
    });
    return response.json();
}

export async function updateTransaction(transactionId, description, amount, categoryId) {
    await fetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, amount, category_id: categoryId }),
    });
}

export async function deleteTransaction(transactionId) {
    await fetch(`/api/transactions/${transactionId}`, { method: 'DELETE' });
}

export async function fetchCategories() {
    const response = await fetch('/api/categories');
    if (!response.ok) {
        throw new Error('Failed to fetch categories');
    }
    return response.json();
}

export async function addCategory(name, type) {
    const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type }),
    });
    return response.json();
}

export async function deleteCategory(categoryId) {
    await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
}

export async function fetchSettings() {
    const response = await fetch('/api/settings');
    if (!response.ok) {
        throw new Error('Failed to fetch settings');
    }
    return response.json();
}

export async function updateSettings(settings) {
    await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
    });
}

export async function fetchRecurring() {
    const response = await fetch('/api/recurring');
    if (!response.ok) throw new Error('Failed to fetch recurring transactions');
    return response.json();
}

export async function addRecurring(data) {
    const response = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

export async function updateRecurring(id, data) {
    const response = await fetch(`/api/recurring/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

export async function deleteRecurring(id) {
    await fetch(`/api/recurring/${id}`, { method: 'DELETE' });
}

export async function toggleRecurring(id) {
    await fetch(`/api/recurring/${id}/toggle`, { method: 'PUT' });
}