import { TEAMS } from "../../lib/mockData";

export function RisographTeamSelection({ state }: { state: string }) {
  if (state === "loading") return <RisographLoading />;
  if (state === "error") return <RisographError />;

  return (
    <div className="rg-select">
      <div className="rg-select__poster">
        <span className="rg-select__badge">Workshop Session — Live</span>
        <h1 className="rg-select__title">
          Pick your <span>team</span>.
        </h1>
        <p className="rg-select__subtitle">
          Six teams, one workshop, too many ideas. Choose where you'll make things today.
        </p>
      </div>

      <p className="rg-select__instruction">Choose a team ↓</p>

      <div className="rg-teams" role="list">
        {TEAMS.map((team, i) => (
          <button
            key={team.id}
            className="rg-team-card"
            role="listitem"
            aria-label={`${team.name} — ${team.blurb}, ${team.members} members`}
          >
            <span className="rg-team-card__num">#{String(i + 1).padStart(2, "0")}</span>
            <div className="rg-team-card__name">{team.name}</div>
            <div className="rg-team-card__blurb">{team.blurb}</div>
            <div className="rg-team-card__meta">
              <span className="rg-team-card__members">{team.members} ppl</span>
              <span className="rg-team-card__join">Join →</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function RisographLoading() {
  return (
    <div className="rg-loading">
      <div className="rg-loading__poster">
        <div className="rg-skel rg-skel--big" />
        <div className="rg-skel rg-skel--med" />
      </div>
      <div className="rg-loading__grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rg-skel rg-skel--card" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
  );
}

function RisographError() {
  return (
    <div className="rg-error">
      <div className="rg-error__poster">
        <div className="rg-error__icon">!</div>
        <h2 className="rg-error__title">Oof — we lost the plot</h2>
        <p className="rg-error__body">
          Something went wrong fetching the workshop. Your team is still there — give it another go.
        </p>
        <button className="rg-error__retry" onClick={() => window.location.reload()}>Try Again</button>
      </div>
    </div>
  );
}
