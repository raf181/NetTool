import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Puzzle, 
  Network, 
  Search, 
  Globe, 
  Shield, 
  Gauge,
  Wifi,
  Activity,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Settings
} from 'lucide-react'
import { pluginsApi } from '../../api'

const menuGroups = [
  {
    id: 'network-analysis',
    label: 'Network Analysis',
    icon: Activity,
    pluginIds: ['network_quality', 'bandwidth_test', 'packet_capture', 'network_info', 'iperf3', 'tc_controller', 'network_latency_heatmap', 'subnet_calculator']
  },
  {
    id: 'network-discovery',
    label: 'Network Discovery',
    icon: Search,
    pluginIds: ['device_discovery', 'port_scanner', 'wifi_scanner']
  },
  {
    id: 'connectivity',
    label: 'Connectivity',
    icon: Network,
    pluginIds: ['ping', 'traceroute', 'mtu_tester']
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: Gauge,
    pluginIds: ['iperf3', 'iperf3_server', 'tc_controller']
  },
  {
    id: 'dns-tools',
    label: 'DNS Tools',
    icon: Globe,
    pluginIds: ['dns_lookup', 'dns_propagation', 'reverse_dns_lookup']
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    pluginIds: ['ssl_checker']
  }
]

export default function Sidebar({ isOpen, onToggle, darkMode, onDarkModeToggle }) {
  const [plugins, setPlugins] = useState([])
  const [expandedGroups, setExpandedGroups] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlugins()
  }, [])

  const loadPlugins = async () => {
    try {
      const response = await pluginsApi.getAll()
      setPlugins(response.data || [])
    } catch (error) {
      console.error('Failed to load plugins:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  const getPluginsForGroup = (group) => {
    return plugins.filter(plugin => group.pluginIds.includes(plugin.ID))
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 256 : 64 }}
      className="fixed left-0 top-0 h-full z-50"
    >
      <div className="h-full glass-card rounded-none border-r border-dark-800/50">
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-dark-800/50">
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gradient">NetTool</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-dark-800/50 transition-colors"
          >
            {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-2">
          {/* Dashboard */}
          <NavLink
            to="/"
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
              ${isActive 
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' 
                : 'hover:bg-dark-800/50 text-dark-300 hover:text-white'}
            `}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="font-medium">Dashboard</span>}
          </NavLink>

          {/* Plugin Manager */}
          <NavLink
            to="/plugin-manager"
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
              ${isActive 
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' 
                : 'hover:bg-dark-800/50 text-dark-300 hover:text-white'}
            `}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="font-medium">Plugin Manager</span>}
          </NavLink>

          {/* Divider */}
          <div className="my-4 border-t border-dark-800/50" />

          {/* Plugin Groups */}
          {isOpen && (
            <div className="space-y-1">
              {menuGroups.map((group) => {
                const groupPlugins = getPluginsForGroup(group)
                if (groupPlugins.length === 0) return null

                const Icon = group.icon
                const isExpanded = expandedGroups[group.id]

                return (
                  <div key={group.id}>
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-dark-800/50 text-dark-300 hover:text-white transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium text-sm">{group.label}</span>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 space-y-1 mt-1">
                            {groupPlugins.map((plugin) => (
                              <NavLink
                                key={plugin.ID}
                                to={`/plugin/${plugin.ID}`}
                                className={({ isActive }) => `
                                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200
                                  ${isActive 
                                    ? 'bg-primary-500/10 text-primary-400' 
                                    : 'hover:bg-dark-800/30 text-dark-400 hover:text-white'}
                                `}
                              >
                                <Puzzle className="w-4 h-4" />
                                <span>{plugin.Name}</span>
                              </NavLink>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-dark-800/50">
          <button
            onClick={onDarkModeToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl hover:bg-dark-800/50 text-dark-300 hover:text-white transition-all duration-200"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {isOpen && <span className="text-sm">Toggle Theme</span>}
          </button>
          
          {isOpen && (
            <div className="mt-4 text-center text-xs text-dark-500">
              <p>NetTool v1.0</p>
              <p className="mt-1">Network Analysis Tool</p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
