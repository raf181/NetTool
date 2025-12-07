import { motion } from 'framer-motion'
import { Plug, Wifi, HardDrive, Cpu } from 'lucide-react'

export default function InterfaceDetails({ data }) {
  const details = [
    { label: 'Name', value: data?.interfaceName || '--', icon: Plug },
    { label: 'MAC Address', value: data?.macAddress || '--', icon: HardDrive },
    { label: 'Link Speed', value: data?.linkSpeed || '--', icon: Cpu },
    { label: 'Duplex', value: data?.duplex || '--', icon: null },
    { label: 'SSID', value: data?.ssid || '--', icon: Wifi },
    { label: 'VLAN', value: data?.vlan || '--', icon: null },
  ]

  return (
    <div className="glass-card gradient-blue p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/20">
          <Plug className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Interface Details</h3>
      </div>
      
      <div className="space-y-4">
        {details.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex justify-between items-center py-3 border-b border-dark-800/50 last:border-0"
          >
            <div className="flex items-center gap-2">
              {item.icon && <item.icon className="w-4 h-4 text-dark-400" />}
              <span className="text-dark-400">{item.label}</span>
            </div>
            <span className="font-semibold text-white truncate max-w-[200px]" title={item.value}>
              {item.value}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
