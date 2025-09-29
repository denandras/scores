'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Database, 
  Upload, 
  Users, 
  LogOut, 
  Search,
  Plus,
  Trash2,
  Edit,
  Settings
} from 'lucide-react'
import { UserRole } from '@/lib/utils'

interface UserData {
  id: string
  email: string
  role: UserRole
  created_at: string
}

interface DatabaseRecord {
  id: string
  title: string
  description: string
  created_at: string
  created_by: string
}

interface User {
  id: string
  email?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole>('user')
  const [records, setRecords] = useState<DatabaseRecord[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [activeTab, setActiveTab] = useState<'database' | 'upload' | 'users'>('database')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    const initializeData = async () => {
      await getUser()
      await getRecords()
    }
    initializeData()
  }, [])

  useEffect(() => {
    if (userRole === 'admin') {
      getUsers()
    }
  }, [userRole])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      // Check user role from database
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      setUserRole(userData?.role || 'user')
    }
    setLoading(false)
  }

  const getRecords = async () => {
    const { data } = await supabase
      .from('records')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setRecords(data)
  }

  const getUsers = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setUsers(data)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const deleteAccount = async () => {
    if (!user?.id) return
    
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Delete user data and account
      await supabase.from('user_profiles').delete().eq('id', user.id)
      await supabase.auth.signOut()
      window.location.href = '/login'
    }
  }

  const filteredRecords = records.filter(record =>
    record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    window.location.href = '/login'
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Secure Database
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {user?.email} ({userRole})
              </div>
              <Button variant="ghost" onClick={deleteAccount} className="text-red-600 hover:text-red-700">
                <Settings className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
              <Button variant="ghost" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'database'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Database className="w-4 h-4 mr-2" />
              Database
            </button>
            
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </button>
            
            {userRole === 'admin' && (
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Users
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Database Tab */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Database Records</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Record
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRecords.map((record) => (
                <Card key={record.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{record.title}</CardTitle>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {record.description}
                    </CardDescription>
                    <div className="text-xs text-gray-500">
                      Created {new Date(record.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">File Upload</h2>
            <Card className="p-8">
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload files to Mega S4</h3>
                <p className="text-gray-600 mb-6">Drag and drop files here or click to browse</p>
                <Button>Choose Files</Button>
              </div>
            </Card>
          </div>
        )}

        {/* Users Tab (Admin Only) */}
        {activeTab === 'users' && userRole === 'admin' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h2>
            <Card>
              <CardHeader>
                <CardTitle>System Users</CardTitle>
                <CardDescription>Manage user access and roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((userData) => (
                    <div key={userData.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{userData.email}</div>
                        <div className="text-sm text-gray-500">
                          Role: {userData.role} • Joined {new Date(userData.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="destructive" size="sm">Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}