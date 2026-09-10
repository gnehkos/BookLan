# -*- coding: utf-8 -*-
"""Regenerate lib/i18n/dictionary.ts from TRANSLATIONS.md.

Run after editing the Khmer column:  python3 scripts/gen-i18n.py
"""
import io, re, sys

src = io.open("TRANSLATIONS.md", encoding="utf-8").read()
rows = re.findall(r"^\|\s*`([^`]+)`\s*\|(.+?)\|(.+?)\|\s*$", src, re.M)

seen, entries = set(), []
for key, en, km in rows:
    key, en, km = key.strip(), en.strip(), km.strip()
    if not key or key in seen:
        continue
    seen.add(key)
    entries.append((key, en, km))

missing = [k for k, _, km in entries if not km]
if missing:
    sys.exit(f"Khmer missing for: {missing}")


def ts(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


out = ['/**',
       ' * Generated from TRANSLATIONS.md by scripts/gen-i18n.py — do not edit by hand.',
       ' *',
       ' * Edit the Khmer column in that file and re-run the script, so the worksheet',
       ' * the translations were reviewed in stays the single source of truth.',
       ' */',
       '',
       'export const en = {']
out += [f"  {ts(k)}: {ts(e)}," for k, e, _ in entries]
out += ['} as const;', '', 'export type TranslationKey = keyof typeof en;', '',
        'export const km: Record<TranslationKey, string> = {']
out += [f"  {ts(k)}: {ts(m)}," for k, _, m in entries]
out += ['};', '']

io.open("lib/i18n/dictionary.ts", "w", encoding="utf-8", newline="\n").write("\n".join(out))
print(f"wrote lib/i18n/dictionary.ts with {len(entries)} keys")
