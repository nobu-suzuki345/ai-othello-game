/**
 * オセロゲームのメインクラス
 */
class OthelloGame {
    constructor() {
        this.BOARD_SIZE = 8;
        this.EMPTY = 0;
        this.BLACK = 1; // プレイヤー
        this.WHITE = 2; // AI
        
        // ゲーム状態
        this.board = [];
        this.currentPlayer = this.BLACK;
        this.gameOver = false;
        this.history = []; // 手の履歴
        
        // DOM要素
        this.boardElement = null;
        this.statusMessage = null;
        this.thinkingMessage = null;
        this.blackScoreElement = null;
        this.whiteScoreElement = null;
        
        // 設定
        this.showHints = true;
        this.showAnimation = true;
        this.difficulty = 2;
        
        // 8方向（上、右上、右、右下、下、左下、左、左上）
        this.directions = [
            [-1, 0], [-1, 1], [0, 1], [1, 1],
            [1, 0], [1, -1], [0, -1], [-1, -1]
        ];
    }
    
    /**
     * ゲームの初期化
     */
    init() {
        this.boardElement = document.getElementById('board');
        this.statusMessage = document.getElementById('statusMessage');
        this.thinkingMessage = document.getElementById('thinkingMessage');
        this.blackScoreElement = document.getElementById('blackScore');
        this.whiteScoreElement = document.getElementById('whiteScore');
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // ゲーム開始
        this.newGame();
    }
    
    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        document.getElementById('newGameBtn').addEventListener('click', () => {
            this.newGame();
        });
        
        document.getElementById('undoBtn').addEventListener('click', () => {
            this.undo();
        });
        
        document.getElementById('hintBtn').addEventListener('click', () => {
            this.showHint();
        });
        
        document.getElementById('showHints').addEventListener('change', (e) => {
            this.showHints = e.target.checked;
            this.renderBoard();
        });
        
