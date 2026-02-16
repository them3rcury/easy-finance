import * as api from './api.js';

const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar' }, 
    { code: 'EUR', symbol: '€', name: 'Euro' }, 
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira' }, 
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }, 
    { code: 'GBP', symbol: '£', name: 'British Pound' }, 
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }, 
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' }, 
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' }, 
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' }, 
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' }, 
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' }, 
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' }, 
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' }, 
    { code: 'RUB', symbol: '₽', name: 'Russian Ruble' }
];

function applyAndSave(key, value, attribute, element) {
    localStorage.setItem(key, value);
    if (attribute && element) {
        element.setAttribute(attribute, value);
    }
}

function initializeCurrencySelector(elements, settings, onCurrencyChange) {
    const { currencySelectorInput, currencyDropdown } = elements;
    
    currencyDropdown.innerHTML = '';
    CURRENCIES.forEach(currency => {
        const item = document.createElement('div');
        item.className = 'currency-item';
        item.dataset.symbol = currency.symbol;
        item.innerHTML = `
            <div>
                <span class="symbol">${currency.symbol}</span>
                <span>${currency.code}</span>
            </div>
            <span class="name">${currency.name}</span>`;
        
        item.addEventListener('click', () => {
            const newSymbol = item.dataset.symbol;
            currencySelectorInput.value = newSymbol;
            api.updateSettings({ currency: newSymbol });
            onCurrencyChange(newSymbol);
            currencyDropdown.classList.remove('visible');
        });
        currencyDropdown.appendChild(item);
    });

    currencySelectorInput.addEventListener('focus', () => currencyDropdown.classList.add('visible'));
    document.addEventListener('click', (e) => {
        if (!elements.currencySelector.contains(e.target)) {
            currencyDropdown.classList.remove('visible');
        }
    });

    currencySelectorInput.addEventListener('input', () => {
        const query = currencySelectorInput.value.toLowerCase();
        document.querySelectorAll('.currency-item').forEach(item => {
            const name = item.querySelector('.name').textContent.toLowerCase();
            const symbol = item.dataset.symbol.toLowerCase();
            const code = item.querySelector('span:not(.name):not(.symbol)').textContent.toLowerCase();
            const isMatch = name.includes(query) || symbol.includes(query) || code.includes(query);
            item.classList.toggle('filtered-out', !isMatch);
        });
    });
}

export function initializeSettings(elements, settings, onCurrencyChange) {
    const {
        themeSwitcherBtn, densityRadios, colorSchemeRadios,
        dashboardTitleInput, dashboardTitle, currencySelectorInput
    } = elements;

    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyAndSave('theme', savedTheme, 'data-theme', document.documentElement);

    const savedDensity = localStorage.getItem('dashboardDensity') || 'default';
    applyAndSave('dashboardDensity', savedDensity, 'data-density', document.body);
    document.getElementById(`density-${savedDensity}`).checked = true;

    const savedColorScheme = localStorage.getItem('dashboardColorScheme') || 'default';
    applyAndSave('dashboardColorScheme', savedColorScheme, 'data-color-scheme', document.documentElement);
    document.getElementById(`color-${savedColorScheme}`).checked = true;
    
    const savedTitle = localStorage.getItem('dashboardTitle') || 'My Dashboard';
    if (dashboardTitle) {
        dashboardTitle.textContent = savedTitle;
    }
    dashboardTitleInput.value = savedTitle;

    currencySelectorInput.value = settings.currency;
    initializeCurrencySelector(elements, settings, onCurrencyChange);

    if (themeSwitcherBtn) {
        themeSwitcherBtn.addEventListener('click', () => {
            const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            applyAndSave('theme', newTheme, 'data-theme', document.documentElement);
        });
    }

    densityRadios.forEach(radio => radio.addEventListener('change', (e) => applyAndSave('dashboardDensity', e.target.value, 'data-density', document.body)));
    colorSchemeRadios.forEach(radio => radio.addEventListener('change', (e) => applyAndSave('dashboardColorScheme', e.target.value, 'data-color-scheme', document.documentElement)));
    
    dashboardTitleInput.addEventListener('input', (e) => {
        if (dashboardTitle) {
            dashboardTitle.textContent = e.target.value;
        }
        localStorage.setItem('dashboardTitle', e.target.value);
    });

    const geminiApiKeyInput = document.getElementById('gemini-api-key-input');
    if (geminiApiKeyInput) {
         geminiApiKeyInput.value = settings.gemini_api_key || '';
         
         const saveApiKey = () => {
             const apiKey = geminiApiKeyInput.value.trim();
             api.updateSettings({ gemini_api_key: apiKey });
         };

         geminiApiKeyInput.addEventListener('blur', saveApiKey);
         geminiApiKeyInput.addEventListener('keypress', (e) => {
             if (e.key === 'Enter') {
                 saveApiKey();
                 geminiApiKeyInput.blur();
             }
         });
    }
}