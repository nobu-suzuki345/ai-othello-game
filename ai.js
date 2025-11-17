/**
 * オセロAIクラス
 * ミニマックス法 + アルファベータ枝刈りを実装
 */
class OthelloAI {
    constructor() {
        // 位置の評価値（角を最優先、辺も重要、X位置とC位置は危険）
        this.positionWeights = [
            [100, -20,  10,   5,   5,  10, -20, 100],
            [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
            [ 10,  -2,   5,   1,   1,   5,  -2,  10],
            [  5,  -2,   1,   0,   0,   1,  -2,   5],
            [  5,  -2,   1,   0,   0,   1,  -2,   5],
            [ 10,  -2,   5,   1,   1,   5,  -2,  10],
            [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
            [100, -20,  10,   5,   5,  10, -20, 100]
        ];
        
        this.BOARD_SIZE = 8;
        this.EMPTY = 0;
        this.BLACK = 1;
        this.WHITE = 2;
        
        // ミニマックス法の探索深度
        this.maxDepth = 4;
    }
    
    /**
     * AIが手を選択する（メインエントリーポイント）
     * @param {Array} board - 現在の盤面
     * @param {number} player - AIのプレイヤー番号
     * @param {number} difficulty - 難易度 (1: 初級, 2: 中級, 3: 上級)
     * @param {Object} game - ゲームオブジェクト
     * @returns {Object} - 選択した手 {row, col}
     */
    selectMove(board, player, difficulty, game) {
        const validMoves = game.getValidMoves(player);
        
        if (validMoves.length === 0) return null;
        
        switch (difficulty) {
            case 1:
                return this.selectRandomMove(validMoves);
            case 2:
                return this.selectGreedyMove(board, validMoves, player, game);
            case 3:
                return this.selectMinimaxMove(board, player, game);
            default:
                return this.selectGreedyMove(board, validMoves, player, game);
        }
    }
    
    /**
     * 初級AI: ランダムに手を選択
     */
    selectRandomMove(validMoves) {
        const randomIndex = Math.floor(Math.random() * validMoves.length);
        return validMoves[randomIndex];
    }
    
    /**
     * 中級AI: 評価関数ベース（貪欲法）
     */
    selectGreedyMove(board, validMoves, player, game) {
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const move of validMoves) {
            // 手を試す
            const testBoard = this.copyBoard(board);
            this.makeTestMove(testBoard, move.row, move.col, player, game);
            
            // 評価値を計算
            const score = this.evaluateBoard(testBoard, player);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }
    
    /**
     * 上級AI: ミニマックス法 + アルファベータ枝刈り
     */
    selectMinimaxMove(board, player, game) {
        let bestMove = null;
        let bestScore = -Infinity;
        let alpha = -Infinity;
        let beta = Infinity;
        
        const validMoves = game.getValidMoves(player);
        
        for (const move of validMoves) {
            // 手を試す
            const testBoard = this.copyBoard(board);
            this.makeTestMove(testBoard, move.row, move.col, player, game);
            
            // ミニマックス法で評価（相手のターン）
            const score = this.minimax(
                testBoard,
                this.maxDepth - 1,
                false,
                alpha,
                beta,
                player,
                game
            );
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
            
            alpha = Math.max(alpha, score);
        }
        
        return bestMove;
    }
    
    /**
     * ミニマックス法の実装
     * @param {Array} board - 盤面
     * @param {number} depth - 残りの探索深度
     * @param {boolean} maximizing - 最大化プレイヤーのターンか
     * @param {number} alpha - アルファ値
     * @param {number} beta - ベータ値
     * @param {number} player - AIのプレイヤー番号
     * @param {Object} game - ゲームオブジェクト
     * @returns {number} - 評価値
     */
    minimax(board, depth, maximizing, alpha, beta, player, game) {
        // 深度0または終端ノードの場合
        if (depth === 0) {
            return this.evaluateBoard(board, player);
        }
        
        const currentPlayer = maximizing ? player : (player === this.WHITE ? this.BLACK : this.WHITE);
        const validMoves = this.getValidMovesForBoard(board, currentPlayer, game);
        
        // 有効な手がない場合
        if (validMoves.length === 0) {
            const opponent = player === this.WHITE ? this.BLACK : this.WHITE;
            const opponentMoves = this.getValidMovesForBoard(board, opponent, game);
            
            if (opponentMoves.length === 0) {
                // ゲーム終了
                return this.evaluateBoard(board, player);
            }
            
            // パス
            return this.minimax(board, depth - 1, !maximizing, alpha, beta, player, game);
        }
        
        if (maximizing) {
            let maxScore = -Infinity;
            
            for (const move of validMoves) {
                const testBoard = this.copyBoard(board);
                this.makeTestMove(testBoard, move.row, move.col, currentPlayer, game);
                
                const score = this.minimax(
                    testBoard,
                    depth - 1,
                    false,
                    alpha,
                    beta,
                    player,
                    game
                );
                
                maxScore = Math.max(maxScore, score);
                alpha = Math.max(alpha, score);
                
                // アルファベータ枝刈り
                if (beta <= alpha) {
                    break;
                }
            }
            
            return maxScore;
        } else {
            let minScore = Infinity;
            
            for (const move of validMoves) {
                const testBoard = this.copyBoard(board);
                this.makeTestMove(testBoard, move.row, move.col, currentPlayer, game);
                
                const score = this.minimax(
                    testBoard,
                    depth - 1,
                    true,
                    alpha,
                    beta,
                    player,
                    game
                );
                
                minScore = Math.min(minScore, score);
                beta = Math.min(beta, score);
                
                // アルファベータ枝刈り
                if (beta <= alpha) {
                    break;
                }
            }
            
            return minScore;
        }
    }
    
    /**
     * 盤面の評価関数
     * @param {Array} board - 盤面
     * @param {number} player - 評価するプレイヤー
     * @returns {number} - 評価値
     */
    evaluateBoard(board, player) {
        const opponent = player === this.WHITE ? this.BLACK : this.WHITE;
        
        let score = 0;
        let playerStones = 0;
        let opponentStones = 0;
        
        // 1. 位置評価（最も重要）
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (board[row][col] === player) {
                    score += this.positionWeights[row][col];
                    playerStones++;
                } else if (board[row][col] === opponent) {
                    score -= this.positionWeights[row][col];
                    opponentStones++;
                }
            }
        }
        
        // 2. 石数評価（終盤で重要）
        const totalStones = playerStones + opponentStones;
        const gamePhase = totalStones / (this.BOARD_SIZE * this.BOARD_SIZE);
        
        if (gamePhase > 0.7) {
            // 終盤：石数が重要
            score += (playerStones - opponentStones) * 10;
        }
        
        // 3. 機動力評価（序盤〜中盤で重要）
        if (gamePhase < 0.7) {
            const playerMobility = this.countMobility(board, player);
            const opponentMobility = this.countMobility(board, opponent);
            score += (playerMobility - opponentMobility) * 5;
        }
        
        // 4. 角の確保（非常に重要）
        const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
        for (const [row, col] of corners) {
            if (board[row][col] === player) {
                score += 100;
            } else if (board[row][col] === opponent) {
                score -= 100;
            }
        }
        
        return score;
    }
    
