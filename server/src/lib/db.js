const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

function createClient() {
  const rawUrl = process.env.DATABASE_URL;
  const url = new URL(rawUrl);
  const schema = url.searchParams.get('schema') || 'public';
  url.searchParams.delete('schema');

  const adapter = new PrismaPg({ connectionString: url.toString() }, { schema });
  return new PrismaClient({ adapter });
}

if (process.env.NODE_ENV === 'production') {
  module.exports = createClient();
} else {
  if (!global.prisma) {
    global.prisma = createClient();
  }
  module.exports = global.prisma;
}
