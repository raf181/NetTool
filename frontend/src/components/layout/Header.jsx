import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Menu, 
  Bell, 
  Search,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react'

export default function Header({ onMenuToggle, connected }) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 glass-card rounded-none border-b border-dark-800/50">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-dark-800/50 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Search */}
          <div className="relative hidden md:block">
            <motion.div
              animate={{ width: searchOpen ? 300 : 200 }}
              className="relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="text"
                placeholder="Search..."
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setSearchOpen(false)}
                className="w-full pl-10 pr-4 py-2 bg-dark-900/50 border border-dark-800 rounded-xl text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </motion.div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              connected 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {connected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </span>
                <Wifi className="w-4 h-4" />
                <span className="hidden sm:inline">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="hidden sm:inline">Disconnected</span>
              </>
            )}
          </motion.div>

          {/* Refresh Button */}
          <button
            onClick={() => window.location.reload()}
            className="p-2 rounded-lg hover:bg-dark-800/50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-dark-400 hover:text-white" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-dark-800/50 transition-colors">
            <Bell className="w-5 h-5 text-dark-400 hover:text-white" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  )
}
