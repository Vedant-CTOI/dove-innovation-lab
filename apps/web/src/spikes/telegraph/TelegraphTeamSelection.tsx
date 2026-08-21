import { TEAMS } from "../../lib/mockData";

export function TelegraphTeamSelection({ state }: { state: string }) {
  if (state === "loading") return <TelegraphLoading />;
  if (state === "error") return <TelegraphError />;

  return (
    <div className="tg-select">
      <div className="tg-select__masthead">
        <div className="tg-select__date">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
        <h1 className="tg-select__title">The Newsroom</h1>
        <p className="tg-select__tagline">A workshop for ideas that deserve the front page.</p>
      </div>

      <p className="tg-select__instruction">
        Choose your team — the press room is waiting.
      </p>

      <div className="tg-teams" role="list">
        {TEAMS.map((team, i) => (
          <button
            key={team.id}
            className="tg-team-card"
            role="listitem"
            aria-label={`${team.name} — ${team.blurb}, ${team.members} members`}
          >
            <div className="tg-team-card__num">№ {String(i + 1).padStart(2, "0")}</div>
            <div className="tg-team-card__name">{team.name}</div>
            <div className="tg-team-card__blurb">{team.blurb}</div>
            <div className="tg-team-card__meta">
              <span className="tg-team-card__members">{team.members} members</span>
              <span className="tg-team-card__arrow">→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TelegraphLoading() {
  return (
    <div className="tg-loading">
      <div className="tg-loading__masthead">
        <div className="tg-skel tg-skel--line" />
        <div className="tg-skel tg-skel--title" />
        <div className="tg-skel tg-skel--line" />
      </div>
      <div className="tg-loading__grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="tg-skel tg-skel--card" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </div>
  );
}

function TelegraphError() {
  return (
    <div className="tg-error">
      <div className="tg-error__seal">!</div>
      <h2 className="tg-error__title">The press is down</h2>
      <p className="tg-error__body">
        We couldn't reach the newsroom. Check your connection and try again — the edition goes to print when you're ready.
      </p>
      <button className="tg-error__retry" onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  );
}
