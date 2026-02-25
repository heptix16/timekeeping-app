'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveLeave(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // ✅ Verify admin
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

  // =============================
  // 1️⃣ Fetch leave record
  // =============================
  const { data: leave, error: leaveError } = await supabase
    .from('leave_requests')
    .select('leave_type, start_date, end_date, is_half_day, status')
    .eq('id', leaveId)
    .single()

  if (leaveError || !leave)
    return { error: 'Leave not found' }

  if (leave.status !== 'pending')
    return { error: 'Leave already processed' }

  // =============================
  // 2️⃣ Compute days safely
  // =============================
  let days = 1

  if (leave.is_half_day) {
    days = 0.5
  } else {
    const start = new Date(leave.start_date + 'T00:00:00')
    const end = new Date(leave.end_date + 'T00:00:00')

    const diffTime = end.getTime() - start.getTime()
    days = diffTime / (1000 * 60 * 60 * 24) + 1
  }

  if (days <= 0 || isNaN(days)) {
    return { error: 'Invalid leave date range' }
  }

  // =============================
  // 3️⃣ Get employee balance
  // =============================
  const { data: empProfile, error: profileError } = await supabase
    .from('profiles')
    .select('vl_balance, sl_balance')
    .eq('id', employeeId)
    .single()

  if (profileError || !empProfile)
    return { error: 'Employee profile not found' }

  const currentVL = Number(empProfile.vl_balance ?? 0)
  const currentSL = Number(empProfile.sl_balance ?? 0)

  let newVL = currentVL
  let newSL = currentSL

  // =============================
  // 4️⃣ Deduct properly
  // =============================
  if (leave.leave_type === 'VL') {
    if (currentVL < days)
      return { error: 'Insufficient VL balance' }

    newVL = currentVL - days
  }

  if (leave.leave_type === 'SL') {
    if (currentSL < days)
      return { error: 'Insufficient SL balance' }

    newSL = currentSL - days
  }

  if (newVL > currentVL || newSL > currentSL) {
    return { error: 'Balance calculation error detected' }
  }

  // =============================
  // 5️⃣ Update leave status (guarded)
  // =============================
  const { error: updateError } = await supabase
    .from('leave_requests')
    .update({
      status: 'approved',
      approver_id: user.id,
    })
    .eq('id', leaveId)
    .eq('status', 'pending')

  if (updateError)
    return { error: updateError.message }

  // =============================
  // 6️⃣ Update balance
  // =============================
  const { error: balanceError } = await supabase
    .from('profiles')
    .update({
      vl_balance: newVL,
      sl_balance: newSL,
    })
    .eq('id', employeeId)

  if (balanceError)
    return { error: balanceError.message }

  // =============================
  // 7️⃣ Insert ledger transaction
  // =============================
  const { error: ledgerError } = await supabase
    .from('leave_transactions')
    .insert({
      employee_id: employeeId,
      leave_type: leave.leave_type,
      amount: -days, // negative = deduction
      reference: 'Approved Leave',
    })

  if (ledgerError)
    return { error: ledgerError.message }

  revalidatePath('/admin')
  revalidatePath('/')

  return { success: true }
}

export async function rejectLeave(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

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
      approver_id: user.id,
    })
    .eq('id', leaveId)
    .eq('status', 'pending')

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/')

  return { success: true }
}