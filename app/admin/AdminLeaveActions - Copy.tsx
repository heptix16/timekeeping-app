'use client'

import { useState } from 'react'
import { approveLeave, rejectLeave } from './actions'
import { useFormStatus } from 'react-dom'

interface AdminLeaveActionsProps {
  leaveId: string;
  employeeId: string;
  diffDays: number;
  disabled?: boolean;
}

export default function AdminLeaveActions({ leaveId, employeeId, diffDays, disabled, }: AdminLeaveActionsProps) {
    const [message, setMessage] = useState('')
    const [isError, setIsError] = useState(false)

    async function handleApprove(formData: FormData) {
        setMessage('')
        setIsError(false)
        const result = await approveLeave(formData)
        if (result?.error) {
            setMessage(result.error)
            setIsError(true)
        } else {
            setMessage('Leave request approved successfully.')
            setIsError(false)
        }
    }

    async function handleReject(formData: FormData) {
        setMessage('')
        setIsError(false)
        const result = await rejectLeave(formData)
        if (result?.error) {
            setMessage(result.error)
            setIsError(true)
        } else {
            setMessage('Leave request rejected.')
            setIsError(false)
        }
    }

    return (
        <div className="flex flex-col gap-3 mt-auto w-full">
            {message && (
                <div className={`p-2 rounded text-xs text-center font-medium ${isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    {message}
                </div>
            )}
            <div className="flex gap-2 relative z-10 w-full">
                <form action={handleApprove} className="flex-1">
                    <input type="hidden" name="leaveId" value={leaveId} />
                    <input type="hidden" name="employeeId" value={employeeId} />
                    <input type="hidden" name="days" value={diffDays} />
                    <SubmitButton
  label="Approve"
  defaultClass="bg-emerald-600 text-white hover:bg-emerald-700"
  disabled={disabled}
/>
                </form>
                <form action={handleReject} className="flex-1">
                    <input type="hidden" name="leaveId" value={leaveId} />
                    <SubmitButton label="Reject" defaultClass="bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300" />
                </form>
            </div>
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
            {pending ? '...' : label}
        </button>
    )
}
