const prisma = require('../src/lib/db');

async function run() {
  console.log('--- Retroactive Coins Fix ---');
  
  // Find kids who have stars but 0 coins (the main symptom of the bug)
  const affectedKids = await prisma.kidProfile.findMany({
    where: {
      totalStars: { gt: 0 },
      coins: 0
    }
  });

  if (affectedKids.length === 0) {
    console.log('No kids found needing retroactive coins!');
  } else {
    console.log(`Found ${affectedKids.length} kid(s) needing coin refunds...`);
    
    for (const kid of affectedKids) {
      // 5 coins per star earned
      const coinsOwed = kid.totalStars * 5;
      
      await prisma.kidProfile.update({
        where: { id: kid.id },
        data: { coins: coinsOwed }
      });
      console.log(`- Refunded ${kid.name}: Added ${coinsOwed} coins (for ${kid.totalStars} stars)`);
    }
    console.log('Successfully refunded all affected kid profiles!');
  }

  await prisma.$disconnect();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
