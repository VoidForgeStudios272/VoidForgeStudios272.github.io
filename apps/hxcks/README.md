# VoidForge Hxcks

Hxcks is a VoidForge companion hub for the KaHoax userscript. The userscript runs on `https://kahoot.it/*`; the VoidForge page itself cannot directly inspect or control another origin because of browser same-origin security.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) or a compatible userscript manager.
2. Open the **Hxcks** tab in VoidForge Studios.
3. Choose **Install Hxcks userscript** and confirm the install prompt.
4. Open [Kahoot](https://kahoot.it/). The KaHoax floating panel appears on the Kahoot page.

## Included KaHoax features

- Quiz ID lookup and public quiz search
- Question list with expandable question and answer details
- Show Answers highlighting
- Auto Answer toggle
- Points-per-question timing slider
- Input-lag compensation
- Multi-select quiz support
- Game PIN detection and copy
- Draggable, minimizable and closable floating panel
- Responsive panel sizing

The upstream project documents standard quiz, true/false and multi-select support. Open-ended questions are listed as a manual cheat sheet; puzzle, slider and drop-pin questions are marked planned/unsupported by upstream.

## Credits and license

This folder contains a modified copy of **KaHoax 1.1.5.1** by KRWCLASSIC, with upstream contributors credited in the source. The upstream MIT license is preserved in [LICENSE](./LICENSE). The VoidForge visual refresh changes presentation only; the upstream script logic is retained.

- Original repository: https://github.com/KRWCLASSIC/KaHoax
- Original author/project: KRWCLASSIC
- Upstream license: MIT

VoidForge Studios is not affiliated with Kahoot or KRWCLASSIC. Use only in sessions and contexts where you are permitted to use these tools.
