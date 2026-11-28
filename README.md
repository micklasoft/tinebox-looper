# Tinebox-Looper

## Build 18 (28 Nov 2026): one file per project, a better synth
Rollback: build 17 is commit 075750f.

**One project, one TP-7 file.** Stop (switch 2) only stops the tape: the next Play records on into the same file, so every play-through lands in one file with its three tracks (line 1, USB 1, USB 2). Clear (switch 5) or ending the session closes the file: the app disarms, reads the file's name from the TP-7, and arms again. The Loop screen shows "TP-7 file open, m:ss". Fake TP-7 (`sim/run6.js`): 1 file across 2 play-throughs, closed by Clear, no rule breaks.

**Synth engine.** Measured on a new offline bench (`sim/synth-bench.js`, `sim/synth-offline.js`): Karplus-Strong strummed open chords (E, Am, C, G, D, Em, F, Dm, A, B7) with known notes, three guitar tones, clean, clipped, quiet and with a loop bleeding in. Mid tone, build 17 → build 18:

| Live synth | Build 17 | Build 18 |
|---|---|---|
| Chord notes right (note names) | 68 % | 92 % |
| Exact notes found (octave too) | 36 % | 62 % |
| Notes it plays that are wrong | 35 % | 7 % |
| Strings voiced within 200 ms | 29 of 52 | 46 of 52 |
| Delay to the voice, median / 90 % | 35 / 87 ms | 35 / 68 ms |
| Single notes, median delay | 17 ms | 17 ms |

Printed layer (offline): exact notes 28 % → 68 % right, onset error median 13 → 3 ms.

What changed:
- **Longer analysis window for the low strings:** 85 ms instead of 43 ms below 700 Hz. At E2 the strings sit 5 Hz apart, a fifth of a bin in 43 ms. The attack still comes from the 21 ms window above 700 Hz, and the window's weight sits late in it, so the delay did not grow.
- **Spectral whitening** (after Klapuri 2006), so a bright or a dark guitar looks alike to the tracker.
- **Fewer false notes:** a new note away from an attack needs 32 to 53 ms of evidence (the tracker's flicker mid-chord made most false notes); a voice whose note goes within 32 ms is cut in 30 ms, not on the sound's release.
- **Loops and metronome as echo reference:** what the app plays (not only the synth) now counts as echo, so a loop coming back into the guitar input cannot start a note.
- **Input high-pass** a little under the lowest string (DC, handling noise, hum).
- **No clicks from the output gain:** the voice-count gain and the limiter now ramp across each audio block (build 17 stepped them), then a soft clip.
- Audio thread cost: 4.3 % → 5.9 % of real time on the test machine.

Limits: the bench is synthetic guitar, not your guitar. Two notes an octave apart in one chord (E2 and E3) still often show as one. The real test is your playing.

## Build 17 (28 Nov 2026): the six-switch looper
Rollback: build 16 is commit 4644117.

One job per switch, single taps only (no double taps, no holds, nothing waits):
| Switch | Job |
|---|---|
| 1 | Record. Closes the loop. While a loop plays: start or stop an overdub |
| 2 | Play / stop. Each play-through is one TP-7 recording |
| 3 | Undo the newest layer, or cancel a recording |
| 4 | Redo |
| 5 | Clear the loop (only while stopped; the TP-7 files stay) |
| 6 | Keep what I just played: the last time round as a layer (before the first loop: the last 4 bars, metronome on) |

- **First press records at once:** the app connects to the TP-7 and makes the session on its own (on the first tap of the screen, or on switch 1).
- **First repeat:** starts as soon as it can and the loop moves with it, so no part of the loop's start is cut.
- **Metronome off by default** (button on the Loop screen). Loop length is free; the loop sets it.
- **Gone from the screen and the switches:** sections, tap tempo, fixed bar lengths, the arrangement and print mode, the raw/synth switch (the sound is chosen in Sounds), drum pads on the Loop screen, and all diagnostics but the level check. Their code stays for now.
- **Loop screen:** what the looper is doing, the layers (mute, drop), the six switches, also tappable.
- **Open:** with the metronome off, the app cannot follow the round trip from the metronome echo; on 26 Nov it crept from 79 to 139 ms over 12 minutes. Layers recorded late in a long session may sit late.

Fake TP-7: `sim/run6.js` drives all six switches from a cold page (2 play-throughs, 2 files, no rule breaks, no page errors).

## Build 16 (26 Nov 2026)
Rollback: build 15 is commit 994ea67.

From the build 15 phone run (21:01):
- **First repeat:** a fixed-length loop now closes 150 ms before its end (was 5 ms), so its first repeat is scheduled ahead. Fake TP-7: 0.0 ms cut on 3 of 3 two-bar loops (phone: 24 to 38 ms). The repeat margin is 5 ms (was 20 ms); free loops should lose about 25 ms instead of 40. Starting them on time would move the loop against the bar grid: not done.
- **Input level:** from test 2 on, the guitar peaked at 0 dBFS and the app's sound came back at -6 to -17 dBFS (before: -14 and -41 to -82). The app sent the same gain (CC 9 = 28, 9 dB) every time and nothing else that touches the input. The cause is not in the log. New: **1. Level and hearing check** (quiet input, echo, can you hear the clicks, loudest strum; sets the gain if it clips; logs the TP-7's mode, input, arm and tape state), and "input clipping" in the log whenever it clips.
- **Playback test:** the app checks which file the TP-7 has loaded, plays the take itself and listens for it.
- **Footswitch test:** asks if you hear the clicks first; the switches do nothing during it.
- **First repeat test:** keeps the tempo it started at (build 15 slid from 91 to 38.6 bpm).
- **New: 6. Live synth alone and with the metronome**, to see if the app's own sound in the input spoils the synth.
- **Hidden:** the 10-minute round trip test and the 30-minute long session. The log keeps the round trip moves.

