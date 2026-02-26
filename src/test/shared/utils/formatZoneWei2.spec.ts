import { formatZoneWei2 } from "../../../shared/utils/formatZoneWei";

describe('formatZoneWei2', () => {
  describe('Big numbers', () => {
    test('1', () => {
      expect(formatZoneWei2(BigInt('1000000000000000000'))).toBe('1');
    });

    test('1.5', () => {
      expect(formatZoneWei2(BigInt('1500000000000000000'))).toBe('1');
    });

    test('1.55', () => {
      expect(formatZoneWei2(BigInt('1550000000000000000'))).toBe('1');
    });

    test('1000', () => {
      expect(formatZoneWei2(BigInt('1000000000000000000000'))).toBe('1,000');
    });

    test('1,000,002', () => {
      expect(formatZoneWei2(BigInt('1000002000000000000000000'))).toBe('1,000,002');
    });

    test('1,000,002.3', () => {
      expect(formatZoneWei2(BigInt('1000002300000000000000000'))).toBe('1,000,002');
    });

    test('1,000,002.31', () => {
      expect(formatZoneWei2(BigInt('1000002310000000000000000'))).toBe('1,000,002');
    });

    test('1,234,567.89', () => {
      expect(formatZoneWei2(BigInt('1234567890000000000000000'))).toBe('1,234,567');
    });

    test('10,000,000', () => {
      expect(formatZoneWei2(BigInt('10000000000000000000000000'))).toBe('10,000,000');
    });

    test('100,000,000.55', () => {
      expect(formatZoneWei2(BigInt('100000000550000000000000000'))).toBe('100,000,000');
    });

    test('999,999,999.99', () => {
      expect(formatZoneWei2(BigInt('999999999990000000000000000'))).toBe('999,999,999');
    });

    test('1,000,000,000', () => {
      expect(formatZoneWei2(BigInt('1000000000000000000000000000'))).toBe('1,000,000,000');
    });

    test('1,234,567,890.12', () => {
      expect(formatZoneWei2(BigInt('1234567890120000000000000000'))).toBe('1,234,567,890');
    });
  });

  describe('Small numbers', () => {
    test('0.000001 (1 wei)', () => {
      expect(formatZoneWei2(BigInt(1))).toBe('0');
    });

    test('0.000001 (1000000000000 wei)', () => {
      expect(formatZoneWei2(BigInt('1000000000000'))).toBe('0');
    });

    test('0.049', () => {
      expect(formatZoneWei2(BigInt('49000000000000000'))).toBe('0');
    });

    test('0.1', () => {
      expect(formatZoneWei2(BigInt('100000000000000000'))).toBe('0');
    });

    test('0.99', () => {
      expect(formatZoneWei2(BigInt('990000000000000000'))).toBe('0');
    });

    test('0.999', () => {
      expect(formatZoneWei2(BigInt('999000000000000000'))).toBe('0');
    });
  });

  describe('boundary case', () => {
    test('0', () => {
      expect(formatZoneWei2(BigInt(0))).toBe('0');
    });

    test('max number', () => {
      const max = BigInt('999999999999999999999999999999999999');
      expect(() => formatZoneWei2(max)).not.toThrow();
    });

    test('0.000000000000000001 (1 wei)', () => {
      expect(formatZoneWei2(BigInt(1))).toBe('0');
    });

    test('0.000000000000000499', () => {
      expect(formatZoneWei2(BigInt(499))).toBe('0');
    });

    test('0.000000000000000500', () => {
      expect(formatZoneWei2(BigInt(500))).toBe('0');
    });

    test('0.000000000000000999', () => {
      expect(formatZoneWei2(BigInt(999))).toBe('0');
    });

    test('0.000000000000001000', () => {
      expect(formatZoneWei2(BigInt(1000))).toBe('0');
    });
  });
});