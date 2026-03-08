import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getModule } from '../data/index';
import { useKid } from '../context/KidContext';
import { useProgress } from '../hooks/useProgress';
import { speakWord } from '../lib/sound';
import LessonCard from '../components/lesson/LessonCard';
import ProgressBar from '../components/lesson/ProgressBar';

export default function LessonPlayer() {
  const { moduleSlug } = useParams();
  const { activeKid }  = useKid();
  const navigate       = useNavigate();
  const mod            = getModule(moduleSlug);
  const { recordLesson } = useProgress(activeKid?.id);

  const [current, setCurrent] = useState(0);
  const [dir, setDir]         = useState(null); // 'left' | 'right' | null
  const touchStart = useRef(null);
  const lessons = mod?.lessons || [];

  if (!mod) return <div className="page-center">Module not found</div>;

  // Auto-speak word when lesson changes
  useEffect(() => {
    const lesson = lessons[current];
    if (!lesson) return;
    const t = setTimeout(() => speakWord(lesson.word), 400);
    return () => clearTimeout(t);
  }, [current]);

  async function markViewed(lesson) {
    if (!activeKid) return;
    await recordLesson(lesson.slug, { viewed: true, starsEarned: 1, attempts: 1 });
  }

  async function goNext() {
    setDir('left');
    await markViewed(lessons[current]);
    setTimeout(() => {
      if (current < lessons.length - 1) {
        setCurrent(c => c + 1);
      } else {
        navigate(`/play/${moduleSlug}/game`);
      }
      setDir(null);
    }, 220);
  }

  function goPrev() {
    if (current === 0) return;
    setDir('right');
    setTimeout(() => { setCurrent(c => c - 1); setDir(null); }, 220);
  }

  // Swipe handling
  function onTouchStart(e) {
    touchStart.current = e.touches[0].clientX;
  }

  function onTouchEnd(e) {
    if (touchStart.current === null) return;
    const delta = touchStart.current - e.changedTouches[0].clientX;
    touchStart.current = null;
    if (delta > 50) goNext();
    else if (delta < -50) goPrev();
  }

  const lesson = lessons[current];
  const isLast = current === lessons.length - 1;

  const slideStyle = dir === 'left'
    ? { opacity: 0, transform: 'translateX(-40px)', transition: 'all 0.2s ease' }
    : dir === 'right'
    ? { opacity: 0, transform: 'translateX(40px)', transition: 'all 0.2s ease' }
    : { opacity: 1, transform: 'translateX(0)', transition: 'all 0.2s ease' };

  return (
    <div
      style={styles.container}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div style={styles.topBar}>
        <ProgressBar current={current + 1} total={lessons.length} color={mod.color} />
        <span style={styles.counter}>{current + 1} / {lessons.length}</span>
      </div>

      <div style={{ ...styles.cardWrap, ...slideStyle }}>
        <LessonCard lesson={lesson} />
      </div>

      <div style={styles.nav}>
        <button
          className="kid-btn ghost"
          onClick={goPrev}
          disabled={current === 0}
          style={styles.navBtn}
        >← Back</button>
        <button
          className="kid-btn"
          onClick={goNext}
          style={{ ...styles.navBtn, background: mod.color }}
        >
          {isLast ? 'Play Games! 🎮' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 'var(--space-xl)', maxWidth: 500, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 },
  topBar: { display: 'flex', alignItems: 'center', gap: 12 },
  counter: { fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' },
  cardWrap: { flex: 1 },
  nav: { display: 'flex', gap: 16 },
  navBtn: { flex: 1 },
};
