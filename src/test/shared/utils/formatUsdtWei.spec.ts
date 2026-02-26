import { formatUsdtWei } from "../../../shared/utils/formatUsdtWei";

describe('formatUsdtWei', () => {
  describe('examples', () => {
    test('1797315000 -> 1,797.31', () => {
      expect(formatUsdtWei(BigInt(1797315000))).toBe('1,797.31');
    });

    test('1797305000 -> 1,797.3', () => {
      expect(formatUsdtWei(BigInt(1797305000))).toBe('1,797.3');
    });

    test('1797005000 -> 1,797', () => {
      expect(formatUsdtWei(BigInt(1797005000))).toBe('1,797');
    });

    test('0.049', () => {
      expect(formatUsdtWei(BigInt(49000))).toBe('0.04');
    });
  });

  describe('Millions', () => {
    test('1,000,002 USDT', () => {
      expect(formatUsdtWei(BigInt(1000002000000))).toBe('1,000,002');
    });

    test('1,000,002.3 USDT', () => {
      expect(formatUsdtWei(BigInt(1000002300000))).toBe('1,000,002.3');
    });

    test('1,000,002.31 USDT', () => {
      expect(formatUsdtWei(BigInt(1000002310000))).toBe('1,000,002.31');
    });

    test('1,234,567.89 USDT', () => {
      expect(formatUsdtWei(BigInt(1234567890000))).toBe('1,234,567.89');
    });

    test('10,000,000 USDT', () => {
      expect(formatUsdtWei(BigInt(10000000000000))).toBe('10,000,000');
    });

    test('100,000,000.55 USDT', () => {
      expect(formatUsdtWei(BigInt(100000000550000))).toBe('100,000,000.55');
    });

    test('999,999,999.99 USDT', () => {
      expect(formatUsdtWei(BigInt(999999999990000))).toBe('999,999,999.99');
    });

    test('1,000,000,000 USDT', () => {
      expect(formatUsdtWei(BigInt(1000000000000000))).toBe('1,000,000,000');
    });

    test('1,234,567,890.12 USDT', () => {
      expect(formatUsdtWei(BigInt(1234567890120000))).toBe('1,234,567,890.12');
    });
  });

  describe('Round numbers', () => {
    test('1 USDT', () => {
      expect(formatUsdtWei(BigInt(1000000))).toBe('1');
    });

    test('5 USDT', () => {
      expect(formatUsdtWei(BigInt(5000000))).toBe('5');
    });

    test('1000 USDT', () => {
      expect(formatUsdtWei(BigInt(1000000000))).toBe('1,000');
    });

    test('1234567 USDT', () => {
      expect(formatUsdtWei(BigInt(1234567000000))).toBe('1,234,567');
    });
  });

  describe('Decimal numbers', () => {
    test('1.5 USDT', () => {
      expect(formatUsdtWei(BigInt(1500000))).toBe('1.5');
    });

    test('1.55 USDT', () => {
      expect(formatUsdtWei(BigInt(1550000))).toBe('1.55');
    });

    test('1.23 USDT', () => {
      expect(formatUsdtWei(BigInt(1230000))).toBe('1.23');
    });

    test('1.1 USDT', () => {
      expect(formatUsdtWei(BigInt(1100000))).toBe('1.1');
    });
  });


  describe('Zero values', () => {
    test('0 USDT', () => {
      expect(formatUsdtWei(BigInt(0))).toBe('0');
    });

    test('0.000001 -> 0', () => {
      expect(formatUsdtWei(BigInt(1))).toBe('0');
    });

    test('Very big number', () => {
      const huge = BigInt('9223372036854775807');
      expect(() => formatUsdtWei(huge)).not.toThrow();
    });
  });
});