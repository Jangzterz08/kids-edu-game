import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getModule } from '../data/index';
import { useKid } from '../context/KidContext';
import { useProgress } from '../hooks/useProgress';
import QuizGame from '../components/games/QuizGame';
import MatchingGame from '../components/games/MatchingGame';
import TracingGame from '../components/games/TracingGame';
import SpellingGame from '../components/games/SpellingGame';

export default function MiniGame() {
  const { moduleSlug }          = useParams();
  const { activeKid }           = useKid();
  const navigate                = useNavigate();
  const mod                     = getModule(moduleSlug);
  const { recordLesson }        = useProgress(activeKid?.id);
  const [gameIdx, setGameIdx]   = useState(0);
  const [scores, setScores]     = useState({});

  if (!mod) return <div className="page-center">Module not found</div>;

  const games = mod.games; // e.g. ['matching','tracing','quiz']

  async function handleGameComplete(score) {
    const gameType = games[gameIdx];
    const newScores = { ...scores, [gameType]: score };
    setScores(newScores);

    // Record score for every lesson in the module (in parallel)
    const update = {
      viewed: true,
      starsEarned: computeStars(newScores),
      attempts: 1,
      completedAt: new Date().toISOString(),
    };
    if (gameType === 'matching') update.matchScore   = score;
    if (gameType === 'tracing')  update.traceScore   = score;
    if (gameType === 'quiz')     update.quizScore    = score;
    if (gameType === 'spelling') update.spellingScore = score;
    await Promise.all(mod.lessons.map(lesson => recordLesson(lesson.slug, update).catch(() => {})));

    if (gameIdx < games.length - 1) {
      setGameIdx(i => i + 1);
    } else {
      navigate(`/play/${moduleSlug}/done`, { state: { scores: newScores } });
    }
  }

  function computeStars(s) {
    const vals = Object.values(s).filter(v => v !== undefined);
    if (vals.length === 0) return 1;
    const allGood = vals.every(v => v >= 80);
    if (allGood && vals.length >= 2) return 3;
    const hasQuiz = (s.quiz !== undefined && s.quiz >= 60) || (s.spelling !== undefined && s.spelling >= 60);
    if (hasQuiz) return 2;
    return 1;
  }

  const game = games[gameIdx];

  return (
    <div>
      <div style={styles.gameHeader}>
        <span style={styles.modEmoji}>{mod.iconEmoji}</span>
        <span style={styles.modTitle}>{mod.title}</span>
        <span style={styles.gameBadge}>
          {game === 'matching' ? '🃏 Match' : game === 'tracing' ? '✏️ Trace' : game === 'spelling' ? '🔤 Spell' : '❓ Quiz'}
        </span>
        <span style={styles.gameCounter}>{gameIdx + 1}/{games.length}</span>
      </div>

      {game === 'quiz' && (
        <QuizGame moduleSlug={moduleSlug} lessons={mod.lessons} onComplete={handleGameComplete} />
      )}
      {game === 'matching' && (
        <MatchingGame lessons={mod.lessons} onComplete={handleGameComplete} />
      )}
      {game === 'tracing' && (
        <TracingGame lessons={mod.lessons} onComplete={handleGameComplete} />
      )}
      {game === 'spelling' && (
        <SpellingGame lessons={mod.lessons} onComplete={handleGameComplete} />
      )}
    </div>
  );
}

const styles = {
  gameHeader: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px var(--space-xl)',
    background: 'var(--bg-surface)', borderBottom: '2px solid var(--bg-surface-alt)',
  },
  modEmoji: { fontSize: 28 },
  modTitle: { fontWeight: 900, fontSize: 'var(--font-base)', flex: 1 },
  gameBadge: {
    background: 'var(--bg-surface-alt)', padding: '4px 14px', borderRadius: 20,
    fontWeight: 700, fontSize: 'var(--font-sm)',
  },
  gameCounter: { color: 'var(--text-secondary)', fontWeight: 700, fontSize: 'var(--font-sm)' },
};