        document.getElementById('showAnimation').addEventListener('change', (e) => {
            this.showAnimation = e.target.checked;
        });
        
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = parseInt(e.target.value);
        });
        
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.hideGameOverModal();
            this.newGame();
        });
    }
    
    /**
     * 新しいゲームを開始
     */
    newGame() {
        // 盤面を初期化
        this.board = Array(this.BOARD_SIZE).fill(null).map(() => 
            Array(this.BOARD_SIZE).fill(this.EMPTY)
        );
        
        // 初期配置
        const mid = this.BOARD_SIZE / 2;
        this.board[mid - 1][mid - 1] = this.WHITE;
        this.board[mid - 1][mid] = this.BLACK;
        this.board[mid][mid - 1] = this.BLACK;
        this.board[mid][mid] = this.WHITE;
        
        // ゲーム状態のリセット
        this.currentPlayer = this.BLACK;
        this.gameOver = false;
        this.history = [];
        
        // 画面を更新
        this.renderBoard();
        this.updateScore();
        this.updateStatus();
        this.hideGameOverModal();
    }
    
    /**
     * 盤面の描画
     */
    renderBoard() {
        this.boardElement.innerHTML = '';
        
        const validMoves = this.getValidMoves(this.currentPlayer);
        
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // 石がある場合
                if (this.board[row][col] !== this.EMPTY) {
                    const stone = document.createElement('div');
                    stone.className = `stone ${this.board[row][col] === this.BLACK ? 'black' : 'white'}`;
                    cell.appendChild(stone);
                }
                
                // 有効な手の表示
                if (this.showHints && !this.gameOver && this.currentPlayer === this.BLACK) {
                    const isValid = validMoves.some(move => move.row === row && move.col === col);
                    if (isValid) {
                        cell.classList.add('valid-move');
                    }
                }
                
                // クリックイベント
                cell.addEventListener('click', () => {
                    this.handleCellClick(row, col);
                });
                
                this.boardElement.appendChild(cell);
            }
        }
    }
    
    /**
     * セルのクリックを処理
     */
    handleCellClick(row, col) {
        if (this.gameOver) return;
        if (this.currentPlayer !== this.BLACK) return;
        
        // 手を打つ前の状態を履歴に保存
        const previousState = {
            board: this.copyBoard(),
            player: this.currentPlayer
        };
        
        if (this.makeMove(row, col, this.BLACK)) {
            // 有効な手だった場合のみ履歴に追加
            this.history.push(previousState);
            
            this.updateScore();
            
            // AIのターンへ
            this.currentPlayer = this.WHITE;
            this.updateStatus();
            
            // ゲーム終了チェック
            if (this.checkGameOver()) {
                return;
            }
            
            // AIの手を実行
            setTimeout(() => {
                this.executeAIMove();
            }, 500);
        }
    }
    
    /**
     * 手を実行
     */
    makeMove(row, col, player) {
        if (this.board[row][col] !== this.EMPTY) return false;
        
        const flips = this.getFlips(row, col, player);
        if (flips.length === 0) return false;
        
        // 石を配置
        this.board[row][col] = player;
        
        // アニメーション
        if (this.showAnimation) {
            const cells = this.boardElement.children;
            const index = row * this.BOARD_SIZE + col;
            const stone = cells[index].querySelector('.stone');
            if (stone) {
                stone.classList.add('placing');
            }
        }
        
        // 挟んだ石を裏返す
        flips.forEach(([r, c]) => {
            this.board[r][c] = player;
            
            // アニメーション
            if (this.showAnimation) {
                setTimeout(() => {
                    const cells = this.boardElement.children;
                    const index = r * this.BOARD_SIZE + c;
                    const stone = cells[index].querySelector('.stone');
                    if (stone) {
                        stone.classList.add('flipping');
                        setTimeout(() => {
                            this.renderBoard();
                        }, 300);
                    }
                }, 100);
            }
        });
        
        if (!this.showAnimation) {
            this.renderBoard();
        }
        
        return true;
    }
    
    /**
     * 裏返す石を取得
     */
    getFlips(row, col, player) {
        if (this.board[row][col] !== this.EMPTY) return [];
        
        const flips = [];
        const opponent = player === this.BLACK ? this.WHITE : this.BLACK;
        
        for (const [dr, dc] of this.directions) {
            const temp = [];
            let r = row + dr;
            let c = col + dc;
            
            // 相手の石が続く間探索
            while (this.isValidPosition(r, c) && this.board[r][c] === opponent) {
                temp.push([r, c]);
                r += dr;
                c += dc;
            }
            
            // 自分の石で終わる場合、裏返せる
            if (this.isValidPosition(r, c) && this.board[r][c] === player && temp.length > 0) {
                flips.push(...temp);
            }
        }
        
        return flips;
    }
    
    /**
     * 有効な手を取得
     */
    getValidMoves(player) {
        const moves = [];
        
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] === this.EMPTY) {
                    const flips = this.getFlips(row, col, player);
                    if (flips.length > 0) {
                        moves.push({ row, col, flips: flips.length });
                    }
                }
            }
        }
        
        return moves;
    }
    
    /**
     * 位置が有効かチェック
     */
    isValidPosition(row, col) {
        return row >= 0 && row < this.BOARD_SIZE && col >= 0 && col < this.BOARD_SIZE;
    }
    
    /**
     * AIの手を実行
     */
    executeAIMove() {
        if (this.gameOver) return;
        
        this.thinkingMessage.textContent = 'AIが思考中...';
        
        // AIに手を決めさせる（ai.jsのAIクラスを使用）
        setTimeout(() => {
            const validMoves = this.getValidMoves(this.WHITE);
            
            if (validMoves.length === 0) {
                // AIがパス
                this.thinkingMessage.textContent = 'AIはパスしました';
                this.currentPlayer = this.BLACK;
                
                // プレイヤーも置けない場合はゲーム終了
                if (this.getValidMoves(this.BLACK).length === 0) {
                    setTimeout(() => {
                        this.endGame();
                    }, 1000);
                    return;
                }
                
                setTimeout(() => {
                    this.thinkingMessage.textContent = '';
                    this.updateStatus();
                    this.renderBoard();
                }, 1500);
                return;
            }
            
            // AIが手を選択（難易度に応じて）
            const move = window.ai.selectMove(this.board, this.WHITE, this.difficulty, this);
            
            if (move) {
                this.makeMove(move.row, move.col, this.WHITE);
                this.updateScore();
                
                this.thinkingMessage.textContent = `AIが (${move.row + 1}, ${move.col + 1}) に配置しました`;
                
                setTimeout(() => {
                    this.thinkingMessage.textContent = '';
                    this.currentPlayer = this.BLACK;
                    this.updateStatus();
                    
                    // ゲーム終了チェック
                    if (this.checkGameOver()) {
                        return;
                    }
                    
                    this.renderBoard();
                }, 1000);
            }
        }, 500);
    }
    
    /**
     * ゲーム終了チェック
     */
    checkGameOver() {
        const blackMoves = this.getValidMoves(this.BLACK);
        const whiteMoves = this.getValidMoves(this.WHITE);
        
        // 両方とも置けない場合
        if (blackMoves.length === 0 && whiteMoves.length === 0) {
            this.endGame();
            return true;
        }
        
        // 盤面が埋まった場合
        let emptyCount = 0;
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] === this.EMPTY) {
                    emptyCount++;
                }
            }
        }
        
        if (emptyCount === 0) {
            this.endGame();
            return true;
        }
        
        return false;
    }
    
    /**
     * ゲーム終了処理
     */
    endGame() {
        this.gameOver = true;
        const score = this.countStones();
        
        let message = '';
        let title = '';
        
        if (score.black > score.white) {
            title = '🎉 あなたの勝利！';
            message = 'おめでとうございます！AIに勝ちました！';
        } else if (score.white > score.black) {
            title = '😢 AIの勝利';
            message = '残念！次は勝ちましょう！';
        } else {
            title = '🤝 引き分け';
            message = '互角の勝負でした！';
        }
        
        document.getElementById('gameOverTitle').textContent = title;
        document.getElementById('gameOverMessage').textContent = message;
        document.getElementById('finalBlackScore').textContent = score.black;
        document.getElementById('finalWhiteScore').textContent = score.white;
        
        this.showGameOverModal();
    }
    
    /**
     * スコアの更新
     */
    updateScore() {
        const score = this.countStones();
        this.blackScoreElement.textContent = score.black;
        this.whiteScoreElement.textContent = score.white;
    }
    
    /**
     * 石の数を数える
     */
    countStones() {
        let black = 0;
        let white = 0;
        
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] === this.BLACK) black++;
                else if (this.board[row][col] === this.WHITE) white++;
            }
        }
        
        return { black, white };
    }
    
    /**
     * ステータスの更新
     */
    updateStatus() {
        if (this.gameOver) {
            this.statusMessage.textContent = 'ゲーム終了';
            return;
        }
        
        if (this.currentPlayer === this.BLACK) {
            this.statusMessage.textContent = 'あなたの番です';
        } else {
            this.statusMessage.textContent = 'AIの番です';
        }
    }
    
    /**
     * 1手戻す
     */
    undo() {
        if (this.history.length === 0) return;
        if (this.currentPlayer !== this.BLACK) return;
        
        // プレイヤーの手を打つ前の状態に戻す（AIの手も自動的に戻る）
        const lastState = this.history.pop();
        this.board = lastState.board;
        this.currentPlayer = this.BLACK;
        this.gameOver = false;
        
        this.renderBoard();
        this.updateScore();
        this.updateStatus();
    }
    
    /**
     * ヒントを表示
     */
    showHint() {
        if (this.currentPlayer !== this.BLACK || this.gameOver) return;
        
        const validMoves = this.getValidMoves(this.BLACK);
        if (validMoves.length === 0) return;
        
        // 最も多く裏返せる手を推奨
        validMoves.sort((a, b) => b.flips - a.flips);
        const bestMove = validMoves[0];
        
        // ハイライト
        const cells = this.boardElement.children;
        const index = bestMove.row * this.BOARD_SIZE + bestMove.col;
        cells[index].classList.add('hint-highlight');
        
        setTimeout(() => {
            cells[index].classList.remove('hint-highlight');
        }, 2000);
    }
    
    /**
     * 盤面のコピー
     */
    copyBoard() {
        return this.board.map(row => [...row]);
    }
    
    /**
     * ゲーム終了モーダルを表示
     */
    showGameOverModal() {
        document.getElementById('gameOverModal').classList.add('show');
    }
    
    /**
     * ゲーム終了モーダルを非表示
     */
    hideGameOverModal() {
        document.getElementById('gameOverModal').classList.remove('show');
    }
}

