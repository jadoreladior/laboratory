import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const api = axios.create({ baseURL: BASE_URL })

// ─── Book ─────────────────────────────────────────────────────────────────────

export async function createBooking(data: {
  client_name: string
  telegram_id?: number
  username?: string
  service: string
  booking_date: string
  booking_time: string
  duration_hours: number
  total_price: number
  prepay_amount: number
  notes?: string
}) {
  const { data: res } = await api.post('/api/book', data)
  return res
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export async function getLeads(filters?: { status?: string; telegram_id?: number }) {
  const params = new URLSearchParams()
  if (filters?.status)      params.set('status', filters.status)
  if (filters?.telegram_id) params.set('telegram_id', String(filters.telegram_id))
  const { data } = await api.get(`/api/leads?${params}`)
  return data as Lead[]
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const { data } = await api.patch(`/api/leads/${id}`, { status })
  return data as Lead
}

// Aliases для совместимости с существующими компонентами
export const getAdminBookings = () => getLeads()
export const getUserBookings  = (telegramId: number) => getLeads({ telegram_id: telegramId })
export const confirmBooking   = (id: string) => updateLeadStatus(id, 'confirmed')
export const cancelBooking    = (id: string) => updateLeadStatus(id, 'cancelled')

// ─── Clients ─────────────────────────────────────────────────────────────────

export async function getClients() {
  const { data } = await api.get('/api/clients')
  return data as Client[]
}

export async function addClient(client: Omit<Client, 'id' | 'created_at'>) {
  const { data } = await api.post('/api/clients', client)
  return data as Client
}

// upsertUser → addClient (для совместимости с App.tsx)
export async function upsertUser(user: {
  telegram_id: number
  first_name: string
  last_name?: string
  username?: string
}) {
  return addClient({
    name: [user.first_name, user.last_name].filter(Boolean).join(' '),
    telegram_id: user.telegram_id,
    username: user.username,
  })
}

// ─── Employees ───────────────────────────────────────────────────────────────

export async function getEmployees() {
  const { data } = await api.get('/api/employees')
  return data as EmployeeWithSalary[]
}

export async function createEmployee(e: Omit<Employee, 'id' | 'created_at'>) {
  const { data } = await api.post('/api/employees', e)
  return data as Employee
}

export async function updateEmployee(id: string, e: Omit<Employee, 'id' | 'created_at'>) {
  const { data } = await api.put(`/api/employees/${id}`, e)
  return data as Employee
}

export async function deleteEmployee(id: string) {
  await api.delete(`/api/employees/${id}`)
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const { data } = await api.get('/api/stats')
  return data as Stats
}

// ─── Slots ───────────────────────────────────────────────────────────────────

export async function getAvailableSlots(_studioId: string, date: string) {
  const { data } = await api.get(`/api/slots/${date}`)
  return data.slots as { time: string; available: boolean }[]
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

export interface CalendarDay {
  date: string
  count: number
  revenue: number
  booked_slots: number
  blocked_slots: number
  total_slots: number
  fill_percent: number
}

export interface DaySlot {
  time: string
  status: 'free' | 'booked' | 'blocked'
  booking: Lead | null
  blocked: BlockedSlot | null
}

export interface DayData {
  date: string
  slots: DaySlot[]
  booked_count: number
  blocked_count: number
  free_count: number
  revenue: number
}

export interface BlockedSlot {
  id: string
  date: string
  time: string
  reason: string
  created_at: string
}

export async function getCalendarMonth(year: number, month: number) {
  const { data } = await api.get(`/api/calendar/month/${year}/${month}`)
  return data as { year: number; month: number; total_slots: number; days: CalendarDay[] }
}

export async function getCalendarDay(date: string) {
  const { data } = await api.get(`/api/calendar/day/${date}`)
  return data as DayData
}

export async function blockSlot(date: string, time: string, reason: string) {
  const { data } = await api.post('/api/blocked', { date, time, reason })
  return data as BlockedSlot
}

export async function unblockSlot(id: string) {
  await api.delete(`/api/blocked/${id}`)
}

// ─── Admin / PIN ─────────────────────────────────────────────────────────────

export async function verifyOwnerPin(pin: string) {
  const { data } = await api.post(
    '/api/admin/owner/verify',
    { pin },
    { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET ?? '' } }
  )
  return data as { ok: boolean }
}

export function getExportUrl(type: 'bookings' | 'financial') {
  return `${BASE_URL}/api/admin/export/${type}`
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type LeadStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface Lead {
  id: string
  client_name: string
  telegram_id: string
  username: string
  service: string
  booking_date: string
  booking_time: string
  duration_hours: string
  total_price: string
  prepay_amount: string
  status: LeadStatus
  notes: string
  created_at: string
}

export interface Client {
  id: string
  name: string
  telegram_id?: number
  username?: string
  phone?: string
  email?: string
  notes?: string
  created_at: string
}

export interface Employee {
  id: string
  name: string
  telegram_id?: string | number | null
  role: string
  hourly_rate: number
  revenue_percent: number
  created_at: string
}

export interface EmployeeWithSalary extends Employee {
  salary_month: number
}

export interface Stats {
  revenue: { today: number; week: number; month: number; total: number }
  total_clients: number
  statuses: Record<string, number>
  by_studio: { id: string; count: number; revenue: number }[]
  by_service: { title: string; count: number; revenue: number }[]
  peak_hours: { hour: number; count: number }[]
  daily: { date: string; revenue: number; count: number }[]
  employees_salaries: EmployeeWithSalary[]
}
