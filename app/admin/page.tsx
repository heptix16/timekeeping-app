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

  // =========================
  // TIME LOGS
  // =========================
  const { data: timeLogs } = await supabase
    .from('time_logs')
    .select('*, profiles(full_name)')
    .order('time_in', { ascending: false })
    .limit(50)

  // =========================
  // PENDING LEAVES
  // =========================
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

  // =========================
  // ALL LEAVES (for history)
  // =========================
  const { data: allLeaves } = await supabase
    .from('leave_requests')
    .select(`
      id,
      employee_id,
      leave_type,
      start_date,
      end_date,
      status,
      created_at
    `)
    .order('created_at', { ascending: false })

  // =========================
  // BALANCES
  // =========================
  const { data: balances } = await supabase
    .from('profiles')
    .select('id, full_name, vl_balance, sl_balance')

  return (
    <main className="relative z-10 flex min-h-screen flex-col items-center p-8">
      <div className="relative w-full max-w-6xl bg-white/30 backdrop-blur-sm rounded-xl shadow-sm border p-8">

        {/* HEADER */}
        <div className="flex justify-between mb-8 items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-500">Manage leave requests</p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/admin/deductions"
              className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 text-sm"
            >
              Late Deduction
            </Link>

            <Link
              href="/admin/employees"
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 text-sm"
            >
              HR Management
            </Link>

            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            >
              Employee View
            </Link>

            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Logout
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* ========================= */}
          {/* LEAVE REQUESTS */}
          {/* ========================= */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Leave Requests</h2>

            {leaveRequests?.length ? (
              <ul className="space-y-6">
                {leaveRequests.map((req) => {
                  const start = new Date(req.start_date + 'T00:00:00')
                  const end = new Date(req.end_date + 'T00:00:00')

                  let days =
                    (end.getTime() - start.getTime()) /
                      (1000 * 60 * 60 * 24) +
                    1

                  if (req.is_half_day) days = 0.5

                  const emp = balances?.find(
                    (b) => b.id === req.employee_id
                  )

                  const currentVL = emp?.vl_balance ?? 0
                  const currentSL = emp?.sl_balance ?? 0

                  const isVL = req.leave_type === 'VL'
                  const isSL = req.leave_type === 'SL'

                  const hasEnoughBalance =
                    (isVL && currentVL >= days) ||
                    (isSL && currentSL >= days)

                  // ✅ Proper history (exclude current pending request)
                  const recentHistory =
                    allLeaves
                      ?.filter(
                        (l) =>
                          l.employee_id === req.employee_id &&
                          l.id !== req.id &&
                          l.status !== 'pending'
                      )
                      .slice(0, 5) || []

                  return (
                    <li
                      key={req.id}
                      className="p-6 border rounded-xl bg-slate-50 shadow-sm"
                    >
                      {/* NAME */}
                      <div className="font-bold text-lg mb-4">
                        {emp?.full_name || req.employee_id}
                      </div>

                      {/* BALANCE CARDS */}
                      <div className="flex gap-4 mb-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex-1">
                          <p className="text-xs text-green-700 font-medium">
                            Vacation Leave
                          </p>
                          <p className={`text-2xl font-bold ${
                            currentVL < 3 ? 'text-red-600' : 'text-green-900'
                          }`}>
                            {currentVL}
                          </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex-1">
                          <p className="text-xs text-blue-700 font-medium">
                            Sick Leave
                          </p>
                          <p className={`text-2xl font-bold ${
                            currentSL < 3 ? 'text-red-600' : 'text-blue-900'
                          }`}>
                            {currentSL}
                          </p>
                        </div>
                      </div>

                      {/* INSUFFICIENT WARNING */}
                      {!hasEnoughBalance && (
                        <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
                          Insufficient {req.leave_type} balance for this request.
                        </div>
                      )}

                      {/* RECENT HISTORY */}
                      <div className="mb-4">
                        <p className="text-sm font-semibold mb-2">
                          Recent Leave History
                        </p>

                        {recentHistory.length ? (
                          <div className="space-y-2 text-sm">
                            {recentHistory.map((leave) => (
                              <div
                                key={leave.id}
                                className="flex justify-between items-center border rounded-md px-3 py-2 bg-white"
                              >
                                <span>
                                  {leave.leave_type} | {leave.start_date}
                                </span>

                                <span
                                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                                    leave.status === 'approved'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {leave.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">
                            No previous leave records
                          </p>
                        )}
                      </div>

                      {/* CURRENT REQUEST INFO */}
                      <div className="flex gap-2 mb-2">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            isVL
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

                      <div className="text-gray-600 text-sm mb-2">
                        {req.start_date} → {req.end_date} ({days}{' '}
                        day{days > 1 ? 's' : ''})
                      </div>

                      <div className="italic mb-4">
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

          {/* ========================= */}
          {/* TIME LOGS */}
          {/* ========================= */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Time Logs</h2>

            {timeLogs?.length ? (
              <ul className="space-y-2">
                {timeLogs.map((log) => (
                  <li key={log.id} className="text-sm">
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