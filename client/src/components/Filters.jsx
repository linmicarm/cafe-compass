// Filter chips. Each group toggles values in the shared filters state.
// Enum options mirror the Postgres enums exactly.

const WIFI = ['spotty', 'decent', 'strong', 'blazing'];
const NOISE = ['silent', 'quiet', 'moderate', 'lively'];
const OUTLETS = ['scarce', 'some', 'plenty'];

function ChipGroup({ label, tint, options, selected, onToggle }) {
  return (
    <div className="filter-group">
      <div className="filter-label">{label}</div>
      <div className="chips">
        {options.map((opt) => (
          <button
            key={opt}
            className="chip"
            data-tint={tint}
            aria-pressed={selected.includes(opt)}
            onClick={() => onToggle(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Filters({ filters, vibes, onToggle, onClear, hasActive }) {
  return (
    <div className="filters">
      <ChipGroup label="Wifi" tint="wifi" options={WIFI}
        selected={filters.wifi} onToggle={(v) => onToggle('wifi', v)} />
      <ChipGroup label="Noise" tint="noise" options={NOISE}
        selected={filters.noise} onToggle={(v) => onToggle('noise', v)} />
      <ChipGroup label="Outlets" tint="outlets" options={OUTLETS}
        selected={filters.outlets} onToggle={(v) => onToggle('outlets', v)} />
      <ChipGroup label="Vibe" tint="vibe" options={vibes.map((v) => v.label)}
        selected={filters.vibe} onToggle={(v) => onToggle('vibe', v)} />

      {hasActive && (
        <button className="clear-btn" onClick={onClear}>clear all filters</button>
      )}
    </div>
  );
}
