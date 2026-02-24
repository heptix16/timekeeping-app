'use client'

import { useFormStatus } from 'react-dom'
import { useState } from 'react'
import { fileLeave } from './actions'

export default function LeaveForm() {
    const [state, setState] = useState({ success: false, error: '' })
    const [isOpen, setIsOpen] = useState(false)

    async function handleSubmit(formData: FormData) {
        setState({ success: false, error: '' })
        const result = await fileLeave(formData)
        if (result?.error) {
            setState({ success: false, error: result.error })
        } else {
            setState({ success: true, error: '' })
            // Optional: Close form immediately on success, but keeping it open allows them to see the success message
        }
    }

    return (
        <details
            className="w-full relative z-10"
            open={isOpen}
            onToggle={(e) => setIsOpen(e.currentTarget.open)}
        >
            <summary
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition font-medium text-sm shadow-sm cursor-pointer text-center list-none select-none mx-auto block max-w-[200px]"
                onClick={(e) => {
                    e.preventDefault()
                    setIsOpen(!isOpen)
                }}
            >
                File Leave
            </summary>

            <div className="absolute top-full left-0 right-0 mt-2 z-20">
                <form action={handleSubmit} className="flex flex-col gap-3 p-4 bg-white rounded-md border border-emerald-200 shadow-xl text-sm max-w-sm mx-auto">
                    {state.success && (
                        <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs text-center font-medium">
                            Leave request submitted successfully!
                        </div>
                    )}
                    {state.error && (
                        <div className="p-2 bg-red-50 text-red-700 border border-red-200 rounded text-xs text-center font-medium">
                            {state.error}
                        </div>
                    )}
                    <div className="mb-4">
  <label className="block text-sm font-medium mb-1">
    Leave Type
  </label>

  <select
    name="leave_type"
    required
    className="w-full border rounded p-2"
  >
    <option value="">Select Type</option>
    <option value="VL">Vacation Leave (VL)</option>
    <option value="SL">Sick Leave (SL)</option>
  </select>

  {/* Half Day Checkbox */}
  <div className="flex items-center gap-2 mt-3">
    <input
      type="checkbox"
      name="is_half_day"
      value="true"
      className="w-4 h-4"
    />
    <label className="text-sm text-slate-700">
      Half Day Leave
    </label>
  </div>
</div>

                    <div className="flex flex-col gap-1 text-left">
                        <label className="font-medium text-slate-700" htmlFor="startDate">Start Date</label>
                        <input type="date" name="startDate" id="startDate" required className="border border-slate-300 rounded px-2 py-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800" />
                    </div>
                    <div className="flex flex-col gap-1 text-left">
                        <label className="font-medium text-slate-700" htmlFor="endDate">End Date</label>
                        <input type="date" name="endDate" id="endDate" required className="border border-slate-300 rounded px-2 py-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800" />
                    </div>
                    <div className="flex flex-col gap-1 text-left">
                        <label className="font-medium text-slate-700" htmlFor="reason">Reason</label>
                        <textarea name="reason" id="reason" required className="border border-slate-300 rounded px-2 py-1 h-20 resize-none focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"></textarea>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="flex-1 bg-white text-slate-700 border border-slate-300 font-medium py-2 rounded hover:bg-slate-50 transition"
                        >
                            Close
                        </button>
                        <SubmitButton />
                    </div>
                </form>
            </div>
        </details>
    )
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button disabled={pending} className="flex-1 bg-emerald-600 text-white font-medium py-2 rounded hover:bg-emerald-700 transition disabled:opacity-50">
            {pending ? 'Submitting...' : 'Submit Request'}
        </button>
    )
}
