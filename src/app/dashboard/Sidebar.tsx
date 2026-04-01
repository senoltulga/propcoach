'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/dashboard',              icon: '📊', label: 'Dashboard' },
  { href: '/dashboard/danismanlar',  icon: '👥', label: 'Danışmanlar' },
  { href: '/dashboard/portfoy',      icon: '🏠', label: 'Portföy' },
  { href: '/dashboard/musteriler',   icon: '🤝', label: 'Müşteriler' },
  { href: '/dashboard/personel',     icon: '👔', label: 'Personel' },
  { href: '/dashboard/egitim',       icon: '🎓', label: 'Eğitim & Koçluk' },
  { href: '/dashboard/belgeler',     icon: '📁', label: 'Belgeler' },
  { href: '/dashboard/mali',         icon: '💰', label: 'Mali Durum' },
  { href: '/dashboard/takvim',       icon: '📅', label: 'Takvim' },
  { href: '/dashboard/mail',         icon: '📧', label: 'Mail' },
  { href: '/dashboard/ayarlar',      icon: '⚙️', label: 'Ayarlar' },
]

export default function Sidebar({ profile }: { profile: any }) {
  const pathname = usePathname()

  const initials = profile?.full_name
    ?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="font-bold text-emerald-700 text-base">PropCoach</div>
        <div className="text-xs text-gray-400 mt-0.5 truncate">
          {profile?.full_name || 'Yönetici'}
        </div>
        <div className="text-xs text-gray-300 mt-0.5">v1.0</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(item => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate text-gray-800">
              {profile?.full_name || 'Yönetici'}
            </div>
            <div className="text-xs text-gray-400">Ofis Sahibi</div>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button className="text-xs text-red-400 hover:text-red-600">↩</button>
          </form>
        </div>
      </div>
    </aside>
  )
}
