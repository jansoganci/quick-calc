import { describe, expect, it } from 'vitest';
import { GOLDEN, goldenRawInput } from './goldenVector.ts';
import type { DetailedInput, DetailedResolvedInput } from './types.ts';
import { buildUnitEconomics } from './unitEconomics.ts';
import { validateDetailedInput } from './validate.ts';

const MONEY = 4;

function resolve(raw: DetailedInput = goldenRawInput()): DetailedResolvedInput {
  const result = validateDetailedInput(raw);
  if (!result.ok) {
    throw new Error(`fixture must be valid: ${JSON.stringify(result.errors)}`);
  }
  return result.input;
}

function golden() {
  return buildUnitEconomics(resolve(), 1, 1);
}

describe('direct fee rate (spec §9.3)', () => {
  it('blends card and meal card, and never cash', () => {
    expect(golden().directFeeRate).toBeCloseTo(GOLDEN.directFeeRate, 9);
  });

  it('is unaffected by the cash share', () => {
    const raw = goldenRawInput();
    const allCash = resolve({ ...raw, paymentMix: { cash: 1, card: 0, mealCard: 0 } });
    expect(buildUnitEconomics(allCash, 1, 1).directFeeRate).toBe(0);
  });
});

describe('VAT netting per unit (spec §8)', () => {
  it('derives net from VAT-inclusive gross by division', () => {
    const americano = golden().products[0]?.byChannel;
    expect(americano?.salon.grossPerUnit).toBe(150);
    expect(americano?.salon.netPerUnit).toBeCloseTo(150 / 1.1, 9);
    expect(americano?.delivery.grossPerUnit).toBe(200);
    expect(americano?.delivery.netPerUnit).toBeCloseTo(200 / 1.1, 9);
  });

  it('never computes VAT as gross times the rate', () => {
    const salon = golden().products[0]?.byChannel.salon;
    const netIfMultiplied = 150 - 150 * 0.1;
    expect(salon?.netPerUnit).not.toBeCloseTo(netIfMultiplied, 6);
    expect(salon?.netPerUnit).toBeCloseTo(136.363636, 5);
  });
});

describe('channel pricing (DF-46)', () => {
  it('uses the normal price for salon and takeaway, the online price for delivery', () => {
    const tost = golden().products[1]?.byChannel;
    expect(tost?.salon.grossPerUnit).toBe(90);
    expect(tost?.takeaway.grossPerUnit).toBe(90);
    expect(tost?.delivery.grossPerUnit).toBe(120);
  });
});

describe('fee bases (DF-65, DF-49)', () => {
  it('applies the payment-mix fee to gross, not net, on direct sales', () => {
    const salon = golden().products[0]?.byChannel.salon;
    expect(salon?.unitPaymentPlatformFee).toBeCloseTo(150 * GOLDEN.directFeeRate, 9);
    expect(salon?.unitPaymentPlatformFee).not.toBeCloseTo(
      (150 / 1.1) * GOLDEN.directFeeRate,
      6,
    );
  });

  it('applies the platform fee to gross delivery revenue', () => {
    const delivery = golden().products[0]?.byChannel.delivery;
    expect(delivery?.unitPaymentPlatformFee).toBeCloseTo(200 * 0.15, 9);
  });

  it('never applies POS or meal-card commission to delivery', () => {
    const raw = goldenRawInput();
    const noPlatformFee = resolve({
      ...raw,
      delivery: { mode: 'platformOnly', platformFeeRate: 0, ownCourierCostPerDeliveryOrder: 40 },
    });
    const delivery = buildUnitEconomics(noPlatformFee, 1, 1).products[0]?.byChannel.delivery;
    expect(delivery?.unitPaymentPlatformFee).toBe(0);
  });
});

describe('cost separation (DF-50, DF-68)', () => {
  it('keeps product cost identical across channels', () => {
    const americano = golden().products[0]?.byChannel;
    expect(americano?.salon.unitProductCost).toBe(30);
    expect(americano?.takeaway.unitProductCost).toBe(30);
    expect(americano?.delivery.unitProductCost).toBe(30);
  });

  it('never folds packaging or courier cost into product cost', () => {
    const americano = golden().products[0]?.byChannel;
    expect(americano?.salon.unitChannelVariableCost).toBe(0);
    expect(americano?.takeaway.unitChannelVariableCost).toBe(3);
    expect(americano?.delivery.unitChannelVariableCost).toBe(45);
  });
});

describe('delivery modes (DF-81)', () => {
  it('includes own-courier payment under merchant courier', () => {
    const delivery = golden().products[0]?.byChannel.delivery;
    expect(delivery?.unitChannelVariableCost).toBe(5 + 40);
  });

  it('drops own-courier payment under platform courier and changes nothing else', () => {
    const raw = goldenRawInput();
    const mode1 = golden();
    const mode2 = buildUnitEconomics(
      resolve({
        ...raw,
        delivery: {
          mode: 'platformCourier',
          platformFeeRate: 0.38,
          ownCourierCostPerDeliveryOrder: 40,
        },
      }),
      1,
      1,
    );

    expect(mode2.products[0]?.byChannel.delivery.unitChannelVariableCost).toBe(5);
    expect(mode2.products[0]?.byChannel.delivery.unitPaymentPlatformFee).toBeCloseTo(
      200 * 0.38,
      9,
    );
    // Salon and takeaway are untouched by the delivery mode.
    expect(mode2.products[0]?.byChannel.salon).toEqual(mode1.products[0]?.byChannel.salon);
    expect(mode2.products[0]?.byChannel.takeaway).toEqual(mode1.products[0]?.byChannel.takeaway);
  });
});

