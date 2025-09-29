'use client'

export default function DemoLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md px-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg border-0 shadow-2xl">
          <div className="space-y-4 pb-8 p-6">
            <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-gradient-to-tr from-blue-600 to-purple-600 rounded"></div>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
              <p className="text-base text-gray-600 dark:text-gray-400 mt-2">
                Sign in to access your secure database dashboard
              </p>
            </div>
          </div>
          <div className="pb-8 px-6">
            <button 
              onClick={() => window.location.href = '/demo-dashboard'}
              className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 font-medium rounded-md flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7V10C2 16 12 22 12 22S22 16 22 22 10V7L12 2Z"/>
              </svg>
              Continue with Google (Demo)
            </button>
            <p className="text-xs text-gray-500 text-center mt-6">
              Only authorized users can access this application.
              <br />
              Contact your administrator for access.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}