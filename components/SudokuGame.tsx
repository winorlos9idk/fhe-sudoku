'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'
import { getSigner } from '@/lib/provider'

const SUDOKU_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_SUDOKU_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000').trim()

const SUDOKU_ABI = [
  'function startGame() external returns (uint256)',
  'function makeMove(uint256 gameId, bytes32 encryptedMove, bytes calldata attestation) external',
  'function completeGame(uint256 gameId) external',
  'function getGame(uint256 gameId) external view returns (address player, uint256 moveCount, uint256 startTime, bool isActive, bool isCompleted)',
  'event GameStarted(uint256 indexed gameId, address indexed player)',
  'event MoveMade(uint256 indexed gameId, address indexed player, bytes32 encryptedMove)',
]

// Логика судоку - проверка валидности
function isValidMove(board: number[][], row: number, col: number, num: number): boolean {
  // проверяем строку
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false
  }
  
  // проверяем столбец
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) return false
  }
  
  // проверяем квадрат 3x3
  const startRow = row - row % 3
  const startCol = col - col % 3
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i + startRow][j + startCol] === num) return false
    }
  }
  
  return true
}

// Генерация начальной доски (простая версия)
function generatePuzzle(): { puzzle: number[][], solution: number[][] } {
  const solution: number[][] = Array(9).fill(null).map(() => Array(9).fill(0))
  
  // заполняем диагональные квадраты 3x3
  for (let box = 0; box < 9; box += 3) {
    fillBox(solution, box, box)
  }
  
  // решаем остальное
  solveSudoku(solution)
  
  // создаем пазл, убирая некоторые числа
  const puzzle = solution.map(row => [...row])
  const cellsToRemove = 40 // убираем 40 чисел для сложности
  
  for (let i = 0; i < cellsToRemove; i++) {
    const row = Math.floor(Math.random() * 9)
    const col = Math.floor(Math.random() * 9)
    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0
    } else {
      i-- // пробуем еще раз
    }
  }
  
  return { puzzle, solution }
}

function fillBox(board: number[][], row: number, col: number): void {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  // перемешиваем
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]]
  }
  
  let idx = 0
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      board[row + i][col + j] = nums[idx++]
    }
  }
}

