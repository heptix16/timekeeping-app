'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveLeave(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Verify admin
    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (adminProfile?.role !== 'admin')
        return { error: 'Not authorized' }

    const leaveId = formData.get('leaveId') as string
    const employeeId = formData.get('employeeId') as string

    if (!leaveId || !employeeId)
        return { error: 'Missing leave or employee ID' }

    // 1️⃣ Get leave FIRST (including status)
    const { data: leave, error: leaveError } = await supabase
        .from('leave_requests')
        .select('leave_type, start_date, end_date, is_half_day, status')
        .eq('id', leaveId)
        .single()

    if (leaveError || !leave)
        return { error: 'Leave not found' }

    // 🚫 Prevent double approval
    if (leave.status === 'approved')
        return { error: 'Already approved' }

    // 2️⃣ Compute number of days safely (no timezone bug)
    let days = 1

    if (leave.is_half_day) {
        days = 0.5
    } else {
        const start = new Date(leave.start_date + 'T00:00:00')
        const end = new Date(leave.end_date + 'T00:00:00')

        const diffTime = end.getTime() - start.getTime()
        days = diffTime / (1000 * 60 * 60 * 24) + 1
    }

    // 3️⃣ Get employee profile
    const { data: empProfile, error: profileError } = await supabase
        .from('profiles')
        .select('vl_balance, sl_balance')
        .eq('id', employeeId)
        .single()

    if (profileError || !empProfile)
        return { error: 'Employee profile not found' }

    let newVL = empProfile.vl_balance
    let newSL = empProfile.sl_balance

    // 4️⃣ Deduct balance
    if (leave.leave_type === 'VL') {
        if (empProfile.vl_balance < days)
            return { error: 'Insufficient VL balance' }

        newVL = empProfile.vl_balance - days
    }

    if (leave.leave_type === 'SL') {
        if (empProfile.sl_balance < days)
            return { error: 'Insufficient SL balance' }

        newSL = empProfile.sl_balance - days
    }

    // 5️⃣ Update leave status FIRST (safer order)
    const { error: approveError } = await supabase
        .from('leave_requests')
        .update({
            status: 'approved',
            approver_id: user.id
        })
        .eq('id', leaveId)

    if (approveError)
        return { error: approveError.message }

    // 6️⃣ Update balances
    const { error: updateBalanceError } = await supabase
        .from('profiles')
        .update({
            vl_balance: newVL,
            sl_balance: newSL
        })
        .eq('id', employeeId)

    if (updateBalanceError)
        return { error: updateBalanceError.message }

    revalidatePath('/admin')
    revalidatePath('/')

    return { success: true }
}

export async function rejectLeave(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Verify admin
    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (adminProfile?.role !== 'admin')
        return { error: 'Not authorized' }

    const leaveId = formData.get('leaveId') as string

    if (!leaveId)
        return { error: 'Missing leave ID' }

    const { error } = await supabase
        .from('leave_requests')
        .update({
            status: 'rejected',
            approver_id: user.id
        })
        .eq('id', leaveId)

    if (error)
        return { error: error.message }

    revalidatePath('/admin')
    revalidatePath('/')

    return { success: true }
}