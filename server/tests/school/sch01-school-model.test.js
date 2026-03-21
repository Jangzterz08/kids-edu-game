import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setTestEnv } from '../helpers/setup.js';

setTestEnv();
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.SUPABASE_URL = '';
process.env.SUPABASE_SERVICE_KEY = '';

const { default: app } = await import('../../src/index.js');
const { isSchoolLicensed, getKidSchoolLicense } = await import('../../src/lib/schoolUtils.js');
const prisma = global.prisma;

describe('SCH-01: School model and schoolUtils', () => {
  describe('isSchoolLicensed', () => {
    it('returns false for null school', () => {
      expect(isSchoolLicensed(null)).toBe(false);
    });

    it('returns false for licenseStatus "none"', () => {
      expect(isSchoolLicensed({ licenseStatus: 'none', licenseExpiry: null })).toBe(false);
    });

    it('returns false for licenseStatus "expired"', () => {
      expect(isSchoolLicensed({ licenseStatus: 'expired', licenseExpiry: null })).toBe(false);
    });

    it('returns true for active license with no expiry', () => {
      expect(isSchoolLicensed({ licenseStatus: 'active', licenseExpiry: null })).toBe(true);
    });

    it('returns true for active license with future expiry', () => {
      const future = new Date(Date.now() + 86400000);
      expect(isSchoolLicensed({ licenseStatus: 'active', licenseExpiry: future })).toBe(true);
    });

    it('returns false for active license with past expiry (webhook missed)', () => {
      const past = new Date(Date.now() - 86400000);
      expect(isSchoolLicensed({ licenseStatus: 'active', licenseExpiry: past })).toBe(false);
    });
  });

  describe('getKidSchoolLicense', () => {
    let classroomStudentFindFirst;

    beforeEach(() => {
      classroomStudentFindFirst = vi.spyOn(prisma.classroomStudent, 'findFirst');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns null when kid has no classroom enrollments', async () => {
      classroomStudentFindFirst.mockResolvedValue(null);
      const result = await getKidSchoolLicense('kid-1');
      expect(result).toBeNull();
    });

    it('returns null when teacher has no school membership', async () => {
      classroomStudentFindFirst.mockResolvedValue({
        classroom: { teacher: { schoolMembership: null } },
      });
      const result = await getKidSchoolLicense('kid-1');
      expect(result).toBeNull();
    });

    it('returns null when school license is not active', async () => {
      classroomStudentFindFirst.mockResolvedValue({
        classroom: {
          teacher: {
            schoolMembership: {
              school: { id: 'school-1', licenseStatus: 'expired', licenseExpiry: null },
            },
          },
        },
      });
      const result = await getKidSchoolLicense('kid-1');
      expect(result).toBeNull();
    });

    it('returns school when license is active', async () => {
      const school = { id: 'school-1', licenseStatus: 'active', licenseExpiry: null };
      classroomStudentFindFirst.mockResolvedValue({
        classroom: {
          teacher: { schoolMembership: { school } },
        },
      });
      const result = await getKidSchoolLicense('kid-1');
      expect(result).toEqual(school);
    });
  });
});
