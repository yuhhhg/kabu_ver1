// 1. 設定：スプレッドシートから取得したCSVのURL
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1v...省略.../pub?output=csv';

let myStocks = [];

// 2. CSVファイル（自分の持ち株リスト）読み込み
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const csvText = e.target.result;
        myStocks = parseCSV(csvText);
        
        // 最新株価をスプレッドシートから取得
        await fetchPricesFromSheet();
    };
    reader.readAsText(file);
}

function parseCSV(csvText) {
    const rows = csvText.trim().split('\n');
    return rows.slice(1).map(row => {
        const cols = row.split(',');
        return {
            code: cols[0].trim(),
            name: cols[1].trim(),
            count: parseInt(cols[2].trim(), 10),
            purchasePrice: parseFloat(cols[3].trim()),
            currentPrice: 0 // 後で入れる
        };
    }).filter(s => s.code);
}

// 3. スプレッドシートから最新株価を一括取得
async function fetchPricesFromSheet() {
    try {
        const response = await fetch(SHEET_CSV_URL);
        const csvText = await response.target ? "" : await response.text();
        const rows = csvText.trim().split('\n');
        
        // スプレッドシートのデータを辞書形式にする { "7203": 2500, ... }
        const priceMap = {};
        rows.forEach(row => {
            const [code, price] = row.split(',');
            priceMap[code.trim()] = parseFloat(price);
        });

        // 自分の持ち株データに株価をマッピング
        myStocks.forEach(stock => {
            stock.currentPrice = priceMap[stock.code] || 0;
        });

        displayStockData(myStocks);
        runSimpleAIAnalysis(myStocks);

    } catch (error) {
        console.error('シート取得エラー:', error);
        alert('最新株価の取得に失敗しました。');
    }
}

// 4. 画面表示処理 (前回と同じ)
function displayStockData(stocks) {
    const container = document.getElementById('stock-list');
    container.innerHTML = ''; 
    stocks.forEach(stock => {
        const currentValue = stock.currentPrice * stock.count;
        const purchaseValue = stock.purchasePrice * stock.count;
        const profitLoss = currentValue - purchaseValue;
        const color = profitLoss >= 0 ? '#00aa00' : '#ff0000';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${stock.name}</td>
            <td>${stock.count}</td>
            <td>${stock.purchasePrice.toLocaleString()}円</td>
            <td>${stock.currentPrice.toLocaleString()}円</td>
            <td style="color: ${color}; font-weight: bold;">${profitLoss.toLocaleString()}円</td>
        `;
        container.appendChild(row);
    });
}

// 5. AI分析 (前回と同じ)
function runSimpleAIAnalysis(stocks) {
    const analysisDiv = document.getElementById('ai-analysis');
    let advice = "<h3>🤖 AI分析結果</h3><ul>";
    stocks.forEach(s => {
        const diff = (s.currentPrice - s.purchasePrice) / s.purchasePrice * 100;
        if (diff < -10) advice += `<li>✅ ${s.name}: ナンピン買いのチャンスです。</li>`;
        else if (diff > 20) advice += `<li>⚠️ ${s.name}: 利益確定を検討してください。</li>`;
    });
    analysisDiv.innerHTML = advice + "</ul>";
}