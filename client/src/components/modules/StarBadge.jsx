export default function StarBadge({ stars = 0, max = 3, size = 'md' }) {
  const sz = size === 'sm' ? 18 : size === 'lg' ? 32 : 24;
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          style={{
            fontSize: sz,
            filter: i < stars ? 'none' : 'grayscale(1) opacity(0.3)',
            transition: 'filter 0.3s',
          }}
        >⭐</span>
      ))}
    </div>
  );
}
