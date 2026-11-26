# Tinebox-Looper

## Build 13 (26 Nov 2026)
Rollback: tag `build-11` is the previous main (commit 98ad9e3).

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
