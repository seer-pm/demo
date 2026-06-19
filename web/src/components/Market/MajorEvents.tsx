// Static placeholder ported from ui-fix/market.html (.events-card). Content is a
// mockup — replace with real per-market events when wiring this to live data.
export default function MajorEvents() {
  return (
    <section className="card-box events-card">
      <div className="section-h">
        <h3>
          Major Events <span className="badge">7 upcoming</span>
        </h3>
      </div>
      <div className="events-list">
        <div className="event is-next">
          <div className="event-marker" />
          <div className="event-info">
            <div className="event-date">May 19, 2026 · 19:00 UTC</div>
            <div className="event-name">National TV Debate</div>
            <div className="event-detail">
              All major party leaders confirmed. First on-air match-up since the snap-election announcement.
            </div>
          </div>
        </div>

        <div className="event is-future-1">
          <div className="event-marker" />
          <div className="event-info">
            <div className="event-date">May 26, 2026</div>
            <div className="event-name">Final Pre-Election Polls Release</div>
            <div className="event-detail">Gallup International and IRI publish their last full-sample surveys.</div>
          </div>
        </div>

        <div className="event is-future-2">
          <div className="event-marker" />
          <div className="event-info">
            <div className="event-date">May 30, 2026</div>
            <div className="event-name">Campaign Silence Period Begins</div>
          </div>
        </div>

        <div className="event is-future-2">
          <div className="event-marker" />
          <div className="event-info">
            <div className="event-date">Jun 7, 2026</div>
            <div className="event-name">Election Day</div>
            <div className="event-detail">Polls open 08:00–20:00 local. Preliminary turnout reports every 2 hours.</div>
          </div>
        </div>

        <div className="event is-future-3">
          <div className="event-marker" />
          <div className="event-info">
            <div className="event-date">Jun 11, 2026</div>
            <div className="event-name">CEC Preliminary Results</div>
          </div>
        </div>

        <div className="event is-future-3">
          <div className="event-marker" />
          <div className="event-info">
            <div className="event-date">Jun 20, 2026</div>
            <div className="event-name">Final Certification by CEC</div>
          </div>
        </div>

        <div className="event is-future-4 is-resolution">
          <div className="event-marker" />
          <div className="event-info">
            <div className="event-date">Jun 25, 2026</div>
            <div className="event-name">Reality.eth Resolution</div>
          </div>
        </div>
      </div>
    </section>
  );
}
