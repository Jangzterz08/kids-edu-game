import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getModule } from '../data/index';
import { useKid } from '../context/KidContext';
import { useProgress } from '../hooks/useProgress';
import useSessionHeartbeat from '../hooks/useSessionHeartbeat';
import QuizGame from '../components/games/QuizGame';
import MatchingGame from '../components/games/MatchingGame';
import TracingGame from '../components/games/TracingGame';
import SpellingGame from '../components/games/SpellingGame';
import PhonicsGame from '../components/games/PhonicsGame';
import PatternGame from '../components/games/PatternGame';
import OddOneOutGame from '../components/games/OddOneOutGame';
import WordScramble from '../components/games/WordScramble';

export default function MiniGame() {
  useSessionHeartbeat();
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
      attempts: 1,
      completedAt: new Date().toISOString(),
    };
    if (gameType === 'matching')  update.matchScore      = score;
    if (gameType === 'tracing')   update.traceScore      = score;
    if (gameType === 'quiz')      update.quizScore       = score;
    if (gameType === 'spelling')  update.spellingScore   = score;
    if (gameType === 'phonics')   update.phonicsScore    = score;
    if (gameType === 'pattern')   update.patternScore    = score;
    if (gameType === 'oddOneOut') update.oddOneOutScore  = score;
    if (gameType === 'scramble')  update.scrambleScore   = score;
    await Promise.all(mod.lessons.map(lesson => recordLesson(lesson.slug, update).catch(() => {})));

    if (gameIdx < games.length - 1) {
      setGameIdx(i => i + 1);
    } else {
      navigate(`/play/${moduleSlug}/done`, { state: { scores: newScores } });
    }
  }

  const game = games[gameIdx];

  return (
    <div>
      <div style={styles.gameHeader}>
        <span style={styles.modEmoji}>{mod.iconEmoji}</span>
        <span style={styles.modTitle}>{mod.title}</span>
        <span style={styles.gameBadge}>
          {game === 'matching' ? '🃏 Match' : 
           game === 'tracing' ? '✏️ Trace' : 
           game === 'spelling' ? '🔤 Spell' : 
           game === 'phonics' ? '🔊 Phonics' : 
           game === 'pattern' ? '🔁 Pattern' : 
           game === 'oddOneOut' ? '❓ Odd One Out' :
           game === 'scramble' ? '🔀 Scramble' :
           '❓ Quiz'}
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
      {game === 'phonics' && (
        <PhonicsGame lessons={mod.lessons} onComplete={handleGameComplete} />
      )}
      {game === 'pattern' && (
        <PatternGame lessons={mod.lessons} onComplete={handleGameComplete} />
      )}
      {game === 'oddOneOut' && (
        <OddOneOutGame lessons={mod.lessons} onComplete={handleGameComplete} />
      )}
      {game === 'scramble' && (
        <WordScramble lessons={mod.lessons} onComplete={handleGameComplete} />
      )}
    </div>
  );
}

const styles = {
  gameHeader: {
    display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px',
    margin: '16px auto', maxWidth: 800,
    background: 'var(--glass-bg)', 
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid var(--glass-border)', borderRadius: 30,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  modEmoji: { fontSize: 32, filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' },
  modTitle: { fontWeight: 900, fontSize: 'var(--font-md)', flex: 1, textShadow: '0 2px 4px rgba(0,0,0,0.5)', color: '#fff' },
  gameBadge: {
    background: 'rgba(255, 255, 255, 0.15)', padding: '6px 16px', borderRadius: 20,
    fontWeight: 800, fontSize: 'var(--font-sm)', color: '#fff',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  gameCounter: { color: 'var(--text-secondary)', fontWeight: 800, fontSize: 'var(--font-sm)', letterSpacing: 1 },
};
