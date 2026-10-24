export const deliveryLabel = (days: number) => `${days}-day delivery`;

export const revisionsLabel = (n: number) =>
  n === 0 ? 'No revisions' : `${n} ${n === 1 ? 'revision' : 'revisions'}`;
