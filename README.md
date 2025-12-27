# Sudoku FHE 🎯 / 数独 FHE

Sudoku game where every move is encrypted and stored on blockchain. Play classic sudoku, but your moves stay private until you want to reveal them.

ブロックチェーンに暗号化された手を保存する数独ゲーム。クラシックな数独をプレイできますが、手は公開するまで非公開のままです。

---

## Overview / 概要

This is a decentralized Sudoku game built on Ethereum using Zama's Fully Homomorphic Encryption (FHE) technology. Every move you make is encrypted client-side before being sent to the blockchain, ensuring complete privacy of your game strategy. Your moves remain encrypted on-chain, and no one can see your actual numbers until you choose to reveal them.

これは、Zamaの完全準同型暗号（FHE）技術を使用してEthereum上に構築された分散型数独ゲームです。ブロックチェーンに送信される前に、すべての手がクライアント側で暗号化され、ゲーム戦略の完全なプライバシーが確保されます。手はオンチェーンで暗号化されたまま残り、公開するまで実際の数字は誰にも見えません。

---

## Concept / コンセプト

Traditional blockchain games expose all player actions transparently. This creates several problems: players can see each other's strategies, there's no privacy for game moves, and the element of mystery is lost. This Sudoku game uses FHE to encrypt every move before blockchain submission. When you place a number in a cell, that move (row, column, and value) is encrypted using Zama's FHEVM Relayer SDK. The encrypted handle is stored on-chain as a bytes32 value, which is unreadable without the decryption key.

従来のブロックチェーンゲームは、すべてのプレイヤーの行動を透明に公開します。これにより、いくつかの問題が生じます：プレイヤーは互いの戦略を見ることができ、ゲームの手にプライバシーがなく、ミステリーの要素が失われます。この数独ゲームは、ブロックチェーンへの送信前にすべての手を暗号化するためにFHEを使用します。セルに数字を配置すると、その手（行、列、値）がZamaのFHEVM Relayer SDKを使用して暗号化されます。暗号化されたハンドルはbytes32値としてオンチェーンに保存され、復号化キーなしでは読み取れません。

This means your moves are private during gameplay, no one can see your strategy until you reveal it, game state is verifiable on-chain through encrypted data, and there's complete transparency of the game rules with complete privacy of your moves. The game follows standard Sudoku rules: fill a 9x9 grid with digits 1-9, ensuring each row, column, and 3x3 subgrid contains all digits exactly once. The difference is that your moves are encrypted, stored on blockchain, and can be verified without revealing the actual values.

これは、ゲームプレイ中に手が非公開であることを意味し、公開するまで誰もあなたの戦略を見ることができず、ゲーム状態が暗号化されたデータを通じてオンチェーンで検証可能であり、ゲームルールの完全な透明性と手の完全なプライバシーがあります。ゲームは標準的な数独のルールに従います：9x9のグリッドに1-9の数字を埋め、各行、各列、各3x3のサブグリッドがすべての数字を正確に1回含むようにします。違いは、あなたの手が暗号化され、ブロックチェーンに保存され、実際の値を公開することなく検証できることです。

---

## How It Works / 仕組み

### Game Flow / ゲームフロー

1. **Start Game** / **ゲーム開始**: Player connects wallet and starts a new Sudoku game. A puzzle is generated, and a game session is created on the smart contract. / プレイヤーがウォレットを接続し、新しい数独ゲームを開始します。パズルが生成され、スマートコントラクト上にゲームセッションが作成されます。

2. **Make Moves** / **手を打つ**: When player places a number in a cell, the move data (row, column, value) is encoded into a single uint32 value. This value is encrypted client-side using Zama FHE Relayer SDK. / プレイヤーがセルに数字を配置すると、手のデータ（行、列、値）が単一のuint32値にエンコードされます。この値は、Zama FHE Relayer SDKを使用してクライアント側で暗号化されます。

3. **Encryption Process** / **暗号化プロセス**: The relayer SDK encrypts the move data and returns an encrypted handle (Uint8Array) along with an attestation proof. The handle is converted to bytes32 format for blockchain compatibility. / リレイヤーSDKが手のデータを暗号化し、証明とともに暗号化されたハンドル（Uint8Array）を返します。ハンドルはブロックチェーン互換性のためにbytes32形式に変換されます。

4. **Blockchain Submission** / **ブロックチェーンへの送信**: The encrypted handle and attestation are sent to the smart contract's `makeMove` function. The contract stores the encrypted handle in an array. / 暗号化されたハンドルと証明がスマートコントラクトの`makeMove`関数に送信されます。コントラクトは暗号化されたハンドルを配列に保存します。

5. **Game Completion** / **ゲーム完了**: When the puzzle is solved, player calls `completeGame` to mark the game as finished on-chain. / パズルが解かれたら、プレイヤーが`completeGame`を呼び出して、ゲームをオンチェーンで終了としてマークします。

