# Vehicle photos

Photos shown in the "Photos" strip on the bus detail screen. Drop files here
and they appear automatically — no code change, no database change.

## Start here: one shared set for every company

Add these four and every company uses them:

```
default-1.jpg   ← bus exterior
default-2.jpg   ← interior / aisle
default-3.jpg   ← seats close-up
default-4.jpg   ← luggage bay or boarding
```

## Later: override per company

If a specific operator supplies real photos, name them after its slug and they
take precedence over the defaults for that company only:

```
vireak-buntham-1.jpg
vireak-buntham-2.jpg
```

Each slot tries, in order: `<slug>-N.jpg` → `<slug>-N.png` → `default-N.jpg`
→ `default-N.png`. The slug is the company name lowercased with runs of
non-alphanumeric characters collapsed to a dash (see `companySlug` in
`components/CompanyLogo.tsx`) — e.g. `Capitol Tour` → `capitol-tour`.

## Sizing

Rendered at 168×104 (roughly 3:2) and cropped to fill, so around 800×500 or
larger stays sharp. These ship with the app — compress before committing and
keep each file well under ~300KB.

With no files at all, the strip falls back to placeholder tiles.
