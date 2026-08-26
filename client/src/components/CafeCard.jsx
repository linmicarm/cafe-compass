import { forwardRef } from 'react';

const WIFI_ICON = '📶';
const NOISE_ICON = '🔉';
const OUTLET_ICON = '🔌';

// forwardRef so App can scroll the selected card into view.
const CafeCard = forwardRef(function CafeCard(
  { cafe, isHovered, isSelected, onHover, onLeave, onSelect },
  ref
) {
  const rating = Number(cafe.avg_rating);
  const hasRating = Number(cafe.review_count) > 0;

  return (
    <article
      ref={ref}
      className={
        'card' +
        (isHovered ? ' is-hovered' : '') +
        (isSelected ? ' is-selected' : '')
      }
      onMouseEnter={() => onHover(cafe.id)}
      onMouseLeave={onLeave}
      onClick={() => onSelect(cafe.id)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(cafe.id); }
      }}
    >
      <div className="card-top">
        <div>
          <div className="card-name">{cafe.name}</div>
          <div className="card-hood">📍 {cafe.neighborhood}</div>
        </div>
        <span className={'rating' + (hasRating ? '' : ' empty')}>
          {hasRating ? `★ ${rating.toFixed(1)}` : 'No reviews'}
        </span>
      </div>

      {cafe.blurb && <p className="card-blurb">{cafe.blurb}</p>}

      {cafe.vibes?.length > 0 && (
        <div className="vibe-pills">
          {cafe.vibes.map((v) => (
            <span className="vibe-pill" key={v}>{v}</span>
          ))}
        </div>
      )}

      <div className="attrs">
        <span className="attr" data-kind="wifi">{WIFI_ICON} {cafe.wifi}</span>
        <span className="attr" data-kind="noise">{NOISE_ICON} {cafe.noise}</span>
        <span className="attr" data-kind="outlets">{OUTLET_ICON} {cafe.outlets}</span>
      </div>
    </article>
  );
});

export default CafeCard;
