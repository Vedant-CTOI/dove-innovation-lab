import { IDEAS, PRESENCE, NEWSROOM_PHASE, TIMER_REMAINING, TOTAL_PARTICIPANTS } from "../../lib/mockData";
import { FakeQR } from "../../lib/QR";

export function RisographNewsroom({ state }: { state: string }) {
  const isOffline = state === "offline";
  const isReconnecting = state === "reconnecting";
  const isLoading = state === "loading";
  const isError = state === "error";

  return (
    <div className="rg-news">
      <div className="rg-news__banner">
        <span className="rg-news__phase">
          <span className="rg-news__phase-dot" />
          {NEWSROOM_PHASE}
        </span>
        <span className="rg-news__count">{TOTAL_PARTICIPANTS} makers in the room</span>
        <span className="rg-news__timer">{TIMER_REMAINING}</span>
      </div>

      <div className="rg-news__body">
        <div className="rg-news__main">
          {isLoading ? (
            <>
              <div className="rg-skel" style={{ height: "2rem", width: "50%", marginBottom: "0.5rem" }} />
              <div className="rg-skel" style={{ height: "0.9rem", width: "30%", marginBottom: "2rem" }} />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ border: "3px solid var(--rg-border)", padding: "1rem", marginBottom: "0.75rem", height: "4rem" }}>
                  <div className="rg-skel" style={{ height: "1rem", width: "60%", marginBottom: "0.3rem" }} />
                </div>
              ))}
            </>
          ) : isError ? (
            <div className="rg-error" style={{ padding: "2rem 0" }}>
              <div className="rg-error__poster">
                <div className="rg-error__icon">!</div>
                <h2 className="rg-error__title">Live feed cut out</h2>
                <p className="rg-error__body">We lost the stream. Your ideas are saved — we'll pick up where we left off.</p>
                <button className="rg-error__retry" onClick={() => window.location.reload()}>Reconnect</button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="rg-news__heading">Ideas <span>off the press</span></h2>
              <p className="rg-news__subhead">→ Live from the workshop floor — {IDEAS.length} ideas and counting</p>
              {IDEAS.map((idea) => (
                <article key={idea.id} className={`rg-idea ${idea.shortlisted ? "rg-idea--shortlisted" : ""}`}>
                  <div className="rg-idea__num">{idea.id.replace("i-", "")}</div>
                  <div>
                    <h3 className="rg-idea__title">{idea.title}</h3>
                    <p className="rg-idea__body">{idea.body}</p>
                    <div className="rg-idea__meta">
                      <span>{idea.author} · {idea.team}</span>
                      <span>{idea.timestamp}</span>
                    </div>
                  </div>
                  <div className="rg-idea__votes">
                    <div className="rg-idea__votes-num">{idea.votes}</div>
                    <div className="rg-idea__votes-label">votes</div>
                  </div>
                </article>
              ))}
            </>
          )}
        </div>

        <aside className="rg-news__side">
          <div className="rg-qr-card">
            <div className="rg-qr-card__label">Scan to vote!</div>
            <div className="rg-qr-card__qr">
              <FakeQR seed="risograph-newsroom-qr" size={160} />
            </div>
            <p className="rg-qr-card__cta">Point your phone at the poster →</p>
          </div>

          <div className="rg-presence">
            <div className="rg-presence__header">In the room</div>
            {PRESENCE.map((p) => (
              <div key={p.name} className="rg-presence__item">
                <span className={`rg-presence__dot rg-presence__dot--${p.status}`} />
                <span className="rg-presence__name">{p.name}</span>
                <span className="rg-presence__team">{p.team}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {(isOffline || isReconnecting) && (
        <div className={`rg-news__banner-alert ${isOffline ? "rg-news__banner-alert--offline" : ""}`}>
          <span className="rg-news__alert-icon">{isOffline ? "✕" : "↻"}</span>
          <div>
            <div className="rg-news__alert-text">{isOffline ? "You're offline" : "Reconnecting…"}</div>
            <div className="rg-news__alert-body">
              {isOffline ? "We'll sync when you're back" : "Hang tight — the feed is coming back"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
