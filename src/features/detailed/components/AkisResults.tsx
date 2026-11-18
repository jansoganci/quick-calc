import { useEffect, useRef, useState, type ReactNode } from 'react'
import { InfoTooltip } from '../../../components/InfoTooltip.tsx'
import { NumberField } from '../../../components/NumberField.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { cn } from '../../../lib/cn.ts'
import {
  changedRowKeys,
  snapshotAkis,
  withDeltas,
  type AkisRow,
  type AkisSnapshot,
} from '../akisView.ts'
import type { DetailedFormState, ProductRow } from '../formState.ts'
import type { DetailedCalcApi } from '../hooks/useDetailedCalc.ts'
import {
  AKIS_COPY,
  CAPEX_STARTERS,
  COPY,
  DELIVERY_MODE_LABELS,
  DELIVERY_MODE_ORDER,
  OPEX_STARTERS,
  RENT_BASIS_LABELS,
  RENT_BASIS_ORDER,
  RECIPE_COPY,
  AKIS_ROW_LABELS,
  type AkisRowKey,
} from '../labels.ts'
import type { DetailedScreen } from '../screens.ts'
import { recipeAmountText } from '../recipeForm.ts'
import { LineRows } from './LineRows.tsx'
import { PositionRows } from './PositionRows.tsx'

const ID_PREFIX = 'akis-'

/**
 * Interactive Akış. Inputs call the same setters as Klasik. Figures, chips,
 * the operating share and deltas come from the builder. Nothing here divides
 * or subtracts. Snapshot and flash stay in this component, never in the draft.
 */
