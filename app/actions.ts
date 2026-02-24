'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function timeIn(formData?: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase.from('time_logs').insert([
        { employee_id: user.id }
    ])

    if (error) {
        console.error("Time In Error:", error.message)
        return
    }

    revalidatePath('/')
}

export async function timeOut(formData?: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const today = new Date().toISOString().split('T')[0] // local time offset isn't considered, but works for UTC

    const { data: logs, error: fetchError } = await supabase
        .from('time_logs')
        .select('*')
        .eq('employee_id', user.id)
        .eq('date', today)
        .is('time_out', null)
        .order('time_in', { ascending: false })
        .limit(1)

    if (fetchError || !logs || logs.length === 0) {
        console.error("Time Out Error: No open time-in record found for today.")
        return
    }

    const logId = logs[0].id

    const { error } = await supabase
        .from('time_logs')
        .update({ time_out: new Date().toISOString() })
        .eq('id', logId)

    if (error) {
        console.error("Time Out Error:", error.message)
        return
    }

    revalidatePath('/')
}

export async function fileLeave(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string
    const reason = formData.get('reason') as string
    const leaveType = formData.get('leave_type') as string
    const isHalfDay = formData.get('is_half_day') === 'true'

    if (!leaveType) {
        return { error: 'Please select a leave type.' }
    }

    // 🔍 Check for overlapping leave requests FIRST
    const { data: existingLeaves, error: checkError } = await supabase
        .from('leave_requests')
        .select('start_date, end_date, status')
        .eq('employee_id', user.id)
        .in('status', ['pending', 'approved'])

    if (checkError)
        return { error: 'Failed to validate existing leave requests.' }

    const newStart = new Date(startDate)
    const newEnd = new Date(endDate)

    const hasOverlap = existingLeaves?.some(leave => {
        const existingStart = new Date(leave.start_date)
        const existingEnd = new Date(leave.end_date)

        return newStart <= existingEnd && newEnd >= existingStart
    })

    if (hasOverlap) {
        return {
            error: 'You already have a pending or approved leave request that overlaps with these dates.'
        }
    }

    // ✅ INSERT ONLY ONCE — AFTER VALIDATION
    const { error } = await supabase
        .from('leave_requests')
        .insert({
            employee_id: user.id,
            leave_type: leaveType,
            start_date: startDate,
            end_date: endDate,
            reason: reason,
            is_half_day: isHalfDay,
            status: 'pending'
        })

    if (error) return { error: error.message }

    revalidatePath('/')
    return { success: true }
}
