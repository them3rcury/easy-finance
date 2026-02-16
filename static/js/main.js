import * as api from './api.js';
import * as ui from './ui.js';
import { initializeSettings } from './settings.js';

document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        accountsContainer: document.getElementById('accounts-container'),
        searchBar: document.getElementById('search-bar'),
        searchContainer: document.querySelector('.search-container'),
        noResultsMessage: document.getElementById('no-results-message'),
        
        addAccountModal: document.getElementById('add-account-modal'),
        openAddAccountModalBtn: document.getElementById('open-add-account-modal-btn'),
        newAccountNameInput: document.getElementById('new-account-name-modal'),
        newAccountTypeInput: document.getElementById('new-account-type-modal'),
        newAccountBalanceInput: document.getElementById('new-account-balance-modal'),
        addAccountBtn: document.getElementById('add-account-btn-modal'),
        
        editAccountModal: document.getElementById('edit-account-modal'),
        editAccountIdInput: document.getElementById('edit-account-id-modal'),
        editAccountNameInput: document.getElementById('edit-account-name-modal'),
        editAccountTypeInput: document.getElementById('edit-account-type-modal'),
        saveAccountChangesBtn: document.getElementById('save-account-changes-btn'),
        
        addTransactionModal: document.getElementById('add-transaction-modal'),
        addTransactionAccountIdInput: document.getElementById('add-transaction-account-id-modal'),
        newTransactionDescriptionInput: document.getElementById('new-transaction-description-modal'),
        newTransactionAmountInput: document.getElementById('new-transaction-amount-modal'),
        newTransactionCategorySelect: document.getElementById('new-transaction-category-select'),
        addTransactionBtnModal: document.getElementById('add-transaction-btn-modal'),
        addTransactionTypeRadios: document.querySelectorAll('input[name="transaction-type-add"]'),
        
        editTransactionModal: document.getElementById('edit-transaction-modal'),
        editTransactionIdInput: document.getElementById('edit-transaction-id-modal'),
        editTransactionDescriptionInput: document.getElementById('edit-transaction-description-modal'),
        editTransactionAmountInput: document.getElementById('edit-transaction-amount-modal'),
        editTransactionCategorySelect: document.getElementById('edit-transaction-category-select'),
        saveTransactionChangesBtn: document.getElementById('save-transaction-changes-btn'),
        editTransactionTypeRadios: document.querySelectorAll('input[name="transaction-type-edit"]'),

        manageCategoriesModal: document.getElementById('manage-categories-modal'),
        openCategoriesModalBtn: document.getElementById('open-categories-modal-btn'),
        incomeCategoriesList: document.getElementById('income-categories-list'),
        expenseCategoriesList: document.getElementById('expense-categories-list'),
        addCategoryBtns: document.querySelectorAll('.add-category-btn'),
        categoryTabs: document.querySelectorAll('.category-tab-btn'),

        manageRecurringModal: document.getElementById('manage-recurring-modal'),
        openRecurringModalBtn: document.getElementById('open-recurring-modal-btn'),
        recurringList: document.getElementById('recurring-transactions-list'),
        saveRecurringBtn: document.getElementById('save-recurring-btn'),
        cancelRecurringEditBtn: document.getElementById('cancel-recurring-edit-btn'),
        recurringTypeRadios: document.querySelectorAll('input[name="transaction-type-recurring"]'),

        settingsModal: document.getElementById('settings-modal'),
        openSettingsModalBtn: document.getElementById('open-settings-modal-btn'),
        themeSwitcherBtn: document.getElementById('theme-switcher'),
        densityRadios: document.querySelectorAll('input[name="density"]'),
        colorSchemeRadios: document.querySelectorAll('input[name="color-scheme"]'),
        dashboardTitleInput: document.getElementById('dashboard-title-input'),
        dashboardTitle: document.getElementById('dashboard-title'),
        currencySelector: document.getElementById('currency-selector'),
        currencySelectorInput: document.getElementById('currency-selector-input'),
        currencyDropdown: document.getElementById('currency-dropdown'),
        
        importModal: document.getElementById('import-modal'),
        openImportModalBtn: document.getElementById('open-import-modal-btn'),
        importAccountSelect: document.getElementById('import-account-select'),
        importFileInput: document.getElementById('import-file-input'),
        importSubmitBtn: document.getElementById('import-submit-btn'),
        importStatus: document.getElementById('import-status'),
        useAiCategorization: document.getElementById('use-ai-categorization'),

        errorToast: document.getElementById('error-toast'),
    };
    
    const onDetailsPage = document.querySelector('.details-page-container');
    let categories = [];
    let userSettings = { currency: '$' };
    let recurringTransactions = [];

    async function handleApiCall(apiFunction, callback, ...args) {
        try {
            const response = await apiFunction(...args);
            if (response && response.error) {
                 ui.showErrorToast(response.error);
                 return;
            }
            if (callback) callback();
        } catch (error) {
            console.error('API Error:', error);
            ui.showErrorToast('An unexpected error occurred.');
        }
    }
    
    async function refreshDashboard() {
        if (onDetailsPage) return; 
        try {
            const data = await api.fetchDashboardData();
            ui.setState({ accounts: data.accounts, categories: categories });
            
            ui.renderSummary(data, userSettings.currency);
            ui.renderAccounts(data.accounts, elements.accountsContainer, elements.noResultsMessage, userSettings.currency);
            
            if (data.accounts.length === 0) {
                 document.querySelector('.dashboard-summary-grid').style.display = 'none';
            } else {
                 document.querySelector('.dashboard-summary-grid').style.display = 'grid';
            }

        } catch (error) {
            console.error(error);
            ui.showErrorToast('Failed to load dashboard data.');
        }
    }

    async function refreshCategories() {
        try {
            categories = await api.fetchCategories();
            if (elements.incomeCategoriesList) {
                ui.renderCategories(
                    elements.incomeCategoriesList, 
                    elements.expenseCategoriesList, 
                    categories, 
                    handleDeleteCategory
                );
            }
            ui.setState({ accounts: ui.getState().accounts, categories: categories });
        } catch (error) {
            console.error(error);
            ui.showErrorToast('Failed to load categories.');
        }
    }

    function handleDeleteCategory(categoryId) {
        if (confirm('Are you sure you want to delete this category?')) {
            handleApiCall(api.deleteCategory, refreshCategories, categoryId);
        }
    }

    function handleCurrencyChange(newSymbol) {
        userSettings.currency = newSymbol;
        if (onDetailsPage) {
            window.location.reload();
        } else {
            refreshDashboard();
        }
    }
    
    if (elements.openAddAccountModalBtn) {
        elements.openAddAccountModalBtn.addEventListener('click', () => {
            elements.newAccountNameInput.value = '';
            elements.newAccountTypeInput.value = 'checking';
            elements.newAccountBalanceInput.value = '0.00';
            ui.openModal(elements.addAccountModal);
            elements.newAccountNameInput.focus();
        });
    }

    if(elements.addAccountBtn) {
        elements.addAccountBtn.addEventListener('click', () => {
            const name = elements.newAccountNameInput.value.trim();
            const type = elements.newAccountTypeInput.value.trim();
            const balance = parseFloat(elements.newAccountBalanceInput.value);
            if (!name) return;
            handleApiCall(api.addAccount, refreshDashboard, name, type, balance);
            ui.closeModal(elements.addAccountModal);
        });
    }

    if(elements.saveAccountChangesBtn) {
        elements.saveAccountChangesBtn.addEventListener('click', () => {
            const accountId = elements.editAccountIdInput.value;
            const name = elements.editAccountNameInput.value.trim();
            const type = elements.editAccountTypeInput.value.trim();
            if (!name) return;
            handleApiCall(api.updateAccount, refreshDashboard, accountId, name, type);
            ui.closeModal(elements.editAccountModal);
        });
    }
    
    if(elements.addTransactionBtnModal) {
        elements.addTransactionBtnModal.addEventListener('click', () => {
            const accountId = elements.addTransactionAccountIdInput.value;
            const description = elements.newTransactionDescriptionInput.value.trim();
            let amount = parseFloat(elements.newTransactionAmountInput.value);
            const categoryId = elements.newTransactionCategorySelect.value;
            
            if (!description || isNaN(amount)) return ui.showErrorToast('Description and amount are required.');
    
            const transactionType = document.querySelector('input[name="transaction-type-add"]:checked').value;
            if (transactionType === 'expense') {
                amount = -Math.abs(amount);
            }
            
            const callback = onDetailsPage ? () => window.location.reload() : refreshDashboard;
            handleApiCall(api.addTransaction, callback, accountId, description, amount, categoryId);
            ui.closeModal(elements.addTransactionModal);
        });
    }
    
    if(elements.saveTransactionChangesBtn) {
        elements.saveTransactionChangesBtn.addEventListener('click', () => {
            const transactionId = elements.editTransactionIdInput.value;
            const description = elements.editTransactionDescriptionInput.value.trim();
            let amount = parseFloat(elements.editTransactionAmountInput.value);
            const categoryId = elements.editTransactionCategorySelect.value;
            if (!description || isNaN(amount)) return ui.showErrorToast('Description and amount are required.');
    
            const transactionType = document.querySelector('input[name="transaction-type-edit"]:checked').value;
            if (transactionType === 'expense') {
                amount = -Math.abs(amount);
            }
            
            const callback = onDetailsPage ? () => window.location.reload() : refreshDashboard;
            handleApiCall(api.updateTransaction, callback, transactionId, description, amount, categoryId);
            ui.closeModal(elements.editTransactionModal);
        });
    }

    if (elements.accountsContainer) {
        elements.accountsContainer.addEventListener('click', (e) => {
            const targetBtn = e.target.closest('button');
            if (!targetBtn) {
                return;
            }

            e.preventDefault();
            const { accountId, transactionId, accountName, accountType, transactionDescription, transactionAmount, transactionCategoryId } = targetBtn.dataset;

            if (targetBtn.classList.contains('delete-account-btn')) {
                if (confirm('Are you sure you want to delete this account and all its transactions?')) {
                    handleApiCall(api.deleteAccount, refreshDashboard, accountId);
                }
            } else if (targetBtn.classList.contains('delete-transaction-btn')) {
                if (confirm('Are you sure you want to delete this transaction?')) {
                    const callback = onDetailsPage ? () => window.location.reload() : refreshDashboard;
                    handleApiCall(api.deleteTransaction, callback, transactionId);
                }
            } else if (targetBtn.classList.contains('add-transaction-to-account-btn')) {
                elements.addTransactionAccountIdInput.value = accountId;
                elements.newTransactionDescriptionInput.value = '';
                elements.newTransactionAmountInput.value = '';
                document.getElementById('type-expense-add').checked = true;
                ui.populateCategoryDropdown(elements.newTransactionCategorySelect, categories, 'expense');
                ui.openModal(elements.addTransactionModal);
                elements.newTransactionDescriptionInput.focus();
            } else if (targetBtn.classList.contains('edit-account-btn')) {
                elements.editAccountIdInput.value = accountId;
                elements.editAccountNameInput.value = decodeURIComponent(accountName);
                elements.editAccountTypeInput.value = decodeURIComponent(accountType);
                ui.openModal(elements.editAccountModal);
                elements.editAccountNameInput.focus();
            } else if (targetBtn.classList.contains('edit-transaction-btn')) {
                elements.editTransactionIdInput.value = transactionId;
                elements.editTransactionDescriptionInput.value = decodeURIComponent(transactionDescription);
                const amount = parseFloat(transactionAmount);
                elements.editTransactionAmountInput.value = Math.abs(amount);
                const transactionType = amount >= 0 ? 'income' : 'expense';
                document.getElementById(`type-${transactionType}-edit`).checked = true;
                ui.populateCategoryDropdown(elements.editTransactionCategorySelect, categories, transactionType, transactionCategoryId);
                ui.openModal(elements.editTransactionModal);
                elements.editTransactionDescriptionInput.focus();
            }
        });
    }
    
    const detailsPageContainer = document.querySelector('.details-page-container');
    if (detailsPageContainer) {
        detailsPageContainer.addEventListener('click', e => {
            const targetBtn = e.target.closest('button');
            if (!targetBtn) return;

            const { transactionId, transactionDescription, transactionAmount, transactionCategoryId } = targetBtn.dataset;

            if (targetBtn.classList.contains('delete-transaction-btn')) {
                if (confirm('Are you sure you want to delete this transaction?')) {
                    handleApiCall(api.deleteTransaction, () => window.location.reload(), transactionId);
                }
            } else if (targetBtn.classList.contains('edit-transaction-btn')) {
                elements.editTransactionIdInput.value = transactionId;
                elements.editTransactionDescriptionInput.value = decodeURIComponent(transactionDescription);
                const amount = parseFloat(transactionAmount);
                elements.editTransactionAmountInput.value = Math.abs(amount);
                
                const transactionType = amount >= 0 ? 'income' : 'expense';
                document.getElementById(`type-${transactionType}-edit`).checked = true;
                
                ui.populateCategoryDropdown(elements.editTransactionCategorySelect, categories, transactionType, transactionCategoryId);
                ui.openModal(elements.editTransactionModal);
                elements.editTransactionDescriptionInput.focus();
            }
        });
    }

    const openAddTransactionBtnDetails = document.getElementById('open-add-transaction-modal-btn');
    if (openAddTransactionBtnDetails && onDetailsPage) {
        openAddTransactionBtnDetails.addEventListener('click', (e) => {
            const accountId = e.currentTarget.dataset.accountId;
            elements.addTransactionAccountIdInput.value = accountId;
            elements.newTransactionDescriptionInput.value = '';
            elements.newTransactionAmountInput.value = '';
            document.getElementById('type-expense-add').checked = true;
            ui.populateCategoryDropdown(elements.newTransactionCategorySelect, categories, 'expense');
            ui.openModal(elements.addTransactionModal);
            elements.newTransactionDescriptionInput.focus();
        });
    }
    
    if(elements.addTransactionTypeRadios) {
        elements.addTransactionTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                ui.populateCategoryDropdown(elements.newTransactionCategorySelect, categories, e.target.value);
            });
        });
    }

    if(elements.editTransactionTypeRadios) {
        elements.editTransactionTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                ui.populateCategoryDropdown(elements.editTransactionCategorySelect, categories, e.target.value);
            });
        });
    }
    
    if (elements.openCategoriesModalBtn) {
        elements.openCategoriesModalBtn.addEventListener('click', () => {
            ui.openModal(elements.manageCategoriesModal);
        });
    }

    if (elements.categoryTabs) {
        elements.categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                elements.categoryTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.querySelectorAll('.category-tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById(`${tab.dataset.tab}-tab-content`).classList.add('active');
            });
        });
    }

    if (elements.addCategoryBtns) {
        elements.addCategoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                const input = document.querySelector(`#${type}-tab-content .new-category-name`);
                const name = input.value.trim();
                if (!name) return ui.showErrorToast('Category name is required.');
                handleApiCall(api.addCategory, refreshCategories, name, type);
                input.value = '';
            });
        });
    }

    async function refreshRecurring() {
        try {
            recurringTransactions = await api.fetchRecurring();
            ui.renderRecurringTransactions(
                elements.recurringList, 
                recurringTransactions, 
                userSettings.currency,
                handleEditRecurring,
                handleDeleteRecurring,
                handleToggleRecurring
            );
        } catch (error) {
            console.error(error);
            ui.showErrorToast('Failed to load recurring transactions.');
        }
    }

    function handleEditRecurring(item) {
        ui.populateRecurringForm(item);
    }

    function handleDeleteRecurring(id) {
        if (confirm('Are you sure you want to permanently delete this recurring transaction?')) {
            handleApiCall(api.deleteRecurring, refreshRecurring, id);
        }
    }

    function handleToggleRecurring(id) {
        handleApiCall(api.toggleRecurring, refreshRecurring, id);
    }

    if (elements.openRecurringModalBtn) {
        elements.openRecurringModalBtn.addEventListener('click', () => {
            refreshRecurring();
            ui.resetRecurringForm();
            const accounts = ui.getState().accounts;
            const recurringAccountSelect = document.getElementById('recurring-account-select');
            ui.populateAccountDropdown(recurringAccountSelect, accounts);
            
            const recurringCategorySelect = document.getElementById('recurring-category-select');
            ui.populateCategoryDropdown(recurringCategorySelect, categories, 'expense');
            
            ui.openModal(elements.manageRecurringModal);
        });
    }

    if (elements.saveRecurringBtn) {
        elements.saveRecurringBtn.addEventListener('click', async () => {
            const id = document.getElementById('recurring-transaction-id').value;
            const name = document.getElementById('recurring-name').value.trim();
            let amount = parseFloat(document.getElementById('recurring-amount').value);
            const startDateValue = document.getElementById('recurring-start-date').value;
            
            if (!name || isNaN(amount) || !startDateValue) {
                return ui.showErrorToast('Name, amount, and start date are required.');
            }

            const type = document.querySelector('input[name="transaction-type-recurring"]:checked').value;
            if (type === 'expense') {
                amount = -Math.abs(amount);
            }

            const data = {
                name: name,
                amount: amount,
                account_id: document.getElementById('recurring-account-select').value,
                category_id: document.getElementById('recurring-category-select').value,
                frequency: document.getElementById('recurring-frequency-select').value,
                start_date: new Date(startDateValue).toISOString(),
                end_date: document.getElementById('recurring-end-date').value ? new Date(document.getElementById('recurring-end-date').value).toISOString() : null,
            };

            if (id) {
                await handleApiCall(api.updateRecurring, refreshRecurring, id, data);
            } else {
                await handleApiCall(api.addRecurring, refreshRecurring, data);
            }
            ui.resetRecurringForm();
            refreshDashboard();
        });
    }

    if(elements.cancelRecurringEditBtn) {
        elements.cancelRecurringEditBtn.addEventListener('click', () => {
            ui.resetRecurringForm();
        });
    }

    if(elements.recurringTypeRadios) {
        elements.recurringTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                ui.populateCategoryDropdown(document.getElementById('recurring-category-select'), categories, e.target.value);
            });
        });
    }

    if (elements.searchBar) {
        let debounceTimer;
        elements.searchBar.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const query = elements.searchBar.value.toLowerCase().trim();
                ui.handleSearch(query, elements.noResultsMessage);
            }, 300);
        });

        elements.searchContainer.addEventListener('click', (e) => {
            if (e.target === elements.searchContainer) {
                elements.searchBar.focus();
            }
        });

        elements.searchBar.addEventListener('focus', () => {
            elements.searchContainer.classList.add('focused');
        });

        elements.searchBar.addEventListener('blur', () => {
            if (elements.searchBar.value === '') {
                elements.searchContainer.classList.remove('focused');
            }
        });
    }

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            ui.closeModal(btn.closest('.modal'))
        });
    });

    if (elements.openSettingsModalBtn) {
        elements.openSettingsModalBtn.addEventListener('click', () => ui.openModal(elements.settingsModal));
    }

    if (elements.openImportModalBtn) {
        elements.openImportModalBtn.addEventListener('click', () => {
             const accounts = ui.getState().accounts;
             if (accounts.length === 0) {
                 ui.showErrorToast('Please create an account first.');
                 return;
             }
             ui.populateAccountDropdown(elements.importAccountSelect, accounts);
             elements.importFileInput.value = '';
             elements.importStatus.textContent = '';
             elements.importStatus.style.color = '';
             ui.openModal(elements.importModal);
        });
    }

    if (elements.importSubmitBtn) {
        elements.importSubmitBtn.addEventListener('click', async () => {
             const accountId = elements.importAccountSelect.value;
             const file = elements.importFileInput.files[0];
             const useAi = elements.useAiCategorization.checked;

             if (!file) {
                 return ui.showErrorToast('Please select a file to import.');
             }

             elements.importSubmitBtn.disabled = true;
             elements.importSubmitBtn.textContent = 'Importing...';
             elements.importStatus.textContent = 'Uploading and processing... This may take a moment.';
             elements.importStatus.style.color = 'var(--text-primary)';

             try {
                 const result = await api.uploadTransactions(file, accountId, useAi);
                 if (result.error) {
                     ui.showErrorToast(result.error);
                     elements.importStatus.textContent = 'Error: ' + result.error;
                     elements.importStatus.style.color = 'var(--destructive)';
                 } else {
                     ui.showErrorToast(`Successfully imported ${result.count} transactions.`);
                     ui.closeModal(elements.importModal);
                     if (onDetailsPage) {
                        window.location.reload();
                     } else {
                        refreshDashboard();
                     }
                 }
             } catch (error) {
                 console.error(error);
                 ui.showErrorToast('Failed to import transactions.');
                 elements.importStatus.textContent = 'An unexpected error occurred.';
                 elements.importStatus.style.color = 'var(--destructive)';
             } finally {
                 elements.importSubmitBtn.disabled = false;
                 elements.importSubmitBtn.textContent = 'Import Data';
             }
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.visible').forEach(ui.closeModal);
        }
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            ui.closeModal(e.target);
        }
    });

    async function initializeApp() {
        try {
            await refreshCategories();
            const settings = await api.fetchSettings();
            userSettings = settings;
            initializeSettings(elements, userSettings, handleCurrencyChange);
            
            if (!onDetailsPage) {
                await refreshDashboard();
            }
        } catch (error) {
            console.error('Failed to initialize data:', error);
            ui.showErrorToast('Could not load user settings.');
        }
    }

    initializeApp();
});