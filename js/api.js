// js/api.js
var API = {
    gramPrice: 2.5,
    userData: null,
    initTelegram: function() {
        if (window.Telegram && window.Telegram.WebApp) {
            var tg = window.Telegram.WebApp;
            tg.ready(); tg.expand();
            if (tg.initDataUnsafe && tg.initDataUnsafe.user) this.userData = tg.initDataUnsafe.user;
            return tg;
        }
        return null;
    },
    fetchGramPrice: async function() {
        try {
            var response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd');
            var data = await response.json();
            this.gramPrice = data['the-open-network'].usd;
            return this.gramPrice;
        } catch(e) { return this.gramPrice; }
    },
    sendToBot: function(data) {
        var tg = window.Telegram && window.Telegram.WebApp;
        if (tg) { tg.sendData(JSON.stringify(data)); return true; }
        return false;
    },
    saveLocal: function(key, data) { localStorage.setItem('gram2profit_' + key, JSON.stringify(data)); },
    loadLocal: function(key) { var d = localStorage.getItem('gram2profit_' + key); return d ? JSON.parse(d) : null; },
    getDeals: function() { return this.loadLocal('deals') || []; },
    saveDeal: function(deal) {
        var deals = this.getDeals();
        deal.id = Date.now();
        deal.date = new Date().toLocaleDateString('ru-RU');
        deals.unshift(deal);
        this.saveLocal('deals', deals);
        return deal;
    },
    getStats: function() {
        var deals = this.getDeals();
        var stats = { total: 0, deals: deals.length, wins: 0, losses: 0, best: 0, worst: 0 };
        deals.forEach(function(d) {
            var p = parseFloat(d.profit_gram) || 0;
            stats.total += p;
            if (p > 0) stats.wins++; else if (p < 0) stats.losses++;
            if (p > stats.best) stats.best = p;
            if (p < stats.worst) stats.worst = p;
        });
        return stats;
    },
    getProfile: function() { return this.loadLocal('profile') || { avatar: 'assets/placeholder.png', nftLink: '' }; },
    saveProfile: function(profile) { this.saveLocal('profile', profile); }
};