    /**
     * 機動力（有効な手の数）を数える
     */
    countMobility(board, player) {
        let count = 0;
        
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (board[row][col] === this.EMPTY) {
                    if (this.canPlaceStone(board, row, col, player)) {
                        count++;
                    }
                }
            }
        }
        
        return count;
    }
    
    /**
     * 石を配置できるかチェック
     */
    canPlaceStone(board, row, col, player) {
        if (board[row][col] !== this.EMPTY) return false;
        
        const opponent = player === this.WHITE ? this.BLACK : this.WHITE;
        const directions = [
            [-1, 0], [-1, 1], [0, 1], [1, 1],
            [1, 0], [1, -1], [0, -1], [-1, -1]
        ];
        
        for (const [dr, dc] of directions) {
            let r = row + dr;
            let c = col + dc;
            let hasOpponent = false;
            
            while (this.isValidPosition(r, c) && board[r][c] === opponent) {
                hasOpponent = true;
                r += dr;
                c += dc;
            }
            
            if (hasOpponent && this.isValidPosition(r, c) && board[r][c] === player) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * テスト用に手を実行
     */
    makeTestMove(board, row, col, player, game) {
        board[row][col] = player;
        
        const flips = this.getFlips(board, row, col, player);
        flips.forEach(([r, c]) => {
            board[r][c] = player;
        });
    }
    
    /**
     * 裏返す石を取得
     */
    getFlips(board, row, col, player) {
        const flips = [];
        const opponent = player === this.WHITE ? this.BLACK : this.WHITE;
        const directions = [
            [-1, 0], [-1, 1], [0, 1], [1, 1],
            [1, 0], [1, -1], [0, -1], [-1, -1]
        ];
        
        for (const [dr, dc] of directions) {
            const temp = [];
            let r = row + dr;
            let c = col + dc;
            
            while (this.isValidPosition(r, c) && board[r][c] === opponent) {
                temp.push([r, c]);
                r += dr;
                c += dc;
            }
            
            if (this.isValidPosition(r, c) && board[r][c] === player && temp.length > 0) {
                flips.push(...temp);
            }
        }
        
        return flips;
    }
    
    /**
     * 有効な手を取得（テスト盤面用）
     */
    getValidMovesForBoard(board, player, game) {
        const moves = [];
        
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (board[row][col] === this.EMPTY) {
                    const flips = this.getFlips(board, row, col, player);
                    if (flips.length > 0) {
                        moves.push({ row, col, flips: flips.length });
                    }
                }
            }
        }
        
        return moves;
    }
    
    /**
     * 盤面のコピー
     */
    copyBoard(board) {
        return board.map(row => [...row]);
    }
    
    /**
     * 位置が有効かチェック
     */
    isValidPosition(row, col) {
        return row >= 0 && row < this.BOARD_SIZE && col >= 0 && col < this.BOARD_SIZE;
    }
}

