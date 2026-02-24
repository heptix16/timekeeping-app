'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { deductLate } from './actions'

export default function DeductionsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [employeeId, setEmployeeId] = useState('')
  const [minutes, setMinutes] = useState(0)
  const [result, setResult] = useState<number | null>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [vlBalance, setVlBalance] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  // ✅ FETCH EMPLOYEES
  useEffect(() => {
    async function fetchEmployees() {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name', { ascending: true })

      if (data) setEmployees(data)
    }

    fetchEmployees()
  }, [])

  // ✅ FETCH HISTORY + BALANCE
  async function fetchData(id: string) {
    if (!id) return

    const { data: hist } = await supabase
      .from('late_deductions')
      .select('*')
      .eq('employee_id', id)
      .order('created_at', { ascending: false })

    if (hist) setHistory(hist)

    const { data: profile } = await supabase
      .from('profiles')
      .select('vl_balance')
      .eq('id', id)
      .single()

    if (profile) setVlBalance(Number(profile.vl_balance.toFixed(3)))
  }

  useEffect(() => {
    fetchData(employeeId)
  }, [employeeId])

  // ✅ STRICT TABLE
  function getMinuteValue(min: number) {
    const table: Record<number, number> = {
      1: 0.002, 2: 0.004, 3: 0.006, 4: 0.008, 5: 0.010,
      6: 0.012, 7: 0.015, 8: 0.017, 9: 0.019, 10: 0.021,
      11: 0.023, 12: 0.025, 13: 0.027, 14: 0.029, 15: 0.031,
      16: 0.033, 17: 0.035, 18: 0.037, 19: 0.040, 20: 0.042,
      21: 0.044, 22: 0.046, 23: 0.048, 24: 0.050, 25: 0.052,
      26: 0.054, 27: 0.056, 28: 0.058, 29: 0.060, 30: 0.062,
      31: 0.065, 32: 0.067, 33: 0.069, 34: 0.071, 35: 0.073,
      36: 0.075, 37: 0.077, 38: 0.079, 39: 0.081, 40: 0.083,
      41: 0.085, 42: 0.087, 43: 0.090, 44: 0.092, 45: 0.094,
      46: 0.096, 47: 0.098, 48: 0.100, 49: 0.102, 50: 0.104,
      51: 0.106, 52: 0.108, 53: 0.110, 54: 0.112, 55: 0.115,
      56: 0.117, 57: 0.119, 58: 0.121, 59: 0.123, 60: 0.125,
    }

    return table[min] || 0
  }

  function computeDeduction(mins: number) {
    const hours = Math.floor(mins / 60)
    const remaining = mins % 60

    const hourValue = hours * 0.125
    const minuteValue = getMinuteValue(remaining)

    return parseFloat((hourValue + minuteValue).toFixed(3))
  }

  function handleCompute() {
    const deduction = computeDeduction(minutes)
    setResult(deduction)
  }

  // ✅ APPLY (FIXED – no refresh needed)
  async function handleApply(formData: FormData) {
    await deductLate(formData)

    setMessage('Deduction applied successfully')
    setResult(null)

    await fetchData(employeeId) // 🔥 instant update
  }

  const filteredEmployees = employees.filter((emp) =>
    emp.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
  <div className="min-h-screen flex items-center justify-center px-4">

    {/* 🔲 GLASS CARD */}
    <div className="w-full max-w-xl p-8 rounded-xl bg-white/20 backdrop-blur-xl shadow-lg border-white/30">

      {/* 🔝 TOP BAR */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-700">
          Late Deduction
        </h1>

        <div className="flex gap-2">
          <a
            href="/admin"
            className="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300"
          >
            Dashboard
          </a>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Logout
            </button>
          </form>
        </div>
      </div>

      {/* 🔍 SEARCH */}
      <input
        placeholder="Search employee..."
        className="border p-2 mb-2 w-full rounded"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* 👇 DROPDOWN */}
      <select
        className="border p-2 mb-3 w-full rounded"
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
      >
        <option value="">Select Employee</option>
        {filteredEmployees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.full_name || emp.id}
          </option>
        ))}
      </select>

      {/* 💰 BALANCE */}
      {vlBalance !== null && (
        <p className="mb-3 text-sm text-gray-600">
          Remaining VL: <strong>{vlBalance}</strong>
        </p>
      )}

      {/* ⏱ INPUT */}
      <input
        type="number"
        placeholder="Minutes late"
        className="border p-2 mb-3 w-full rounded"
        onChange={(e) => setMinutes(Number(e.target.value))}
      />

      <button
        onClick={handleCompute}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Compute
      </button>

      {/* RESULT */}
      {result !== null && (
        <div className="mt-4">
          <p className="font-semibold">Deduction: {result} VL</p>

          <form action={handleApply}>
            <input type="hidden" name="employeeId" value={employeeId} />
            <input type="hidden" name="minutes" value={minutes} />
            <input type="hidden" name="deduction" value={result} />

            <button className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              Apply Deduction
            </button>
          </form>
        </div>
      )}

      {/* MESSAGE */}
      {message && (
        <p className="mt-3 text-green-600">✅ {message}</p>
      )}

      {/* 📜 HISTORY */}
      {history.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold mb-2">Deduction History</h2>
          <div className="border p-3 rounded bg-white/20 backdrop-blur-sm">
            {history.map((h) => (
              <div key={h.id} className="mb-2 text-sm">
                {h.minutes} mins → {h.deduction} VL
                <br />
                <span className="text-gray-400 text-xs">
                  {new Date(h.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
)
}