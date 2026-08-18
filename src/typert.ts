import { TYPERT_REMOTE } from './remote.ts'

export const TYPERT = {
  package: 'dsh-northstar',
  face: 'host',
  schemas: [],
  invocations: TYPERT_REMOTE.descriptors,
  model: { services: [], events: [], objects: [] },
} as const

export default TYPERT