6. **Privacy** / **プライバシー**: Throughout the process, actual move values remain encrypted. Only the encrypted handles are visible on-chain, maintaining complete privacy of player strategy. / プロセス全体を通じて、実際の手の値は暗号化されたままです。オンチェーンには暗号化されたハンドルのみが表示され、プレイヤーの戦略の完全なプライバシーが維持されます。

### FHE Implementation / FHE実装

The game uses Zama's FHEVM Relayer SDK for client-side encryption. Each move is encrypted as a uint32 value containing row (8 bits), column (8 bits), and value (8 bits). The relayer encrypts this data and returns a handle in Uint8Array format. The handle is converted to bytes32 hex string for Solidity compatibility. Attestation proofs validate the encryption integrity. Encrypted handles are stored on-chain in `bytes32[] encryptedMoves` array.

ゲームは、クライアント側の暗号化にZamaのFHEVM Relayer SDKを使用します。各手は、行（8ビット）、列（8ビット）、値（8ビット）を含むuint32値として暗号化されます。リレイヤーがこのデータを暗号化し、Uint8Array形式のハンドルを返します。ハンドルはSolidity互換性のためにbytes32 hex文字列に変換されます。証明が暗号化の整合性を検証します。暗号化されたハンドルは、`bytes32[] encryptedMoves`配列にオンチェーンで保存されます。

### Smart Contract / スマートコントラクト

The `SudokuGame` contract stores game state and encrypted moves. `startGame()` creates a new game session for the player. `makeMove(gameId, bytes32 encryptedMove, bytes attestation)` stores an encrypted move. `completeGame(gameId)` marks game as completed. `getGame(gameId)` returns game metadata (player, move count, timestamps, status). `getPlayerGames(player)` returns all game IDs for a player. Game data structure includes player address, array of encrypted moves, timestamps, and completion status. The contract ensures only the game owner can make moves and complete their games.

`SudokuGame`コントラクトは、ゲーム状態と暗号化された手を保存します。`startGame()`はプレイヤーの新しいゲームセッションを作成します。`makeMove(gameId, bytes32 encryptedMove, bytes attestation)`は暗号化された手を保存します。`completeGame(gameId)`はゲームを完了としてマークします。`getGame(gameId)`はゲームメタデータ（プレイヤー、手の数、タイムスタンプ、ステータス）を返します。`getPlayerGames(player)`はプレイヤーのすべてのゲームIDを返します。ゲームデータ構造には、プレイヤーアドレス、暗号化された手の配列、タイムスタンプ、完了ステータスが含まれます。コントラクトは、ゲームの所有者のみが手を打ち、ゲームを完了できることを保証します。

---

## Features / 機能

- **Encrypted Moves** / **暗号化された手**: Every move encrypted using Zama FHE before blockchain submission / ブロックチェーンへの送信前に、すべての手がZama FHEを使用して暗号化されます

- **Privacy Preserved** / **プライバシー保護**: Move values remain private, only encrypted handles visible on-chain / 手の値は非公開のままで、オンチェーンには暗号化されたハンドルのみが表示されます

- **On-Chain Verification** / **オンチェーン検証**: Game state and move count verifiable on blockchain / ゲーム状態と手の数がブロックチェーンで検証可能

- **Standard Sudoku Rules** / **標準数独ルール**: Classic 9x9 Sudoku puzzle mechanics / クラシックな9x9数独パズルのメカニクス

- **Player Ownership** / **プレイヤー所有権**: Each game is tied to player's wallet address / 各ゲームはプレイヤーのウォレットアドレスに結び付けられています

- **Game History** / **ゲーム履歴**: All games stored on-chain with timestamps / すべてのゲームがタイムスタンプ付きでオンチェーンに保存されます

---

## Getting Started / 始め方

### Prerequisites / 前提条件

