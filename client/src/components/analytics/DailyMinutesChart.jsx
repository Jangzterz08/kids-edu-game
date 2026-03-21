import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DailyMinutesChart({ data }) {
  const hasActivity = data && data.some(d => d.minutes > 0);

  if (!hasActivity) {
    return (
      <div style={styles.empty}>No activity this week</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tickFormatter={d => d ? d.slice(5) : ''}
          tick={{ fontSize: 11, fill: 'var(--text-secondary, #999)' }}
        />
        <YAxis
          unit=" min"
          tick={{ fontSize: 11, fill: 'var(--text-secondary, #999)' }}
          width={52}
        />
        <Tooltip
          formatter={(value) => [`${value} min`, 'Time']}
          labelFormatter={(label) => label}
          contentStyle={{
            background: 'var(--bg-surface, #1e2a3a)',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
            borderRadius: 8,
            color: '#fff',
          }}
        />
        <Bar
          dataKey="minutes"
          fill="var(--primary, #6C5CE7)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

const styles = {
  empty: {
    height: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary, #999)',
    fontSize: 'var(--font-base, 16px)',
    fontStyle: 'italic',
  },
};
