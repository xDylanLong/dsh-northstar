import { describe, expect, it } from 'vitest'
import { NORTHSTAR_SLOT_NAME } from '../src/client/index.ts'
import { NORTHSTAR_LOGO_TOOLTIP, NORTHSTAR_LOGO_URL } from '../src/client/logo.ts'
import { NORTHSTAR_STYLES } from '../src/client/styles.ts'
import { NORTHSTAR_HIGH_SCORE_EXAMPLE } from '../src/client/NorthstarHero.tsx'

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

  it('provides a concrete high-score example for first-time users', () => {
    expect(NORTHSTAR_HIGH_SCORE_EXAMPLE).toContain('获取 1,000 名目标 DSH 用户安装并使用 dsh-northstar')
  })

  it('uses the supplied product logo with a north-star tooltip', () => {
    expect(NORTHSTAR_LOGO_URL).toMatch(/^data:image\/png;base64,/u)
    expect(NORTHSTAR_LOGO_TOOLTIP).toBe('北极星指标')
    expect(NORTHSTAR_STYLES).toContain('.dsh-northstar-logo-button {')
  })
})
