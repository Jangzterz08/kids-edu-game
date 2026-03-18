import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getModule, getDailyChallengeSlug } from '../data/index';
import { useKid } from '../context/KidContext';
import { api } from '../lib/api';
import CelebrationModal from '../components/ui/CelebrationModal';

export default function ModuleComplete() {
  const { moduleSlug } = useParams();
  const { state }      = useLocation();
  const navigate       = useNavigate();
  const { activeKid, refreshKids } = useKid();
  const mod = getModule(moduleSlug);
  const [show, setShow] = useState(false);
  const [dailyBonus, setDailyBonus] = useState(0);

  const scores   = state?.scores || {};
  const scoreVals = Object.values(scores).filter(v => v !== undefined);
  const avgScore  = scoreVals.length ? Math.round(scoreVals.reduce((a,b) => a+b,0) / scoreVals.length) : 50;
  const stars     = avgScore >= 80 ? 3 : avgScore >= 55 ? 2 : 1;
  const coinsEarned = stars * 5;

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 200);
    // Refresh kid to update star/coin count in header
    refreshKids();
    if (activeKid) {
      // Award module achievement
      api.post(`/api/achievements/${activeKid.id}`, {
        type: 'module_complete',
        moduleSlug,
        label: `${mod?.title} Complete!`,
        iconEmoji: mod?.iconEmoji || '🏆',
      }).catch(() => {});

      // Auto-complete daily challenge if this is today's featured module
      const todaySlug = getDailyChallengeSlug();
      if (moduleSlug === todaySlug) {
        api.post(`/api/daily-challenge/${activeKid.id}/complete`, {})
          .then(result => {
            if (result?.success) setDailyBonus(result.coinsEarned || 0);
          })
          .catch(() => {});
      }
    }
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <CelebrationModal
      stars={stars}
      moduleName={mod?.title || moduleSlug}
      coinsEarned={coinsEarned + dailyBonus}
      dailyBonus={dailyBonus}
      onContinue={() => navigate('/play')}
      onReplay={() => navigate(`/play/${moduleSlug}/lesson`)}
    />
  );
}
