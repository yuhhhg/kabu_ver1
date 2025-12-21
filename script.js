// --- 持ち株データの一時保存用変数 ---
let myStocks = [];

// --- ファイルが選択されたときに実行される関数 ---
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    
    // ファイルの読み込みが完了したときの処理
    reader.onload = function(e) {
        const csvText = e.target.result;
        try {
            // CSVテキストを構造化されたデータ（myStocks配列）に変換
            myStocks = parseCSV(csvText);
            
            // データが準備できたら、株価取得と表示のメイン処理を呼び出す
            if (myStocks.length > 0) {
                console.log('CSVデータ読み込み完了:', myStocks);
                fetchAndDisplayStocks(myStocks);
            } else {
                alert('CSVファイルに有効なデータがありませんでした。');
            }
        } catch (error) {
            console.error('CSVパースエラー:', error);
            alert('CSVファイルの読み込み中にエラーが発生しました。形式を確認してください。');
        }
    };

    // ファイルをテキストとして読み込む
    reader.readAsText(file);
}

// --- CSVテキストをJavaScriptオブジェクトに変換する関数 ---
function parseCSV(csvText) {
    const rows = csvText.trim().split('\n');
    
    // ヘッダー行をスキップし、残りの行を処理
    // 形式: コード,銘柄名,持ち株数,購入時価格
    const data = rows.slice(1).map(row => {
        const cols = row.split(',');
        
        // 4つの列が揃っているか確認
        if (cols.length >= 4) {
            return {
                code: cols[0].trim(),
                name: cols[1].trim(),
                count: parseInt(cols[2].trim(), 10),
                purchasePrice: parseFloat(cols[3].trim())
            };
        }
        return null;
    }).filter(stock => stock && !isNaN(stock.count) && !isNaN(stock.purchasePrice)); // 不正なデータを除外
    
    return data;
}

// --- メイン処理（次のステップで実装）のダミー関数 ---
// CSV読み込み後に、この関数内で株価を取得し、表示処理を呼び出します。
function fetchAndDisplayStocks(stocks) {
    // 【次のステップ：ここで株価を取得するAPIを呼び出します】
    // 例としてダミーの株価データを付与して表示する処理
    const dummyData = stocks.map(stock => ({
        ...stock,
        currentPrice: stock.code === '9984' ? 5500 : (stock.code === '7203' ? 8000 : 4100)
    }));
    
    // 画面にデータを表示
    displayStockData(dummyData);
    
    // 簡易AI分析を実行
    runSimpleAIAnalysis(dummyData);
}

// --- 株価データを画面に表示する関数（前回のものに微調整） ---
function displayStockData(stocksWithPrice) {
    const container = document.getElementById('stock-list');
    container.innerHTML = ''; 

    stocksWithPrice.forEach(stock => {
        const currentValue = stock.currentPrice * stock.count;
        const purchaseValue = stock.purchasePrice * stock.count;
        const profitLoss = currentValue - purchaseValue;
        const profitLossRate = (profitLoss / purchaseValue) * 100;
        
        // 損益の色付け
        const color = profitLoss >= 0 ? 'green' : 'red';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${stock.name} (${stock.code})</td>
            <td>${stock.count}</td>
            <td>${stock.purchasePrice.toLocaleString()}円</td>
            <td>${stock.currentPrice.toLocaleString()}円</td>
            <td>${currentValue.toLocaleString()}円</td>
            <td style="color: ${color};">
                ${profitLoss.toLocaleString()}円 (${profitLossRate.toFixed(2)}%)
            </td>
        `;
        container.appendChild(row);
    });
}


// --- 簡易AI分析機能のダミー実装（次のステップで改良） ---
function runSimpleAIAnalysis(stocks) {
    const analysisDiv = document.getElementById('ai-analysis');
    
    // 簡易ロジック: 損益率が+10%以上の銘柄を「再投資見送り」
    const sellCandidates = stocks.filter(s => {
        const profitLossRate = ((s.currentPrice * s.count) - (s.purchasePrice * s.count)) / (s.purchasePrice * s.count) * 100;
        return profitLossRate > 10;
    });

    // 簡易ロジック: 損益率が-5%以下の銘柄を「再投資検討（ナンピン狙い）」
    const buyCandidates = stocks.filter(s => {
        const profitLossRate = ((s.currentPrice * s.count) - (s.purchasePrice * s.count)) / (s.purchasePrice * s.count) * 100;
        return profitLossRate < -5;
    });

    let outputHTML = '<ul>';
    
    if (buyCandidates.length > 0) {
        outputHTML += `<li>**【再投資候補（ナンピン狙い）】**以下の銘柄は現在 ${buyCandidates.map(s => s.name).join(', ')} などが含み損が大きいため、買い増し（ナンピン）のタイミングを検討しても良いかもしれません。</li>`;
    } else {
        outputHTML += `<li>現在、含み損が大きな銘柄はありません。</li>`;
    }
    
    if (sellCandidates.length > 0) {
        outputHTML += `<li>**【利益確定検討】**以下の銘柄は大きく含み益があります: ${sellCandidates.map(s => s.name).join(', ')}。</li>`;
    }
    
    outputHTML += '</ul>';
    analysisDiv.innerHTML = outputHTML;
}