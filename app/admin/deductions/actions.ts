'use server'

import { createClient } from '@/utils/supabase/server'

export async function deductLate(formData: FormData) {
  const supabase = await createClient()

  const employeeId = formData.get('employeeId') as string
  const minutes = Number(formData.get('minutes'))
  const deduction = Number(formData.get('deduction'))

  if (!employeeId || !deduction) {
    return { error: 'Missing data' }
  }

  // 1. Get current VL
  const { data: profile } = await supabase
    .from('profiles')
    .select('vl_balance')
    .eq('id', employeeId)
    .single()

  if (!profile) {
    return { error: 'Employee not found' }
  }

  const newVL = Number(profile.vl_balance) - deduction

  // 2. Update VL balance
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ vl_balance: newVL })
    .eq('id', employeeId)

  if (updateError) {
    return { error: updateError.message }
  }

  // 3. Save history
  await supabase.from('late_deductions').insert({
    employee_id: employeeId,
    minutes,
    deduction,
  })

  return { success: true }
}