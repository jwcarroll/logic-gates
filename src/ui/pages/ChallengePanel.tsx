import { useMemo, useState } from 'react'
import { useAppStore } from '../../app/store'
import { listChallenges } from '../../app/challenges/challengeService'

export const ChallengePanel = () => {
  const challenges = useMemo(() => listChallenges(), [])
  const [selected, setSelected] = useState(challenges[0]?.id ?? '')
  const loadChallenge = useAppStore((s) => s.loadChallenge)
  const runChallenge = useAppStore((s) => s.runChallenge)
  const status = useAppStore((s) => s.challengeStatus)

  return (
    <div className="challenge-panel">
      <h3>Challenges</h3>
      <div className="challenge-row">
        <label htmlFor="challenge-select">Select</label>
        <select
          id="challenge-select"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          aria-label="Challenge selector"
        >
          {challenges.map((challenge) => (
            <option value={challenge.id} key={challenge.id}>
              {challenge.title}
            </option>
          ))}
        </select>
        <button
          className="toolbar-button"
          onClick={() => {
            if (!selected) return
            const result = loadChallenge(selected)
            if (!result.ok) {
              alert((result.errors || []).join(', '))
            }
          }}
          disabled={!selected}
        >
          Load challenge
        </button>
      </div>
      <div className="challenge-row">
        <button className="toolbar-button" onClick={() => runChallenge()}>
          Validate
        </button>
        <span className={`challenge-status challenge-status--${status.state}`} role="status">
          {status.state === 'idle' && 'No challenge loaded'}
          {status.state === 'loaded' && 'Loaded: adjust circuit then validate'}
          {status.state === 'incomplete' && status.message}
          {status.state === 'success' && 'Success! Targets met.'}
          {status.state === 'error' && status.message}
        </span>
      </div>
    </div>
  )
}
