import { formatZoneWei3 } from "../../../shared/utils/formatZoneWei";

describe('formatZoneWei3', () => {
  describe('Big numbers', () => {
    test('1', () => {
      expect(formatZoneWei3(BigInt('1000000000000000000'))).toBe('1');
    });

    test('1.5', () => {
      expect(formatZoneWei3(BigInt('1500000000000000000'))).toBe('1.5');
    });

    test('1.55', () => {
      expect(formatZoneWei3(BigInt('1550000000000000000'))).toBe('1.5');
    });

    test('1000', () => {
      expect(formatZoneWei3(BigInt('1000000000000000000000'))).toBe('1000');
    });

    test('1,000,002', () => {
      expect(formatZoneWei3(BigInt('1000002000000000000000000'))).toBe('1000002');
    });

    test('1,000,002.3', () => {
      expect(formatZoneWei3(BigInt('1000002300000000000000000'))).toBe('1000002.3');
    });

    test('1,000,002.31', () => {
        expect(formatZoneWei3(BigInt('1000002310000000000000000'))).toBe('1000002.3');
    });

    test('1,234,567.89', () => {
      expect(formatZoneWei3(BigInt('1234567890000000000000000'))).toBe('1234567.8');
    });
  });

  describe('Small numbers', () => {
    test('0.000001 (1 wei)', () => {
      expect(formatZoneWei3(BigInt(1))).toBe('0');
    });

    test('0.000001 (1000000000000 wei)', () => {
      expect(formatZoneWei3(BigInt('1000000000000'))).toBe('0');
    });

    test('0.049', () => {
      expect(formatZoneWei3(BigInt('49000000000000000'))).toBe('0');
    });

    test('0.1', () => {
      expect(formatZoneWei3(BigInt('100000000000000000'))).toBe('0.1');
    });

    test('0.99', () => {
      expect(formatZoneWei3(BigInt('990000000000000000'))).toBe('0.9');
    });

    test('0.999', () => {
      expect(formatZoneWei3(BigInt('999000000000000000'))).toBe('0.9');
    });
  });

  describe('boundary case', () => {
    test('0', () => {
      expect(formatZoneWei3(BigInt(0))).toBe('0');
    });

    test('max number', () => {
      const max = BigInt('999999999999999999999999999999999999');
      expect(() => formatZoneWei3(max)).not.toThrow();
    });

    test('0.000000000000000001 (1 wei)', () => {
      expect(formatZoneWei3(BigInt(1))).toBe('0');
    });

    test('0.000000000000000499', () => {
      expect(formatZoneWei3(BigInt(499))).toBe('0');
    });

    test('0.000000000000000500', () => {
      expect(formatZoneWei3(BigInt(500))).toBe('0');
    });

    test('0.000000000000000999', () => {
      expect(formatZoneWei3(BigInt(999))).toBe('0');
    });

    test('0.000000000000001000', () => {
      expect(formatZoneWei3(BigInt(1000))).toBe('0');
    });
  });
});