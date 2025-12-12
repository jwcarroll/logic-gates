import { describe, expect, it } from 'vitest'

import { assertVersionConsistency } from '../../app/settings/versionCheck'

describe('assertVersionConsistency', () => {
  it('throws when settings version does not match reference', () => {
    expect(() =>
      assertVersionConsistency(
        { app: { version: '1.0.1', environment: 'local' } },
        '1.0.0',
      ),
    ).toThrowError(/Version mismatch/)
  })

  it('no-ops when referenceVersion is undefined', () => {
    expect(() => assertVersionConsistency({ app: { version: '1.0.0', environment: 'local' } })).not.toThrow()
  })
})
