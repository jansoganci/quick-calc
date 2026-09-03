import { NumberField } from '../../../components/NumberField.tsx'
import { cn } from '../../../lib/cn.ts'
import type { DetailedCalcApi } from '../hooks/useDetailedCalc.ts'
import {
  CAPEX_STARTERS,
  CHANNEL_LABELS,
  DELIVERY_MODE_ORDER,
  HORIZON_ORDER,
  RAMP_UP_ORDER,
  RENT_BASIS_ORDER,
  SCENARIO_ORDER,
  COPY,
  DELIVERY_MODE_LABELS,
  OPEX_STARTERS,
  PAYMENT_LABELS,
  RAMP_UP_LABELS,
  RENT_BASIS_LABELS,
  SCENARIO_LABELS,
  SECTION_LABELS,
  type SectionId,
} from '../labels.ts'
import { sectionSummary, typedDailyUnits, visibleSections } from '../sectionSummary.ts'
import { echoLabel } from '../viewModel.ts'
import { formatCount } from '../../../lib/number.ts'
import { LineRows } from './LineRows.tsx'
import { MixTable } from './MixTable.tsx'
import { PositionRows } from './PositionRows.tsx'
import { ProductRows } from './ProductRows.tsx'
import { SectionFrame } from './SectionFrame.tsx'

