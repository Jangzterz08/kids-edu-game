import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function getBarColor(avgStars) {
  if (avgStars >= 2.5) return '#10B981';
  if (avgStars >= 1)   return '#F59E0B';
  return '#EF4444';
}

export default function ModuleStarsChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={styles.empty}>No module data yet</div>
    );
  }

  const chartHeight = Math.max(300, data.length * 30);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
      >
        <XAxis
          type="number"
          domain={[0, 3]}
          ticks={[0, 1, 2, 3]}
          tick={{ fontSize: 11, fill: 'var(--text-secondary, #999)' }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={80}
          tick={{ fontSize: 11, fill: 'var(--text-secondary, #999)' }}
        />
        <Tooltip
          formatter={(value) => [value.toFixed(2), 'Avg Stars']}
          contentStyle={{
            background: 'var(--bg-surface, #1e2a3a)',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
            borderRadius: 8,
            color: '#fff',
          }}
        />
        <Bar dataKey="avgStars" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.avgStars)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const styles = {
  empty: {
    height: 300,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary, #999)',
    fontSize: 'var(--font-base, 16px)',
    fontStyle: 'italic',
  },
};
