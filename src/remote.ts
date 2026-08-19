import { z } from 'zod'
import type { RemoteResult, TypertRemoteNamespace } from '@deepseek-ai/dsh-typert-protocol'
import { NorthstarStateSchema, NorthstarSettingsSchema } from './wire.ts'
import type { NorthstarSettings, NorthstarState } from './types.ts'

export const TYPERT_REMOTE = {
  package: 'dsh-northstar',
  descriptors: [
    {
      id: 'dsh-northstar#northstar/state', service: 'northstar', namespace: 'northstar', method: 'state', invocation: { kind: 'direct' }, parameters: [],
      result: { mode: 'strict', typeSymbol: 'dsh-northstar#NorthstarState', schema: NorthstarStateSchema },
    },
    {
      id: 'dsh-northstar#northstar/save', service: 'northstar', namespace: 'northstar', method: 'save', invocation: { kind: 'direct' },
      parameters: [{ name: 'settings', wire: 'settings', source: 'json', codec: { mode: 'strict', typeSymbol: 'dsh-northstar#NorthstarSettings', schema: NorthstarSettingsSchema } }],
      result: { mode: 'strict', typeSymbol: 'dsh-northstar#NorthstarState', schema: NorthstarStateSchema },
    },
    {
      id: 'dsh-northstar#northstar/evaluate', service: 'northstar', namespace: 'northstar', method: 'evaluate', invocation: { kind: 'direct' },
      parameters: [{ name: 'statement', wire: 'statement', source: 'json', codec: { mode: 'strict', typeSymbol: 'string', schema: z.string() } }],
      result: { mode: 'strict', typeSymbol: 'dsh-northstar#NorthstarState', schema: NorthstarStateSchema },
    },
  ],
} as const

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteMap {
    'northstar/state': () => Promise<RemoteResult<NorthstarState>>
    'northstar/save': (settings: NorthstarSettings) => Promise<RemoteResult<NorthstarState>>
    'northstar/evaluate': (statement: string) => Promise<RemoteResult<NorthstarState>>
  }
  interface TypertRemoteNamespaceMap {
    northstar: TypertRemoteNamespace<'northstar'>
  }
}

export default TYPERT_REMOTE
