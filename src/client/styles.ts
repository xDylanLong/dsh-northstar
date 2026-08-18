/** Small layout-only additions; colors and typography come from DSH tokens. */
export const NORTHSTAR_STYLES = `
.dsh-northstar-control { position: absolute; top: 16px; left: 16px; z-index: 1; display: inline-flex; flex-direction: column; align-items: flex-start; min-width: 0; }
.dsh-northstar-card { display: inline-flex; align-items: center; gap: 2px; min-height: 28px; padding: 3px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); box-shadow: var(--dsw-alias-shadow-layer-1); }
.dsh-northstar-switch { display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 7px; border: none; border-radius: 8px; color: var(--dsw-alias-label-primary); background: transparent; cursor: pointer; font: inherit; font-size: 12px; line-height: 18px; }
.dsh-northstar-switch:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
.dsh-northstar-switch:disabled { cursor: wait; opacity: .55; }
.dsh-northstar-switch-track { position: relative; display: inline-flex; flex: none; width: 28px; height: 16px; align-items: center; border-radius: 8px; background: var(--dsw-alias-bg-layer-3); transition: background .16s ease; }
.dsh-northstar-switch-knob { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--dsw-alias-label-secondary); box-shadow: var(--dsw-alias-shadow-layer-1); transition: transform .16s ease, background .16s ease; }
.dsh-northstar-switch[data-enabled='true'] .dsh-northstar-switch-track { background: currentColor; }
.dsh-northstar-switch[data-enabled='true'] .dsh-northstar-switch-knob { background: var(--dsw-alias-label-primary-foreground); transform: translateX(12px); }
.dsh-northstar-config-button { width: 28px; padding: 0; border-radius: 8px; }
.dsh-northstar-green { color: var(--dsw-alias-state-success-primary); }
.dsh-northstar-yellow { color: var(--dsw-alias-state-warn-primary); }
.dsh-northstar-red { color: var(--dsw-alias-state-error-primary); }
.dsh-northstar-editor { position: absolute; top: calc(100% + 6px); left: 0; z-index: 20; width: min(360px, calc(100vw - 32px)); padding: 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); box-shadow: var(--dsw-alias-shadow-layer-2); }
.dsh-northstar-editor textarea { display: block; box-sizing: border-box; width: 100%; resize: vertical; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; padding: 8px 10px; color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-base); font: inherit; font-size: 13px; line-height: 20px; outline: none; }
.dsh-northstar-editor textarea:focus { border-color: var(--dsw-alias-border-focus); }
.dsh-northstar-editor-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 8px; }
.dsh-northstar-status { display: inline-flex; align-items: center; min-width: 0; color: var(--dsw-alias-label-caption); font-size: 11px; line-height: 16px; }
.dsh-northstar-error { margin-top: 6px; color: var(--dsw-alias-state-error-primary); font-size: 11px; line-height: 16px; }
`
