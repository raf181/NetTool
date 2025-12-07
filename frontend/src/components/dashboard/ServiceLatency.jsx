import { motion } from 'framer-motion'
import { Clock, Cloud, Server } from 'lucide-react'

const services = [
  { id: 'google', name: 'Google', icon: '🔍', color: 'blue' },
  { id: 'amazon', name: 'Amazon', icon: '📦', color: 'orange' },
  { id: 'cloudflare', name: 'Cloudflare', icon: '☁️', color: 'cyan' },
  { id: 'microsoft', name: 'Microsoft', icon: '🪟', color: 'purple' },
]

const getLatencyColor = (latency) => {
  if (!latency) return 'text-dark-400'
  if (latency < 50) return 'text-green-400'
  if (latency < 100) return 'text-yellow-400'
  return 'text-red-400'
}

const getLatencyBarWidth = (latency, max = 200) => {
  if (!latency) return 0
  return Math.min((latency / max) * 100, 100)
}

const getLatencyBarColor = (latency) => {
  if (!latency) return 'bg-dark-600'
  if (latency < 50) return 'bg-gradient-to-r from-green-500 to-green-400'
  if (latency < 100) return 'bg-gradient-to-r from-yellow-500 to-yellow-400'
  return 'bg-gradient-to-r from-red-500 to-red-400'
}

export default function ServiceLatency({ data }) {
  const serviceLatencies = data || {}

  return (
    <div className="glass-card gradient-pink p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-pink-500/20">
          <Clock className="w-5 h-5 text-pink-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Service Latency</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Major Services */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cloud className="w-4 h-4 text-dark-400" />
            <h4 className="font-medium text-dark-300">Major Services</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {services.map((service) => {
              const latency = serviceLatencies[service.id]
              
              return (
                <motion.div
                  key={service.id}
                  whileHover={{ scale: 1.02 }}
                  className="stat-item text-center p-4"
                >
                  <div className="text-2xl mb-2">{service.icon}</div>
                  <div className="text-sm text-dark-400 mb-1">{service.name}</div>
                  <div className={`text-lg font-bold ${getLatencyColor(latency)}`}>
                    {latency ? `${latency.toFixed(1)} ms` : '-- ms'}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Network Services */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-dark-400" />
            <h4 className="font-medium text-dark-300">Network Services</h4>
          </div>
          
          <div className="space-y-6">
            {/* DNS Resolution */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌐</span>
                  <span className="text-sm text-dark-300">DNS Resolution</span>
                </div>
                <span className={`text-sm font-semibold ${getLatencyColor(serviceLatencies.dns)}`}>
                  {serviceLatencies.dns ? `${serviceLatencies.dns.toFixed(1)} ms` : '-- ms'}
                </span>
              </div>
              <div className="progress-bar">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getLatencyBarWidth(serviceLatencies.dns)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`fill ${getLatencyBarColor(serviceLatencies.dns)}`}
                />
              </div>
            </div>

            {/* HTTP Connection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔗</span>
                  <span className="text-sm text-dark-300">HTTP Connection</span>
                </div>
                <span className={`text-sm font-semibold ${getLatencyColor(serviceLatencies.http)}`}>
                  {serviceLatencies.http ? `${serviceLatencies.http.toFixed(1)} ms` : '-- ms'}
                </span>
              </div>
              <div className="progress-bar">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getLatencyBarWidth(serviceLatencies.http)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`fill ${getLatencyBarColor(serviceLatencies.http)}`}
                />
              </div>
            </div>

            {/* Gateway */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚪</span>
                  <span className="text-sm text-dark-300">Gateway</span>
                </div>
                <span className={`text-sm font-semibold ${getLatencyColor(serviceLatencies.gateway)}`}>
                  {serviceLatencies.gateway ? `${serviceLatencies.gateway.toFixed(1)} ms` : '-- ms'}
                </span>
              </div>
              <div className="progress-bar">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getLatencyBarWidth(serviceLatencies.gateway)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`fill ${getLatencyBarColor(serviceLatencies.gateway)}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
