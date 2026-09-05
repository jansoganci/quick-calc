import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initialForm } from '../formState.ts'
import { createDraftSaveQueue, registerDraftLifecycleFlush } from './draftAutosave.ts'

let visibilityState: DocumentVisibilityState

beforeEach(() => {
  vi.useFakeTimers()
  visibilityState = 'visible'

  const pageTarget = new EventTarget()
  const visibilityTarget = new EventTarget()
  Object.defineProperty(visibilityTarget, 'visibilityState', {
    configurable: true,
    get: () => visibilityState,
  })
  Object.assign(pageTarget, {
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  })

  vi.stubGlobal('window', pageTarget)
  vi.stubGlobal('document', visibilityTarget)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('Detailed draft lifecycle flush', () => {
  it('writes the latest pending form when the page becomes hidden', () => {
    const write = vi.fn(() => true)
    const onSaved = vi.fn()
    const starting = initialForm()
    const latest = { ...starting, owner: { ...starting.owner, monthlyAmount: '42.000' } }
    const queue = createDraftSaveQueue(starting, write, onSaved)
    const unregister = registerDraftLifecycleFlush(queue)

    queue.updateLatest(latest)
    queue.schedule()
    visibilityState = 'hidden'
    document.dispatchEvent(new Event('visibilitychange'))

    expect(write).toHaveBeenCalledOnce()
    expect(write).toHaveBeenCalledWith(latest)
    expect(onSaved).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(500)
    window.dispatchEvent(new Event('pagehide'))
    expect(write).toHaveBeenCalledOnce()

    unregister()
    queue.dispose()
  })

  it('does nothing on lifecycle events when no form revision is pending', () => {
    const write = vi.fn(() => true)
    const starting = initialForm()
    const latest = { ...starting, owner: { ...starting.owner, monthlyAmount: '42.000' } }
    const queue = createDraftSaveQueue(starting, write, vi.fn())
    const unregister = registerDraftLifecycleFlush(queue)

    visibilityState = 'hidden'
    document.dispatchEvent(new Event('visibilitychange'))
    window.dispatchEvent(new Event('pagehide'))

    expect(write).not.toHaveBeenCalled()

    unregister()
    queue.updateLatest(latest)
    queue.schedule()
    window.dispatchEvent(new Event('pagehide'))
    expect(write).not.toHaveBeenCalled()
    queue.dispose()
  })

  it('does not throw when storage fails during a lifecycle flush', () => {
    const write = vi.fn(() => {
      throw new Error('storage unavailable')
    })
    const starting = initialForm()
    const latest = { ...starting, owner: { ...starting.owner, monthlyAmount: '42.000' } }
    const queue = createDraftSaveQueue(starting, write, vi.fn())
    const unregister = registerDraftLifecycleFlush(queue)

    queue.updateLatest(latest)
    queue.schedule()

    expect(() => window.dispatchEvent(new Event('pagehide'))).not.toThrow()
    expect(write).toHaveBeenCalledOnce()

    unregister()
    queue.dispose()
  })
})
