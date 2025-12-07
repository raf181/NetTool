import { motion } from 'framer-motion'
import { Network, Laptop, Router, Server, Monitor } from 'lucide-react'

const getDeviceIcon = (state) => {
  // You can customize based on MAC vendor lookup
  return Laptop
}

const getStateColor = (state) => {
  switch (state?.toLowerCase()) {
    case 'reachable':
      return 'text-green-400 bg-green-400/20 border-green-400/30'
    case 'stale':
      return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30'
    case 'delay':
      return 'text-orange-400 bg-orange-400/20 border-orange-400/30'
    case 'failed':
      return 'text-red-400 bg-red-400/20 border-red-400/30'
    default:
      return 'text-dark-400 bg-dark-600/20 border-dark-400/30'
  }
}

export default function ArpTable({ entries = [] }) {
  // Filter out empty entries and limit display
  const validEntries = (entries || []).filter(e => e && e.ip).slice(0, 50)

  return (
    <div className="glass-card gradient-teal p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-500/20">
            <Network className="w-5 h-5 text-teal-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">IP Neighbor Table (ARP)</h3>
        </div>
        <span className="text-sm text-dark-400">
          {validEntries.length} entries
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="modern-table">
          <thead>
            <tr>
              <th className="rounded-tl-lg">IP Address</th>
              <th>MAC Address</th>
              <th>Interface</th>
              <th className="rounded-tr-lg">State</th>
            </tr>
          </thead>
          <tbody>
            {validEntries.length > 0 ? (
              validEntries.map((entry, index) => (
                <motion.tr
                  key={`${entry.ip}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-primary-500/5"
                >
                  <td className="font-mono text-sm">{entry.ip}</td>
                  <td className="font-mono text-sm text-dark-300">{entry.mac || '--'}</td>
                  <td className="text-sm text-dark-300">{entry.interface || '--'}</td>
                  <td>
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStateColor(entry.state)}`}>
                      {entry.state || 'Unknown'}
                    </span>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-8 text-dark-400">
                  <div className="flex flex-col items-center gap-2">
                    <Network className="w-8 h-8 opacity-50" />
                    <span>No ARP entries found</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
