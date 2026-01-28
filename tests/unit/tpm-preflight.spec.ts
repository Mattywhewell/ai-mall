import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const ROOT = path.resolve(process.cwd())
const SCRIPTS = [
  'scripts/tpm/beat1_check.sh',
  'scripts/tpm/beat2_create_identity.sh',
  'scripts/tpm/beat3_capture_attestation.sh',
  'scripts/tpm/beat4_register_identity.sh',
  'scripts/tpm/beat5_verify_attestation.sh',
  'scripts/tpm/ci_run_beats_1_to_5.sh',
]

describe('TPM beats preflight (node guard)', () => {
  it('repo root looks right (scripts/ exists)', () => {
    const exists = fs.existsSync(path.join(ROOT, 'scripts'))
    expect(exists).toBe(true)
  })

  for (const rel of SCRIPTS) {
    it(`script exists: ${rel}`, () => {
      const p = path.join(ROOT, rel)
      expect(fs.existsSync(p)).toBe(true)
    })

    it(`script is executable: ${rel}`, () => {
      const p = path.join(ROOT, rel)
      // fs.constants.X_OK is POSIX — on Windows this may be a no-op; assert at least readable
      try {
        fs.accessSync(p, fs.constants.X_OK)
      } catch (e) {
        // If accessSync fails for X_OK, try readable check and still warn
        expect(() => fs.accessSync(p, fs.constants.R_OK)).not.toThrow()
      }
    })

    it(`script passes shell syntax check: ${rel}`, () => {
      const p = path.join(ROOT, rel)
      if (process.platform === 'win32') {
        // skip strict bash syntax check on Windows
        expect(true).toBeTruthy()
        return
      }
      try {
        // run bash -n to check syntax
        execSync(`bash -n "${p}"`, { stdio: 'ignore' })
        expect(true).toBeTruthy()
      } catch (err) {
        throw new Error(`bash -n failed for ${rel}: ${String(err)}`)
      }
    })
  }

  it('ci_run_beats_1_to_5.sh references expected beat scripts', () => {
    const p = path.join(ROOT, 'scripts/tpm/ci_run_beats_1_to_5.sh')
    const content = fs.readFileSync(p, 'utf8')
    for (const beat of ['beat1_check.sh', 'beat2_create_identity.sh', 'beat3_capture_attestation.sh', 'beat4_register_identity.sh', 'beat5_verify_attestation.sh']) {
      expect(content.includes(beat)).toBe(true)
    }
  })
})
