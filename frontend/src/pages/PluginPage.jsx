import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Play, 
  Settings, 
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { pluginsApi } from '../api'

export default function PluginPage() {
  const { id } = useParams()
  const [plugin, setPlugin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [params, setParams] = useState({})

  useEffect(() => {
    loadPlugin()
  }, [id])

  const loadPlugin = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await pluginsApi.getById(id)
      setPlugin(response.data)
      
      // Initialize params with default values
      if (response.data?.Parameters) {
        const initialParams = {}
        response.data.Parameters.forEach(param => {
          initialParams[param.Name] = param.Default || ''
        })
        setParams(initialParams)
      }
    } catch (err) {
      setError('Failed to load plugin')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const runPlugin = async () => {
    setRunning(true)
    setResult(null)
    setError(null)
    try {
      const response = await pluginsApi.run(id, params)
      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to run plugin')
      console.error(err)
    } finally {
      setRunning(false)
    }
  }

  const handleParamChange = (name, value) => {
    setParams(prev => ({ ...prev, [name]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    )
  }

  if (!plugin) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Plugin Not Found</h2>
        <p className="text-dark-400 mb-4">The plugin "{id}" could not be found.</p>
        <Link to="/" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          to="/" 
          className="p-2 rounded-lg hover:bg-dark-800/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{plugin.Name}</h1>
          <p className="text-dark-400 mt-1">{plugin.Description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parameters */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary-500/20">
                <Settings className="w-5 h-5 text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Parameters</h3>
            </div>

            <div className="space-y-4">
              {plugin.Parameters && plugin.Parameters.length > 0 ? (
                plugin.Parameters.map((param) => (
                  <div key={param.Name}>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      {param.Label || param.Name}
                      {param.Required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    
                    {param.Type === 'select' ? (
                      <select
                        value={params[param.Name] || ''}
                        onChange={(e) => handleParamChange(param.Name, e.target.value)}
                        className="w-full px-4 py-2 bg-dark-900/50 border border-dark-800 rounded-xl text-white focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20"
                      >
                        {param.Options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : param.Type === 'boolean' ? (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={params[param.Name] === true || params[param.Name] === 'true'}
                          onChange={(e) => handleParamChange(param.Name, e.target.checked)}
                          className="w-5 h-5 rounded bg-dark-900/50 border-dark-800 text-primary-500 focus:ring-primary-500/20"
                        />
                        <span className="text-dark-300">{param.Description}</span>
                      </label>
                    ) : param.Type === 'number' ? (
                      <input
                        type="number"
                        value={params[param.Name] || ''}
                        onChange={(e) => handleParamChange(param.Name, e.target.value)}
                        placeholder={param.Placeholder || param.Description}
                        className="w-full px-4 py-2 bg-dark-900/50 border border-dark-800 rounded-xl text-white placeholder:text-dark-500 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20"
                      />
                    ) : (
                      <input
                        type="text"
                        value={params[param.Name] || ''}
                        onChange={(e) => handleParamChange(param.Name, e.target.value)}
                        placeholder={param.Placeholder || param.Description}
                        className="w-full px-4 py-2 bg-dark-900/50 border border-dark-800 rounded-xl text-white placeholder:text-dark-500 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20"
                      />
                    )}
                    
                    {param.Description && param.Type !== 'boolean' && (
                      <p className="text-xs text-dark-500 mt-1">{param.Description}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-dark-400 text-sm">No parameters required</p>
              )}
            </div>

            <button
              onClick={runPlugin}
              disabled={running}
              className="btn-primary w-full mt-6"
            >
              {running ? (
                <>
                  <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 inline mr-2" />
                  Run Plugin
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6 min-h-[400px]">
            <h3 className="text-lg font-semibold text-white mb-6">Results</h3>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 mb-4"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {result ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {result.success !== undefined && (
                  <div className={`flex items-center gap-2 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                    {result.success ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                    <span className="font-medium">
                      {result.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                )}

                {/* Render result based on type */}
                {typeof result === 'object' ? (
                  <pre className="bg-dark-900/50 p-4 rounded-xl overflow-auto text-sm text-dark-200 font-mono">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                ) : (
                  <p className="text-dark-200">{result}</p>
                )}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-dark-400">
                <Play className="w-12 h-12 mb-4 opacity-50" />
                <p>Run the plugin to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
