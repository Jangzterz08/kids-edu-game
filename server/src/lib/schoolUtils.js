const prisma = require('./db');

/**
 * Check if a school has an active, non-expired license.
 * Checks BOTH licenseStatus AND licenseExpiry date for defense-in-depth
 * (protects against missed webhook).
 */
function isSchoolLicensed(school) {
  if (!school) return false;
  if (school.licenseStatus !== 'active') return false;
  if (school.licenseExpiry && school.licenseExpiry < new Date()) return false;
  return true;
}

/**
 * Walk the chain: kid -> classroomStudent -> classroom -> teacher -> schoolMembership -> school.
 * Returns the School record if the kid is enrolled in any classroom owned by a teacher
 * in a licensed school. Returns null otherwise.
 * Single query with deep include — avoids N+1 sequential lookups.
 */
async function getKidSchoolLicense(kidId) {
  const enrollment = await prisma.classroomStudent.findFirst({
    where: { kidId },
    include: {
      classroom: {
        include: {
          teacher: {
            include: {
              schoolMembership: {
                include: { school: true },
              },
            },
          },
        },
      },
    },
  });
  if (!enrollment) return null;
  const school = enrollment.classroom?.teacher?.schoolMembership?.school;
  return isSchoolLicensed(school) ? school : null;
}

module.exports = { isSchoolLicensed, getKidSchoolLicense };
