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


// ✅ PUT LOGS HERE
console.log("EMPLOYEE ID FROM FORM:", employeeId)
console.log("LEAVE ID:", leaveId)

    // 1️⃣ Get leave FIRST
    const { data: leave, error: leaveFetchError } = await supabase
        .from('leave_requests')
        .select('leave_type, start_date, end_date, is_half_day')
        .eq('id', leaveId)
        .single()

    if (leaveFetchError || !leave)
    return { error: 'Leave not found' }

// 🚫 Prevent double approval
const { data: existingLeave } = await supabase
    .from('leave_requests')
    .select('status')
    .eq('id', leaveId)
    .single()

if (existingLeave?.status === 'approved') {
    return { error: 'Already approved' }
}

let days = 1

if (leave.is_half_day) {
    days = 0.5
} else {
    const start = new Date(leave.start_date)
    const end = new Date(leave.end_date)

    const diffTime = Math.abs(end.getTime() - start.getTime())
    days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

    // 2️⃣ Get employee profile
    const { data: empProfile, error: profileError } = await supabase
        .from('profiles')
        .select('vl_balance, sl_balance')
        .eq('id', employeeId)
        .single()

    if (profileError || !empProfile)
        return { error: 'Employee profile not found' }

    let newVL = empProfile.vl_balance
    let newSL = empProfile.sl_balance

    // 3️⃣ Deduct balance
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

    const { error: updateBalanceError } = await supabase
        .from('profiles')
        .update({
            vl_balance: newVL,
            sl_balance: newSL
        })
        .eq('id', employeeId)

    if (updateBalanceError)
        return { error: updateBalanceError.message }

    // 4️⃣ Now update leave status
    const { error: approveError } = await supabase
        .from('leave_requests')
        .update({
            status: 'approved',
            approver_id: user.id
        })
        .eq('id', leaveId)

    if (approveError)
        return { error: approveError.message }

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

    const { error } = await supabase
        .from('leave_requests')
        .update({
            status: 'rejected',
            approver_id: user.id
        })
        .eq('id', leaveId)

    if (error) return { error: error.message }

    revalidatePath('/admin')
    revalidatePath('/')

    return { success: true }
}
