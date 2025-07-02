import { Edit, Loader2, Plus, Server, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
    addMCPServer,
    deleteMCPServer,
    listMCPServers,
    MCPServer,
    updateMCPServer
} from '../services/api'

interface ServerFormData {
  url: string
  transport: string
}

export default function ServerManagement() {
  const [servers, setServers] = useState<Record<string, MCPServer>>({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingServer, setEditingServer] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ServerFormData>()

  useEffect(() => {
    fetchServers()
  }, [])

  const fetchServers = async () => {
    try {
      const response = await listMCPServers()
      setServers(response.data)
    } catch (error) {
      console.error('Failed to fetch servers:', error)
      toast.error('Failed to load servers')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ServerFormData) => {
    if (!editingServer) {
      toast.error('Please provide a server name')
      return
    }

    try {
      if (servers[editingServer]) {
        await updateMCPServer(editingServer, data)
        toast.success('Server updated successfully')
      } else {
        await addMCPServer(editingServer, data)
        toast.success('Server added successfully')
      }
      
      await fetchServers()
      handleCancel()
    } catch (error) {
      console.error('Failed to save server:', error)
      toast.error('Failed to save server')
    }
  }

  const handleEdit = (name: string, server: MCPServer) => {
    setEditingServer(name)
    setValue('url', server.url)
    setValue('transport', server.transport)
    setShowForm(true)
  }

  const handleDelete = async (name: string) => {
    if (!confirm('Are you sure you want to delete this server?')) return

    try {
      await deleteMCPServer(name)
      toast.success('Server deleted successfully')
      await fetchServers()
    } catch (error) {
      console.error('Failed to delete server:', error)
      toast.error('Failed to delete server')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingServer(null)
    reset()
  }

  const handleAdd = () => {
    const name = prompt('Enter server name:')
    if (!name) return
    
    setEditingServer(name)
    reset()
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MCP Servers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your Model Context Protocol servers.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Server
        </button>
      </div>

      {/* Server Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {servers[editingServer!] ? 'Edit Server' : 'Add Server'}
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Server Name
                </label>
                <input
                  type="text"
                  value={editingServer || ''}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  URL
                </label>
                <input
                  type="text"
                  {...register('url', { required: 'URL is required' })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.url && (
                  <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Transport
                </label>
                <select
                  {...register('transport', { required: 'Transport is required' })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select transport...</option>
                  <option value="stdio">stdio</option>
                  <option value="sse">sse</option>
                  <option value="websocket">websocket</option>
                </select>
                {errors.transport && (
                  <p className="mt-1 text-sm text-red-600">{errors.transport.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  {servers[editingServer!] ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Servers List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {Object.keys(servers).length === 0 ? (
          <div className="text-center py-12">
            <Server className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No servers</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first MCP server.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {Object.entries(servers).map(([name, server]) => (
              <li key={name}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <Server className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{name}</p>
                        <div className="mt-1 text-sm text-gray-500">
                          <p>URL: {server.url}</p>
                          <p>Transport: {server.transport}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(name, server)}
                      className="p-2 text-gray-400 hover:text-gray-500"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(name)}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