export function AkisResults({
  calc,
  onGoToScreen,
}: {
  calc: DetailedCalcApi
  onGoToScreen: (screen: DetailedScreen) => void
}) {
  const { form, view } = calc
  const [snapshot, setSnapshot] = useState<AkisSnapshot | null>(null)
  const [open, setOpen] = useState<'payroll' | 'opex' | 'capex' | null>(null)
  const [flash, setFlash] = useState<readonly AkisRowKey[]>([])
  const [openProducts, setOpenProducts] = useState<ReadonlySet<string>>(() => new Set())
  const pendingProduct = useRef(false)
  const focusProductId = useRef<string | null>(null)
  const prevAmounts = useRef<AkisSnapshot | null>(null)
  const amountKey = view ? view.akis.rows.map((row) => row.amount).join('|') : ''
  const latestAmounts = useRef<AkisSnapshot | null>(null)
  latestAmounts.current = view ? snapshotAkis(view.akis) : null

  useEffect(() => {
    if (view && snapshot === null) setSnapshot(snapshotAkis(view.akis))
  }, [view, snapshot])

  useEffect(() => {
    const next = latestAmounts.current
    if (!next) return
    const prev = prevAmounts.current
    prevAmounts.current = next
    if (!prev) return
    const keys = changedRowKeys(prev, next)
    if (keys.length === 0) return
    setFlash(keys)
    const timer = window.setTimeout(() => setFlash([]), 200)
    return () => window.clearTimeout(timer)
  }, [amountKey])

  useEffect(() => {
    if (!pendingProduct.current) return
    const newest = form.products[form.products.length - 1]
    if (!newest) return
    pendingProduct.current = false
    focusProductId.current = newest.id
    setOpenProducts((current) => {
      const next = new Set(current)
      next.add(newest.id)
      return next
    })
  }, [form.products])

  useEffect(() => {
    const id = focusProductId.current
    if (!id || !openProducts.has(id)) return
    const index = form.products.findIndex((product) => product.id === id)
    const node = document.getElementById(`${ID_PREFIX}products.${index}.name`)
    if (!node) return
    node.focus()
    focusProductId.current = null
  }, [form.products, openProducts])

  const akis = view ? withDeltas(view.akis, snapshot) : null
  const blank = AKIS_COPY.blank
  const guardrails = view?.guardrails ?? []

  function row(key: AkisRowKey): AkisRow | undefined {
    return akis?.rows.find((candidate) => candidate.key === key)
  }

  function figure(key: AkisRowKey): string {
    return akis ? row(key)!.amountFormatted : blank
  }

  function delta(key: AkisRowKey): string | null {
    return akis ? row(key)!.deltaFormatted : null
  }

  return (
    <div className="qc-report-body border-t border-qc-rule px-[18px] pb-[34px] pt-[26px] lg:px-[30px] lg:pt-[30px]">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="m-0 text-[15px] font-semibold text-qc-ink">{AKIS_COPY.title}</h2>
        <button
          type="button"
          className="qc-text-btn min-h-[44px]"
          onClick={() => {
            if (view) setSnapshot(snapshotAkis(view.akis))
          }}
        >
          {AKIS_COPY.resetReference}
        </button>
      </div>
      <p className="mb-[18px] mt-0 max-w-[720px] text-xs leading-relaxed text-qc-secondary">
        {AKIS_COPY.note}
      </p>

      <div className="mb-5 flex max-w-[720px] flex-col gap-3">
        {form.products.map((product, index) => (
          <ProductCard
            key={product.id}
            form={form}
            product={product}
            index={index}
            gross={akis?.products.find((line) => line.productId === product.id)?.amountFormatted ?? blank}
            open={openProducts.has(product.id)}
            canRemove={form.products.length > 1}
            errorFor={calc.errorFor}
            onBlur={calc.markTouched}
            onChange={calc.setProductField}
            onToggle={() =>
              setOpenProducts((current) => {
                const next = new Set(current)
                if (next.has(product.id)) next.delete(product.id)
                else next.add(product.id)
                return next
              })
            }
            onRemove={() => {
              calc.removeProduct(index)
              setOpenProducts((current) => {
                if (!current.has(product.id)) return current
                const next = new Set(current)
                next.delete(product.id)
                return next
              })
            }}
            onGoToMenu={() => onGoToScreen('menu')}
          />
        ))}
        <button
          type="button"
          className="qc-text-btn min-h-[44px] self-start"
          onClick={() => {
            pendingProduct.current = true
            calc.addProduct()
          }}
        >
          {AKIS_COPY.addProduct}
        </button>
      </div>

      <div className="max-w-[720px]">
        <FlowRow
          label={AKIS_COPY.days}
          input={
            <NumberField
              id={`${ID_PREFIX}assumptions.operatingDaysPerMonth`}
              label={AKIS_COPY.days}
              labelHidden
              value={form.assumptions.operatingDaysPerMonth}
              onChange={(value) => calc.setAssumption('operatingDaysPerMonth', value)}
              onBlur={() => calc.markTouched('assumptions.operatingDaysPerMonth')}
              unit="gün"
              error={calc.errorFor('assumptions.operatingDaysPerMonth')}
            />
          }
        />

        <FlowRow
          label={AKIS_ROW_LABELS.grossSales}
          hint={akis?.rows.find((line) => line.key === 'grossSales')?.hint}
          tint
          flash={flash.includes('grossSales')}
          value={figure('grossSales')}
          delta={delta('grossSales')}
          strong
        />

        <p className="mb-1 mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
          {AKIS_COPY.channelSplit}
        </p>
        {(['salon', 'takeaway', 'delivery'] as const).map((channel) => (
          <FlowRow
            key={channel}
            nested
            label={AKIS_COPY.channels[channel]}
            input={
              <NumberField
                id={`${ID_PREFIX}channelMix.${channel}`}
                label={AKIS_COPY.channels[channel]}
                labelHidden
                value={form.channelMix[channel]}
                onChange={(value) => calc.setChannelShare(channel, value)}
                onBlur={() => calc.markTouched(`channelMix.${channel}`)}
                unit="%"
                error={calc.errorFor(`channelMix.${channel}`)}
              />
            }
            value={akis?.channels.find((chip) => chip.channel === channel)?.grossFormatted ?? blank}
          />
        ))}
        {calc.errorFor('channelMix') ? (
          <p className="m-0 text-xs text-qc-secondary">{calc.errorFor('channelMix')}</p>
        ) : null}

        <FlowRow
          label={AKIS_ROW_LABELS.vat}
          flash={flash.includes('vat')}
          input={
            <NumberField
              id={`${ID_PREFIX}assumptions.vatRate`}
              label={COPY.vatRate}
              labelHidden
              value={form.assumptions.vatRate}
              onChange={(value) => calc.setAssumption('vatRate', value)}
              onBlur={() => calc.markTouched('assumptions.vatRate')}
              unit="%"
              error={calc.errorFor('assumptions.vatRate')}
            />
          }
          value={figure('vat')}
          delta={delta('vat')}
        />

        <FlowRow label={AKIS_ROW_LABELS.netSales} tint strong flash={flash.includes('netSales')} value={figure('netSales')} delta={delta('netSales')} />
        <FlowRow label={AKIS_ROW_LABELS.productCogs} flash={flash.includes('productCogs')} value={figure('productCogs')} delta={delta('productCogs')} />
        <FlowRow label={AKIS_ROW_LABELS.grossProfit} tint strong flash={flash.includes('grossProfit')} value={figure('grossProfit')} delta={delta('grossProfit')} />

        <FlowRow
          label={AKIS_ROW_LABELS.channelCost}
          hint={akis?.rows.find((line) => line.key === 'channelCost')?.hint}
          flash={flash.includes('channelCost')}
          value={figure('channelCost')}
          delta={delta('channelCost')}
        />

        <FlowRow
          nested
          label={AKIS_ROW_LABELS.paymentPlatformFee}
          flash={flash.includes('paymentPlatformFee')}
          value={figure('paymentPlatformFee')}
          delta={delta('paymentPlatformFee')}
        />
        {(['cash', 'card', 'mealCard'] as const).map((method) => (
          <FlowRow
            key={method}
            nested
            label={AKIS_COPY.payments[method]}
            input={
              <NumberField
                id={`${ID_PREFIX}paymentMix.${method}`}
                label={AKIS_COPY.payments[method]}
                labelHidden
                value={form.paymentMix[method]}
                onChange={(value) => calc.setPaymentShare(method, value)}
                onBlur={() => calc.markTouched(`paymentMix.${method}`)}
                unit="%"
                error={calc.errorFor(`paymentMix.${method}`)}
              />
            }
          />
        ))}
        {calc.errorFor('paymentMix') ? (
          <p className="m-0 pl-4 text-xs text-qc-secondary lg:pl-6">{calc.errorFor('paymentMix')}</p>
        ) : null}
        <FlowRow
          nested
          label={COPY.posCommission}
          input={
            <NumberField
              id={`${ID_PREFIX}posCommissionRate`}
              label={COPY.posCommission}
              labelHidden
              value={form.posCommissionRate}
              onChange={calc.setPosCommissionRate}
              onBlur={() => calc.markTouched('posCommissionRate')}
              unit="%"
              error={calc.errorFor('posCommissionRate')}
            />
          }
        />
        <FlowRow
          nested
          label={COPY.mealCardCommission}
          input={
            <NumberField
              id={`${ID_PREFIX}mealCardCommissionRate`}
              label={COPY.mealCardCommission}
              labelHidden
              value={form.mealCardCommissionRate}
              onChange={calc.setMealCardCommissionRate}
              onBlur={() => calc.markTouched('mealCardCommissionRate')}
              unit="%"
              error={calc.errorFor('mealCardCommissionRate')}
            />
          }
        />
        {hasDelivery(form.channelMix.delivery) ? (
          <>
            <FlowRow
              nested
              label={COPY.platformFeeRate}
              input={
                <NumberField
                  id={`${ID_PREFIX}delivery.platformFeeRate`}
                  label={COPY.platformFeeRate}
                  labelHidden
                  value={form.delivery.platformFeeRate}
                  onChange={(value) => calc.setDeliveryField('platformFeeRate', value)}
                  onBlur={() => calc.markTouched('delivery.platformFeeRate')}
                  unit="%"
                  error={calc.errorFor('delivery.platformFeeRate')}
                />
              }
            />
            <div className="py-2 pl-4 lg:pl-6">
              <div className="qc-segment" role="group" aria-label={COPY.deliveryModeQuestion}>
                {DELIVERY_MODE_ORDER.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className="qc-segment-btn"
                    aria-pressed={form.delivery.mode === mode}
                    onClick={() => calc.setDeliveryMode(mode)}
                  >
                    {DELIVERY_MODE_LABELS[mode]}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}

        <FlowRow
          nested
          label={AKIS_ROW_LABELS.channelVariableCost}
          flash={flash.includes('channelVariableCost')}
          value={figure('channelVariableCost')}
          delta={delta('channelVariableCost')}
        />
        <FlowRow
          nested
          label={`${AKIS_COPY.channels.takeaway} — ${COPY.packagingPerOrder}`}
          input={
            <NumberField
              id={`${ID_PREFIX}packaging.takeawayPerOrder`}
              label={`${AKIS_COPY.channels.takeaway} — ${COPY.packagingPerOrder}`}
              labelHidden
              value={form.packaging.takeawayPerOrder}
              onChange={(value) => calc.setPackaging('takeawayPerOrder', value)}
              onBlur={() => calc.markTouched('packaging.takeawayPerOrder')}
              unit="TL"
              error={calc.errorFor('packaging.takeawayPerOrder')}
              grouped
            />
          }
        />
        <FlowRow
          nested
          label={`${AKIS_COPY.channels.delivery} — ${COPY.packagingPerOrder}`}
          input={
            <NumberField
              id={`${ID_PREFIX}packaging.deliveryPerOrder`}
              label={`${AKIS_COPY.channels.delivery} — ${COPY.packagingPerOrder}`}
              labelHidden
              value={form.packaging.deliveryPerOrder}
              onChange={(value) => calc.setPackaging('deliveryPerOrder', value)}
              onBlur={() => calc.markTouched('packaging.deliveryPerOrder')}
              unit="TL"
              error={calc.errorFor('packaging.deliveryPerOrder')}
              grouped
            />
          }
        />
        {hasDelivery(form.channelMix.delivery) ? (
          <FlowRow
            nested
            label={COPY.ownCourierCost}
            input={
              <NumberField
                id={`${ID_PREFIX}delivery.ownCourierCostPerDeliveryOrder`}
                label={COPY.ownCourierCost}
                labelHidden
                value={form.delivery.ownCourierCostPerDeliveryOrder}
                onChange={(value) => calc.setDeliveryField('ownCourierCostPerDeliveryOrder', value)}
                onBlur={() => calc.markTouched('delivery.ownCourierCostPerDeliveryOrder')}
                unit="TL"
                error={calc.errorFor('delivery.ownCourierCostPerDeliveryOrder')}
                disabled={form.delivery.mode === 'platformCourier'}
                grouped
              />
            }
          />
        ) : null}

        <FlowRow
          label={AKIS_ROW_LABELS.payroll}
          flash={flash.includes('payroll')}
          value={figure('payroll')}
          delta={delta('payroll')}
          note={akis?.isPayrollMissing ? AKIS_COPY.payrollMissing : null}
          extra={
            <EditPanel
              open={open === 'payroll'}
              onToggle={() => setOpen(open === 'payroll' ? null : 'payroll')}
            >
              <PositionRows
                positions={form.positions}
                idPrefix={ID_PREFIX}
                guardrailFor={(positionId) =>
                  guardrails.find((guardrail) => guardrail.id === `employer-cost-${positionId}`)?.message ?? null
                }
                errorFor={calc.errorFor}
                onBlur={calc.markTouched}
                onChange={calc.setPositionField}
                onAdd={calc.addPosition}
                onRemove={calc.removePosition}
              />
            </EditPanel>
          }
        />

        <FlowRow
          label={AKIS_ROW_LABELS.rent}
          flash={flash.includes('rent')}
          input={
            <NumberField
              id={`${ID_PREFIX}occupancy.monthlyRent`}
              label={COPY.monthlyRent}
              labelHidden
              value={form.occupancy.monthlyRent}
              onChange={(value) => calc.setOccupancyField('monthlyRent', value)}
              onBlur={() => calc.markTouched('occupancy.monthlyRent')}
              unit="TL"
              error={calc.errorFor('occupancy.monthlyRent')}
              grouped
            />
          }
          value={figure('rent')}
          delta={delta('rent')}
          extra={
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
          }
        />
        <FlowRow
          nested
          label={AKIS_ROW_LABELS.aidat}
          flash={flash.includes('aidat')}
          input={
            <NumberField
              id={`${ID_PREFIX}occupancy.monthlyAidat`}
              label={COPY.monthlyAidat}
              labelHidden
              value={form.occupancy.monthlyAidat}
              onChange={(value) => calc.setOccupancyField('monthlyAidat', value)}
              onBlur={() => calc.markTouched('occupancy.monthlyAidat')}
              unit="TL"
              error={calc.errorFor('occupancy.monthlyAidat')}
              grouped
            />
          }
          value={figure('aidat')}
          delta={delta('aidat')}
        />

        <FlowRow
          label={AKIS_ROW_LABELS.opex}
          flash={flash.includes('opex')}
          value={figure('opex')}
          delta={delta('opex')}
          extra={
            <EditPanel open={open === 'opex'} onToggle={() => setOpen(open === 'opex' ? null : 'opex')}>
              <LineRows
                lines={form.opexLines}
                pathPrefix="opexLines"
                idPrefix={ID_PREFIX}
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
            </EditPanel>
          }
        />

        <FlowRow
          label={AKIS_ROW_LABELS.ownerDraw}
          flash={flash.includes('ownerDraw')}
          input={
            <NumberField
              id={`${ID_PREFIX}owner.monthlyAmount`}
              label={COPY.ownerMonthlyAmount}
              labelHidden
              value={form.owner.monthlyAmount}
              onChange={(value) => calc.setOwnerField('monthlyAmount', value)}
              onBlur={() => calc.markTouched('owner.monthlyAmount')}
              unit="TL"
              error={calc.errorFor('owner.monthlyAmount')}
              grouped
            />
          }
          value={figure('ownerDraw')}
          delta={delta('ownerDraw')}
        />
        <FlowRow
          label={AKIS_ROW_LABELS.bagKur}
          flash={flash.includes('bagKur')}
          input={
            <NumberField
              id={`${ID_PREFIX}owner.bagKurMonthlyCost`}
              label={COPY.ownerBagKur}
              labelHidden
              value={form.owner.bagKurMonthlyCost}
              onChange={(value) => calc.setOwnerField('bagKurMonthlyCost', value)}
              onBlur={() => calc.markTouched('owner.bagKurMonthlyCost')}
              unit="TL"
              error={calc.errorFor('owner.bagKurMonthlyCost')}
              grouped
            />
          }
          value={figure('bagKur')}
          delta={delta('bagKur')}
        />

        <FlowRow
          label={AKIS_ROW_LABELS.operatingResult}
          highlight
          strong
          flash={flash.includes('operatingResult')}
          value={figure('operatingResult')}
          delta={delta('operatingResult')}
          note={akis ? (akis.operatingShareFormatted ?? blank) : blank}
        />

        <FlowRow
          label={AKIS_COPY.payback}
          highlight
          value={view ? (view.payback.available ? view.payback.value : view.payback.message) : blank}
          extra={
            <EditPanel
              open={open === 'capex'}
              onToggle={() => setOpen(open === 'capex' ? null : 'capex')}
              label={`${AKIS_COPY.initialInvestment} · ${AKIS_COPY.edit}`}
            >
              <p className="m-0 mb-2 font-mono text-[13px] tabular-nums text-qc-ink">
                {view ? view.initialInvestment : blank}
              </p>
              <LineRows
                lines={form.capexItems}
                pathPrefix="capexItems"
                idPrefix={ID_PREFIX}
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
            </EditPanel>
          }
        />
      </div>
    </div>
  )
}

const PRODUCT_ERROR_FIELDS = ['name', 'normalPrice', 'onlinePrice', 'dailyQuantity', 'unitProductCost', 'discountRate'] as const

function ProductCard({
  form,
  product,
  index,
  gross,
  open,
  canRemove,
  errorFor,
  onBlur,
  onChange,
  onToggle,
  onRemove,
  onGoToMenu,
}: {
  form: DetailedFormState
  product: ProductRow
  index: number
  gross: string
  open: boolean
  canRemove: boolean
  errorFor: (path: string) => string | null
  onBlur: (path: string) => void
  onChange: (index: number, field: keyof Omit<ProductRow, 'id'>, value: string) => void
  onToggle: () => void
  onRemove: () => void
  onGoToMenu: () => void
}) {
  const path = (field: string) => `products.${index}.${field}`
  const panelId = `akis-product-panel-${product.id}`
  const hasError = PRODUCT_ERROR_FIELDS.some((field) => errorFor(path(field)) !== null)
  const name = product.name.trim() === '' ? AKIS_COPY.unnamedProduct : product.name
  const summary = AKIS_COPY.productSummary(product.dailyQuantity, product.normalPrice)
  return (
    <div className="rounded border border-qc-rule bg-qc-surface">
      <button
        type="button"
        className="flex min-h-[44px] w-full items-center gap-2 px-3 py-2 text-left focus-visible:outline-none focus-visible:[box-shadow:0_0_0_3px_var(--qc-focus-ring)]"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={onToggle}
      >
        <span aria-hidden="true" className="w-4 shrink-0 text-qc-secondary">
          {open ? '▾' : '▸'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] text-qc-ink">{name}</span>
          {summary ? (
            <span className="block truncate text-xs text-qc-secondary">{summary}</span>
          ) : null}
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-[11px] text-qc-secondary">{AKIS_COPY.productGross}</span>
          <span className="block font-mono text-[13px] tabular-nums text-qc-ink">{gross}</span>
        </span>
        {hasError ? <span className="qc-error shrink-0">{AKIS_COPY.checkProduct}</span> : null}
      </button>
      {open ? (
      <div id={panelId} className="border-t border-qc-rule px-3 py-3">
      <div className="mb-2 flex justify-end">
        <button type="button" className="qc-text-btn" disabled={!canRemove} onClick={onRemove}>
          {AKIS_COPY.removeProduct}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
        <TextField
          id={`${ID_PREFIX}${path('name')}`}
          label={COPY.productName}
          value={product.name}
          onChange={(value) => onChange(index, 'name', value)}
          onBlur={() => onBlur(path('name'))}
          error={errorFor(path('name'))}
        />
        <NumberField
          id={`${ID_PREFIX}${path('dailyQuantity')}`}
          label={AKIS_COPY.dailyQuantity}
          value={product.dailyQuantity}
          onChange={(value) => onChange(index, 'dailyQuantity', value)}
          onBlur={() => onBlur(path('dailyQuantity'))}
          unit="adet"
          error={errorFor(path('dailyQuantity'))}
        />
        <NumberField
          id={`${ID_PREFIX}${path('normalPrice')}`}
          label={AKIS_COPY.shopPrice}
          value={product.normalPrice}
          onChange={(value) => onChange(index, 'normalPrice', value)}
          onBlur={() => onBlur(path('normalPrice'))}
          unit="TL"
          error={errorFor(path('normalPrice'))}
          grouped
        />
        <NumberField
          id={`${ID_PREFIX}${path('onlinePrice')}`}
          label={AKIS_COPY.platformPrice}
          value={product.onlinePrice}
          onChange={(value) => onChange(index, 'onlinePrice', value)}
          onBlur={() => onBlur(path('onlinePrice'))}
          unit="TL"
          error={errorFor(path('onlinePrice'))}
          grouped
        />
        <NumberField
          id={`${ID_PREFIX}${path('discountRate')}`}
          label={AKIS_COPY.discount}
          value={product.discountRate}
          onChange={(value) => onChange(index, 'discountRate', value)}
          onBlur={() => onBlur(path('discountRate'))}
          unit="%"
          error={errorFor(path('discountRate'))}
        />
        {product.costSource === 'recipe' ? (
          <div>
            <p className="m-0 text-xs text-qc-secondary">{AKIS_COPY.unitCost}</p>
            <p className="m-0 mt-1 text-[13px] text-qc-ink">{recipeCostLabel(form, product)}</p>
            <button type="button" className="qc-text-btn mt-1 min-h-[44px]" onClick={onGoToMenu}>
              {AKIS_COPY.editRecipe}
            </button>
          </div>
        ) : (
          <NumberField
            id={`${ID_PREFIX}${path('unitProductCost')}`}
            label={AKIS_COPY.unitCost}
            value={product.unitProductCost}
            onChange={(value) => onChange(index, 'unitProductCost', value)}
            onBlur={() => onBlur(path('unitProductCost'))}
            unit="TL"
            error={errorFor(path('unitProductCost'))}
            grouped
          />
        )}
      </div>
      </div>
      ) : null}
    </div>
  )
}

function recipeCostLabel(form: DetailedFormState, product: ProductRow): string {
  const amount = recipeAmountText(form, product) ?? AKIS_COPY.blank
  return RECIPE_COPY.menuRowCost(amount, RECIPE_COPY.sourceRecipe)
}

function hasDelivery(share: string): boolean {
  const trimmed = share.trim()
  return trimmed !== '' && !/^0+([.,]0*)?$/.test(trimmed)
}

function EditPanel({
  open,
  onToggle,
  label = AKIS_COPY.edit,
  children,
}: {
  open: boolean
  onToggle: () => void
  label?: string
  children: ReactNode
}) {
  return (
    <div className="mt-1">
      <button type="button" className="qc-text-btn min-h-[44px]" aria-expanded={open} onClick={onToggle}>
        {label}
      </button>
      {open ? <div className="mt-2">{children}</div> : null}
    </div>
  )
}

function FlowRow({
  label,
  hint,
  nested = false,
  tint = false,
  highlight = false,
  strong = false,
  flash = false,
  input,
  value,
  delta,
  note,
  extra,
}: {
  label: string
  hint?: string | null
  nested?: boolean
  tint?: boolean
  highlight?: boolean
  strong?: boolean
  flash?: boolean
  input?: ReactNode
  value?: string
  delta?: string | null
  note?: string | null
  extra?: ReactNode
}) {
  return (
    <div
      className={cn(
        'border-t border-qc-rule-row py-2',
        nested && 'pl-4 lg:pl-6',
        tint && 'bg-qc-surface',
        highlight && 'bg-qc-surface-result',
        flash && 'qc-live',
      )}
    >
      <div className="grid grid-cols-1 items-start gap-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(9rem,12rem)_7.5rem_6.5rem] lg:items-center lg:gap-3">
        <div className={cn('text-[13px] text-qc-ink', strong && 'font-semibold')}>
          <span>{label}</span>
          {hint ? <InfoTooltip text={hint} /> : null}
          {note ? <span className="mt-0.5 block text-xs font-normal text-qc-secondary">{note}</span> : null}
        </div>
        <div className={input ? 'min-w-0' : 'hidden lg:block'}>{input}</div>
        <div className={cn('font-mono text-[13px] tabular-nums text-qc-ink lg:text-right', strong && 'font-semibold')}>
          {value}
        </div>
        <div className="font-mono text-xs tabular-nums text-qc-secondary lg:text-right">{delta}</div>
      </div>
      {extra}
    </div>
  )
}
