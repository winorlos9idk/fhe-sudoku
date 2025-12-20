import hre from 'hardhat'
const { ethers } = hre

async function main() {
  const signers = await ethers.getSigners()
  if (signers.length === 0) {
    throw new Error('No signers available. Check PRIVATE_KEY in .env.local')
  }
  const deployer = signers[0]

  console.log('Deploying SudokuGame...')
  console.log('Deployer:', deployer.address)

  const SudokuGame = await ethers.getContractFactory('SudokuGame')
  const game = await SudokuGame.deploy()
  await game.waitForDeployment()

  const address = await game.getAddress()
  console.log('Deployed to:', address)

  // тест - создаем игру
  const tx = await game.startGame()
  const receipt = await tx.wait()
  
  const event = receipt?.logs.find((log: any) => {
    try {
      const parsed = game.interface.parseLog(log)
      return parsed?.name === 'GameStarted'
    } catch {
      return false
    }
  })

  if (event) {
    const parsed = game.interface.parseLog(event)
    const gameId = parsed?.args.gameId
    console.log('Test game created:', gameId.toString())
  }

  console.log('Done!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

