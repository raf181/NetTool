import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Activity, ArrowDown, ArrowUp } from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 border border-dark-700">
        <p className="text-sm text-dark-400 mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm text-green-400">
            ↓ Download: {payload[0]?.value?.toFixed(2)} Mbps
          </p>
          <p className="text-sm text-blue-400">
            ↑ Upload: {payload[1]?.value?.toFixed(2)} Mbps
          </p>
        </div>
      </div>
    )
  }
  return null
}

export default function TrafficChart({ data }) {
  const [chartData, setChartData] = useState([])
  const maxPoints = 30

  useEffect(() => {
    if (data) {
      const now = new Date()
      const time = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })

      setChartData(prev => {
        const newPoint = {
          time,
          download: data.downloadSpeed || Math.random() * 100,
          upload: data.uploadSpeed || Math.random() * 50,
        }
        
        const updated = [...prev, newPoint]
        return updated.slice(-maxPoints)
      })
    }
  }, [data])

  // Initialize with some data for demo
  useEffect(() => {
    if (chartData.length === 0) {
      const initialData = []
      for (let i = 0; i < 10; i++) {
        const now = new Date(Date.now() - (10 - i) * 3000)
        const time = now.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        })
        initialData.push({
          time,
          download: Math.random() * 80 + 20,
          upload: Math.random() * 30 + 10,
        })
      }
      setChartData(initialData)
    }
  }, [])

  const currentDownload = chartData[chartData.length - 1]?.download || 0
  const currentUpload = chartData[chartData.length - 1]?.upload || 0

  return (
    <div className="glass-card gradient-teal p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-500/20">
            <Activity className="w-5 h-5 text-teal-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Network Traffic</h3>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <ArrowDown className="w-4 h-4 text-green-400" />
            <span className="text-sm text-dark-400">Download:</span>
            <span className="text-sm font-semibold text-green-400">
              {currentDownload.toFixed(2)} Mbps
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowUp className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-dark-400">Upload:</span>
            <span className="text-sm font-semibold text-blue-400">
              {currentUpload.toFixed(2)} Mbps
            </span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
            <XAxis 
              dataKey="time" 
              stroke="rgba(148, 163, 184, 0.5)" 
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
            />
            <YAxis 
              stroke="rgba(148, 163, 184, 0.5)" 
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="download"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#downloadGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#22c55e' }}
            />
            <Area
              type="monotone"
              dataKey="upload"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#uploadGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#3b82f6' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
