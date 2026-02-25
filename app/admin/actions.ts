'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveLeave(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') return

  const leaveId = formData.get('leaveId') as string
  const employeeId = formData.get('employeeId') as string

  if (!leaveId || !employeeId) return

  const { data: leave } = await supabase
    .from('leave_requests')
    .select('leave_type, start_date, end_date, is_half_day, status')
    .eq('id', leaveId)
    .single()

  if (!leave || leave.status !== 'pending') return

  let days = 1

  if (leave.is_half_day) {
    days = 0.5
  } else {
    const start = new Date(leave.start_date + 'T00:00:00')
    const end = new Date(leave.end_date + 'T00:00:00')
    const diffTime = end.getTime() - start.getTime()
    days = diffTime / (1000 * 60 * 60 * 24) + 1
  }

  if (days <= 0 || isNaN(days)) return

  const { data: empProfile } = await supabase
    .from('profiles')
    .select('vl_balance, sl_balance')
    .eq('id', employeeId)
    .single()

  if (!empProfile) return

  let newVL = empProfile.vl_balance
  let newSL = empProfile.sl_balance

  if (leave.leave_type === 'VL') {
    if (empProfile.vl_balance < days) return
    newVL = empProfile.vl_balance - days
  }

  if (leave.leave_type === 'SL') {
    if (empProfile.sl_balance < days) return
    newSL = empProfile.sl_balance - days
  }

  await supabase
    .from('leave_requests')
    .update({
      status: 'approved',
      approver_id: user.id,
    })
    .eq('id', leaveId)
    .eq('status', 'pending')

  await supabase
    .from('profiles')
    .update({
      vl_balance: newVL,
      sl_balance: newSL,
    })
    .eq('id', employeeId)

  await supabase
    .from('leave_transactions')
    .insert({
      employee_id: employeeId,
      leave_type: leave.leave_type,
      amount: -days,
      reference: 'Approved Leave',
    })

  revalidatePath('/admin')
}

export async function rejectLeave(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') return

  const leaveId = formData.get('leaveId') as string
  if (!leaveId) return

  await supabase
    .from('leave_requests')
    .update({
      status: 'rejected',
      approver_id: user.id,
    })
    .eq('id', leaveId)
    .eq('status', 'pending')

  revalidatePath('/admin')
}

export async function adjustLeaveBalance(
  formData: FormData
): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') return

  const employeeId = formData.get('employeeId') as string
  const leaveType = formData.get('leaveType') as string
  const amount = Number(formData.get('amount'))
  const reason = formData.get('reason') as string

  if (!employeeId || !leaveType || isNaN(amount)) return

  const { data: empProfile } = await supabase
    .from('profiles')
    .select('vl_balance, sl_balance')
    .eq('id', employeeId)
    .single()

  if (!empProfile) return

  let newVL = empProfile.vl_balance
  let newSL = empProfile.sl_balance

  if (leaveType === 'VL') {
    newVL = empProfile.vl_balance + amount
    if (newVL < 0) return
  }

  if (leaveType === 'SL') {
    newSL = empProfile.sl_balance + amount
    if (newSL < 0) return
  }

  await supabase
    .from('profiles')
    .update({
      vl_balance: newVL,
      sl_balance: newSL,
    })
    .eq('id', employeeId)

  await supabase
    .from('leave_transactions')
    .insert({
      employee_id: employeeId,
      leave_type: leaveType,
      amount,
      reference: reason || 'Manual Adjustment',
    })

  revalidatePath('/admin/employees')
}