import { TEAMS } from "../../lib/mockData";

export function TerminalTeamSelection({ state }: { state: string }) {
  if (state === "loading") return <TerminalLoading />;
  if (state === "error") return <TerminalError />;

  return (
    <div className="tm-select">
      <div className="tm-select__header">
        <div className="tm-select__header-content">
          <div className="tm-select__prompt">$ broadcast --list-teams</div>
          <h1 className="tm-select__title">Select a team to begin<span className="tm-cursor">_</span></h1>
          <p className="tm-select__desc">
            Choose the team whose broadcast you want to join. Each room runs a live session with real-time idea submission and voting.
          </p>
        </div>
      </div>

      <div className="tm-select__table" role="list">
        <div className="tm-select__table-header">
          <span>ID</span>
          <span>Team</span>
          <span>Members</span>
          <span>Status</span>
          <span></span>
        </div>
        {TEAMS.map((team) => (
          <button
            key={team.id}
            className="tm-team-row"
            role="listitem"
            aria-label={`${team.name} — ${team.blurb}, ${team.members} members`}
          >
            <span className="tm-team-row__id">{team.id.slice(0, 4)}</span>
            <span>
              <div className="tm-team-row__name">{team.name}</div>
              <div className="tm-team-row__blurb">{team.blurb}</div>
            </span>
            <span className="tm-team-row__members">{team.members}</span>
            <span className="tm-team-row__status">live</span>
            <span className="tm-team-row__arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TerminalLoading() {
  return (
    <div className="tm-loading">
      <div className="tm-loading__header">
        <div className="tm-loading__line tm-loading__line--1" />
        <div className="tm-loading__line tm-loading__line--2" />
      </div>
      <div className="tm-loading__table">
        <div className="tm-loading__row"><span className="tm-skel-block" style={{ width: "60%" }} /></div>
        <div className="tm-loading__row"><span className="tm-skel-block" style={{ width: "50%" }} /></div>
        <div className="tm-loading__row"><span className="tm-skel-block" style={{ width: "55%" }} /></div>
        <div className="tm-loading__row"><span className="tm-skel-block" style={{ width: "45%" }} /></div>
        <div className="tm-loading__row"><span className="tm-skel-block" style={{ width: "50%" }} /></div>
      </div>
    </div>
  );
}

function TerminalError() {
  return (
    <div className="tm-error">
      <div className="tm-error__box">
        <div className="tm-error__code">E-CONN-503</div>
        <div className="tm-error__msg">Failed to establish connection to broadcast server</div>
        <div className="tm-error__trace">{`> fetch('/api/teams')
> Network request failed
> Retried 3x
> Last attempt: ${new Date().toISOString()}`}</div>
        <button className="tm-error__retry" onClick={() => window.location.reload()}>
          $ retry --now
        </button>
      </div>
    </div>
  );
}