- Node.js 18 or higher / Node.js 18以上
- npm or yarn
- MetaMask or compatible Web3 wallet / MetaMaskまたは互換性のあるWeb3ウォレット
- Sepolia testnet ETH ([Get from faucet](https://sepoliafaucet.com/)) / SepoliaテストネットETH（[フォーセットから取得](https://sepoliafaucet.com/)）

### Installation / インストール

```bash
# Clone repository / リポジトリをクローン
git clone <repository-url>
cd wallet-13

# Install dependencies / 依存関係をインストール
npm install
```

### Environment Setup / 環境設定

Create `.env.local` file: / `.env.local`ファイルを作成:

```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.drpc.org
NEXT_PUBLIC_SUDOKU_CONTRACT_ADDRESS=0x15FBfc56Ff5a16fC54f787f852007d99E7Bbb97d
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### Development / 開発

```bash
# Start development server / 開発サーバーを起動
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. / ブラウザで[http://localhost:3000](http://localhost:3000)を開きます。

### Build for Production / 本番用ビルド

```bash
# Build / ビルド
npm run build

# Start production server / 本番サーバーを起動
npm start
```

### Contract Deployment / コントラクトのデプロイ

```bash
# Compile contracts / コントラクトをコンパイル
npm run compile

# Deploy to Sepolia / Sepoliaにデプロイ
npm run deploy:sudoku
```

---

## Usage / 使用方法

### Playing the Game / ゲームのプレイ

1. **Connect Wallet** / **ウォレットを接続**: Connect your Web3 wallet (MetaMask recommended) / Web3ウォレットを接続（MetaMask推奨）

2. **Start Game** / **ゲーム開始**: Click "START GAME" to create a new Sudoku puzzle / 「START GAME」をクリックして新しい数独パズルを作成

3. **Select Cell** / **セルを選択**: Click on an empty cell to select it / 空のセルをクリックして選択

4. **Place Number** / **数字を配置**: Click a number (1-9) or use keyboard to place a digit / 数字（1-9）をクリックするか、キーボードを使用して数字を配置

5. **Move Encrypted** / **手が暗号化される**: Your move is automatically encrypted and sent to blockchain / あなたの手が自動的に暗号化され、ブロックチェーンに送信されます

6. **Solve Puzzle** / **パズルを解く**: Fill the entire grid following Sudoku rules / 数独のルールに従ってグリッド全体を埋める

7. **Complete Game** / **ゲーム完了**: When solved, complete the game on-chain / 解けたら、オンチェーンでゲームを完了

### Game Rules / ゲームルール

Fill 9x9 grid with digits 1-9. Each row must contain all digits 1-9 exactly once. Each column must contain all digits 1-9 exactly once. Each 3x3 subgrid must contain all digits 1-9 exactly once. Initial puzzle has some cells pre-filled (clues). Fill empty cells to complete the puzzle.

9x9のグリッドに1-9の数字を埋めます。各行は1-9のすべての数字を正確に1回含む必要があります。各列は1-9のすべての数字を正確に1回含む必要があります。各3x3のサブグリッドは1-9のすべての数字を正確に1回含む必要があります。初期パズルには一部のセルが事前に埋められています（ヒント）。空のセルを埋めてパズルを完成させます。

---

## Technical Stack / 技術スタック

**Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS  
**Blockchain:** Ethereum Sepolia Testnet, Hardhat, Ethers.js v6, Wagmi, RainbowKit  
**FHE:** Zama FHEVM Relayer SDK v0.3.0-6  
**Development:** Solidity ^0.8.20, TypeScript

---

## Project Structure / プロジェクト構造

```
wallet-13/
├── app/                      # Next.js application
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Main game page
│   └── providers.tsx        # Wagmi/RainbowKit providers
├── components/
│   ├── SudokuGame.tsx       # Main game component (FHE integration)
│   └── Navigation.tsx       # Navigation component
├── contracts/
│   └── SudokuGame.sol       # Sudoku game smart contract
├── scripts/
│   └── deploy-sudoku.ts     # Contract deployment script
└── lib/
    └── provider.ts          # Ethereum provider utilities
```

---

## Security Considerations / セキュリティに関する考慮事項

- **Encryption** / **暗号化**: All moves encrypted client-side using Zama FHE before submission / 送信前に、すべての手がZama FHEを使用してクライアント側で暗号化されます

- **Privacy** / **プライバシー**: Encrypted handles stored on-chain cannot be decrypted by other users / オンチェーンに保存された暗号化されたハンドルは、他のユーザーが復号化できません

- **Attestation** / **証明**: Each encrypted move includes attestation proof from relayer / 各暗号化された手には、リレイヤーからの証明が含まれます

- **Access Control** / **アクセス制御**: Only game owner can make moves and complete their games / ゲームの所有者のみが手を打ち、ゲームを完了できます

- **Validation** / **検証**: Contract validates game state before accepting moves / コントラクトは、手を受け入れる前にゲーム状態を検証します

**Note:** This is a testnet deployment for demonstration purposes. Do not use for production without thorough security auditing. / **注意：** これはデモンストレーション目的のテストネットデプロイメントです。徹底的なセキュリティ監査なしに本番環境で使用しないでください。

---

## Development Commands / 開発コマンド

```bash
# Development / 開発
npm run dev              # Start dev server / 開発サーバーを起動
npm run build            # Build for production / 本番用ビルド
npm run start            # Start production server / 本番サーバーを起動
npm run lint             # Run ESLint / ESLintを実行

# Smart Contracts / スマートコントラクト
npm run compile          # Compile contracts / コントラクトをコンパイル
npm run deploy:sudoku    # Deploy SudokuGame contract / SudokuGameコントラクトをデプロイ
```

---

## License / ライセンス

MIT

---

## Resources / リソース

- [Zama FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama Relayer SDK](https://github.com/zama-ai/fhevm-relayer-sdk)
- [Ethereum Sepolia Testnet](https://sepolia.dev/)
- [Sepolia Etherscan](https://sepolia.etherscan.io/)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Game Demo](https://sudokufhe.vercel.app)
- [Smart Contract on Etherscan](https://sepolia.etherscan.io/address/0x15FBfc56Ff5a16fC54f787f852007d99E7Bbb97d)

**Contract Address:** `0x15FBfc56Ff5a16fC54f787f852007d99E7Bbb97d`  
**Network:** Sepolia Testnet / Sepoliaテストネット