Fake TP-7 checks: `sim/run.js`, `run3.js`, `run5.js` (2-bar cut, level check, synth A/B, playback). No rule breaks, no page errors.

## Build 15 (26 Nov 2026)
Rollback: build 14 is commit 4346619.

Diagnostics now show only tests whose answer is still open. The settled ones are hidden (their code stays, for reference).

| Shown | Plan test | Why it stays |
|---|---|---|
| 1. Capture take: TP-7 playback | 6 | failed on 26 Nov because the TP-7 was armed (app bug, fixed in 14); only the playback questions remain |
| 2. First repeat cut | 1 | one loop measured 39.7 ms against a 20 ms limit |
| 3. Footswitch timing | 2 | not run |
| 4. Press timing under load | 3 | not run |
| 5. Layers in time as the round trip moves | 7 | the round trip moved 71 to 123 ms and back; cause unknown |
| 6. Long session | 9 | not run |

| Hidden | Settled by |
|---|---|
| old 1, stance | 26 Nov: normal mode, armed is the stance; no stance gives all three |
| old 2, printing | 26 Nov: all passed |
| old 3, first loop | 26 Nov: all passed |
| old 4, sending the song | 26 Nov: A and C work, B needs hand steps |
| old 5, synth | 26 Nov: playable; its round-trip question moves to 5 |
| old 6, capture (full) | 26 Nov: loop, layer, undo, redo, keep passed |
| 10, TP-7 file head (plan 4) | 26 Nov phone 6 ms short (limit 10), Mac Test 5 15 of 15; every take keeps logging it (`t4`) |
| 12, double taps (plan 8) | 26 Nov: each worked; tap gaps keep logging (`t8`) |
| close and re-arm (plan 5) | Mac Test 5 and phone 26 Nov (221 ms); logged on every Stop (`t5`) |
| tap tempo (plan 10) | 26 Nov: metronome 47 ms after the fourth tap; logged (`t10`) |

## Build 14 (26 Nov 2026)
Rollback: build 13 is commit c65a7f8, build 11 is commit 98ad9e3.

From the build 13 phone run (26 Nov, 20:26):
- **Test 6 fix:** the TP-7 is disarmed before you play the take back. Build 13 left it armed, so the TP-7's Play recorded a new 2.35 s file instead of playing the take ("nothing", "loops gone"). It is armed again afterwards.
- **On screen:** a chip "TP-7 armed: its ▶ records" whenever the TP-7 is armed and not recording a take.
- **Report and Share log** now hold the whole log (2000 lines), not the last 300.

