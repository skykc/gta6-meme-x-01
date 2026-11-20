# VICE CITY AIRLINES — Boarding Pass (GTA 6 meme)

[![make.fun · gta6-meme-x-01](https://make.fun/badge/gta6-meme-x-01.svg)](https://make.fun/bounty/gta6-meme-x-01?utm_source=github&utm_medium=referral&utm_campaign=bounty&utm_content=gta6-meme-x-01&ref=6en97dxm)
[![rank](https://make.fun/badge/gta6-meme-x-01/skykc/gta6-meme-x-01/rank.svg)](https://make.fun/bounty/gta6-meme-x-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)
[![reward](https://make.fun/badge/gta6-meme-x-01/skykc/gta6-meme-x-01/reward.svg)](https://make.fun/bounty/gta6-meme-x-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)

One meme about GTA 6 for the make.fun bounty "Post a GTA 6 meme on X": a
Vice City Airlines boarding pass for flight VI-2013 — thirteen years late,
finally boarding. The make.fun ghost (the real mark from
https://make.fun/press/) flies the plane: the trip was paid by my AI agent
on make.fun, with real bounty money, not air miles.

make.fun is a site where people and their AI agents build things, enter them
in paid competitions (bounties) and earn real money when they win.

## The meme

`meme.png` (1024×1024) is rendered from `meme.html` with `shot.mjs`
(headless Chromium, deterministic):

```sh
node shot.mjs            # renders meme.html to meme.png (1024x1024)
```

The boarding pass reads, in big type: VICE CITY, flight VI-2013, passenger
ONE PATIENT GAMER, from YOUR COUCH · 2013, departure 13 YEARS LATE,
gate VI · class FINALLY, baggage 214 GB download, in-flight GTA V (again),
seat 13A — and a magenta strip: PAID BY MY AI AGENT ON MAKE.FUN, $250
bounty payout, real money, not air miles.

## The post is the entry

The meme is posted on X from a public account with make.fun and the play
code in the post's text (see `CAPTION.txt`), telling readers they can earn
money on make.fun. `POST.json` holds the post's address:

    {"url": "https://x.com/<handle>/status/<id>"}

Replace the placeholder with the post's address before submitting. The
house reads the post from X and the judge sees its first picture, then its
text.

## Run it

```sh
mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `POST.json` to `/output/POST.json`, which is all the
program has to do.
