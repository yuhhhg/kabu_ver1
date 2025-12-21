// ==========================================
// 1. 設定エリア
// ==========================================
// Alpha Vantageで取得したAPIキーをここに入力してください
const API_KEY = GTC0EF7JYUD6KVON;

// 持ち株データを保持する変数
let myStocks = [];

// ==========================================
// 2. CSVファイル読み込み処理
// ==========================================
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const csvText = e.target.result;
        try {
            myStocks = parseCSV(csvText);
            if (myStocks.length > 0) {
                // データがあれば株価取得を開始
                fetchAndDisplayStocks(myStocks);
            } else {
                alert('CSVファイルにデータが見つかりません。');
            }
        } catch (error) {
            alert('CSVの読み込みに失敗しました。');
        }
    };
    reader.readAsText(file);
}

function parseCSV(csvText) {
    const rows = csvText.trim().split('\n');
    return rows.slice(1).map(row => {
        const cols = row.split(',');
        if (cols.length >= 4) {
            return {
                code: cols[0].trim(),
                name: cols[1].trim(),
                count: parseInt(cols[2].trim(), 10),
                purchasePrice: parseFloat(cols[3].trim())
            };
        }
        return null;
    }).filter(s => s !== null);
}

// ==========================================
// 3. 本物の株価取得処理 (Alpha Vantage API)
// ==========================================
async function fetchAndDisplayStocks(stocks) {
    const updatedStocks = [];
    const statusDiv = document.getElementById('ai-analysis');
    
    statusDiv.innerHTML = "<p>⏳ 株価データを取得中...（無料版のため時間がかかります）</p>";

    for (const stock of stocks) {
        // 日本株の場合、コードに .T を付与
        const symbol = `${stock.code}.T`;
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            const quote = data["Global Quote"];

            if (quote && quote["05. price"]) {
                stock.currentPrice = parseFloat(quote["05. price"]);
            } else {
                console.error('取得失敗:', data);
                stock.currentPrice = 0; // 取得できなかった場合は0
            }
        } catch (error) {
            stock.currentPrice = 0;
        }
        
        updatedStocks.push(stock);

        // 無料APIの制限(1分5回)に配慮し、1銘柄ごとに少し待機
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    displayStockData(updatedStocks);
    runSimpleAIAnalysis(updatedStocks);
}

// ==========================================
// 4. 画面表示処理
// ==========================================
function displayStockData(stocks) {
    const container = document.getElementById('stock-list');
    container.innerHTML = ''; 

    stocks.forEach(stock => {
        const currentValue = stock.currentPrice * stock.count;
        const purchaseValue = stock.purchasePrice * stock.count;
        const profitLoss = currentValue - purchaseValue;
        const profitLossRate = (profitLoss / purchaseValue) * 100;
        const color = profitLoss >= 0 ? '#00aa00' : '#ff0000';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${stock.name}<br><small>${stock.code}</small></td>
            <td>${stock.count}</td>
            <td>${stock.purchasePrice.toLocaleString()}円</td>
            <td>${stock.currentPrice > 0 ? stock.currentPrice.toLocaleString() + '円' : '取得失敗'}</td>
            <td>${currentValue.toLocaleString()}円</td>
            <td style="color: ${color}; font-weight: bold;">
                ${profitLoss.toLocaleString()}円<br>(${profitLossRate.toFixed(2)}%)
            </td>
        `;
        container.appendChild(row);
    });
}

// ==========================================
// 5. 簡易AI分析機能（再投資の狙い目）
// ==========================================
function runSimpleAIAnalysis(stocks) {
    const analysisDiv = document.getElementById('ai-analysis');
    let advice = "<h3>🤖 AI分析結果</h3><ul>";

    stocks.forEach(s => {
        const diff = (s.currentPrice - s.purchasePrice) / s.purchasePrice * 100;
        
        if (diff < -10) {
            advice += `<li>✅ <b>${s.name}</b>: 購入時より10%以上値下がりしています。長期保有目的であれば、<b>ナンピン買い（再投資）の狙い目</b>です。</li>`;
        } else if (diff > 20) {
            advice += `<li>⚠️ <b>${s.name}</b>: 20%以上の利益が出ています。一部利益確定を検討しても良い時期かもしれません。</li>`;
        }
    });

    if (stocks.every(s => Math.abs((s.currentPrice - s.purchasePrice) / s.purchasePrice * 100) < 10)) {
        advice += "<li>現在、大きな動きはありません。じっくりホールド（静観）が推奨されます。</li>";
    }

    advice += "</ul>";
    analysisDiv.innerHTML = advice;
}