"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renders children at the end of document.body.
 *
 * Needed for overlays inside a screen whose root is `position: fixed`. A fixed
 * element creates its own stacking context, so a z-index set inside it is only
 * ever compared against its siblings — no value, however large, can lift a
 * modal above the bottom nav, which sits at the root. Portalling out puts the
 * overlay back on the root's stacking context where its z-index means what it
 * looks like it means.
 */
export default function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // document.body only exists once mounted; nothing renders on the server.
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}
