# Sudoku FHE 🎯 / 数独 FHE

Sudoku game where every move is encrypted and stored on blockchain. Play classic sudoku, but your moves stay private until you want to reveal them.

ブロックチェーンに暗号化された手を保存する数独ゲーム。クラシックな数独をプレイできますが、手は公開するまで非公開のままです。

## What's this? / これは何？

It's a sudoku game, but cooler. Every time you put a number in a cell, it gets encrypted using fancy math (FHE - Fully Homomorphic Encryption) and saved to the blockchain. Nobody can see your moves unless you want them to.

数独ゲームですが、もっとクールです。セルに数字を入れるたびに、高度な数学（FHE - 完全準同型暗号）を使って暗号化され、ブロックチェーンに保存されます。公開しない限り、誰もあなたの手を見ることはできません。

## How to play / 遊び方

1. Connect your wallet (MetaMask works great) / ウォレットを接続（MetaMaskがおすすめ）
2. Click "START GAME" / 「START GAME」をクリック
3. Click on an empty cell / 空のセルをクリック
4. Click a number (1-9) or use keyboard / 数字（1-9）をクリックするか、キーボードを使用
5. Your move gets encrypted and sent to blockchain automatically / 手が自動的に暗号化されてブロックチェーンに送信されます
6. Solve the puzzle and win! / パズルを解いて勝利！

## Setup / セットアップ

### Install stuff / インストール

```bash
npm install
```

### Compile contract / コントラクトのコンパイル

```bash
npm run compile
```

### Deploy contract / コントラクトのデプロイ

```bash
npm run deploy:sudoku
```

### Run locally / ローカルで実行

```bash
npm run dev
```

## Environment variables / 環境変数

Create `.env.local`:

```
PRIVATE_KEY=your_key_here
SEPOLIA_RPC_URL=https://sepolia.drpc.org
NEXT_PUBLIC_SUDOKU_CONTRACT_ADDRESS=your_contract_address
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## How it works / 仕組み

- You play sudoku like normal / 通常通り数独をプレイ
- When you make a move, the game encrypts it using Zama's FHE relayer / 手を打つと、ZamaのFHEリレイヤーを使って暗号化されます
- Encrypted move goes to blockchain as bytes32 / 暗号化された手がbytes32としてブロックチェーンに送られます
- Your actual move stays secret / 実際の手は秘密のままです
- When you solve the puzzle, game completes on blockchain / パズルを解くと、ブロックチェーン上でゲームが完了します

## Tech stuff / 技術情報

- Frontend: Next.js, React, TypeScript / フロントエンド: Next.js, React, TypeScript
- Blockchain: Hardhat, Ethers.js / ブロックチェーン: Hardhat, Ethers.js
- FHE: Zama FHEVM Relayer / FHE: Zama FHEVM Relayer
- Network: Sepolia testnet / ネットワーク: Sepolia テストネット

## Live / ライブ

https://sudokufhe.vercel.app

## License / ライセンス

MIT
