'use client'
import { useState } from 'react'
type Lead = { id: string; full_name: string }
type Agent = { id: string; full_name: string }

export default function AddAppointmentButton({ leads, agents }: { leads: Lead[]; agents: Agent[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', date: '', time: '', duration_minutes: '60', location: '', type: 'meeting', agent_id: '', lead_id: '', add_to_calendar: true })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/crm/appointments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          appointment_date: `${form.date}T${form.time}:00`,
          duration_minutes: Number(form.duration_minutes),
          location: form.location, type: form.type,
          agent_id: form.agent_id || undefined,
          lead_id: form.lead_id || undefined,
          add_to_calendar: form.add_to_calendar,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Hata')
      setOpen(false)
      window.location.reload()
    } catch (err) { setError(err instanceof Error ? err.message : 'Hata') }
    finally { setLoading(false) }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="px-4 py-2 border border-emerald-600 text-emerald-700 text-sm rounded-lg hover:bg-emerald-50 transition-colors">
        + Randevu
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Yeni Randevu</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Başlık *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Mülk gösterimi — Ahmet Kaya"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Tarih *</label>
                  <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Saat *</label>
                  <input required type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Tür</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="meeting">Toplantı</option>
                    <option value="showing">Mülk Gösterimi</option>
                    <option value="call">Telefon</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Süre (dk)</label>
                  <input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Konum</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Kadıköy, İstanbul"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Lead</label>
                  <select value={form.lead_id} onChange={e => setForm(f => ({ ...f, lead_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Seçiniz</option>
                    {leads.map(l => <option key={l.id} value={l.id}>{l.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Danışman</label>
                  <select value={form.agent_id} onChange={e => setForm(f => ({ ...f, agent_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Seçiniz</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.add_to_calendar} onChange={e => setForm(f => ({ ...f, add_to_calendar: e.target.checked }))}
                  className="rounded border-gray-300 text-emerald-600" />
                <span className="text-xs text-gray-600">Google Calendar&apos;a da ekle</span>
              </label>
              {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">İptal</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                  {loading ? 'Kaydediliyor...' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
