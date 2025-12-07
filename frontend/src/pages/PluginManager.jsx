import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  Download, 
  RefreshCw, 
  Trash2, 
  Check, 
  X,
  ExternalLink,
  Package,
  Clock,
  AlertCircle
} from 'lucide-react'
import { pluginManagerApi } from '../api'

export default function PluginManager() {
  const [installedPlugins, setInstalledPlugins] = useState([])
  const [availablePlugins, setAvailablePlugins] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('installed')
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    loadPlugins()
  }, [])

  const loadPlugins = async () => {
    setLoading(true)
    setError(null)
    try {
      const [installed, available] = await Promise.all([
        pluginManagerApi.listInstalled(),
        pluginManagerApi.listAvailable()
      ])
      setInstalledPlugins(installed.data || [])
      setAvailablePlugins(available.data || [])
    } catch (err) {
      setError('Failed to load plugins')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleInstall = async (repository) => {
    setActionLoading(prev => ({ ...prev, [repository]: true }))
    try {
      await pluginManagerApi.install(repository)
      await loadPlugins()
    } catch (err) {
      console.error('Failed to install plugin:', err)
    } finally {
      setActionLoading(prev => ({ ...prev, [repository]: false }))
    }
  }

  const handleUpdate = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: true }))
    try {
      await pluginManagerApi.update(id)
      await loadPlugins()
    } catch (err) {
      console.error('Failed to update plugin:', err)
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleUninstall = async (id) => {
    if (!confirm('Are you sure you want to uninstall this plugin?')) return
    
    setActionLoading(prev => ({ ...prev, [id]: true }))
    try {
      await pluginManagerApi.uninstall(id)
      await loadPlugins()
    } catch (err) {
      console.error('Failed to uninstall plugin:', err)
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleRefreshCatalog = async () => {
    setActionLoading(prev => ({ ...prev, refresh: true }))
    try {
      await pluginManagerApi.refreshCatalog()
      await loadPlugins()
    } catch (err) {
      console.error('Failed to refresh catalog:', err)
    } finally {
      setActionLoading(prev => ({ ...prev, refresh: false }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Plugin Manager</h1>
          <p className="text-dark-400 mt-1">Install and manage network analysis plugins</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshCatalog}
            disabled={actionLoading.refresh}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${actionLoading.refresh ? 'animate-spin' : ''}`} />
            Refresh Catalog
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-dark-900/50 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('installed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'installed'
              ? 'bg-primary-500/20 text-primary-400'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          Installed ({installedPlugins.length})
        </button>
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'available'
              ? 'bg-primary-500/20 text-primary-400'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          Available ({availablePlugins.length})
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Installed Plugins */}
          {activeTab === 'installed' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {installedPlugins.length > 0 ? (
                installedPlugins.map((plugin, index) => (
                  <motion.div
                    key={plugin.ID}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{plugin.Name}</h3>
                          <p className="text-xs text-dark-400">v{plugin.Version || '1.0.0'}</p>
                        </div>
                      </div>
                      {plugin.UpdateAvailable && (
                        <span className="status-badge warning">
                          Update available
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-dark-300 mb-4 line-clamp-2">
                      {plugin.Description || 'No description available'}
                    </p>

                    <div className="flex items-center gap-2">
                      {plugin.UpdateAvailable && (
                        <button
                          onClick={() => handleUpdate(plugin.ID)}
                          disabled={actionLoading[plugin.ID]}
                          className="btn-primary text-sm flex-1"
                        >
                          {actionLoading[plugin.ID] ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Download className="w-4 h-4 inline mr-1" />
                              Update
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleUninstall(plugin.ID)}
                        disabled={actionLoading[plugin.ID]}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-dark-400">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No plugins installed</p>
                  <p className="text-sm mt-1">Browse available plugins to get started</p>
                </div>
              )}
            </div>
          )}

          {/* Available Plugins */}
          {activeTab === 'available' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availablePlugins.length > 0 ? (
                availablePlugins.map((plugin, index) => (
                  <motion.div
                    key={plugin.Repository || plugin.ID}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                          <Package className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{plugin.Name}</h3>
                          <p className="text-xs text-dark-400">v{plugin.Version || '1.0.0'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-dark-300 mb-4 line-clamp-2">
                      {plugin.Description || 'No description available'}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleInstall(plugin.Repository)}
                        disabled={actionLoading[plugin.Repository]}
                        className="btn-primary text-sm flex-1"
                      >
                        {actionLoading[plugin.Repository] ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="w-4 h-4 inline mr-1" />
                            Install
                          </>
                        )}
                      </button>
                      {plugin.Repository && (
                        <a
                          href={`https://github.com/${plugin.Repository}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-dark-800/50 text-dark-400 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-dark-400">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No plugins available</p>
                  <p className="text-sm mt-1">Click refresh to check for new plugins</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
