'use client'
import { useState } from 'react'

export default function SeedButton() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSeed = async () => {
    setLoading(true)
    try {
      await fetch('/api/seed', { method: 'POST' })
      setDone(true)
      setTimeout(() => window.location.reload(), 800)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSeed}
      disabled={loading || done}
      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors shrink-0"
    >
      {done ? '✓ Yüklendi' : loading ? 'Yükleniyor...' : 'Demo Veri Yükle'}
    </button>
  )
}
