var App = {
    tg: null,
    init: function() {
        this.tg = API.initTelegram();
        // setupNavigation, setupFilters и т.д. можно оставить свои, главное – addSale
        document.getElementById('addSaleBtn').addEventListener('click', () => this.addSale());
        ['buyAmount','sellAmount','royalty'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.calculateProfit());
        });
        this.loadData();
    },
    calculateProfit: function() {
        var buy = parseFloat(document.getElementById('buyAmount').value) || 0;
        var sell = parseFloat(document.getElementById('sellAmount').value) || 0;
        var royalty = parseFloat(document.getElementById('royalty').value) || 0;
        var profit = sell - buy - royalty;
        document.getElementById('profitGram').textContent = (profit >= 0 ? '+' : '') + profit.toFixed(4) + ' GRAM';
        document.getElementById('profitUsd').textContent = '$' + (profit * API.gramPrice).toFixed(2);
    },
    addSale: async function() {
        var coll = document.getElementById('collectionInput').value.trim();
        var buy = document.getElementById('buyAmount').value.trim();
        var sell = document.getElementById('sellAmount').value.trim();
        if (!coll || !buy || !sell) { alert('Заполните все поля'); return; }
        var deal = {
            action: 'add_sale',
            category: coll,
            nft_link: document.getElementById('nftLink').value,
            buy_amount: buy,
            sell_amount: sell,
            royalty: document.getElementById('royalty').value || '0.3',
            profit_gram: (parseFloat(sell) - parseFloat(buy) - parseFloat(document.getElementById('royalty').value || 0)).toFixed(4),
            gram_price: API.gramPrice
        };
        // Сохраняем локально
        API.saveDeal(deal);
        // Отправляем боту
        var sent = API.sendToBot(deal);
        // Очищаем поля
        document.getElementById('collectionInput').value = '';
        document.getElementById('nftLink').value = '';
        document.getElementById('buyAmount').value = '';
        document.getElementById('sellAmount').value = '';
        document.getElementById('profitGram').textContent = '0 GRAM';
        document.getElementById('profitUsd').textContent = '$0.00';
        if (sent) {
            alert('✅ Сделка отправлена боту!');
        } else {
            alert('⚠️ Данные не отправлены. Откройте Mini App из меню бота.');
        }
    },
    loadData: function() {
        this.updateGramPrice();
        // можно подгрузить свои сделки
    },
    updateGramPrice: async function() {
        var price = await API.fetchGramPrice();
        document.getElementById('gramPrice').textContent = '💎 GRAM: $' + price.toFixed(4);
    }
};
window.addEventListener('DOMContentLoaded', () => App.init());
