// js/components.js
var Components = {
    createNFTCard: function(deal) {
        var profit = parseFloat(deal.profit_gram) || 0;
        var cls = profit > 0 ? 'profit-positive' : profit < 0 ? 'profit-negative' : 'profit-zero';
        return '<div class="nft-card" onclick="showDealDetails(' + deal.id + ')">' +
            '<img class="nft-image" src="' + (deal.nft_image || 'assets/placeholder.png') + '" onerror="this.src=\'assets/placeholder.png\'">' +
            '<div class="nft-info"><div class="nft-name">' + (deal.nft_name || 'NFT') + '</div><div class="nft-collection">' + (deal.category || '') + '</div>' +
            '<div class="nft-profit ' + cls + '">' + (profit>=0?'+':'') + profit.toFixed(4) + ' GRAM</div></div></div>';
    },
    showDealModal: function(deal) {
        var profit = parseFloat(deal.profit_gram) || 0;
        var html = '<div style="text-align:center;margin-bottom:20px;"><img src="' + (deal.nft_image || 'assets/placeholder.png') + '" style="width:120px;height:120px;border-radius:16px;object-fit:cover;margin-bottom:12px;"><h3>' + (deal.nft_name || 'NFT') + '</h3><p style="color:var(--text-secondary)">' + (deal.category || '') + '</p></div>';
        html += '<div style="background:var(--bg-secondary);border-radius:12px;padding:16px;margin-bottom:16px;">';
        html += '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:var(--text-secondary)">Куплено:</span><span>' + deal.buy_amount + ' GRAM</span></div>';
        html += '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:var(--text-secondary)">Продано:</span><span>' + deal.sell_amount + ' GRAM</span></div>';
        html += '<hr style="border-color:var(--border-color);margin:12px 0;">';
        html += '<div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary)">Прибыль:</span><span style="font-weight:bold;font-size:18px;color:' + (profit>=0?'var(--profit-positive)':'var(--profit-negative)') + '">' + (profit>=0?'+':'') + profit.toFixed(4) + ' GRAM</span></div></div>';
        html += '<div style="text-align:center;color:var(--text-muted);margin-bottom:16px;">📅 ' + deal.date + '</div>';
        if (deal.nft_link) html += '<a href="' + deal.nft_link + '" target="_blank" class="btn-secondary" style="display:block;text-align:center;text-decoration:none;margin-bottom:8px;">🔗 Открыть NFT</a>';
        html += '<button class="btn-secondary" onclick="closeModal()">Закрыть</button>';
        document.getElementById('dealModalContent').innerHTML = html;
        document.getElementById('dealModal').classList.add('active');
    },
    updateStats: function(stats) {
        document.getElementById('statTotal').textContent = (stats.total>=0?'+':'') + stats.total.toFixed(4) + ' GRAM';
        document.getElementById('statDeals').textContent = stats.deals;
        document.getElementById('statWinRate').textContent = (stats.deals>0 ? Math.round(stats.wins/stats.deals*100) : 0) + '%';
        document.getElementById('statBest').textContent = stats.best.toFixed(4) + ' GRAM';
    },
    drawChart: function() {
        var deals = API.getDeals();
        if (deals.length === 0) {
            document.getElementById('chartImage').src = '';
            return;
        }
        // Группировка по месяцам (берём из date строку вида ДД.ММ.ГГГГ)
        var months = {};
        deals.forEach(function(d) {
            var parts = d.date.split('.');
            if (parts.length === 3) {
                var monthKey = parts[1] + '.' + parts[2]; // ММ.ГГГГ
                if (!months[monthKey]) months[monthKey] = 0;
                months[monthKey] += parseFloat(d.profit_gram) || 0;
            }
        });
        var sorted = Object.keys(months).sort();
        if (sorted.length === 0) { document.getElementById('chartImage').src = ''; return; }
        var labels = sorted.slice(-6);
        var values = labels.map(function(k) { return months[k]; });
        var config = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Прибыль (GRAM)',
                    data: values,
                    backgroundColor: values.map(function(v) { return v >= 0 ? '#2ecc71' : '#e74c3c'; })
                }]
            },
            options: { title: { display: true, text: 'Прибыль по месяцам', fontSize: 14 } }
        };
        var url = 'https://quickchart.io/chart?c=' + encodeURIComponent(JSON.stringify(config)) + '&w=400&h=250';
        document.getElementById('chartImage').src = url;
    }
};
function showDealDetails(id) { var d = API.getDeals().find(function(x){return x.id===id;}); if(d) Components.showDealModal(d); }
function closeModal() { document.getElementById('dealModal').classList.remove('active'); }
