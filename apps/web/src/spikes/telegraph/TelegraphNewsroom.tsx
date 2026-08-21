import { IDEAS, PRESENCE, NEWSROOM_PHASE, TIMER_REMAINING, TOTAL_PARTICIPANTS } from "../../lib/mockData";
import { FakeQR } from "../../lib/QR";

export function TelegraphNewsroom({ state }: { state: string }) {
  const isOffline = state === "offline";
  const isReconnecting = state === "reconnecting";
  const isLoading = state === "loading";
  const isError = state === "error";

  return (
    <div className="tg-news">
      <div className="tg-news__topbar">
        <span className="tg-news__phase">● {NEWSROOM_PHASE}</span>
        <span className="tg-news__timer">{TIMER_REMAINING}</span>
        <span className="tg-news__presence-count">{TOTAL_PARTICIPANTS} present</span>
      </div>

      <div className="tg-news__grid">
        <div className="tg-news__main">
          {isLoading ? (
            <>
              <div className="tg-skel" style={{ height: "2.5rem", width: "60%", marginBottom: "0.5rem" }} />
              <div className="tg-skel" style={{ height: "1rem", width: "30%", marginBottom: "2rem" }} />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ padding: "1.5rem 0", borderBottom: "1px solid var(--tg-rule)" }}>
                  <div className="tg-skel" style={{ height: "1.2rem", width: "80%", marginBottom: "0.5rem" }} />
                  <div className="tg-skel" style={{ height: "0.9rem", width: "50%" }} />
                </div>
              ))}
            </>
          ) : isError ? (
            <div className="tg-error" style={{ padding: "3rem 0", textAlign: "center" }}>
              <div className="tg-error__seal">!</div>
              <h2 className="tg-error__title">Live feed interrupted</h2>
              <p className="tg-error__body">The wire went quiet. Your ideas are safe — we'll reconnect when the line is back.</p>
              <button className="tg-error__retry" onClick={() => window.location.reload()}>Retry</button>
            </div>
          ) : (
            <>
              <h2 className="tg-news__heading">The Floor</h2>
              <p className="tg-news__subhead">Live from the workshop — ideas as they come off the press.</p>
              {IDEAS.map((idea) => (
                <article key={idea.id} className={`tg-idea ${idea.shortlisted ? "tg-idea--shortlisted" : ""}`}>
                  <div className="tg-idea__num">{idea.id.replace("i-", "№")}</div>
                  <div>
                    <h3 className="tg-idea__title">{idea.title}</h3>
                    <p className="tg-idea__body">{idea.body}</p>
                    <div className="tg-idea__meta">
                      <span>{idea.author} · {idea.team}</span>
                      <span>{idea.timestamp}</span>
                    </div>
                  </div>
                  <div className="tg-idea__votes">
                    <span className="tg-idea__votes-num">{idea.votes}</span>
                    <span className="tg-idea__votes-label">votes</span>
                  </div>
                </article>
              ))}
            </>
          )}
        </div>

        <aside className="tg-news__side">
          <div className="tg-qr-card">
            <div className="tg-qr-card__label">Join the room</div>
            <div className="tg-qr-card__qr">
              <FakeQR seed="telegraph-newsroom-qr" size={180} />
            </div>
            <p className="tg-qr-card__cta">Scan to vote from your phone</p>
          </div>

          <div className="tg-presence">
            <div className="tg-presence__label">In the room</div>
            {PRESENCE.map((p) => (
              <div key={p.name} className="tg-presence__item">
                <span className={`tg-presence__dot tg-presence__dot--${p.status}`} />
                <span>{p.name}</span>
                <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--tg-ink-faint)" }}>{p.team}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {(isOffline || isReconnecting) && (
        <div className="tg-news__overlay">
          <div className="tg-news__overlay-card">
            {isReconnecting ? (
              <>
                <div className="tg-spinner" />
                <h3 className="tg-news__overlay-title">Reconnecting…</h3>
                <p className="tg-news__overlay-body">The line is coming back. Your ideas are safe.</p>
              </>
            ) : (
              <>
                <div className="tg-news__overlay-icon">!</div>
                <h3 className="tg-news__overlay-title">You're offline</h3>
                <p className="tg-news__overlay-body">The connection dropped. We'll restore the live feed as soon as you're back.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
