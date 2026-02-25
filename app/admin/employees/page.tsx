import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { adjustLeaveBalance } from '../actions'

export default async function EmployeeHRPage({
  searchParams,
}: {
  searchParams: Promise<{ employee?: string }>
}) {
  const params = await searchParams
  const selectedEmployeeId = params?.employee ?? null

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return <p>Access denied</p>
  }

  // Get all employees for dropdown
  const { data: employees } = await supabase
    .from('profiles')
    .select('id, full_name')
    .order('full_name')

  let employeeData: any = null
  let leaveTransactions: any[] = []
  let leaveRequests: any[] = []
  let deductions: any[] = []

  if (selectedEmployeeId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', selectedEmployeeId)
      .single()

    employeeData = data

    const { data: tx } = await supabase
      .from('leave_transactions')
      .select('*')
      .eq('employee_id', selectedEmployeeId)
      .order('created_at', { ascending: false })

    leaveTransactions = tx ?? []

    const { data: req } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', selectedEmployeeId)
      .order('created_at', { ascending: false })

    leaveRequests = req ?? []

    const { data: late } = await supabase
      .from('late_deductions')
      .select('*')
      .eq('employee_id', selectedEmployeeId)
      .order('created_at', { ascending: false })

    deductions = late ?? []
  }

  return (
    <main className="p-10 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">HR Employee Management</h1>
        <Link
          href="/admin"
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* EMPLOYEE SELECT */}
      <div className="mb-8">
        <form method="GET" className="flex gap-3 items-center">
          <select
            name="employee"
            defaultValue={selectedEmployeeId ?? ''}
            className="border rounded px-4 py-2 w-80"
          >
            <option value="">Select Employee</option>
            {employees?.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-black text-white rounded text-sm"
          >
            View
          </button>
        </form>
      </div>

      {/* EMPLOYEE DATA */}
      {employeeData && (
        <div>
          {/* OVERVIEW CARDS */}
          <div className="grid grid-cols-3 gap-6 mb-10">
            <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
              <p className="text-sm text-green-700">Vacation Leave</p>
              <p className="text-3xl font-bold text-green-900">
                {employeeData.vl_balance}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
              <p className="text-sm text-blue-700">Sick Leave</p>
              <p className="text-3xl font-bold text-blue-900">
                {employeeData.sl_balance}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-6 rounded-lg">
              <p className="text-sm text-slate-600">Total Leave</p>
              <p className="text-3xl font-bold">
                {Number(employeeData.vl_balance) +
                  Number(employeeData.sl_balance)}
              </p>
            </div>
          </div>

          {/* LEAVE TRANSACTIONS */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4">
              Leave Transactions
            </h2>

            <div className="bg-white border rounded-lg divide-y">
              {leaveTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between p-4 text-sm"
                >
                  <span>
                    {tx.leave_type} — {tx.reference}
                  </span>
                  <span
                    className={`font-medium ${
                      tx.amount < 0
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {tx.amount}
                  </span>
                </div>
              ))}

              {leaveTransactions.length === 0 && (
                <div className="p-4 text-sm text-gray-500">
                  No transactions found.
                </div>
              )}
            </div>
          </section>

          {/* LEAVE REQUESTS */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4">
              Leave Requests
            </h2>

            <div className="bg-white border rounded-lg divide-y">
              {leaveRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex justify-between p-4 text-sm"
                >
                  <span>
                    {req.start_date} → {req.end_date}
                  </span>
                  <span className="capitalize">
                    {req.status}
                  </span>
                </div>
              ))}

              {leaveRequests.length === 0 && (
                <div className="p-4 text-sm text-gray-500">
                  No leave history found.
                </div>
              )}
            </div>
          </section>

          {/* LATE DEDUCTIONS */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4">
              Late Deductions
            </h2>

            <div className="bg-white border rounded-lg divide-y">
              {deductions.map((d) => (
                <div key={d.id} className="p-4 text-sm">
                  {d.reason} — {d.amount}
                </div>
              ))}

              {deductions.length === 0 && (
                <div className="p-4 text-sm text-gray-500">
                  No deductions found.
                </div>
              )}
            </div>
          </section>

          {/* MANUAL ADJUSTMENT */}
          <section>
            <h2 className="text-lg font-semibold mb-4">
              Manual Leave Adjustment
            </h2>

            <form
              action={adjustLeaveBalance}
              className="space-y-4 max-w-md"
            >
              <input
  type="hidden"
  name="employeeId"
  value={selectedEmployeeId ?? ''}
/>

              <select
                name="leaveType"
                className="border rounded px-4 py-2 w-full"
              >
                <option value="VL">Vacation Leave</option>
                <option value="SL">Sick Leave</option>
              </select>

              <input
                name="amount"
                type="number"
                step="0.5"
                placeholder="Enter positive or negative value"
                className="border rounded px-4 py-2 w-full"
              />

              <input
                name="reason"
                placeholder="Reason"
                className="border rounded px-4 py-2 w-full"
              />

              <button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded"
              >
                Apply Adjustment
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}