import { describe, expect, it } from 'vitest'
import { NORTHSTAR_SLOT_NAME } from '../src/client/index.ts'
import { NORTHSTAR_STYLES } from '../src/client/styles.ts'

describe('northstar client placement', () => {
  it('uses the additive frame overlay instead of the agent-preset hero seat', () => {
    expect(NORTHSTAR_SLOT_NAME).toBe('shell.overlay')
    expect(NORTHSTAR_STYLES).toContain('.dsh-northstar-control { position: absolute;')
  })

  it('renders a compact card with a dedicated switch track and config action', () => {
    expect(NORTHSTAR_STYLES).toContain('.dsh-northstar-card {')
    expect(NORTHSTAR_STYLES).toContain('.dsh-northstar-switch-track {')
    expect(NORTHSTAR_STYLES).toContain('.dsh-northstar-config-button {')
  })
})
