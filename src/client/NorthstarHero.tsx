import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Button, IconSettingsOutline14, StateDot } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace } from '@deepseek-ai/dsh-client-ui-slots'
import { evaluateSmart } from '../core/evaluate.ts'
import type { NorthstarSettings, NorthstarState } from '../types.ts'

export interface NorthstarHeroInjected {
  readonly load: () => Promise<NorthstarState>
  readonly save: (settings: NorthstarSettings) => Promise<NorthstarState>
}

export type NorthstarHeroProps = InjectFace<NorthstarHeroInjected>

function dotState(status: NorthstarState['smart']['status']): 'done' | 'warning' | 'error' {
  return status === 'green' ? 'done' : status === 'yellow' ? 'warning' : 'error'
}

/**
 * Keep the frame-overlay entry aligned with the conversation column while
 * the sidebar is resized or collapsed. The host exposes the overlay as a
 * frame-wide layer, so the second frame child is the stable center-column
 * render site without replacing any host DOM.
 */
function useConversationColumnLeft(): number {
  const [left, setLeft] = useState(16)

  useLayoutEffect(() => {
    const overlay = document.querySelector<HTMLElement>('[data-shell-overlay]')
    const frame = overlay?.parentElement
    if (overlay === null || frame === null || frame === undefined) return
    const center = frame.children.item(1)
    if (center === null || center === undefined) return

    const update = (): void => {
      const next = Math.round(center.getBoundingClientRect().left - overlay.getBoundingClientRect().left + 16)
      setLeft(Math.max(12, next))
    }
    update()

    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(frame)
    observer.observe(center)
    return () => { observer.disconnect() }
  }, [])

  return left
}

/** Minimal frame-scoped control: status-colored switch, config button, inline editor. */
export function NorthstarHero({ load, save }: NorthstarHeroProps) {
  const [state, setState] = useState<NorthstarState>({
    settings: { enabled: false, statement: '' },
    smart: evaluateSmart(''),
  })
  const [draft, setDraft] = useState('')
  const [expanded, setExpanded] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const conversationColumnLeft = useConversationColumnLeft()

  useEffect(() => {
    let alive = true
    void load().then((next) => {
      if (!alive) return
      setState(next)
      setDraft(next.settings.statement)
      setExpanded(next.settings.statement.trim() === '')
    }, (reason: unknown) => {
      if (alive) setError(reason instanceof Error ? reason.message : String(reason))
    })
    return () => { alive = false }
  }, [load])

  const preview = useMemo(() => evaluateSmart(draft), [draft])
  const visibleState = draft === state.settings.statement ? state.smart : preview

  const persist = (next: NorthstarSettings): void => {
    setBusy(true)
    setError(undefined)
    void save(next).then((saved) => {
      setState(saved)
      setDraft(saved.settings.statement)
    }, (reason: unknown) => {
      setError(reason instanceof Error ? reason.message : String(reason))
    }).finally(() => { setBusy(false) })
  }

  const toggle = (): void => {
    persist({ enabled: !state.settings.enabled, statement: draft })
  }

  const saveDraft = (): void => {
    if (draft !== state.settings.statement) persist({ enabled: state.settings.enabled, statement: draft })
  }

  return (
    <div className="dsh-northstar-control" style={{ left: conversationColumnLeft }}>
      <div className="dsh-northstar-card">
        <button
          type="button"
          role="switch"
          aria-checked={state.settings.enabled}
          aria-label="开启北极星指标检查"
          className={`dsh-northstar-switch dsh-northstar-${visibleState.status}`}
          data-enabled={state.settings.enabled}
          disabled={busy}
          onClick={toggle}
        >
          <span className="dsh-northstar-switch-track" aria-hidden="true">
            <span className="dsh-northstar-switch-knob" />
          </span>
          <StateDot state={dotState(visibleState.status)} size={8} />
          <span>北极星</span>
        </button>
        <Button
          variant="ghost"
          size="sm"
          className="dsh-northstar-config-button"
          aria-label="配置北极星指标"
          title="配置北极星指标"
          disabled={busy}
          icon={<IconSettingsOutline14 size={14} />}
          onClick={() => { setExpanded(open => !open) }}
        />
      </div>
      {expanded && (
        <div className="dsh-northstar-editor">
          <textarea
            aria-label="北极星指标"
            value={draft}
            rows={3}
            maxLength={2000}
            placeholder="用一句自然语言写下你的北极星指标…"
            onChange={event => { setDraft(event.target.value) }}
            onKeyDown={event => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault()
                saveDraft()
              }
            }}
          />
          <div className="dsh-northstar-editor-footer">
            <span className="dsh-northstar-status">
              <StateDot state={dotState(visibleState.status)} size={8} />
              SMART {visibleState.score}/5 · {visibleState.summary}
            </span>
            <Button variant="primary" size="sm" disabled={busy || draft === state.settings.statement} onClick={saveDraft}>
              保存
            </Button>
          </div>
          {error !== undefined && <div className="dsh-northstar-error" role="alert">{error}</div>}
        </div>
      )}
    </div>
  )
}