describe('approved zero packaging (spec §4.5a)', () => {
  it('charges no channel variable cost when packaging is empty and no own courier is used', () => {
    const economics = buildUnitEconomics(
      resolve({
        ...goldenRawInput(),
        packaging: undefined,
        delivery: { mode: 'platformCourier', platformFeeRate: 0.38 },
      }),
      1,
      1,
    );
    const americano = economics.products[0]?.byChannel;
    expect(americano?.takeaway.unitChannelVariableCost).toBe(0);
    expect(americano?.delivery.unitChannelVariableCost).toBe(0);
  });

  it('leaves contribution equal to net revenue less product cost and fee', () => {
    const economics = buildUnitEconomics(
      resolve({
        ...goldenRawInput(),
        packaging: undefined,
        delivery: { mode: 'platformCourier', platformFeeRate: 0.38 },
      }),
      1,
      1,
    );
    const takeaway = economics.products[0]?.byChannel.takeaway;
    expect(takeaway?.unitContribution).toBeCloseTo(
      (takeaway?.netPerUnit ?? 0) -
        (takeaway?.unitProductCost ?? 0) -
        (takeaway?.unitPaymentPlatformFee ?? 0),
      9,
    );
  });

  it('keeps only the own-courier payment when delivery packaging alone is empty', () => {
    const economics = buildUnitEconomics(
      resolve({
        ...goldenRawInput(),
        packaging: { takeawayPerOrder: 3 },
      }),
      1,
      1,
    );
    expect(economics.products[0]?.byChannel.delivery.unitChannelVariableCost).toBe(40);
  });
});

describe('golden per-unit contribution', () => {
  it('matches the specification daily lines divided by their units', () => {
    const economics = golden();
    for (const line of GOLDEN.dailyChannelLines) {
      const entry = economics.products.find((candidate) => candidate.product.name === line.product);
      const channel = entry?.byChannel[line.channel as 'salon' | 'takeaway' | 'delivery'];
      expect(channel?.unitContribution).toBeCloseTo(line.contribution / line.units, MONEY);
      expect(channel?.unitPaymentPlatformFee).toBeCloseTo(line.fee / line.units, MONEY);
      expect(channel?.unitChannelVariableCost).toBeCloseTo(line.channelVariable / line.units, MONEY);
    }
  });
});

describe('escalation factors', () => {
  it('scales prices with the price factor and costs with the COGS factor', () => {
    const scaled = buildUnitEconomics(resolve(), 1.1, 1.2);
    const salon = scaled.products[0]?.byChannel.salon;
    expect(salon?.grossPerUnit).toBeCloseTo(165, 9);
    expect(salon?.unitProductCost).toBeCloseTo(36, 9);
  });

  it('escalates channel variable costs with the COGS factor (DF-83)', () => {
    const scaled = buildUnitEconomics(resolve(), 1, 1.2);
    expect(scaled.products[0]?.byChannel.takeaway.unitChannelVariableCost).toBeCloseTo(3.6, 9);
    expect(scaled.products[0]?.byChannel.delivery.unitChannelVariableCost).toBeCloseTo(54, 9);
  });

  it('leaves commission rates alone while fee amounts follow the gross base', () => {
    const scaled = buildUnitEconomics(resolve(), 1.1, 1);
    expect(scaled.directFeeRate).toBeCloseTo(GOLDEN.directFeeRate, 9);
    expect(scaled.products[0]?.byChannel.delivery.unitPaymentPlatformFee).toBeCloseTo(
      200 * 1.1 * 0.15,
      9,
    );
  });
});

describe('volume-freeness', () => {
  it('produces identical economics when only daily quantities change', () => {
    const raw = goldenRawInput();
    const busier = {
      ...raw,
      products: (raw.products as Record<string, unknown>[]).map((product) => ({
        ...product,
        dailyQuantity: 9_999,
      })),
    };

    // `product` is carried for pairing, so compare the computed half only.
    const computed = (input: DetailedResolvedInput) => {
      const economics = buildUnitEconomics(input, 1, 1);
      return {
        directFeeRate: economics.directFeeRate,
        byChannel: economics.products.map((entry) => entry.byChannel),
      };
    };

    expect(computed(resolve(busier))).toEqual(computed(resolve(raw)));
  });

  it('is unaffected by operating days or the channel mix', () => {
    const raw = goldenRawInput();
    const altered = resolve({
      ...raw,
      channelMix: { salon: 1, takeaway: 0, delivery: 0 },
      assumptions: { ...(raw.assumptions as object), operatingDaysPerMonth: 26 },
    });
    expect(buildUnitEconomics(altered, 1, 1).products[0]?.byChannel).toEqual(
      golden().products[0]?.byChannel,
    );
  });
});
