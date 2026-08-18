/** Small layout-only additions; colors and typography come from DSH tokens. */
export const NORTHSTAR_STYLES = `
.dsh-northstar-control { position: relative; display: inline-flex; flex-direction: column; align-items: flex-start; min-width: 0; }
.dsh-northstar-toolbar { display: inline-flex; align-items: center; gap: 2px; min-height: 28px; }
.dsh-northstar-switch { display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 9px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 14px; color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-1); cursor: pointer; font: inherit; font-size: 12px; line-height: 18px; }
.dsh-northstar-switch:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
.dsh-northstar-switch:disabled { cursor: wait; opacity: .55; }
.dsh-northstar-switch[data-enabled='true'] { box-shadow: inset 0 0 0 1px color-mix(in srgb, currentColor 20%, transparent); }
.dsh-northstar-switch-knob { width: 10px; height: 10px; border-radius: 50%; background: var(--dsw-alias-label-quaternary); }
.dsh-northstar-switch[data-enabled='true'] .dsh-northstar-switch-knob { background: currentColor; }
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
