'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function Navigation() {
  const pathname = usePathname()

  return (
    <header className="w-full sticky top-0 z-50" style={{ 
      background: '#8b4513',
      borderBottom: '3px solid #654321',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
    }}>
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center text-xl font-black rounded" style={{
            background: '#f5f1e8',
            border: '2px solid #654321',
            boxShadow: '2px 2px 0px #654321'
          }}>
            数
          </div>
          <span className="text-xl font-black" style={{ color: '#f5f1e8', textShadow: '1px 1px 0px #000' }}>
            SUDOKU FHE
          </span>
        </Link>

        <div className="flex items-center">
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}

