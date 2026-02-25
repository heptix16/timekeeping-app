'use client'

import { useFormStatus } from 'react-dom'
import { approveLeave, rejectLeave } from './actions'

interface AdminLeaveActionsProps {
  leaveId: string
  employeeId: string
  diffDays: number
  disabled?: boolean
}

export default function AdminLeaveActions({
  leaveId,
  employeeId,
  diffDays,
  disabled,
}: AdminLeaveActionsProps) {
  return (
    <div className="flex gap-2 w-full">

      <form action={approveLeave} className="flex-1">
        <input type="hidden" name="leaveId" value={leaveId} />
        <input type="hidden" name="employeeId" value={employeeId} />
        <input type="hidden" name="days" value={diffDays} />
        <SubmitButton
          label="Approve"
          defaultClass="bg-emerald-600 text-white hover:bg-emerald-700"
          disabled={disabled}
        />
      </form>

      <form action={rejectLeave} className="flex-1">
        <input type="hidden" name="leaveId" value={leaveId} />
        <SubmitButton
          label="Reject"
          defaultClass="bg-white text-red-600 border border-red-200 hover:bg-red-50"
        />
      </form>

    </div>
  )
}

function SubmitButton({
  label,
  defaultClass,
  disabled,
}: {
  label: string
  defaultClass: string
  disabled?: boolean
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`w-full px-4 py-2 rounded-md transition font-medium shadow-sm ${
        disabled
          ? 'bg-gray-300 cursor-not-allowed'
          : defaultClass
      }`}
    >
      {pending ? 'Processing...' : label}
    </button>
  )
}