import { motion } from 'framer-motion'
import { GitBranch, Monitor, Router, Globe, Server } from 'lucide-react'

export default function NetworkTopology({ data }) {
  const nodes = [
    { id: 'internet', type: 'internet', label: 'Internet', icon: Globe },
    { id: 'gateway', type: 'router', label: data?.gateway || 'Gateway', icon: Router },
    { id: 'device', type: 'device', label: 'This Device', icon: Monitor },
  ]

  return (
    <div className="glass-card gradient-cyan p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-cyan-500/20">
          <GitBranch className="w-5 h-5 text-cyan-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Network Topology</h3>
      </div>

      <div className="relative py-8">
        {/* Simple linear topology */}
        <div className="flex items-center justify-center gap-8">
          {nodes.map((node, index) => {
            const Icon = node.icon
            return (
              <div key={node.id} className="flex items-center gap-8">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.2, type: 'spring' }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className={`
                    w-16 h-16 rounded-xl flex items-center justify-center
                    ${node.type === 'internet' ? 'bg-blue-500/20 border border-blue-500/30' : ''}
                    ${node.type === 'router' ? 'bg-green-500/20 border border-green-500/30' : ''}
                    ${node.type === 'device' ? 'bg-purple-500/20 border border-purple-500/30' : ''}
                  `}>
                    <Icon className={`
                      w-8 h-8
                      ${node.type === 'internet' ? 'text-blue-400' : ''}
                      ${node.type === 'router' ? 'text-green-400' : ''}
                      ${node.type === 'device' ? 'text-purple-400' : ''}
                    `} />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-white">{node.label}</div>
                    {node.type === 'device' && data?.ipv4 && (
                      <div className="text-xs text-dark-400 mt-1">{data.ipv4}</div>
                    )}
                    {node.type === 'device' && data?.macAddress && (
                      <div className="text-xs text-dark-500 font-mono mt-0.5">{data.macAddress}</div>
                    )}
                  </div>
                </motion.div>

                {/* Connection Line */}
                {index < nodes.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: index * 0.2 + 0.1, duration: 0.3 }}
                    className="flex-1 max-w-32 h-0.5 bg-gradient-to-r from-dark-600 via-primary-500/50 to-dark-600 origin-left"
                  >
                    <motion.div
                      animate={{ x: ['0%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-full bg-primary-400 rounded-full opacity-50"
                    />
                  </motion.div>
                )}
              </div>
            )
          })}
        </div>

        {/* Connection info */}
        <div className="mt-8 flex justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span className="text-sm text-dark-400">Active Connection</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-dark-600"></div>
            <span className="text-sm text-dark-400">Inactive</span>
          </div>
        </div>
      </div>
    </div>
  )
}