**New diagnostics, one per phone test in the test plan** (each prints the plan's pass mark and a ✓ or ✗):
| Diagnostic | Plan test | Time |
|---|---|---|
| 7. First repeat cut | 1 | 5 min |
| 8. Footswitch timing against the click | 2 | 5 min |
| 9. Press timing under load | 3 | 1 min |
| 10. TP-7 file head | 4 | 3 min (10 TP-7 files to delete) |
| 11. Layers in time as the round trip moves | 7 | 10 min |
| 12. Double-tap windows | 8 | 8 min |
| 13. Long session | 9 | 30 min |

Plan test 5 ran on the Mac (Test 5). Plan test 6 is diagnostics 6. Plan test 10 is in the log (`t10` lines: fourth tap to metronome) after any four-tap session. Plan test 11 needs MTP and your OK.
Suggested order: 9, 8, 7, 10, 6, 12, then 11 and 13 when you have time.

**Fake TP-7 checks** (`sim/`): `run.js` capture (4 play-throughs, 4 files), `run2.js` arrangement path and the timing tools, `run3.js` diagnostics 7, 9, 10 and 12. All pass on build 14 with no rule breaks.

## Build 13 (26 Nov 2026)
Rollback: build 11 is commit 98ad9e3 (https://github.com/micklasoft/tinebox-looper/commit/98ad9e3).

**Capture fixes (build 12's, redone on build 11, with Test 5's numbers):**
- capStop: Stop, 150 ms, disarm, wait for armed = 0 and a K notice for a *new* file, arm again, Start Session. Build 11 never disarmed, so all play-throughs went into one open file, and it reported the previous file as the new take.
- A file that Start Session reports (always the newest closed file) is no longer taken for a new take.
- Start Session after the greet and around arming, so the TP-7 sends its notices.
- The playing state is read from the Play and Stop replies too.

**Waits**
| Wait | Build 11 | Build 13 | Evidence | Tested on the TP-7? |
|---|---|---|---|---|
| Start Session to Play (capStart) | 80 ms | gone: Play alone, Start Session sent ahead when armed | Test 5 always sent Start Session 80 ms before Play | **No**: test 4 checks one new file per take (the log says "no new TP-7 file" if not) |
| Stop to disarm (capStop) | none (never disarmed) | 150 ms | Test 5: 15 of 15 takes OK at 150 ms | Yes (Mac) |
| After Stop, before reading the file | 400 ms + Start Session | the K notice after the disarm; Start Session only as fallback | Test 5: K about 16 ms after armed = 0 | Yes (Mac) |
| Creation pass, before reading the file (arrangement mode) | 400 ms + Start Session | the K notice after the disarm | Test 5 | Yes (Mac), not in this path |
| Stop to edit toggle (tpPerform) | 120 ms | the reply to Stop | none | **No** |
| Edit mode toggle | 200 ms, then every 60 ms, then 80 ms | at once, every 20 ms to 0.9 s, no margin | Mac 19 Nov: toggle took 3 to 4 ms | **No** (margin removed) |
| Stop to Play | 250 ms (implicit) | 255 ms guard, only if you press within it | HANDOFF safety rule (250 to 900 ms) | kept |
| Round trip measure | none | waits until the input has been open 3 s | Mac 19 Nov: the round trip stepped 1 s after the stream opened | kept (first session after a page load only) |
| Stop to go to start (tpToStart), cue taps, print path | as before | as before | HANDOFF safety rules, each cost a freeze or a recording | kept |
| Switch 6 single tap | 350 ms | 350 ms | needed to tell a single tap from a double tap | kept, test 8 measures it |
| Diagnostics listening windows | as before | as before | they are the test | kept |

**Logging for the phone tests** (Settings, Tests and log; log lines are tagged):
- `t1` how far into the loop the first repeat starts, with the output latency.
- `t2` Settings, **Footswitch timing**: 16 presses of switch 1 on the clicks; median, SD, outliers. Logs only, sets no correction.
- `t3` Settings, **Press timing under load**: the app stutters 200 ms every 600 ms; press switch 4 ten times.
- `t4` each take: press to Play, Play to first position, file length against Play to Stop.
- `t5` each Stop: Stop to armed = 0, how the file was found, Stop to armed again.
- `t8` switch 6 and switch 1 tap gaps. `t10` fourth tap to the metronome running.
- **Share log** saves the report and the whole log (now 2000 lines, ms resolution) as one .txt file.

**Fake TP-7 check** (`sim/`): `node sim/run.js $PWD/index.html` (Playwright). Copies Test 5's behaviour. Build 13: 4 play-throughs gave 4 new files, Stop to re-armed 231 ms, no rule breaks.
