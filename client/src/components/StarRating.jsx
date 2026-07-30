export default function StarRating({ value = 0, count, size = 'md', onRate }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className={`star-rating star-rating-${size}`} data-testid="star-rating" data-value={value}>
      {stars.map((n) => (
        <span
          key={n}
          className={`star ${n <= Math.round(value) ? 'star-filled' : ''} ${onRate ? 'star-interactive' : ''}`}
          onClick={onRate ? () => onRate(n) : undefined}
          data-testid={onRate ? `star-input-${n}` : undefined}
        >
          ★
        </span>
      ))}
      {count !== undefined && <span className="star-count" data-testid="star-count">({count})</span>}
    </span>
  );
}
