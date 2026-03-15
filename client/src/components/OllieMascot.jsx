export default function OllieMascot({ size = 1, message = 'Dive in! 🌊' }) {
  const s = size;

  return (
    <div style={{ position: 'relative', width: 120 * s, height: 150 * s, display: 'inline-block' }}>

      {/* Speech bubble */}
      {message && (
        <div style={{
          position: 'absolute',
          top: -52 * s, left: '50%',
          transform: 'translateX(-10%)',
          background: '#fff',
          borderRadius: 16 * s,
          padding: `${6 * s}px ${14 * s}px`,
          fontSize: 13 * s,
          fontWeight: 600,
          color: '#0A4A6E',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(0,100,200,0.2)',
          animation: 'bubble-pop 3s ease-in-out infinite',
          zIndex: 2,
        }}>
          {message}
          <div style={{
            position: 'absolute',
            bottom: -8 * s, left: 20 * s,
            width: 0, height: 0,
            borderLeft: `${8 * s}px solid transparent`,
            borderRight: `${8 * s}px solid transparent`,
            borderTop: `${10 * s}px solid #fff`,
          }} />
        </div>
      )}

      {/* Tentacles */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: 120 * s, height: 50 * s,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
      }}>
        {[44, 52, 48, 54, 46, 52, 44, 50].map((h, i) => (
          <div key={i} style={{
            width: 14 * s, height: h * s,
            background: 'linear-gradient(180deg, #38BDF8, #0EA5E9)',
            borderRadius: `${8 * s}px ${8 * s}px ${10 * s}px ${10 * s}px`,
            animation: `tentacle-wiggle ${1.6 + i * 0.05}s ease-in-out ${i * 0.15}s infinite`,
            transformOrigin: 'top center',
            boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.15)',
          }} />
        ))}
      </div>

      {/* Body */}
      <div style={{
        width: 100 * s, height: 90 * s,
        background: 'linear-gradient(160deg, #38BDF8 0%, #0EA5E9 60%, #0284C7 100%)',
        borderRadius: '50% 50% 48% 48%',
        position: 'absolute',
        top: 42 * s, left: 10 * s,
        boxShadow: `0 8px 24px rgba(2,132,199,0.5), inset 0 -8px 16px rgba(0,0,0,0.15), inset 0 4px 12px rgba(255,255,255,0.2)`,
      }}>
        {/* Belly sheen */}
        <div style={{
          width: 46 * s, height: 20 * s,
          background: 'rgba(255,255,255,0.22)',
          borderRadius: '50%',
          position: 'absolute',
          top: 10 * s, left: 16 * s,
          transform: 'rotate(-20deg)',
          filter: 'blur(2px)',
        }} />
      </div>

      {/* Head */}
      <div style={{
        width: 100 * s, height: 92 * s,
        background: 'linear-gradient(140deg, #7DD3FC 0%, #38BDF8 40%, #0EA5E9 100%)',
        borderRadius: '50%',
        position: 'absolute',
        top: 0, left: 10 * s,
        boxShadow: `0 -4px 12px rgba(125,211,252,0.4), inset 0 4px 16px rgba(255,255,255,0.2)`,
      }}>
        {/* Head sheen */}
        <div style={{
          width: 42 * s, height: 16 * s,
          background: 'rgba(255,255,255,0.28)',
          borderRadius: '50%',
          position: 'absolute',
          top: 14 * s, left: 14 * s,
          transform: 'rotate(-20deg)',
          filter: 'blur(3px)',
        }} />

        {/* Texture dots */}
        {[[10, 28], [8, 50], [16, 66]].map(([t, l], i) => (
          <div key={i} style={{
            width: 6 * s, height: 6 * s,
            background: 'rgba(2,132,199,0.35)',
            borderRadius: '50%',
            position: 'absolute',
            top: t * s, left: l * s,
          }} />
        ))}

        {/* Left eye */}
        <div style={{
          width: 26 * s, height: 28 * s,
          background: '#fff',
          borderRadius: '50%',
          position: 'absolute',
          top: 28 * s, left: 12 * s,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          <div style={{ width: 8 * s, height: 8 * s, background: 'rgba(125,211,252,0.5)', borderRadius: '50%', position: 'absolute', top: 4 * s, left: 3 * s }} />
          <div style={{ width: 15 * s, height: 17 * s, background: '#0A2540', borderRadius: '50%', position: 'absolute', bottom: 3 * s, left: '50%', transform: 'translateX(-50%)' }}>
            <div style={{ width: 5 * s, height: 5 * s, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2 * s, right: 1 * s }} />
          </div>
        </div>

        {/* Right eye */}
        <div style={{
          width: 26 * s, height: 28 * s,
          background: '#fff',
          borderRadius: '50%',
          position: 'absolute',
          top: 28 * s, right: 12 * s,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          <div style={{ width: 8 * s, height: 8 * s, background: 'rgba(125,211,252,0.5)', borderRadius: '50%', position: 'absolute', top: 4 * s, left: 3 * s }} />
          <div style={{ width: 15 * s, height: 17 * s, background: '#0A2540', borderRadius: '50%', position: 'absolute', bottom: 3 * s, left: '50%', transform: 'translateX(-50%)' }}>
            <div style={{ width: 5 * s, height: 5 * s, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2 * s, right: 1 * s }} />
          </div>
        </div>

        {/* Blush left */}
        <div style={{ width: 18 * s, height: 10 * s, background: '#7DD3FC', borderRadius: '50%', position: 'absolute', top: 46 * s, left: 4 * s, opacity: 0.5 }} />
        {/* Blush right */}
        <div style={{ width: 18 * s, height: 10 * s, background: '#7DD3FC', borderRadius: '50%', position: 'absolute', top: 46 * s, right: 4 * s, opacity: 0.5 }} />

        {/* Smile */}
        <div style={{
          width: 30 * s, height: 15 * s,
          border: `${4 * s}px solid #0369A1`,
          borderTop: 'none',
          borderRadius: `0 0 ${20 * s}px ${20 * s}px`,
          position: 'absolute',
          bottom: 14 * s, left: '50%',
          transform: 'translateX(-50%)',
        }} />
      </div>

      {/* Shadow */}
      <div style={{
        width: 70 * s, height: 16 * s,
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '50%',
        position: 'absolute',
        bottom: -8 * s, left: 25 * s,
        filter: 'blur(6px)',
      }} />
    </div>
  );
}
