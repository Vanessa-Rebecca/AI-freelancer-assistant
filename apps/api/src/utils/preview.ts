const PREVIEW_LENGTH = 160;

// First characters of a document on a word boundary, with line breaks flattened
export function preview(content: string) {
  const flat = content.replace(/\s+/g, ' ').trim();
  if (flat.length <= PREVIEW_LENGTH) return flat;
  const cut = flat.slice(0, PREVIEW_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : PREVIEW_LENGTH)}…`;
}
