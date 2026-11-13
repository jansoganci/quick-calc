import { describe, expect, it } from 'vitest';
import { salonRestorePrice } from './recipeCost.ts';
import { channelRestorePrice, esnafPrice } from './priceSuggestion.ts';

describe('Appendix D channel restore and esnaf rounding', () => {
  it('matches the locked salon helper when the fee is 0', () => {
    expect(channelRestorePrice(220, 8.4, 0.1, 0)).toBeCloseTo(
      salonRestorePrice(220, 8.4, 0.1),
      10,
    );
    expect(channelRestorePrice(160, 7, 0.1, 0)).toBeCloseTo(
      salonRestorePrice(160, 7, 0.1),
      10,
    );
  });

  it('restores Hamburger online remaining at default platform 15% and KDV 10%', () => {
    // 230 + 8,40 / (1/1,10 − 0,15) = 241,0658…
    const restore = channelRestorePrice(230, 8.4, 0.1, 0.15);
    expect(restore).toBeCloseTo(230 + 8.4 / (1 / 1.1 - 0.15), 10);
    expect(esnafPrice(restore ?? NaN)).toBe(242);
  });

  it('restores Köfte ekmek online remaining on the same rates', () => {
    const restore = channelRestorePrice(180, 7, 0.1, 0.15);
    expect(restore).toBeCloseTo(180 + 7 / (1 / 1.1 - 0.15), 10);
    expect(esnafPrice(restore ?? NaN)).toBe(190);
  });

  it('rounds the salon restore up to a whole lira (O6 example 229,24 → 230)', () => {
    expect(esnafPrice(salonRestorePrice(220, 8.4, 0.1))).toBe(230);
    expect(esnafPrice(salonRestorePrice(160, 7, 0.1))).toBe(168);
  });

  it('keeps an already whole lira', () => {
    expect(esnafPrice(230)).toBe(230);
    expect(esnafPrice(230.0000000004)).toBe(230);
  });

  it('is unavailable when the extra lira cannot restore remaining', () => {
    expect(channelRestorePrice(230, 8.4, 0.1, 1 / 1.1)).toBeNull();
    expect(channelRestorePrice(230, 8.4, 0.1, 0.95)).toBeNull();
  });

  it('never returns NaN or Infinity', () => {
    const cases: Array<Parameters<typeof channelRestorePrice>> = [
      [230, 8.4, 0.1, 0.15],
      [230, 8.4, 0.1, 0],
      [0, 0, 0, 0],
      [Number.NaN, 8.4, 0.1, 0.15],
      [230, Number.POSITIVE_INFINITY, 0.1, 0.15],
      [230, 8.4, -0.1, 0.15],
      [230, 8.4, 0.1, -0.01],
    ];
    for (const args of cases) {
      const value = channelRestorePrice(...args);
      if (value !== null) {
        expect(Number.isFinite(value)).toBe(true);
      }
    }
    expect(esnafPrice(Number.NaN)).toBeNull();
    expect(esnafPrice(Number.NEGATIVE_INFINITY)).toBeNull();
    expect(esnafPrice(-1)).toBeNull();
  });
});
