import { useEffect, useRef, useState, useCallback } from 'react';
import Filters from './components/Filters.jsx';
import CafeCard from './components/CafeCard.jsx';
import CafeMap from './components/CafeMap.jsx';
import { fetchCafes, fetchVibes } from './api.js';

const EMPTY_FILTERS = { wifi: [], noise: [], outlets: [], vibe: [], q: '' };

export default function App() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [cafes, setCafes] = useState([]);
  const [vibes, setVibes] = useState([]);
  const [status, setStatus] = useState('loading');
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState('list');

  const cardRefs = useRef({});

  useEffect(() => {
    fetchVibes().then(setVibes).catch(() => setVibes([]));
  }, []);

  useEffect(() => {
    setStatus('loading');
    const t = setTimeout(() => {
      fetchCafes(filters)
        .then((data) => { setCafes(data); setStatus('ok'); })
        .catch(() => setStatus('error'));
    }, 220);
    return () => clearTimeout(t);
  }, [filters]);

  useEffect(() => {
    if (selectedId == null) return;
    const el = cardRefs.current[selectedId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [selectedId]);

  const toggleFilter = useCallback((group, value) => {
    setFilters((f) => {
      const set = new Set(f[group]);
      set.has(value) ? set.delete(value) : set.add(value);
      return { ...f, [group]: [...set] };
    });
  }, []);

  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);
  const onHover = useCallback((id) => setHoveredId(id), []);
  const onLeave = useCallback(() => setHoveredId(null), []);
  const onSelect = useCallback((id) => setSelectedId((cur) => (cur === id ? null : id)), []);

  const hasActive =
    filters.wifi.length || filters.noise.length ||
    filters.outlets.length || filters.vibe.length || filters.q.trim();

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="pin-emoji">☕</span>
          Café Compass
        </div>
        <input
          className="search"
          placeholder="Search a café or neighborhood…"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
        <span className="count-pill">
          {status !== 'ok' ? '…'
            : cafes.length === 0 ? 'no spots'
            : cafes.length === 12 ? 'all 12 spots'
            : `${cafes.length} match${cafes.length === 1 ? '' : 'es'}`}
        </span>
      </header>

      <div className="body" data-view={view}>
        <aside className="panel-side">
          <div className="side-intro">
            <span className="kicker">☕ your desk, anywhere</span>
            <h2>Find your spot.</h2>
            <p>
              Every café is a compromise between good wifi, quiet enough,
              and somewhere to plug in. This finds the ones worth the walk.
            </p>
          </div>
          <div className="filters-heading">Narrow it down</div>
          <Filters
            filters={filters}
            vibes={vibes}
            onToggle={toggleFilter}
            onClear={clearFilters}
            hasActive={hasActive}
          />
        </aside>

        <section className="panel-list">
          <div className="hero">
            <h1>Where are you working today?</h1>
            <p>
              The cafés worth the walk, sorted by how well they treat a laptop and a
              long afternoon. Hover a card to find it on the map — or{' '}
              <span className="wink">just follow the pins.</span>
            </p>
          </div>

          {status === 'error' && (
            <div className="state">
              <div className="big">Couldn&rsquo;t reach the caf&eacute; data.</div>
              Is the API running on port 3000?
            </div>
          )}

          {status === 'ok' && cafes.length === 0 && (
            <div className="state">
              <div className="big">Nothing matches all of that.</div>
              You&rsquo;re asking a lot of one café &mdash; try dropping a filter.
            </div>
          )}

          <div className="card-grid">
            {cafes.map((cafe) => (
              <CafeCard
                key={cafe.id}
                cafe={cafe}
                ref={(el) => { cardRefs.current[cafe.id] = el; }}
                isHovered={cafe.id === hoveredId}
                isSelected={cafe.id === selectedId}
                onHover={onHover}
                onLeave={onLeave}
                onSelect={onSelect}
              />
            ))}
          </div>
        </section>

        <section className="panel-map">
          <div className="map-caption">the grey city, your bright spots</div>
          <div className="map-frame">
            <CafeMap
              cafes={cafes}
              hoveredId={hoveredId}
              selectedId={selectedId}
              onHover={onHover}
              onLeave={onLeave}
              onSelect={onSelect}
              view={view}
            />
          </div>
        </section>
      </div>

      <div className="mobile-only-toggle view-toggle">
        <button aria-pressed={view === 'list'} onClick={() => setView('list')}>List</button>
        <button aria-pressed={view === 'map'} onClick={() => setView('map')}>Map</button>
      </div>
    </div>
  );
}
