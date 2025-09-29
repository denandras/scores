'use client'

import { useEffect } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'

export default function Home() {
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        window.location.href = '/dashboard'
      } else {
        window.location.href = '/login'
      }
    }

    checkUser()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  )
}
