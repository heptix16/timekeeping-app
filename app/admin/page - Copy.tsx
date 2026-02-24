import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminLeaveActions from './AdminLeaveActions'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return <p>Access denied</p>
  }

  // ✅ Time logs
  const { data: timeLogs } = await supabase
    .from('time_logs')
    .select('*, profiles(full_name)')
    .order('time_in', { ascending: false })
    .limit(50)

  // ✅ Leave requests (SAFE)
  const { data: leaveRequests } = await supabase
    .from('leave_requests')
    .select(`
      id,
      employee_id,
      leave_type,
      is_half_day,
      start_date,
      end_date,
      reason,
      status,
      created_at
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // ✅ Fetch balances + names (SAFE)
  const { data: balances } = await supabase
    .from('profiles')
    .select('id, full_name, vl_balance, sl_balance')

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-slate-50">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-sm border p-8">

        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-500">Manage leave requests</p>
          </div>

          <Link href="/" className="px-4 py-2 bg-gray-200 rounded">
            Employee View
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* ✅ LEAVE REQUESTS */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Leave Requests</h2>

            {leaveRequests?.length ? (
              <ul className="space-y-4">
                {leaveRequests.map((req) => {
                  const start = new Date(req.start_date)
                  const end = new Date(req.end_date)

                  let days =
                    Math.ceil(
                      Math.abs(end.getTime() - start.getTime()) /
                        (1000 * 60 * 60 * 24)
                    ) + 1

                  if (req.is_half_day) days = 0.5

                  // ✅ match employee
                  const emp = balances?.find(
                    (b) => b.id === req.employee_id
                  )
                  const isVL = req.leave_type === 'VL'
const isSL = req.leave_type === 'SL'

const hasEnoughBalance =
  (isVL && (emp?.vl_balance ?? 0) >= days) ||
  (isSL && (emp?.sl_balance ?? 0) >= days)

                  return (
                    <li
                      key={req.id}
                      className="p-4 border rounded-lg bg-slate-50"
                    >
                      {/* NAME */}
                      <div className="font-bold text-lg">
                        {emp?.full_name || req.employee_id}
                      </div>

                      {/* BALANCE */}
                      <p className="text-sm text-gray-600 mb-2">
                        VL: {emp?.vl_balance ?? 0} | SL:{' '}
                        {emp?.sl_balance ?? 0}
                      </p>

                      {/* BADGES */}
                      <div className="flex gap-2 mb-2">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            req.leave_type === 'VL'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {req.leave_type}
                        </span>

                        {req.is_half_day && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 rounded">
                            Half Day
                          </span>
                        )}

                        <span className="px-2 py-1 text-xs bg-amber-100 rounded">
                          {req.status}
                        </span>
                      </div>

                      {/* DATES */}
                      <div className="text-gray-600 text-sm mb-2">
                        {req.start_date} → {req.end_date} ({days} day
                        {days > 1 ? 's' : ''})
                      </div>

                      {/* REASON */}
                      <div className="italic mb-3">
                        "{req.reason}"
                      </div>

                      <AdminLeaveActions
  leaveId={req.id}
  employeeId={req.employee_id}
  diffDays={days}
  disabled={!hasEnoughBalance}
/>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p>No leave requests</p>
            )}
          </div>

          {/* ✅ TIME LOGS */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Time Logs</h2>

            {timeLogs?.length ? (
              <ul>
                {timeLogs.map((log) => (
                  <li key={log.id}>
                    {log.profiles?.full_name} — {log.date}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No logs</p>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}