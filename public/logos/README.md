# Company logos

Drop real logos here as `<company-slug>.png` and `CompanyLogo` picks them up
automatically — no code change needed.

The slug is the company name lowercased with every run of non-alphanumeric
characters collapsed to a single dash (see `companySlug` in
`components/CompanyLogo.tsx`). For the companies currently seeded:

| Company          | File                    |
| ---------------- | ----------------------- |
| Vireak Buntham   | `vireak-buntham.png`    |
| Larita           | `larita.png`            |
| Capitol Tour     | `capitol-tour.png`      |
| Mekong Express   | `mekong-express.png`    |

Square artwork, ideally 160×160 or larger. Until a file exists, the component
falls back to a tinted square with the company's initial.
