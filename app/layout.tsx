import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sudoku FHE | Encrypted Moves on Blockchain',
  description: 'Play Sudoku with encrypted moves stored on blockchain using Zama FHEVM',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof global === 'undefined') {
                window.global = globalThis;
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen`} style={{ background: 'linear-gradient(135deg, #f5f1e8 0%, #e8ddd4 100%)' }}>
        <Providers>
          <Navigation />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  )
}

