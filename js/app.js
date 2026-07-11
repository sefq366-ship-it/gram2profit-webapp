var App = {
    tg: null,
    currentFilter: 'recent',
    
    init: function() {
        this.tg = API.initTelegram();
        themeManager.init();
        this.setupNavigation();
        this.setupFilters();
        this.setupAddSale();
        this.setupProfile();
        this.loadData();
        
        var self = this;
        setInterval(function() { self.updateGramPrice(); }, 300000);
    },
    
    setupNavigation: function() {
        document.querySelectorAll('.nav-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                
                var tabName = this.dataset.tab;
                document.querySelectorAll('.tab').forEach(function(tab) { tab.classList.remove('active'); });
                document.getElementById(tabName + 'Tab').classList.add('active');
                
                if (tabName === 'stats') App.updateStatsDisplay();
            });
        });
    },
    
    setupFilters: function() {
        var self = this;
        document.querySelectorAll('.filter-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                self.currentFilter = this.dataset.filter;
                self.renderDeals();
            });
        });
    },
    
    setupAddSale: function() {
        document.getElementById('addSaleBtn').addEventListener('click', function() { App.addSale(); });
        
        ['buyAmount', 'sellAmount', 'royalty'].forEach(function(id) {
            document.getElementById(id).addEventListener('input', function() { App.calculateProfit(); });
        });
    },
    
    setupProfile: function() {
        document.getElementById('updateProfileBtn').addEventListener('click', function() { App.updateProfile(); });
        
        var profile = API.getProfile();
        if (profile.avatar) {
            document.getElementById('profileAvatar').src = profile.avatar;
            document.getElementById('settingsAvatar').src = profile.avatar;
        }
        
        if (API.userData) {
            document.getElementById('settingsName').textContent = 
                API.userData.first_name + ' ' + (API.userData.last_name || '');
            document.getElementById('settingsUsername').textContent = 
                '@' + (API.userData.username || 'user');
        }
    },
    
    loadData: function() {
        this.updateGramPrice();
        this.loadCollections();
        this.renderDeals();
        this.updateStatsDisplay();
    },
    
    updateGramPrice: async function() {
        var price = await API.fetchGramPrice();
        document.getElementById('gramPrice').textContent = '💎 GRAM: $' + price.toFixed(4);
    },
    
    loadCollections: function() {
        var deals = API.getDeals();
        var collections = [];
        deals.forEach(function(d) {
            if (collections.indexOf(d.category) === -1 && d.category) {
                collections.push(d.category);
            }
        });
        
        var datalist = document.getElementById('collectionsList');
        datalist.innerHTML = collections.map(function(c) {
            return '<option value="' + c + '">';
        }).join('');
    },
    
    renderDeals: function() {
        var deals = API.getDeals();
        var filteredDeals = deals.slice();
        
        if (this.currentFilter === 'top') {
            filteredDeals.sort(function(a, b) {
                return (parseFloat(b.profit_gram) || 0) - (parseFloat(a.profit_gram) || 0);
            });
        } else if (this.currentFilter === 'worst') {
            filteredDeals.sort(function(a, b) {
                return (parseFloat(a.profit_gram) || 0) - (parseFloat(b.profit_gram) || 0);
            });
        }
        
        var grid = document.getElementById('nftGrid');
        var emptyState = document.getElementById('emptyDeals');
        
        if (filteredDeals.length === 0) {
            grid.innerHTML = '';
            grid.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            grid.innerHTML = filteredDeals.map(function(deal) {
                return Components.createNFTCard(deal);
            }).join('');
            grid.style.display = 'grid';
            emptyState.style.display = 'none';
        }
    },
    
    updateStatsDisplay: function() {
        var stats = API.getStats();
        Components.updateStats(stats);
        
        var goal = parseFloat(localStorage.getItem('gram2profit_goal') || 0);
        if (goal > 0) {
            var progress = Math.min((stats.total / goal) * 100, 100);
            document.getElementById('goalProgress').style.width = progress + '%';
            document.getElementById('goalText').textContent = progress.toFixed(1) + '% выполнено';
            document.getElementById('goalCurrent').textContent = 
                (stats.total >= 0 ? '+' : '') + stats.total.toFixed(4) + ' GRAM';
        }
        
        // Goal button
        document.getElementById('setGoalBtn').onclick = function() {
            var goalInput = parseFloat(document.getElementById('goalInput').value);
            if (goalInput > 0) {
                localStorage.setItem('gram2profit_goal', goalInput);
                App.updateStatsDisplay();
                
                if (API.sendToBot) {
                    API.sendToBot({ action: 'set_goal', goal: goalInput });
                }
            }
        };
    },
    
    calculateProfit: function() {
        var buyAmount = parseFloat(document.getElementById('buyAmount').value) || 0;
        var sellAmount = parseFloat(document.getElementById('sellAmount').value) || 0;
        var royalty = parseFloat(document.getElementById('royalty').value) || 0;
        
        var profitGram = sellAmount - buyAmount - royalty;
        var profitUsd = profitGram * API.gramPrice;
        
        document.getElementById('profitGram').textContent = 
            (profitGram >= 0 ? '+' : '') + profitGram.toFixed(4) + ' GRAM';
        document.getElementById('profitUsd').textContent = '$' + profitUsd.toFixed(2);
        
        var preview = document.getElementById('profitPreview');
        preview.style.borderColor = profitGram >= 0 ? 'var(--profit-positive)' : 'var(--profit-negative)';
    },
    
    addSale: function() {
        var collection = document.getElementById('collectionInput').value;
        var buyAmount = document.getElementById('buyAmount').value;
        var sellAmount = document.getElementById('sellAmount').value;
        
        if (!collection || !buyAmount || !sellAmount) {
            alert('Заполните все обязательные поля!');
            return;
        }
        
        var deal = {
            category: collection,
            nft_link: document.getElementById('nftLink').value,
            nft_image: document.getElementById('nftPreviewImage') ? 
                document.getElementById('nftPreviewImage').src : '',
            nft_name: document.getElementById('nftPreviewName') ? 
                document.getElementById('nftPreviewName').textContent : collection,
            buy_amount: buyAmount,
            sell_amount: sellAmount,
            royalty: document.getElementById('royalty').value || '0.3',
            profit_gram: (parseFloat(sellAmount) - parseFloat(buyAmount) - 
                parseFloat(document.getElementById('royalty').value || 0)).toFixed(4),
            profit_usd: ((parseFloat(sellAmount) - parseFloat(buyAmount) - 
                parseFloat(document.getElementById('royalty').value || 0)) * API.gramPrice).toFixed(2),
            gram_price: API.gramPrice
        };
        
        // Сохраняем локально
        API.saveDeal(deal);
        
        // Отправляем боту
        var sent = API.sendToBot({
            action: 'add_sale',
            category: deal.category,
            nft_link: deal.nft_link,
            nft_image: deal.nft_image,
            nft_name: deal.nft_name,
            buy_amount: parseFloat(deal.buy_amount),
            sell_amount: parseFloat(deal.sell_amount),
            royalty: parseFloat(deal.royalty),
            profit_gram: parseFloat(deal.profit_gram),
            profit_usd: parseFloat(deal.profit_usd),
            gram_price: deal.gram_price
        });
        
        // Очищаем форму
        document.getElementById('collectionInput').value = '';
        document.getElementById('nftLink').value = '';
        document.getElementById('buyAmount').value = '';
        document.getElementById('sellAmount').value = '';
        document.getElementById('profitGram').textContent = '0 GRAM';
        document.getElementById('profitUsd').textContent = '$0.00';
        
        // Обновляем UI
        this.renderDeals();
        this.loadCollections();
        
        if (sent) {
            alert('✅ Сделка отправлена боту!');
        } else {
            alert('✅ Сделка сохранена локально');
        }
    },
    
    updateProfile: function() {
        var nftLink = document.getElementById('profileNftLink').value;
        if (nftLink) {
            var profile = {
                avatar: 'assets/placeholder.png',
                nftLink: nftLink
            };
            API.saveProfile(profile);
            document.getElementById('profileAvatar').src = profile.avatar;
            document.getElementById('settingsAvatar').src = profile.avatar;
            alert('✅ Аватар обновлён!');
        }
    }
};

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});