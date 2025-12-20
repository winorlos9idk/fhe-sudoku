// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Контракт для игры в судоку с зашифрованными ходами
// Каждый ход шифруется через FHE relayer перед отправкой
contract SudokuGame {
    struct Game {
        address player;
        bytes32[] encryptedMoves; // Зашифрованные ходы (позиция + значение)
        uint256 startTime;
        bool isActive;
        bool isCompleted;
        uint256 completedTime;
    }

    mapping(uint256 => Game) public games;
    mapping(address => uint256[]) public playerGames;
    uint256 public gameCounter;

    event GameStarted(uint256 indexed gameId, address indexed player);
    event MoveMade(uint256 indexed gameId, address indexed player, bytes32 encryptedMove);
    event GameCompleted(uint256 indexed gameId, address indexed player);

    // Начать новую игру
    function startGame() external returns (uint256) {
        uint256 gameId = gameCounter;
        gameCounter++;

        games[gameId] = Game({
            player: msg.sender,
            encryptedMoves: new bytes32[](0),
            startTime: block.timestamp,
            isActive: true,
            isCompleted: false,
            completedTime: 0
        });

        playerGames[msg.sender].push(gameId);

        emit GameStarted(gameId, msg.sender);
        return gameId;
    }

    // Сделать ход (зашифрованный)
    function makeMove(uint256 gameId, bytes32 encryptedMove, bytes calldata /* attestation */) external {
        Game storage game = games[gameId];
        require(game.isActive, "Game not active");
        require(msg.sender == game.player, "Not your game");
        require(encryptedMove != bytes32(0), "Invalid move");

        game.encryptedMoves.push(encryptedMove);

        emit MoveMade(gameId, msg.sender, encryptedMove);
    }

    // Завершить игру
    function completeGame(uint256 gameId) external {
        Game storage game = games[gameId];
        require(game.isActive, "Game not active");
        require(msg.sender == game.player, "Not your game");

        game.isActive = false;
        game.isCompleted = true;
        game.completedTime = block.timestamp;

        emit GameCompleted(gameId, msg.sender);
    }

    // Получить информацию об игре
    function getGame(uint256 gameId) external view returns (
        address player,
        uint256 moveCount,
        uint256 startTime,
        bool isActive,
        bool isCompleted
    ) {
        Game storage game = games[gameId];
        return (
            game.player,
            game.encryptedMoves.length,
            game.startTime,
            game.isActive,
            game.isCompleted
        );
    }

    // Получить игры игрока
    function getPlayerGames(address player) external view returns (uint256[] memory) {
        return playerGames[player];
    }
}

