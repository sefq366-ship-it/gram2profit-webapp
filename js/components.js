var Components = {
    createNFTCard: function(deal) {
        var profit = parseFloat(deal.profit_gram) || 0;
        var profitClass = profit > 0 ? 'profit-positive' : profit < 0 ? 'profit-negative' : 'profit-zero';
        var profitSign = profit > 0 ? '+' : '';
        
        return '<div class="nft-card" onclick="showDealDetails(' + deal.id + ')">' +
            '<img class="nft-image" src="' + (deal.nft_image || 'assets/placeholder.png') + '" ' +
            'alt="' + (deal.nft_name || 'NFT') + '" ' +
            'onerror="this.src=\'assets/placeholder.png\'" loading="lazy">' +
            '<div class="nft-info">' +
            '<div class="nft-name">' + (deal.nft_name || 'NFT') + '</div>' +
            '<div class="nft-collection">' + (deal.category || 'Unknown') + '</div>' +
            '<div class="nft-profit ' + profitClass + '">' +
            profitSign + profit.toFixed(4) + ' GRAM</div>' +
            '</div></div>';
    },
    
    showDealModal: function(deal) {
        var profit = parseFloat(deal.profit_gram) || 0;
        var profitEmoji = profit > 0 ? '🚀' : profit < 0 ? '💀' : '➖';
        
        var content = '<div style="text-align:center;margin-bottom:20px;">' +
            '<img src="' + (deal.nft_image || 'assets/placeholder.png') + '" ' +
            'style="width:120px;height:120px;border-radius:16px;object-fit:cover;margin-bottom:12px;" ' +
            'onerror="this.src=\'assets/placeholder.png\'">' +
            '<h3>' + (deal.nft_name || 'NFT') + '</h3>' +
            '<p style="color:var(--text-secondary)">' + (deal.category || '') + '</p></div>' +
            '<div style="background:var(--bg-secondary);border-radius:12px;padding:16px;margin-bottom:16px;">' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">' +
            '<span style="color:var(--text-secondary)">Куплено:</span><span>' + deal.buy_amount + ' GRAM</span></div>' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">' +
            '<span style="color:var(--text-secondary)">Продано:</span><span>' + deal.sell_amount + ' GRAM</span></div>' +
            '<hr style="border-color:var(--border-color);margin:12px 0;">' +
            '<div style="display:flex;justify-content:space-between;">' +
            '<span style="color:var(--text-secondary)">Прибыль:</span>' +
            '<span style="font-weight:bold;font-size:18px;color:' + (profit >= 0 ? 'var(--profit-positive)' : 'var(--profit-negative)') + '">' +
            profitEmoji + ' ' + (profit >= 0 ? '+' : '') + profit.toFixed(4) + ' GRAM</span></div></div>' +
            '<div style="text-align:center;color:var(--text-muted);margin-bottom:16px;">📅 ' + deal.date + '</div>' +
            (deal.nft_link ? '<a href="' + deal.nft_link + '" target="_blank" class="btn-secondary" style="display:block;text-align:center;text-decoration:none;margin-bottom:8px;">🔗 Открыть NFT</a>' : '') +
            '<button class="btn-secondary" onclick="closeModal()" style="margin-top:8px;">Закрыть</button>';
        
        document.getElementById('dealModalContent').innerHTML = content;
        document.getElementById('dealModal').classList.add('active');
    },
    
    updateStats: function(stats) {
        document.getElementById('statTotal').textContent = (stats.total >= 0 ? '+' : '') + stats.total.toFixed(4) + ' GRAM';
        document.getElementById('statDeals').textContent = stats.deals;
        document.getElementById('statWinRate').textContent = (stats.deals > 0 ? Math.round(stats.wins / stats.deals * 100) : 0) + '%';
        document.getElementById('statBest').textContent = stats.best.toFixed(4) + ' GRAM';
    }
};

function showDealDetails(dealId) {
    var deals = API.getDeals();
    var deal = null;
    for (var i = 0; i < deals.length; i++) {
        if (deals[i].id === dealId) { deal = deals[i]; break; }
    }
    if (deal) Components.showDealModal(deal);
}

function closeModal() {
    document.getElementById('dealModal').classList.remove('active');
}