export function DetailedForm({ calc }: { calc: DetailedCalcApi }) {
  const { form, view } = calc
  const sections = visibleSections(form)

  const guardrailsFor = (section: SectionId) =>
    (view?.guardrails ?? []).filter((guardrail) => guardrail.section === section)

  const frameProps = (section: SectionId) => {
    const index = sections.indexOf(section)
    return {
      section,
      index: index + 1,
      echoLabel: echoLabel(section),
      echoValue: view?.sectionEcho[section] ?? null,
      summary: sectionSummary(form, section),
      isOpen: calc.openSection === section,
      onToggle: () => calc.toggleSection(section),
      nextSection: sections[index + 1] ?? null,
      onGoToNext: () => calc.setOpenSection(sections[index + 1] ?? null),
    }
  }

  return (
    <div className="px-[18px] py-5 lg:px-[30px] lg:py-[26px] lg:pb-[34px]">
      <SectionFrame {...frameProps('products')}>
        <ProductRows
          products={form.products}
          dailyUnits={formatCount(typedDailyUnits(form))}
          errorFor={calc.errorFor}
          onBlur={calc.markTouched}
          onChange={calc.setProductField}
          onAdd={calc.addProduct}
          onRemove={calc.removeProduct}
        />
      </SectionFrame>

      <SectionFrame {...frameProps('channels')}>
        <MixTable
          firstColumnLabel={COPY.channelColumn}
          extraColumnLabel={COPY.packagingPerOrder}
          total={sectionSummary(form, 'channels')}
          totalError={calc.errorFor('channelMix')}
          errorFor={calc.errorFor}
          onBlur={calc.markTouched}
          rows={[
            {
              key: 'salon',
              label: CHANNEL_LABELS.salon,
              sharePath: 'channelMix.salon',
              shareValue: form.channelMix.salon,
              onShareChange: (value) => calc.setChannelShare('salon', value),
              extra: null,
            },
            {
              key: 'takeaway',
              label: CHANNEL_LABELS.takeaway,
              sharePath: 'channelMix.takeaway',
              shareValue: form.channelMix.takeaway,
              onShareChange: (value) => calc.setChannelShare('takeaway', value),
              extra: {
                path: 'packaging.takeawayPerOrder',
                value: form.packaging.takeawayPerOrder,
                unit: 'TL',
                label: `${CHANNEL_LABELS.takeaway} — ${COPY.packagingPerOrder}`,
                onChange: (value) => calc.setPackaging('takeawayPerOrder', value),
              },
            },
            {
              key: 'delivery',
              label: CHANNEL_LABELS.delivery,
              sharePath: 'channelMix.delivery',
              shareValue: form.channelMix.delivery,
              onShareChange: (value) => calc.setChannelShare('delivery', value),
              extra: {
                path: 'packaging.deliveryPerOrder',
                value: form.packaging.deliveryPerOrder,
                unit: 'TL',
                label: `${CHANNEL_LABELS.delivery} — ${COPY.packagingPerOrder}`,
                onChange: (value) => calc.setPackaging('deliveryPerOrder', value),
              },
            },
          ]}
        />
      </SectionFrame>

      <SectionFrame {...frameProps('payments')}>
        <MixTable
          firstColumnLabel={COPY.paymentColumn}
          extraColumnLabel={COPY.commission}
          total={sectionSummary(form, 'payments')}
          totalError={calc.errorFor('paymentMix')}
          errorFor={calc.errorFor}
          onBlur={calc.markTouched}
          rows={[
            {
              key: 'cash',
              label: PAYMENT_LABELS.cash,
              sharePath: 'paymentMix.cash',
              shareValue: form.paymentMix.cash,
              onShareChange: (value) => calc.setPaymentShare('cash', value),
              extra: null,
            },
            {
              key: 'card',
              label: PAYMENT_LABELS.card,
              sharePath: 'paymentMix.card',
              shareValue: form.paymentMix.card,
              onShareChange: (value) => calc.setPaymentShare('card', value),
              extra: {
                path: 'posCommissionRate',
                value: form.posCommissionRate,
                unit: '%',
                label: COPY.posCommission,
                onChange: calc.setPosCommissionRate,
              },
            },
            {
              key: 'mealCard',
              label: PAYMENT_LABELS.mealCard,
              sharePath: 'paymentMix.mealCard',
              shareValue: form.paymentMix.mealCard,
              onShareChange: (value) => calc.setPaymentShare('mealCard', value),
              extra: {
                path: 'mealCardCommissionRate',
                value: form.mealCardCommissionRate,
                unit: '%',
                label: COPY.mealCardCommission,
                onChange: calc.setMealCardCommissionRate,
              },
            },
          ]}
        />
      </SectionFrame>

      {sections.includes('delivery') ? (
        <SectionFrame {...frameProps('delivery')}>
          <div className="max-w-[600px]">
            <span className="qc-field-label">{COPY.deliveryModeQuestion}</span>
            <div
              className={cn('qc-segment', calc.errorFor('delivery.mode') && 'border-qc-error')}
              role="group"
              aria-label={COPY.deliveryModeQuestion}
            >
              {DELIVERY_MODE_ORDER.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className="qc-segment-btn"
                  aria-pressed={form.delivery.mode === mode}
                  onClick={() => {
                    calc.setDeliveryMode(mode)
                    calc.markTouched('delivery.mode')
                  }}
                >
                  {DELIVERY_MODE_LABELS[mode]}
                </button>
              ))}
            </div>
            {calc.errorFor('delivery.mode') ? (
              <p className="qc-error mt-1.5" role="alert">
                {calc.errorFor('delivery.mode')}
              </p>
            ) : (
              <p className="qc-hint mt-1.5">{COPY.deliveryModeHint}</p>
            )}
          </div>

          <div className="mt-[18px] grid max-w-[600px] grid-cols-1 gap-x-[13px] gap-y-[15px] lg:grid-cols-2">
            <NumberField
              id="delivery.platformFeeRate"
              label={COPY.platformFeeRate}
              value={form.delivery.platformFeeRate}
              onChange={(value) => calc.setDeliveryField('platformFeeRate', value)}
              onBlur={() => calc.markTouched('delivery.platformFeeRate')}
              unit="%"
              error={calc.errorFor('delivery.platformFeeRate')}
              hint={COPY.platformFeeHint}
            />
            <NumberField
              id="delivery.ownCourierCostPerDeliveryOrder"
              label={COPY.ownCourierCost}
              value={form.delivery.ownCourierCostPerDeliveryOrder}
              onChange={(value) => calc.setDeliveryField('ownCourierCostPerDeliveryOrder', value)}
              onBlur={() => calc.markTouched('delivery.ownCourierCostPerDeliveryOrder')}
              unit="TL"
              error={calc.errorFor('delivery.ownCourierCostPerDeliveryOrder')}
              hint={
                form.delivery.mode === 'platformCourier'
                  ? COPY.ownCourierDisabledHint
                  : COPY.ownCourierHint
              }
              grouped
            />
          </div>
        </SectionFrame>
      ) : null}

      <SectionFrame {...frameProps('positions')}>
        <PositionRows
          positions={form.positions}
          guardrailFor={(positionId) =>
            guardrailsFor('positions').find(
              (guardrail) => guardrail.id === `employer-cost-${positionId}`,
            )?.message ?? null
          }
          errorFor={calc.errorFor}
          onBlur={calc.markTouched}
          onChange={calc.setPositionField}
          onAdd={calc.addPosition}
          onRemove={calc.removePosition}
        />
        {guardrailsFor('positions')
          .filter((guardrail) => guardrail.id === 'owner-not-an-employee')
          .map((guardrail) => (
            <p
              key={guardrail.id}
              className="mt-3.5 max-w-[600px] text-xs leading-relaxed text-qc-muted"
            >
              {guardrail.message}
            </p>
          ))}
      </SectionFrame>

      <SectionFrame {...frameProps('owner')}>
        <div className="grid max-w-[600px] grid-cols-1 gap-x-[13px] gap-y-[15px] lg:grid-cols-2">
          <NumberField
            id="owner.monthlyAmount"
            label={COPY.ownerMonthlyAmount}
            value={form.owner.monthlyAmount}
            onChange={(value) => calc.setOwnerField('monthlyAmount', value)}
            onBlur={() => calc.markTouched('owner.monthlyAmount')}
            unit="TL"
            error={calc.errorFor('owner.monthlyAmount')}
            grouped
          />
          <NumberField
            id="owner.bagKurMonthlyCost"
            label={COPY.ownerBagKur}
            value={form.owner.bagKurMonthlyCost}
            onChange={(value) => calc.setOwnerField('bagKurMonthlyCost', value)}
            onBlur={() => calc.markTouched('owner.bagKurMonthlyCost')}
            unit="TL"
            error={calc.errorFor('owner.bagKurMonthlyCost')}
            grouped
          />
        </div>
      </SectionFrame>

      <SectionFrame {...frameProps('occupancy')}>
        <div className="grid max-w-[600px] grid-cols-1 gap-x-[13px] gap-y-[15px] lg:grid-cols-2">
          <div>
            <NumberField
              id="occupancy.monthlyRent"
              label={COPY.monthlyRent}
              value={form.occupancy.monthlyRent}
              onChange={(value) => calc.setOccupancyField('monthlyRent', value)}
              onBlur={() => calc.markTouched('occupancy.monthlyRent')}
              unit="TL"
              error={calc.errorFor('occupancy.monthlyRent')}
              grouped
            />
            <div className="qc-segment" role="group" aria-label={COPY.rentBasisGroup}>
              {RENT_BASIS_ORDER.map((basis) => (
                <button
                  key={basis}
                  type="button"
                  className="qc-segment-btn"
                  aria-pressed={form.occupancy.rentInputBasis === basis}
                  onClick={() => calc.setRentInputBasis(basis)}
                >
                  {RENT_BASIS_LABELS[basis]}
                </button>
              ))}
            </div>
          </div>
          <NumberField
            id="occupancy.monthlyAidat"
            label={COPY.monthlyAidat}
            value={form.occupancy.monthlyAidat}
            onChange={(value) => calc.setOccupancyField('monthlyAidat', value)}
            onBlur={() => calc.markTouched('occupancy.monthlyAidat')}
            unit="TL"
            error={calc.errorFor('occupancy.monthlyAidat')}
            hint={COPY.aidatOnceHint}
            grouped
          />
        </div>
      </SectionFrame>

      <SectionFrame {...frameProps('opex')}>
        <LineRows
          lines={form.opexLines}
          pathPrefix="opexLines"
          amountField="monthlyAmount"
          nameLabel={COPY.lineName}
          amountLabel={COPY.monthlyAmount}
          addLabel={COPY.addOpex}
          starterLabel={COPY.starterOpex}
          starters={OPEX_STARTERS}
          errorFor={calc.errorFor}
          onBlur={calc.markTouched}
          onChange={(index, field, value) => calc.setLineField('opexLines', index, field, value)}
          onAdd={(name) => calc.addLine('opexLines', name)}
          onRemove={(index) => calc.removeLine('opexLines', index)}
        />
        {guardrailsFor('opex').map((guardrail) => (
          <p
            key={guardrail.id}
            className="mt-3.5 max-w-[600px] text-xs leading-relaxed text-qc-muted"
          >
            {guardrail.message}
          </p>
        ))}
      </SectionFrame>

      <SectionFrame {...frameProps('capex')}>
        <LineRows
          lines={form.capexItems}
          pathPrefix="capexItems"
          amountField="amount"
          nameLabel={COPY.capexName}
          amountLabel={COPY.capexAmount}
          addLabel={COPY.addCapex}
          starterLabel={COPY.starterCapex}
          starters={CAPEX_STARTERS}
          errorFor={calc.errorFor}
          onBlur={calc.markTouched}
          onChange={(index, field, value) => calc.setLineField('capexItems', index, field, value)}
          onAdd={(name) => calc.addLine('capexItems', name)}
          onRemove={(index) => calc.removeLine('capexItems', index)}
        />
      </SectionFrame>

      <SectionFrame {...frameProps('assumptions')}>
        <div className="grid max-w-[600px] grid-cols-1 gap-x-[13px] gap-y-[15px] lg:grid-cols-2">
          <NumberField
            id="assumptions.vatRate"
            label={COPY.vatRate}
            value={form.assumptions.vatRate}
            onChange={(value) => calc.setAssumption('vatRate', value)}
            onBlur={() => calc.markTouched('assumptions.vatRate')}
            unit="%"
            error={calc.errorFor('assumptions.vatRate')}
          />
          <NumberField
            id="assumptions.operatingDaysPerMonth"
            label={COPY.operatingDays}
            value={form.assumptions.operatingDaysPerMonth}
            onChange={(value) => calc.setAssumption('operatingDaysPerMonth', value)}
            onBlur={() => calc.markTouched('assumptions.operatingDaysPerMonth')}
            unit="gün"
            error={calc.errorFor('assumptions.operatingDaysPerMonth')}
          />
        </div>

        <div className="mt-[18px] grid max-w-[600px] grid-cols-1 gap-x-[13px] gap-y-[18px] lg:grid-cols-2">
          <div>
            <span className="qc-field-label">{COPY.projectionHorizon}</span>
            <div className="qc-segment" role="group" aria-label={COPY.projectionHorizon}>
              {HORIZON_ORDER.map((months) => (
                <button
                  key={months}
                  type="button"
                  className="qc-segment-btn"
                  aria-pressed={form.assumptions.projectionHorizonMonths === months}
                  onClick={() => calc.setHorizon(months)}
                >
                  {months} ay
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="qc-field-label">{COPY.rampUp}</span>
            <div className="qc-segment" role="group" aria-label={COPY.rampUp}>
              {RAMP_UP_ORDER.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="qc-segment-btn"
                  aria-pressed={form.assumptions.rampUpPreset === preset}
                  onClick={() => calc.setRampUp(preset)}
                >
                  {RAMP_UP_LABELS[preset]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-[22px] max-w-[600px]">
          <span className="qc-field-label">{COPY.scenarioVolumes}</span>
          <p className="qc-hint mb-2 mt-1">{COPY.scenarioVolumesHint}</p>
          <div className="grid grid-cols-3 gap-[13px]">
            {SCENARIO_ORDER.map((scenario) => (
              <div key={scenario} className="flex flex-col gap-[5px]">
                <span
                  className={cn(
                    'text-[11px] font-semibold uppercase tracking-[0.08em]',
                    scenario === 'base' ? 'text-qc-ink' : 'text-qc-muted',
                  )}
                >
                  {SCENARIO_LABELS[scenario]}
                </span>
                <NumberField
                  id={`assumptions.scenarioVolumeDeltas.${scenario}`}
                  label={`${SECTION_LABELS.assumptions} — ${SCENARIO_LABELS[scenario]}`}
                  labelHidden
                  value={form.assumptions.scenarioVolumeDeltas[scenario]}
                  onChange={(value) => calc.setScenarioDelta(scenario, value)}
                  onBlur={() =>
                    calc.markTouched(`assumptions.scenarioVolumeDeltas.${scenario}`)
                  }
                  unit="%"
                  error={calc.errorFor(`assumptions.scenarioVolumeDeltas.${scenario}`)}
                />
              </div>
            ))}
          </div>
        </div>

        <details className="mt-6 max-w-[600px] border-t border-qc-rule-row pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13px] text-qc-secondary">
            <span>{COPY.advancedAssumptions}</span>
            <span className="font-mono text-[13px] tabular-nums text-qc-muted">
              {`%${form.assumptions.salesPriceAnnualIncrease} · %${form.assumptions.productCogsAnnualIncrease} · %${form.assumptions.fixedCostAnnualIncrease}`}
            </span>
          </summary>
          <div className="mt-4 grid grid-cols-1 gap-x-[13px] gap-y-[15px] lg:grid-cols-3">
            <NumberField
              id="assumptions.salesPriceAnnualIncrease"
              label={COPY.salesPriceAnnualIncrease}
              value={form.assumptions.salesPriceAnnualIncrease}
              onChange={(value) => calc.setAssumption('salesPriceAnnualIncrease', value)}
              onBlur={() => calc.markTouched('assumptions.salesPriceAnnualIncrease')}
              unit="%"
              error={calc.errorFor('assumptions.salesPriceAnnualIncrease')}
            />
            <NumberField
              id="assumptions.productCogsAnnualIncrease"
              label={COPY.productCogsAnnualIncrease}
              value={form.assumptions.productCogsAnnualIncrease}
              onChange={(value) => calc.setAssumption('productCogsAnnualIncrease', value)}
              onBlur={() => calc.markTouched('assumptions.productCogsAnnualIncrease')}
              unit="%"
              error={calc.errorFor('assumptions.productCogsAnnualIncrease')}
            />
            <NumberField
              id="assumptions.fixedCostAnnualIncrease"
              label={COPY.fixedCostAnnualIncrease}
              value={form.assumptions.fixedCostAnnualIncrease}
              onChange={(value) => calc.setAssumption('fixedCostAnnualIncrease', value)}
              onBlur={() => calc.markTouched('assumptions.fixedCostAnnualIncrease')}
              unit="%"
              error={calc.errorFor('assumptions.fixedCostAnnualIncrease')}
            />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-qc-muted">
            {COPY.advancedAssumptionsNote}
          </p>
        </details>
      </SectionFrame>
    </div>
  )
}
