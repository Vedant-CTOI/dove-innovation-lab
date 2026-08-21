import { IDEAS, PRESENCE, NEWSROOM_PHASE, TIMER_REMAINING, TOTAL_PARTICIPANTS } from "../../lib/mockData";
import { FakeQR } from "../../lib/QR";

export function TerminalNewsroom({ state }: { state: string }) {
  const isOffline = state === "offline";
  const isReconnecting = state === "reconnecting";
  const isLoading = state === "loading";
  const isError = state === "error";

  return (
    <div className="tm-news">
      <div className="tm-news__statusbar">
        <div className="tm-news__status-item">
          <span className="tm-news__status-led" />
          <span>{NEWSROOM_PHASE.toUpperCase()}</span>
        </div>
        <div className="tm-news__status-item">
          <span>TIMER</span>
          <span className="tm-news__status-timer">{TIMER_REMAINING}</span>
        </div>
        <div className="tm-news__status-item">
          <span>{TOTAL_PARTICIPANTS} connected</span>
        </div>
        <span className="tm-news__status-spacer" />
        <span style={{ color: "var(--tm-ink-faint)" }}>socket: wss://newsroom.local</span>
      </div>

      <div className="tm-news__body">
        <div className="tm-news__stream">
          <div className="tm-news__stream-header">
            <span className="tm-news__stream-title">/ideas/live</span>
            <span className="tm-news__stream-count">{IDEAS.length} entries</span>
          </div>

          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="tm-stream-skel">
                <div className="tm-skel-block" style={{ height: "0.9rem", width: "70%", marginBottom: "0.3rem" }} />
                <div className="tm-skel-block" style={{ height: "0.8rem", width: "40%" }} />
              </div>
            ))
          ) : isError ? (
            <div style={{ padding: "2rem 0", textAlign: "center" }}>
              <div className="tm-error__code" style={{ fontSize: "1.5rem" }}>E-SOCKET-RESET</div>
              <div className="tm-error__msg">Live stream interrupted</div>
              <button className="tm-error__retry" style={{ marginTop: "1rem" }} onClick={() => window.location.reload()}>$ reconnect</button>
            </div>
          ) : (
            IDEAS.map((idea) => (
              <article key={idea.id} className={`tm-idea ${idea.shortlisted ? "tm-idea--shortlisted" : ""}`}>
                <div className="tm-idea__marker">{idea.shortlisted ? "★" : "›"}</div>
                <div>
                  <div className="tm-idea__title">{idea.title}</div>
                  <div className="tm-idea__body">{idea.body}</div>
                  <div className="tm-idea__meta">
                    <span>{idea.author}@{idea.team}</span>
                    <span>{idea.timestamp}</span>
                  </div>
                </div>
                <div className="tm-idea__votes">
                  <div className="tm-idea__votes-num">{String(idea.votes).padStart(2, "0")}</div>
                  <div className="tm-idea__votes-label">votes</div>
                </div>
              </article>
            ))
          )}
        </div>

        <aside className="tm-news__panel">
          <div className="tm-qr-box">
            <div className="tm-qr-box__label">// scan to vote</div>
            <div className="tm-qr-box__qr">
              <FakeQR seed="terminal-newsroom-qr" size={160} />
            </div>
            <div className="tm-qr-box__url">vote.local/r/abc123</div>
          </div>

          <div className="tm-roster">
            <div className="tm-roster__header">// presence</div>
            {PRESENCE.map((p) => (
              <div key={p.name} className="tm-roster__item">
                <span className={`tm-roster__dot tm-roster__dot--${p.status}`} />
                <span className="tm-roster__name">{p.name}</span>
                <span className="tm-roster__team">{p.team}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {(isOffline || isReconnecting) && (
        <div className={`tm-news__alert ${isOffline ? "tm-news__alert--critical" : "tm-news__alert--warning"}`}>
          <div className="tm-news__alert-icon">{isOffline ? "!" : "↻"}</div>
          <div className="tm-news__alert-text">
            <div className="tm-news__alert-title">{isOffline ? "CONNECTION LOST" : "RECONNECTING"}</div>
            <div className="tm-news__alert-body">
              {isOffline ? "Socket disconnected. Waiting for network…" : "Negotiating WebSocket…"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
