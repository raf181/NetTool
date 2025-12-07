import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Wifi, 
  WifiOff, 
  Globe, 
  Activity, 
  Server,
  Clock,
  ArrowUpDown,
  Gauge,
  Shield,
  HardDrive,
  RefreshCw
} from 'lucide-react'
import StatsCard from '../components/dashboard/StatsCard'
import TrafficChart from '../components/dashboard/TrafficChart'
import ServiceLatency from '../components/dashboard/ServiceLatency'
import ArpTable from '../components/dashboard/ArpTable'
import NetworkTopology from '../components/dashboard/NetworkTopology'
import InterfaceDetails from '../components/dashboard/InterfaceDetails'
import { networkApi } from '../api'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
}

export default function Dashboard({ networkData, connected }) {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [localData, setLocalData] = useState(null)

  // Use WebSocket data or fetch manually
  useEffect(() => {
    if (networkData) {
      setLocalData(networkData)
      setLastUpdated(new Date())
    }
  }, [networkData])

  // Initial fetch if no WebSocket data
  useEffect(() => {
    if (!networkData) {
      fetchNetworkInfo()
    }
  }, [])

  const fetchNetworkInfo = async () => {
    try {
      const response = await networkApi.getNetworkInfo()
      setLocalData(response.data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch network info:', error)
    }
  }

  const formatUptime = (seconds) => {
    if (!seconds) return '--:--:--'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const data = localData || {}

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Network Dashboard</h1>
          <p className="text-dark-400 mt-1">Real-time network monitoring and analysis</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`btn-secondary flex items-center gap-2 ${!autoRefresh && 'opacity-50'}`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh && connected && 'animate-spin'}`} />
            {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
          </button>
          {lastUpdated && (
            <span className="text-sm text-dark-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Quick Overview Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Connection Status */}
        <StatsCard
          title="Connection"
          gradient="blue"
          icon={connected ? Wifi : WifiOff}
          badge={{ text: 'Live', variant: connected ? 'success' : 'error' }}
        >
          <div className="text-center mb-4">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {connected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              <span className="font-medium">{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="text-xs text-dark-400">Uptime</span>
              <span className="text-sm font-semibold text-white">{formatUptime(data.uptime)}</span>
            </div>
            <div className="stat-item">
              <span className="text-xs text-dark-400">Type</span>
              <span className="text-sm font-semibold text-white truncate">{data.connectionType || '--'}</span>
            </div>
          </div>
        </StatsCard>

        {/* IP Configuration */}
        <StatsCard
          title="IP Config"
          gradient="cyan"
          icon={Globe}
          badge={{ text: 'Live', variant: 'cyan' }}
        >
          <div className="stats-grid">
            <div className="stat-item">
              <span className="text-xs text-dark-400">IPv4</span>
              <span className="text-sm font-semibold text-white">{data.ipv4 || '--'}</span>
            </div>
            <div className="stat-item">
              <span className="text-xs text-dark-400">Subnet</span>
              <span className="text-sm font-semibold text-white">{data.subnet || '--'}</span>
            </div>
            <div className="stat-item">
              <span className="text-xs text-dark-400">Gateway</span>
              <span className="text-sm font-semibold text-white">{data.gateway || '--'}</span>
            </div>
            <div className="stat-item">
              <span className="text-xs text-dark-400">IPv6</span>
              <span className="text-xs font-semibold text-white truncate">{data.ipv6 || '--'}</span>
            </div>
          </div>
        </StatsCard>

        {/* Connection Metrics */}
        <StatsCard
          title="Metrics"
          gradient="purple"
          icon={Activity}
          badge={{ text: 'Live', variant: 'purple' }}
        >
          <div className="stats-grid">
            <div className="stat-item">
              <span className="text-xs text-dark-400">Latency</span>
              <span className="text-sm font-semibold text-white">
                {data.latency ? `${data.latency.toFixed(1)} ms` : '-- ms'}
              </span>
            </div>
            <div className="stat-item">
              <span className="text-xs text-dark-400">Packet Loss</span>
              <span className="text-sm font-semibold text-white">
                {data.packetLoss !== undefined ? `${data.packetLoss.toFixed(1)}%` : '--%'}
              </span>
            </div>
            <div className="stat-item">
              <span className="text-xs text-dark-400">Signal</span>
              <span className="text-sm font-semibold text-white">
                {data.signalStrength ? `${data.signalStrength} dBm` : '-- dBm'}
              </span>
            </div>
            <div className="stat-item">
              <span className="text-xs text-dark-400">Bandwidth</span>
              <span className="text-sm font-semibold text-white">
                {data.bandwidth ? `${data.bandwidth} Mbps` : '-- Mbps'}
              </span>
            </div>
          </div>
          <button className="btn-primary w-full mt-4 text-sm">
            <Gauge className="w-4 h-4 inline mr-2" />
            Run Speed Test
          </button>
        </StatsCard>

        {/* DNS */}
        <StatsCard
          title="DNS"
          gradient="orange"
          icon={Server}
          badge={{ text: 'Live', variant: 'orange' }}
        >
          <div className="space-y-2">
            {data.dnsServers && data.dnsServers.length > 0 ? (
              data.dnsServers.slice(0, 4).map((dns, index) => (
                <div key={index} className="stat-item">
                  <span className="text-xs text-dark-400">DNS {index + 1}</span>
                  <span className="text-sm font-semibold text-white">{dns}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-dark-400">
                No DNS servers found
              </div>
            )}
          </div>
        </StatsCard>
      </motion.div>

      {/* Traffic Chart */}
      <motion.div variants={itemVariants}>
        <TrafficChart data={data} />
      </motion.div>

      {/* Network Details Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InterfaceDetails data={data} />
        
        {/* Traffic Stats */}
        <div className="glass-card gradient-purple p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <ArrowUpDown className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Traffic Statistics</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-dark-800/50">
              <span className="text-dark-400">Bytes Received</span>
              <span className="font-semibold text-white">{formatBytes(data.bytesReceived)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-dark-800/50">
              <span className="text-dark-400">Bytes Sent</span>
              <span className="font-semibold text-white">{formatBytes(data.bytesSent)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-dark-800/50">
              <span className="text-dark-400">Packets Received</span>
              <span className="font-semibold text-white">{data.packetsReceived?.toLocaleString() || '--'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-dark-800/50">
              <span className="text-dark-400">Packets Sent</span>
              <span className="font-semibold text-white">{data.packetsSent?.toLocaleString() || '--'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-dark-800/50">
              <span className="text-dark-400">DHCP Status</span>
              <span className={`font-semibold ${data.dhcpEnabled ? 'text-green-400' : 'text-yellow-400'}`}>
                {data.dhcpEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Service Latency */}
      <motion.div variants={itemVariants}>
        <ServiceLatency data={data.serviceLatency} />
      </motion.div>

      {/* ARP Table */}
      <motion.div variants={itemVariants}>
        <ArpTable entries={data.arpTable} />
      </motion.div>

      {/* Network Topology */}
      <motion.div variants={itemVariants}>
        <NetworkTopology data={data} />
      </motion.div>
    </motion.div>
  )
}
