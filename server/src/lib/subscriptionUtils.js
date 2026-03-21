const FREE_MODULE_SLUGS = ['alphabet', 'numbers', 'shapes'];

function isParentPremium(user) {
  if (!user) return false;
  if (user.subscriptionStatus === 'active') return true;
  if (user.subscriptionStatus === 'trialing' && user.trialEndsAt && user.trialEndsAt > new Date()) return true;
  return false;
}

module.exports = { FREE_MODULE_SLUGS, isParentPremium };
