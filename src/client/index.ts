import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { TYPERT_REMOTE } from '../remote.ts'
import type { NorthstarSettings, NorthstarState } from '../types.ts'
import { NorthstarHero, type NorthstarHeroInjected } from './NorthstarHero.tsx'
import { NORTHSTAR_STYLES } from './styles.ts'

export const inject = ['slots', 'remote']
export const NORTHSTAR_SLOT_NAME = 'shell.overlay'

const STYLE_SELECTOR = 'style[data-dsh-northstar]'

function mountStyles(): () => void {
  if (typeof document === 'undefined' || document.querySelector(STYLE_SELECTOR) !== null) return () => {}
  const style = document.createElement('style')
  style.setAttribute('data-dsh-northstar', 'true')
  style.textContent = NORTHSTAR_STYLES
  document.head.appendChild(style)
  return () => { style.remove() }
}

export async function apply(ctx: ClientContext): Promise<() => Promise<void>> {
  const disposeRemote = await ctx.remote.$mount(TYPERT_REMOTE)
  const disposeStyles = mountStyles()
  const northstar = (ctx as unknown as { get(key: string): unknown }).get('remote.northstar') as ClientContext['remote']['northstar']
  const load: NorthstarHeroInjected['load'] = async (): Promise<NorthstarState> => {
    const result = await northstar.state()
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`)
    return result.value
  }
  const save: NorthstarHeroInjected['save'] = async (settings: NorthstarSettings): Promise<NorthstarState> => {
    const result = await northstar.save(settings)
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`)
    return result.value
  }

  ctx.slots.inject(NORTHSTAR_SLOT_NAME, () => ctx.slots.register(
    {
      name: NORTHSTAR_SLOT_NAME,
      id: 'dsh-northstar',
      order: -100,
      inject: () => ({ load, save }),
    },
    NorthstarHero,
  ))

  return async () => {
    disposeStyles()
    await disposeRemote()
  }
}

export { NorthstarHero }
export type { NorthstarHeroInjected, NorthstarHeroProps } from './NorthstarHero.tsx'