function solveSudoku(board: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValidMove(board, row, col, num)) {
            board[row][col] = num
            if (solveSudoku(board)) {
              return true
            }
            board[row][col] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

export default function SudokuGame() {
  const { address, isConnected } = useAccount()
  const [board, setBoard] = useState<number[][]>(Array(9).fill(null).map(() => Array(9).fill(0)))
  const [initialBoard, setInitialBoard] = useState<number[][]>(Array(9).fill(null).map(() => Array(9).fill(0)))
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [gameId, setGameId] = useState<number | null>(null)
  const [relayerInstance, setRelayerInstance] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (typeof global === 'undefined') {
        (window as any).global = globalThis
      }
      initRelayer()
    }
  }, [])

  const initRelayer = async () => {
    try {
      const relayerModule = await import('@zama-fhe/relayer-sdk/web')
      const sdkInitialized = await relayerModule.initSDK()
      if (!sdkInitialized) {
        throw new Error('SDK init failed')
      }
      const instance = await relayerModule.createInstance(relayerModule.SepoliaConfig)
      setRelayerInstance(instance)
    } catch (err) {
      console.log('Relayer init failed, will retry when needed')
    }
  }

  const startNewGame = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first')
      return
    }

    try {
      // генерируем новую доску
      const { puzzle, solution } = generatePuzzle()
      setInitialBoard(puzzle.map(row => [...row]))
      setBoard(puzzle.map(row => [...row]))
      setSelectedCell(null)
      setIsComplete(false)
      setGameStarted(true)

      // создаем игру в блокчейне
      if (relayerInstance) {
        const signer = await getSigner()
        const contract = new ethers.Contract(SUDOKU_CONTRACT_ADDRESS, SUDOKU_ABI, signer)
        
        // переключаемся на Sepolia если нужно
        if (typeof window !== 'undefined' && window.ethereum) {
          try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' })
            if (chainId !== '0xaa36a7') {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xaa36a7' }],
              })
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          } catch {}
        }

        const tx = await contract.startGame()
        const receipt = await tx.wait()
        
        // находим gameId из события
        const event = receipt?.logs.find((log: any) => {
          try {
            const parsed = contract.interface.parseLog(log)
            return parsed?.name === 'GameStarted'
          } catch {
            return false
          }
        })

        if (event) {
          const parsed = contract.interface.parseLog(event)
          const newGameId = parsed?.args.gameId
          setGameId(Number(newGameId))
        }
      }
    } catch (err: any) {
      console.error('Failed to start game:', err)
      alert('Failed to start game: ' + (err.message || 'Unknown error'))
    }
  }

  const handleCellClick = (row: number, col: number) => {
    // нельзя менять начальные числа
    if (initialBoard[row][col] !== 0) return
    setSelectedCell({ row, col })
  }

  const handleNumberInput = async (num: number) => {
    if (!selectedCell || !gameId || !relayerInstance || !isConnected) return

    const { row, col } = selectedCell
    if (initialBoard[row][col] !== 0) return // нельзя менять начальные

    // обновляем доску локально
    const newBoard = board.map(r => [...r])
    newBoard[row][col] = num
    setBoard(newBoard)

    // проверяем, решена ли игра
    const isSolved = checkIfSolved(newBoard)
    if (isSolved) {
      setIsComplete(true)
      // завершаем игру в блокчейне
      try {
        const signer = await getSigner()
        const contract = new ethers.Contract(SUDOKU_CONTRACT_ADDRESS, SUDOKU_ABI, signer)
        await contract.completeGame(gameId)
      } catch (err) {
        console.error('Failed to complete game:', err)
      }
    }

    // шифруем и отправляем ход
    try {
      setIsSubmitting(true)
      
      // кодируем ход: row (1 byte) + col (1 byte) + value (1 byte)
      const moveData = (row << 16) | (col << 8) | num
      
      const inputBuilder = relayerInstance.createEncryptedInput(SUDOKU_CONTRACT_ADDRESS, address)
      inputBuilder.add32(moveData) // используем uint32 для хода
      const encryptedInput = await Promise.race([
        inputBuilder.encrypt(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Encryption timeout')), 30000)
        )
      ]) as any

      if (!encryptedInput?.handles || encryptedInput.handles.length === 0) {
        throw new Error('Encryption failed')
      }

      const encryptedHandle = encryptedInput.handles[0]
      const attestation = encryptedInput.inputProof

      const signer = await getSigner()
      const contract = new ethers.Contract(SUDOKU_CONTRACT_ADDRESS, SUDOKU_ABI, signer)
      await contract.makeMove(gameId, encryptedHandle, attestation)
      
      setSelectedCell(null)
    } catch (err: any) {
      console.error('Failed to submit move:', err)
      // откатываем изменение если не удалось отправить
      const newBoard = board.map(r => [...r])
      newBoard[row][col] = 0
      setBoard(newBoard)
      alert('Failed to submit move: ' + (err.message || 'Unknown error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const checkIfSolved = (currentBoard: number[][]): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (currentBoard[row][col] === 0) return false
        if (!isValidMove(currentBoard, row, col, currentBoard[row][col])) return false
      }
    }
    return true
  }

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!selectedCell || isSubmitting) return
    
    const num = parseInt(e.key)
    if (num >= 1 && num <= 9) {
      handleNumberInput(num)
    } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
      // удаляем число
      const { row, col } = selectedCell
      if (initialBoard[row][col] === 0) {
        const newBoard = board.map(r => [...r])
        newBoard[row][col] = 0
        setBoard(newBoard)
      }
    }
  }, [selectedCell, board, initialBoard, isSubmitting])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ 
      background: 'linear-gradient(135deg, #f5f1e8 0%, #e8ddd4 100%)',
      fontFamily: 'serif'
    }}>
      <div className="max-w-2xl w-full">
        <h1 className="text-5xl font-bold text-center mb-8" style={{ 
          color: '#8b4513',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
          letterSpacing: '2px'
        }}>
          数独
        </h1>
        <p className="text-center mb-6 text-gray-700">Sudoku with encrypted moves on blockchain</p>

        {!gameStarted ? (
          <div className="text-center">
            <button
              onClick={startNewGame}
              disabled={!isConnected}
              className="px-8 py-4 text-xl font-bold rounded-lg disabled:opacity-50"
              style={{
                background: isConnected ? '#8b4513' : '#999',
                color: '#fff',
                border: '2px solid #654321',
                cursor: isConnected ? 'pointer' : 'not-allowed',
                boxShadow: '4px 4px 8px rgba(0,0,0,0.2)'
              }}
            >
              {isConnected ? '🎮 START GAME' : 'CONNECT WALLET FIRST'}
            </button>
          </div>
        ) : (
          <>
            {isComplete && (
              <div className="text-center mb-4 p-4 rounded-lg" style={{ background: '#d4edda', border: '2px solid #28a745' }}>
                <p className="text-2xl font-bold text-green-700">🎉 CONGRATULATIONS! PUZZLE SOLVED!</p>
              </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-lg" style={{ border: '3px solid #8b4513' }}>
              <div className="grid grid-cols-9 gap-1 mb-4">
                {board.map((row, rowIdx) =>
                  row.map((cell, colIdx) => {
                    const isInitial = initialBoard[rowIdx][colIdx] !== 0
                    const isSelected = selectedCell?.row === rowIdx && selectedCell?.col === colIdx
                    const borderRight = colIdx === 2 || colIdx === 5
                    const borderBottom = rowIdx === 2 || rowIdx === 5

                    return (
                      <div
                        key={`${rowIdx}-${colIdx}`}
                        onClick={() => handleCellClick(rowIdx, colIdx)}
                        className={`flex items-center justify-center text-2xl font-bold cursor-pointer transition-all ${
                          isSelected ? 'ring-4 ring-blue-500' : ''
                        }`}
                        style={{
                          aspectRatio: '1',
                          background: isInitial ? '#f0e6d2' : isSelected ? '#e3f2fd' : '#fff',
                          color: isInitial ? '#654321' : '#000',
                          borderRight: borderRight ? '3px solid #8b4513' : '1px solid #ddd',
                          borderBottom: borderBottom ? '3px solid #8b4513' : '1px solid #ddd',
                          borderTop: rowIdx === 0 ? '3px solid #8b4513' : '1px solid #ddd',
                          borderLeft: colIdx === 0 ? '3px solid #8b4513' : '1px solid #ddd',
                        }}
                      >
                        {cell !== 0 ? cell : ''}
                      </div>
                    )
                  })
                )}
              </div>

              <div className="mt-6 flex justify-center gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    onClick={() => handleNumberInput(num)}
                    disabled={!selectedCell || isSubmitting}
                    className="w-12 h-12 text-xl font-bold rounded-lg disabled:opacity-50"
                    style={{
                      background: selectedCell && !isSubmitting ? '#8b4513' : '#ccc',
                      color: '#fff',
                      border: '2px solid #654321',
                      cursor: selectedCell && !isSubmitting ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <p className="text-center mt-4 text-sm text-gray-600">
                Click a cell, then click a number or use keyboard (1-9)
              </p>
              {isSubmitting && (
                <p className="text-center mt-2 text-sm text-blue-600">Encrypting and submitting move...</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

