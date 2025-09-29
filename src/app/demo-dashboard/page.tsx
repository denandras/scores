'use client'

import { useState } from 'react'
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

const mockRecords = [
  {
    id: '1',
    title: 'Customer Data Analysis',
    description: 'Quarterly analysis of customer behavior patterns and preferences',
    created_at: '2024-01-15T10:30:00Z',
    created_by: 'user1'
  },
  {
    id: '2', 
    title: 'Sales Performance Report',
    description: 'Monthly sales performance metrics and growth indicators',
    created_at: '2024-01-10T14:20:00Z',
    created_by: 'user2'
  },
  {
    id: '3',
    title: 'Product Inventory Update',
    description: 'Current inventory levels and restock recommendations',
    created_at: '2024-01-08T09:15:00Z',
    created_by: 'user1'
  }
]

const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    email: 'user@example.com', 
    role: 'user',
    created_at: '2024-01-05T12:00:00Z'
  }
]

export default function DemoDashboard() {
  const [activeTab, setActiveTab] = useState<'database' | 'upload' | 'users'>('database')
  const [searchTerm, setSearchTerm] = useState('')
  const [userRole] = useState<'admin' | 'user'>('admin')
  
  const user = { email: 'demo@example.com' }

  const filteredRecords = mockRecords.filter(record =>
    record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
                {user.email} ({userRole})
              </div>
              <Button variant="ghost" className="text-red-600 hover:text-red-700">
                <Settings className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
              <Button variant="ghost" onClick={() => window.location.href = '/demo-login'}>
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
              className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
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
              className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
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
                className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
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
                  {mockUsers.map((userData) => (
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