export const dynamic = 'force-dynamic'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { timeIn, timeOut } from './actions'
import LeaveForm from './LeaveForm'

export default async function Home() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
console.log('USER ID:', user.id)
console.log('PROFILE DATA:', profile)

    const { data: timeLogs } = await supabase
        .from('time_logs')
        .select('*')
        .eq('employee_id', user.id)
        .order('time_in', { ascending: false })
        .limit(5)

    const { data: leaveRequests } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

    return (
        <main className="flex min-h-screen flex-col items-center p-8">


            <div className="w-full min-h-screen px-6 py-8 bg-white/30 backdrop-blur-sm rounded-none shadow-none">
                <h1 className="text-3xl font-bold mb-2 tracking-tight text-slate-800">Timekeeping Dashboard</h1>
                <p className="text-lg text-slate-500 mb-8">Welcome back, {profile?.full_name || user.email}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-100 flex flex-col items-center justify-center">
                        <h2 className="text-xl font-semibold mb-4 text-blue-900">Time Clock</h2>
                        <div className="flex gap-4">
                            <form action={timeIn}>
                                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm">
                                    Time In
                                </button>
                            </form>
                            <form action={timeOut}>
                                <button className="px-6 py-3 bg-white/60 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition font-medium shadow-sm hover:border-slate-300">
                                    Time Out
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-100 flex flex-col items-center justify-center relative">
                        <h2 className="text-xl font-semibold mb-4 text-emerald-900">Leave Credits</h2>

<div className="flex gap-8 mb-4">
    <div className="text-center">
        <p className="text-sm text-emerald-700">VL</p>
        <p className="text-3xl font-bold text-emerald-600">
            {Number(profile?.vl_balance ?? 0).toFixed(1)}
        </p>
    </div>

    <div className="text-center">
        <p className="text-sm text-emerald-700">SL</p>
        <p className="text-3xl font-bold text-emerald-600">
            {Number(profile?.sl_balance ?? 0).toFixed(1)}
        </p>
    </div>
</div>

<p className="text-emerald-700 mb-4">
    Total: {(
  Number(profile?.vl_balance ?? 0) +
  Number(profile?.sl_balance ?? 0)
).toFixed(1)} Days
</p>


                        <LeaveForm />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-slate-800 border-b pb-2">Recent Time Logs</h3>
                        {timeLogs && timeLogs.length > 0 ? (
                            <ul className="space-y-3">
                                {timeLogs.map((log) => (
                                    <li key={log.id} className="text-sm flex justify-between bg-slate-50 p-3 rounded border border-slate-100">
                                        <div>
                                            <span className="font-medium block">{log.date}</span>
                                            <span className="text-slate-500 block text-xs mt-1">
                                                In: {new Date(log.time_in).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${log.time_out ? 'bg-slate-200 text-slate-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {log.time_out ? 'Completed' : 'Active'}
                                            </span>
                                            {log.time_out && (
                                                <span className="text-slate-500 block text-xs mt-1">
                                                    Out: {new Date(log.time_out).toLocaleTimeString()}
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500">No time logs found.</p>
                        )}
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-slate-800 border-b pb-2">Recent Leave Requests</h3>
                        {leaveRequests && leaveRequests.length > 0 ? (
                            <ul className="space-y-3">
                                {leaveRequests.map((req) => (
                                    <li key={req.id} className="text-sm flex justify-between bg-slate-50 p-3 rounded border border-slate-100">
                                        <div className="max-w-[150px]">
                                            <span className="font-medium block truncate max-w-full" title={req.reason}>{req.reason}</span>
                                            <span className="text-slate-500 block text-xs mt-1">
                                                {req.start_date} to {req.end_date}
                                            </span>
                                        </div>
                                        <div className="text-right flex items-center">
                                            <span className={`px-2 py-1 rounded text-xs font-medium capitalize
                                        ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : ''}
                                        ${req.status === 'rejected' ? 'bg-red-100 text-red-700' : ''}
                                        ${req.status === 'pending' ? 'bg-amber-100 text-amber-700' : ''}
                                    `}>
                                                {req.status}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500">No leave requests found.</p>
                        )}
                    </div>
                </div>
{profile?.role === 'admin' && (
  <div className="flex justify-end mb-4">
    <a
      href="/admin"
      className="px-4 py-2 bg-slate-800 text-white rounded-md text-sm hover:bg-slate-900 transition"
    >
      Go to Admin Dashboard
    </a>
  </div>
)}
                <div className="flex justify-end mt-12 border-t border-slate-100 pt-8">
                    <form action="/auth/signout" method="post">
                        <button className="text-sm text-slate-500 hover:text-slate-800 transition underline underline-offset-4">
                            Sign Out
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
