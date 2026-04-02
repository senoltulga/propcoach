'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/panel',          icon: '🏠', label: 'Ana Sayfa' },
  { href: '/panel/kocluk',   icon: '🎯', label: 'Koçluk' },
  { href: '/panel/dokuman',  icon: '🧠', label: 'Hafıza & Doküman' },
]

export default function PanelNav() {
  const pathname = usePathname()
  return (
    <nav className="flex gap-1 border-b border-gray-100 px-4">
      {nav.map(item => {
        const isActive = item.href === '/panel'
          ? pathname === '/panel'
          : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
