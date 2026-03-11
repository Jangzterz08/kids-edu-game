import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getModule } from '../data/index';
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

  const scores   = state?.scores || {};
  const scoreVals = Object.values(scores).filter(v => v !== undefined);
  const avgScore  = scoreVals.length ? Math.round(scoreVals.reduce((a,b) => a+b,0) / scoreVals.length) : 50;
  const stars     = avgScore >= 80 ? 3 : avgScore >= 55 ? 2 : 1;
  const coinsEarned = stars * 5;

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 200);
    // Refresh kid to update star count in header
    refreshKids();
    // Award module achievement
    if (activeKid) {
      api.post(`/api/achievements/${activeKid.id}`, {
        type: 'module_complete',
        moduleSlug,
        label: `${mod?.title} Complete!`,
        iconEmoji: mod?.iconEmoji || '🏆',
      }).catch(() => {});
    }
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <CelebrationModal
      stars={stars}
      moduleName={mod?.title || moduleSlug}
      coinsEarned={coinsEarned}
      onContinue={() => navigate('/play')}
    />
  );
}
