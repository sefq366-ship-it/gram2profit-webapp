var App = {
    tg: null, currentFilter: 'recent',
    init: function() {
        this.tg = API.initTelegram();
        themeManager.init();
        this.setupNavigation();
        this.setupFilters();
        this.setupAddSale();
        this.setupSync();
        this.setupProfile();
        this.loadData();
        var self = this;
        setInterval(function() { self.updateGramPrice(); }, 300000);
    },
    setupNavigation: function() {
        document.querySelectorAll('.nav-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.nav-btn').forEach(function(b){b.classList.remove('active');});
                this.classList.add('active');
                var tab = this.dataset.tab;
                document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active');});
                document.getElementById(tab+'Tab').classList.add('active');
                if (tab === 'stats') { App.updateStatsDisplay(); Components.drawChart(); }
            });
        });
    },
    setupFilters: function() {
        var self = this;
        document.querySelectorAll('.filter-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn').forEach(function(b){b.classList.remove('active');});
                this.classList.add('active');
                self.currentFilter = this.dataset.filter;
                self.renderDeals();
            });
        });
    },
    setupAddSale: function() {
        document.getElementById('addSaleBtn').addEventListener('click', function(){App.addSale();});
        ['buyAmount','sellAmount','royalty'].forEach(function(id){
            document.getElementById(id).addEventListener('input', function(){App.calculateProfit();});
        });
        document.getElementById('nftLink').addEventListener('input', function() { App.fetchNFTPreview(); });
    },
    setupSync: function() {
        document.getElementById('syncRequestBtn').addEventListener('click', function(){
            API.sendToBot({action:'sync_request'});
            alert('Запрос отправлен боту. Ожидайте файл с данными.');
        });
        document.getElementById('importBtn').addEventListener('click', function(){
            var jsonText = document.getElementById('importJson').value;
            try {
                var deals = JSON.parse(jsonText);
                if (!Array.isArray(deals)) throw new Error('Not array');
                API.saveLocal('deals', deals);
                document.getElementById('importResult').textContent = '✅ Импортировано сделок: ' + deals.length;
                App.renderDeals();
                App.loadCollections();
                App.updateStatsDisplay();
                Components.drawChart();
            } catch(e) {
                alert('Ошибка JSON. Проверьте данные.');
            }
        });
    },
    setupProfile: function() {
        document.getElementById('updateProfileBtn').addEventListener('click', function(){
            var link = document.getElementById('profileNftLink').value;
            if (link) {
                API.saveProfile({avatar: link, nftLink: link});
                document.getElementById('profileAvatar').src = link;
                document.getElementById('settingsAvatar').src = link;
                alert('✅ Аватар обновлён!');
            } else {
                alert('Введите прямую ссылку на изображение.');
            }
        });
        var profile = API.getProfile();
        if (profile.avatar && profile.avatar !== 'assets/placeholder.png') {
            document.getElementById('profileAvatar').src = profile.avatar;
            document.getElementById('settingsAvatar').src = profile.avatar;
        }
        if (API.userData) {
            document.getElementById('settingsName').textContent = API.userData.first_name + ' ' + (API.userData.last_name||'');
            document.getElementById('settingsUsername').textContent = '@' + (API.userData.username||'user');
        }
    },
    loadData: function() {
        this.updateGramPrice();
        this.loadCollections();
        this.renderDeals();
        this.updateStatsDisplay();
        Components.drawChart();
    },
    updateGramPrice: async function() {
        var price = await API.fetchGramPrice();
        document.getElementById('gramPrice').textContent = '💎 GRAM: $' + price.toFixed(4);
    },
    loadCollections: function() {
        var deals = API.getDeals();
        var cols = [];
        deals.forEach(function(d){ if (d.category && cols.indexOf(d.category)===-1) cols.push(d.category); });
        document.getElementById('collectionsList').innerHTML = cols.map(function(c){return '<option value="'+c+'">';}).join('');
    },
    renderDeals: function() {
        var deals = API.getDeals();
        var filtered = deals.slice();
        if (this.currentFilter === 'top') filtered.sort(function(a,b){return (parseFloat(b.profit_gram)||0)-(parseFloat(a.profit_gram)||0);});
        else if (this.currentFilter === 'worst') filtered.sort(function(a,b){return (parseFloat(a.profit_gram)||0)-(parseFloat(b.profit_gram)||0);});
        var grid = document.getElementById('nftGrid');
        var empty = document.getElementById('emptyDeals');
        if (filtered.length === 0) { grid.innerHTML=''; grid.style.display='none'; empty.style.display='block'; }
        else { grid.innerHTML = filtered.map(function(d){return Components.createNFTCard(d);}).join(''); grid.style.display='grid'; empty.style.display='none'; }
    },
    updateStatsDisplay: function() {
        var stats = API.getStats();
        Components.updateStats(stats);
        var goal = parseFloat(localStorage.getItem('gram2profit_goal') || 0);
        if (goal > 0) {
            var progress = Math.min((stats.total/goal)*100, 100);
            document.getElementById('goalProgress').style.width = progress+'%';
            document.getElementById('goalText').textContent = progress.toFixed(1)+'% выполнено';
            document.getElementById('goalCurrent').textContent = (stats.total>=0?'+':'') + stats.total.toFixed(4) + ' GRAM';
        }
        document.getElementById('setGoalBtn').onclick = function(){
            var g = parseFloat(document.getElementById('goalInput').value);
            if (g>0) {
                localStorage.setItem('gram2profit_goal', g);
                App.updateStatsDisplay();
                API.sendToBot({action:'set_goal', goal: g});
            }
        };
    },
    calculateProfit: function() {
        var buy = parseFloat(document.getElementById('buyAmount').value)||0;
        var sell = parseFloat(document.getElementById('sellAmount').value)||0;
        var roy = parseFloat(document.getElementById('royalty').value)||0;
        var profit = sell - buy - roy;
        var usd = profit * API.gramPrice;
        document.getElementById('profitGram').textContent = (profit>=0?'+':'') + profit.toFixed(4) + ' GRAM';
        document.getElementById('profitUsd').textContent = '$' + usd.toFixed(2);
        document.getElementById('profitPreview').style.borderColor = profit>=0 ? 'var(--profit-positive)' : 'var(--profit-negative)';
    },
    fetchNFTPreview: async function() {
        var link = document.getElementById('nftLink').value.trim();
        if (!link) return;
        var preview = document.getElementById('nftPreview');
        var img = document.getElementById('nftPreviewImage');
        var nameEl = document.getElementById('nftPreviewName');
        var collEl = document.getElementById('nftPreviewCollection');
        preview.style.display = 'flex';
        img.src = 'assets/placeholder.png';
        nameEl.textContent = 'Загрузка...';
        try {
            var resp = await fetch('https://api.microlink.io/?url=' + encodeURIComponent(link));
            var data = await resp.json();
            if (data.status === 'success' && data.data) {
                if (data.data.image && data.data.image.url) {
                    img.src = data.data.image.url;
                }
                nameEl.textContent = data.data.title || 'NFT';
                collEl.textContent = data.data.description || '';
            } else {
                nameEl.textContent = 'Не удалось загрузить';
            }
        } catch(e) {
            nameEl.textContent = 'Ошибка загрузки';
        }
    },
    addSale: function() {
        var coll = document.getElementById('collectionInput').value;
        var buy = document.getElementById('buyAmount').value;
        var sell = document.getElementById('sellAmount').value;
        if (!coll || !buy || !sell) { alert('Заполните все поля'); return; }
        var deal = {
            category: coll,
            nft_link: document.getElementById('nftLink').value,
            nft_image: document.getElementById('nftPreviewImage') ? document.getElementById('nftPreviewImage').src : '',
            nft_name: document.getElementById('nftPreviewName') ? document.getElementById('nftPreviewName').textContent : coll,
            buy_amount: buy,
            sell_amount: sell,
            royalty: document.getElementById('royalty').value || '0.3',
            profit_gram: (parseFloat(sell)-parseFloat(buy)-parseFloat(document.getElementById('royalty').value||0)).toFixed(4),
            profit_usd: ((parseFloat(sell)-parseFloat(buy)-parseFloat(document.getElementById('royalty').value||0))*API.gramPrice).toFixed(2),
            gram_price: API.gramPrice
        };
        API.saveDeal(deal);
        API.sendToBot({action:'add_sale', ...deal});
        document.getElementById('collectionInput').value='';
        document.getElementById('nftLink').value='';
        document.getElementById('buyAmount').value='';
        document.getElementById('sellAmount').value='';
        document.getElementById('profitGram').textContent='0 GRAM';
        document.getElementById('profitUsd').textContent='$0.00';
        this.renderDeals();
        this.loadCollections();
        this.updateStatsDisplay();
        Components.drawChart();
        alert('✅ Сделка добавлена!');
    }
};
document.addEventListener('DOMContentLoaded', function(){ App.init(); });
