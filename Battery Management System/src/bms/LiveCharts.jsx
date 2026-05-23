import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const tooltipStyle = {
  background: '#1a2332',
  border: '1px solid #243044',
  borderRadius: 8,
  color: '#f1f5f9',
}

export function LiveCharts({ data }) {
  if (data.length === 0) {
    return (
      <div className="bms-card">
        <p className="bms-empty">Charts populate when live data arrives</p>
      </div>
    )
  }

  const last = data[data.length - 1]

  return (
    <>
      <section className="bms-grid-2">
        <div className="bms-card">
          <h3>Pack voltage &amp; current</h3>
          <div className="bms-chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#243044" />
                <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="v" stroke="#3b82f6" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="a" orientation="right" stroke="#f59e0b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line yAxisId="v" type="monotone" dataKey="voltage" name="Voltage (V)" stroke="#3b82f6" dot={false} strokeWidth={2} />
                <Line yAxisId="a" type="monotone" dataKey="current" name="Current (A)" stroke="#f59e0b" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bms-card">
          <h3>State of charge</h3>
          <div className="bms-chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="socGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#243044" />
                <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#22c55e" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="soc" name="SOC %" stroke="#22c55e" fill="url(#socGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="bms-grid-2">
        <div className="bms-card">
          <h3>ML model scores (good %)</h3>
          <div className="bms-chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Random Forest', score: last.rf },
                  { name: 'Gradient Boost', score: last.gb },
                  { name: 'Extra Trees', score: last.et },
                ]}
                layout="vertical"
                margin={{ left: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#243044" />
                <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={95} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="score" name="Good %" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bms-card">
          <h3>Score history</h3>
          <div className="bms-chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#243044" />
                <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="rf" name="Random Forest" stroke="#3b82f6" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="gb" name="Gradient Boost" stroke="#8b5cf6" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="et" name="Extra Trees" stroke="#06b6d4" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </>
  )
}
