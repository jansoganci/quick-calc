import { describe, expect, it } from 'vitest'
import { emptyProduct, initialForm } from './formState.ts'
import { buildBulkPriceRows, bulkRate, undoProductPrices, writeProductPrices } from './bulkPriceView.ts'

describe('DF-88 bulk price view and one-write undo', () => {
  it('shows current channel prices before a rate is entered', () => {
    const products = [{ ...emptyProduct(), id: 'one', normalPrice: '320', onlinePrice: '380' }]
    const view = buildBulkPriceRows(products, new Set(['one']), 'both', bulkRate(''))
    expect(view.rows[0]?.previews.map((preview) => preview.text)).toEqual([
      'Salon: 320 TL', 'Online: 380 TL',
    ])
    expect(view.writes).toEqual([])
  })
  it('previews and writes selected salon prices, skipping empty and unchecked products', () => {
    const products = [
      { ...emptyProduct(), id: 'one', name: 'Hamburger', normalPrice: '230', onlinePrice: '240' },
      { ...emptyProduct(), id: 'empty', name: 'Boş', normalPrice: '', onlinePrice: '190' },
      { ...emptyProduct(), id: 'unchecked', name: 'Köfte', normalPrice: '200', onlinePrice: '220' },
    ]
    const view = buildBulkPriceRows(products, new Set(['one', 'empty']), 'normalPrice', bulkRate('10'))
    expect(view.rows.map((row) => row.previews[0]?.text)).toEqual([
      'Salon: 230 → 253 TL',
      'Fiyat yok',
      'Salon: 200 → 220 TL',
    ])
    expect(view.writes).toEqual([{ productIndex: 0, field: 'normalPrice', value: '253' }])
    expect(view.productCount).toBe(1)
  })

  it('shows a kuruş price as typed, not rounded', () => {
    const products = [{ ...emptyProduct(), id: 'one', name: 'Hamburger', normalPrice: '229,24', onlinePrice: '240' }]
    const view = buildBulkPriceRows(products, new Set(['one']), 'both', bulkRate('10'))
    expect(view.rows[0]?.previews.map((preview) => preview.text)).toEqual([
      'Salon: 229,24 → 253 TL',
      'Online: 240 → 264 TL',
    ])
  })

  it('restores exactly the previous strings of only the fields written', () => {
    const form = initialForm()
    form.products = [{ ...emptyProduct(), id: 'one', normalPrice: '1.230,00', onlinePrice: '230', discountRate: '7,5' }]
    const result = writeProductPrices(form, [
      { productIndex: 0, field: 'normalPrice', value: '1.354' },
      { productIndex: 0, field: 'onlinePrice', value: '253' },
    ])
    expect(result.form.products[0]).toMatchObject({ normalPrice: '1.354', onlinePrice: '253', discountRate: '7,5' })
    expect(undoProductPrices(result.form, result.undo).products[0]).toMatchObject({
      normalPrice: '1.230,00', onlinePrice: '230', discountRate: '7,5',
    })
    expect(form.products[0]?.normalPrice).toBe('1.230,00')
  })
})
