/**
 * The BookLan mark, inlined rather than loaded as a file.
 *
 * The supplied SVGs sit in a 251.91×326 canvas that the artwork fills only a
 * corner of, so the mark would float tiny in any container it was dropped in.
 * The three paths are reproduced below against a tight viewBox instead.
 *
 * The colours are the logo's own and are never overridden — anywhere the mark
 * appears, the background is chosen to suit it rather than the artwork being
 * repainted to suit the background.
 *
 * The original files remain in public/logos as the source of truth, alongside
 * cropped copies (booklan-mark.svg, booklan-wordmark.svg) for anywhere an
 * <img> is wanted.
 */
export default function BooklanLogo({
  className = "",
  /**
   * Staggers the three shapes so the mark assembles itself. Only the splash
   * uses it; everywhere else the logo is simply present.
   */
  assemble = false,
}: {
  className?: string;
  assemble?: boolean;
}) {
  const part = (index: number) =>
    assemble ? `booklan-mark-part booklan-mark-part-${index}` : undefined;

  const navy = "#19355F";
  const teal = "#00A79D";

  return (
    <svg
      viewBox="65 46 115 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="BookLan"
    >
      <path
        className={part(1)}
        fill={navy}
        d="M69,48.27h69.85a1.89,1.89,0,0,1,1,.31L167.28,66.3a1.89,1.89,0,0,1-1.05,3.48L75.39,68.63a1.9,1.9,0,0,1-1.75-1.21L67.25,50.85A1.89,1.89,0,0,1,69,48.27Z"
      />
      <path
        className={part(2)}
        fill={teal}
        d="M78.73,72.71h61.91a5.49,5.49,0,0,1,5.11,3.47l1.84,4.61a3.64,3.64,0,0,1-3.38,5H83a2.14,2.14,0,0,1-1.61-.71,24.94,24.94,0,0,1-4.78-9.57A2.18,2.18,0,0,1,78.73,72.71Z"
      />
      <path
        className={part(3)}
        fill={navy}
        d="M152.93,73.27h17.19A4.61,4.61,0,0,1,174,75.36l3.73,5.7a3,3,0,0,1-2.54,4.71h-17.8A3.58,3.58,0,0,1,154,83.52l-3-7.49A2,2,0,0,1,152.93,73.27Z"
      />
    </svg>
  );
}
