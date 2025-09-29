'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createBrowserSupabaseClient()

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md px-4">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-4 pb-8">
            <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-gradient-to-tr from-blue-600 to-purple-600 rounded"></div>
              </div>
            </div>
            <CardTitle className="text-center text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription className="text-center text-base">
              Sign in to access your secure database dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 font-medium"
              variant="outline"
            >
              <LogIn className="w-5 h-5 mr-3" />
              {loading ? 'Signing in...' : 'Continue with Google'}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-6">
              Only authorized users can access this application.
              <br />
              Contact your administrator for access.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}