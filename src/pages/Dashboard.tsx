import { Activity, MessageSquare, Server, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { healthCheck, listLangChainTools, listMCPServers } from '../services/api'

interface DashboardStats {
  healthStatus: string
  serverCount: number
  toolCount: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    healthStatus: 'unknown',
    serverCount: 0,
    toolCount: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Check health
        const healthResponse = await healthCheck()
        const healthStatus = healthResponse.data.status

        // Get server count
        const serversResponse = await listMCPServers()
        const serverCount = Object.keys(serversResponse.data).length

        // Get tool count
        let toolCount = 0
        try {
          const toolsResponse = await listLangChainTools()
          toolCount = toolsResponse.data.length
        } catch {
          // If no servers or tools available, keep count at 0
        }

        setStats({
          healthStatus,
          serverCount,
          toolCount
        })
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      name: 'Backend Status', 
      value: stats.healthStatus === 'ok' ? 'Online' : 'Offline',
      icon: Activity,
      color: stats.healthStatus === 'ok' ? 'text-green-600' : 'text-red-600',
      bgColor: stats.healthStatus === 'ok' ? 'bg-green-100' : 'bg-red-100'
    },
    {
      name: 'MCP Servers',
      value: stats.serverCount.toString(),
      icon: Server,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Available Tools',
      value: stats.toolCount.toString(),
      icon: Wrench,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to the MCP Frontend. Monitor your servers and interact with your AI tools.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-md ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <a
              href="/chat"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-600 ring-4 ring-white">
                  <MessageSquare className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" />
                  Start Chat
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Begin a conversation with the AI agent
                </p>
              </div>
            </a>

            <a
              href="/servers"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-600 ring-4 ring-white">
                  <Server className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" />
                  Manage Servers
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Add, edit, or remove MCP servers
                </p>
              </div>
            </a>

            <a
              href="/tools"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-600 ring-4 ring-white">
                  <Wrench className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" />
                  Browse Tools
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Explore available MCP tools
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
