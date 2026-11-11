(()=>{"use strict";
const slug=document.body.dataset.game||location.pathname.split("/").filter(Boolean).pop()||"arcade";
const data={
"starfall":["Starfall","Catch falling stars and avoid dark sparks.","collect"],"driftline":["Driftline","Steer through traffic and survive the road.","dodge"],"color-cascade":["Color Cascade","Tap the color named above.","color"],"orbit-pilot":["Orbit Pilot","Pilot through a field of hazards.","dodge"],"dungeon-dash":["Dungeon Dash","Collect relics while avoiding monsters.","collect"],"bubble-pop":["Bubble Pop","Pop as many bubbles as possible.","click"],"sudoku-lite":["Sudoku Lite","Cycle numbers in the 4×4 grid.","grid"],"chess-arena":["Chess Arena","Capture the marked squares.","grid"],"checkers":["Checkers","Select pieces to clear the board.","grid"],"connect-four":["Connect Four","Connect four matching tokens.","grid"],"word-scramble":["Word Scramble","Unscramble the hidden word.","word"],"typing-blitz":["Typing Blitz","Type the displayed word accurately.","typing"],"math-blaster":["Math Blaster","Solve equations to charge your blaster.","math"],"pattern-memory":["Pattern Memory","Repeat the glowing tile sequence.","memory"],"maze-runner":["Maze Runner","Find the exit through the maze.","maze"],"laser-defender":["Laser Defender","Tap incoming targets before they reach you.","click"],"fruit-slicer":["Fruit Slicer","Tap the fruit targets quickly.","click"],"stack-tower":["Stack Tower","Stop the moving block near the center.","stack"],"gravity-flip":["Gravity Flip","Move to dodge incoming obstacles.","dodge"],"submarine-rescue":["Submarine Rescue","Collect air bubbles and avoid mines.","collect"],"cosmic-miner":["Cosmic Miner","Collect crystals while avoiding asteroids.","collect"],"traffic-weave":["Traffic Weave","Navigate through busy lanes.","dodge"],"pixel-farm":["Pixel Farm","Harvest crops before time runs out.","click"],"card-duel":["Card Duel","Draw cards and get close to 21.","cards"],"rhythm-tap":["Rhythm Tap","Tap the beat markers as they arrive.","click"],
"block-breaker":["Block Breaker","Clear the colorful blocks before time runs out.","click"],
"lunar-lander":["Lunar Lander","Guide your lander through the final approach.","dodge"],
"number-rush":["Number Rush","Solve quick number challenges under pressure.","math"],
"emoji-match":["Emoji Match","Tap the emoji shown in the prompt.","color"],
"target-practice":["Target Practice","Hit the targets as fast as you can.","click"],
"word-race":["Word Race","Unscramble words before the clock runs out.","word"],
"color-match":["Color Match","Match the displayed color without getting distracted.","color"],
"dodgeball":["Dodgeball","Move your player to avoid incoming balls.","dodge"],
"treasure-hunt":["Treasure Hunt","Explore the board and find hidden treasure.","maze"],
"ice-slide":["Ice Slide","Navigate slippery lanes and reach the goal.","maze"],
"rocket-rescue":["Rocket Rescue","Collect rescue beacons in orbit.","collect"],
"tower-climb":["Tower Climb","Climb higher by timing your moves.","stack"],
"bug-squash":["Bug Squash","Tap the bugs before they escape.","click"],
"gem-match":["Gem Match","Clear gems in a fast matching challenge.","grid"],
"quick-draw":["Quick Draw","React as soon as the signal appears.","click"],
"logic-lock":["Logic Lock","Crack the number pattern to unlock the vault.","math"],
"spelling-bee":["Spelling Bee","Spell the displayed word correctly.","typing"],
"fraction-frenzy":["Fraction Frenzy","Solve quick fraction and number questions.","math"],
"memory-pairs":["Memory Pairs","Remember the pattern and match the tiles.","memory"],
"shape-shift":["Shape Shift","Find the matching shape in the grid.","grid"],
"space-invaders-mini":["Space Invaders Mini","Defend the sector by hitting the targets.","click"],
"pinball-flip":["Pinball Flip","Tap to keep the pinball challenge going.","click"],
"coin-catcher":["Coin Catcher","Collect coins and avoid hazards.","collect"],
"river-crossing":["River Crossing","Find a safe path to the other side.","maze"],
"dungeon-keys":["Dungeon Keys","Find the key and reach the dungeon exit.","maze"]};
Object.assign(data,{
"neon-sprint":["Neon Sprint","Collect glowing energy orbs, avoid hazards and beat your best score.","collect"],
"neon-quest":["Neon Quest","Move through a shifting hazard field and survive for as long as possible.","dodge"],
"neon-dash":["Neon Dash","Hit every target before the timer runs out and build a high score.","click"],
"neon-rescue":["Neon Rescue","Match the called-out color quickly and avoid losing precious seconds.","color"],
"neon-rally":["Neon Rally","Work through a compact interactive grid challenge and score points.","grid"],
"neon-run":["Neon Run","Explore the board, mark your route and find the exit.","maze"],
"neon-escape":["Neon Escape","Watch the sequence, remember the pattern and repeat it correctly.","memory"],
"neon-trials":["Neon Trials","Unscramble a space-themed word before the countdown reaches zero.","word"],
"neon-expedition":["Neon Expedition","Type the displayed word accurately to keep your streak alive.","typing"],
"neon-showdown":["Neon Showdown","Solve quick number questions to earn points against the clock.","math"],
"crystal-sprint":["Crystal Sprint","Time each stop carefully and stack up a new personal best.","stack"],
"crystal-quest":["Crystal Quest","Draw carefully, manage your total and score as close to 21 as you can.","cards"],
"crystal-dash":["Crystal Dash","Collect glowing energy orbs, avoid hazards and beat your best score.","collect"],
"crystal-rescue":["Crystal Rescue","Move through a shifting hazard field and survive for as long as possible.","dodge"],
"crystal-rally":["Crystal Rally","Hit every target before the timer runs out and build a high score.","click"],
"crystal-run":["Crystal Run","Match the called-out color quickly and avoid losing precious seconds.","color"],
"crystal-escape":["Crystal Escape","Work through a compact interactive grid challenge and score points.","grid"],
"crystal-trials":["Crystal Trials","Explore the board, mark your route and find the exit.","maze"],
"crystal-expedition":["Crystal Expedition","Watch the sequence, remember the pattern and repeat it correctly.","memory"],
"crystal-showdown":["Crystal Showdown","Unscramble a space-themed word before the countdown reaches zero.","word"],
"quantum-sprint":["Quantum Sprint","Type the displayed word accurately to keep your streak alive.","typing"],
"quantum-quest":["Quantum Quest","Solve quick number questions to earn points against the clock.","math"],
"quantum-dash":["Quantum Dash","Time each stop carefully and stack up a new personal best.","stack"],
"quantum-rescue":["Quantum Rescue","Draw carefully, manage your total and score as close to 21 as you can.","cards"],
"quantum-rally":["Quantum Rally","Collect glowing energy orbs, avoid hazards and beat your best score.","collect"],
"quantum-run":["Quantum Run","Move through a shifting hazard field and survive for as long as possible.","dodge"],
"quantum-escape":["Quantum Escape","Hit every target before the timer runs out and build a high score.","click"],
"quantum-trials":["Quantum Trials","Match the called-out color quickly and avoid losing precious seconds.","color"],
"quantum-expedition":["Quantum Expedition","Work through a compact interactive grid challenge and score points.","grid"],
"quantum-showdown":["Quantum Showdown","Explore the board, mark your route and find the exit.","maze"],
"turbo-sprint":["Turbo Sprint","Watch the sequence, remember the pattern and repeat it correctly.","memory"],
"turbo-quest":["Turbo Quest","Unscramble a space-themed word before the countdown reaches zero.","word"],
"turbo-dash":["Turbo Dash","Type the displayed word accurately to keep your streak alive.","typing"],
"turbo-rescue":["Turbo Rescue","Solve quick number questions to earn points against the clock.","math"],
"turbo-rally":["Turbo Rally","Time each stop carefully and stack up a new personal best.","stack"],
"turbo-run":["Turbo Run","Draw carefully, manage your total and score as close to 21 as you can.","cards"],
"turbo-escape":["Turbo Escape","Collect glowing energy orbs, avoid hazards and beat your best score.","collect"],
"turbo-trials":["Turbo Trials","Move through a shifting hazard field and survive for as long as possible.","dodge"],
"turbo-expedition":["Turbo Expedition","Hit every target before the timer runs out and build a high score.","click"],
"turbo-showdown":["Turbo Showdown","Match the called-out color quickly and avoid losing precious seconds.","color"],
"pixel-sprint":["Pixel Sprint","Work through a compact interactive grid challenge and score points.","grid"],
"pixel-quest":["Pixel Quest","Explore the board, mark your route and find the exit.","maze"],
"pixel-dash":["Pixel Dash","Watch the sequence, remember the pattern and repeat it correctly.","memory"],
"pixel-rescue":["Pixel Rescue","Unscramble a space-themed word before the countdown reaches zero.","word"],
"pixel-rally":["Pixel Rally","Type the displayed word accurately to keep your streak alive.","typing"],
"pixel-run":["Pixel Run","Solve quick number questions to earn points against the clock.","math"],
"pixel-escape":["Pixel Escape","Time each stop carefully and stack up a new personal best.","stack"],
"pixel-trials":["Pixel Trials","Draw carefully, manage your total and score as close to 21 as you can.","cards"],
"pixel-expedition":["Pixel Expedition","Collect glowing energy orbs, avoid hazards and beat your best score.","collect"],
"pixel-showdown":["Pixel Showdown","Move through a shifting hazard field and survive for as long as possible.","dodge"],
"shadow-sprint":["Shadow Sprint","Hit every target before the timer runs out and build a high score.","click"],
"shadow-quest":["Shadow Quest","Match the called-out color quickly and avoid losing precious seconds.","color"],
"shadow-dash":["Shadow Dash","Work through a compact interactive grid challenge and score points.","grid"],
"shadow-rescue":["Shadow Rescue","Explore the board, mark your route and find the exit.","maze"],
"shadow-rally":["Shadow Rally","Watch the sequence, remember the pattern and repeat it correctly.","memory"],
"shadow-run":["Shadow Run","Unscramble a space-themed word before the countdown reaches zero.","word"],
"shadow-escape":["Shadow Escape","Type the displayed word accurately to keep your streak alive.","typing"],
"shadow-trials":["Shadow Trials","Solve quick number questions to earn points against the clock.","math"],
"shadow-expedition":["Shadow Expedition","Time each stop carefully and stack up a new personal best.","stack"],
"shadow-showdown":["Shadow Showdown","Draw carefully, manage your total and score as close to 21 as you can.","cards"],
"solar-sprint":["Solar Sprint","Collect glowing energy orbs, avoid hazards and beat your best score.","collect"],
"solar-quest":["Solar Quest","Move through a shifting hazard field and survive for as long as possible.","dodge"],
"solar-dash":["Solar Dash","Hit every target before the timer runs out and build a high score.","click"],
"solar-rescue":["Solar Rescue","Match the called-out color quickly and avoid losing precious seconds.","color"],
"solar-rally":["Solar Rally","Work through a compact interactive grid challenge and score points.","grid"],
"solar-run":["Solar Run","Explore the board, mark your route and find the exit.","maze"],
"solar-escape":["Solar Escape","Watch the sequence, remember the pattern and repeat it correctly.","memory"],
"solar-trials":["Solar Trials","Unscramble a space-themed word before the countdown reaches zero.","word"],
"solar-expedition":["Solar Expedition","Type the displayed word accurately to keep your streak alive.","typing"],
"solar-showdown":["Solar Showdown","Solve quick number questions to earn points against the clock.","math"],
"lunar-sprint":["Lunar Sprint","Time each stop carefully and stack up a new personal best.","stack"],
"lunar-quest":["Lunar Quest","Draw carefully, manage your total and score as close to 21 as you can.","cards"],
"lunar-dash":["Lunar Dash","Collect glowing energy orbs, avoid hazards and beat your best score.","collect"],
"lunar-rescue":["Lunar Rescue","Move through a shifting hazard field and survive for as long as possible.","dodge"],
"lunar-rally":["Lunar Rally","Hit every target before the timer runs out and build a high score.","click"],
"lunar-run":["Lunar Run","Match the called-out color quickly and avoid losing precious seconds.","color"],
"lunar-escape":["Lunar Escape","Work through a compact interactive grid challenge and score points.","grid"],
"lunar-trials":["Lunar Trials","Explore the board, mark your route and find the exit.","maze"],
"lunar-expedition":["Lunar Expedition","Watch the sequence, remember the pattern and repeat it correctly.","memory"],
"lunar-showdown":["Lunar Showdown","Unscramble a space-themed word before the countdown reaches zero.","word"],
"cyber-sprint":["Cyber Sprint","Type the displayed word accurately to keep your streak alive.","typing"],
"cyber-quest":["Cyber Quest","Solve quick number questions to earn points against the clock.","math"],
"cyber-dash":["Cyber Dash","Time each stop carefully and stack up a new personal best.","stack"],
"cyber-rescue":["Cyber Rescue","Draw carefully, manage your total and score as close to 21 as you can.","cards"],
"cyber-rally":["Cyber Rally","Collect glowing energy orbs, avoid hazards and beat your best score.","collect"],
"cyber-run":["Cyber Run","Move through a shifting hazard field and survive for as long as possible.","dodge"],
"cyber-escape":["Cyber Escape","Hit every target before the timer runs out and build a high score.","click"],
"cyber-trials":["Cyber Trials","Match the called-out color quickly and avoid losing precious seconds.","color"],
"cyber-expedition":["Cyber Expedition","Work through a compact interactive grid challenge and score points.","grid"],
"cyber-showdown":["Cyber Showdown","Explore the board, mark your route and find the exit.","maze"],
"mystic-sprint":["Mystic Sprint","Watch the sequence, remember the pattern and repeat it correctly.","memory"],
"mystic-quest":["Mystic Quest","Unscramble a space-themed word before the countdown reaches zero.","word"],
"mystic-dash":["Mystic Dash","Type the displayed word accurately to keep your streak alive.","typing"],
"mystic-rescue":["Mystic Rescue","Solve quick number questions to earn points against the clock.","math"],
"mystic-rally":["Mystic Rally","Time each stop carefully and stack up a new personal best.","stack"],
"mystic-run":["Mystic Run","Draw carefully, manage your total and score as close to 21 as you can.","cards"],
"mystic-escape":["Mystic Escape","Collect glowing energy orbs, avoid hazards and beat your best score.","collect"],
"mystic-trials":["Mystic Trials","Move through a shifting hazard field and survive for as long as possible.","dodge"],
"mystic-expedition":["Mystic Expedition","Hit every target before the timer runs out and build a high score.","click"],
"mystic-showdown":["Mystic Showdown","Match the called-out color quickly and avoid losing precious seconds.","color"],
"frost-sprint":["Frost Sprint","Work through a compact interactive grid challenge and score points.","grid"],
"frost-quest":["Frost Quest","Explore the board, mark your route and find the exit.","maze"],
"frost-dash":["Frost Dash","Watch the sequence, remember the pattern and repeat it correctly.","memory"],
"frost-rescue":["Frost Rescue","Unscramble a space-themed word before the countdown reaches zero.","word"],
"frost-rally":["Frost Rally","Type the displayed word accurately to keep your streak alive.","typing"],
"frost-run":["Frost Run","Solve quick number questions to earn points against the clock.","math"],
"frost-escape":["Frost Escape","Time each stop carefully and stack up a new personal best.","stack"],
"frost-trials":["Frost Trials","Draw carefully, manage your total and score as close to 21 as you can.","cards"],
"frost-expedition":["Frost Expedition","Collect glowing energy orbs, avoid hazards and beat your best score.","collect"],
"frost-showdown":["Frost Showdown","Move through a shifting hazard field and survive for as long as possible.","dodge"],
"ember-sprint":["Ember Sprint","Hit every target before the timer runs out and build a high score.","click"],
"ember-quest":["Ember Quest","Match the called-out color quickly and avoid losing precious seconds.","color"],
"ember-dash":["Ember Dash","Work through a compact interactive grid challenge and score points.","grid"],
"ember-rescue":["Ember Rescue","Explore the board, mark your route and find the exit.","maze"],
"ember-rally":["Ember Rally","Watch the sequence, remember the pattern and repeat it correctly.","memory"],
"ember-run":["Ember Run","Unscramble a space-themed word before the countdown reaches zero.","word"],
"ember-escape":["Ember Escape","Type the displayed word accurately to keep your streak alive.","typing"],
"ember-trials":["Ember Trials","Solve quick number questions to earn points against the clock.","math"],
"ember-expedition":["Ember Expedition","Time each stop carefully and stack up a new personal best.","stack"],
"ember-showdown":["Ember Showdown","Draw carefully, manage your total and score as close to 21 as you can.","cards"],
"thunder-sprint":["Thunder Sprint","Collect glowing energy orbs, avoid hazards and beat your best score.","collect"],
"thunder-quest":["Thunder Quest","Move through a shifting hazard field and survive for as long as possible.","dodge"],
"thunder-dash":["Thunder Dash","Hit every target before the timer runs out and build a high score.","click"],
"thunder-rescue":["Thunder Rescue","Match the called-out color quickly and avoid losing precious seconds.","color"],
"thunder-rally":["Thunder Rally","Work through a compact interactive grid challenge and score points.","grid"],
"thunder-run":["Thunder Run","Explore the board, mark your route and find the exit.","maze"],
"thunder-escape":["Thunder Escape","Watch the sequence, remember the pattern and repeat it correctly.","memory"],
"thunder-trials":["Thunder Trials","Unscramble a space-themed word before the countdown reaches zero.","word"],
"thunder-expedition":["Thunder Expedition","Type the displayed word accurately to keep your streak alive.","typing"],
"thunder-showdown":["Thunder Showdown","Solve quick number questions to earn points against the clock.","math"],
"astro-sprint":["Astro Sprint","Time each stop carefully and stack up a new personal best.","stack"],
"astro-quest":["Astro Quest","Draw carefully, manage your total and score as close to 21 as you can.","cards"],
"astro-dash":["Astro Dash","Collect glowing energy orbs, avoid hazards and beat your best score.","collect"],
"astro-rescue":["Astro Rescue","Move through a shifting hazard field and survive for as long as possible.","dodge"],
"astro-rally":["Astro Rally","Hit every target before the timer runs out and build a high score.","click"],
"astro-run":["Astro Run","Match the called-out color quickly and avoid losing precious seconds.","color"],
"astro-escape":["Astro Escape","Work through a compact interactive grid challenge and score points.","grid"],
"astro-trials":["Astro Trials","Explore the board, mark your route and find the exit.","maze"],
"astro-expedition":["Astro Expedition","Watch the sequence, remember the pattern and repeat it correctly.","memory"],
"astro-showdown":["Astro Showdown","Unscramble a space-themed word before the countdown reaches zero.","word"],
"robo-sprint":["Robo Sprint","Type the displayed word accurately to keep your streak alive.","typing"],
"robo-quest":["Robo Quest","Solve quick number questions to earn points against the clock.","math"],
"robo-dash":["Robo Dash","Time each stop carefully and stack up a new personal best.","stack"],
"robo-rescue":["Robo Rescue","Draw carefully, manage your total and score as close to 21 as you can.","cards"],
"robo-rally":["Robo Rally","Collect glowing energy orbs, avoid hazards and beat your best score.","collect"],
"robo-run":["Robo Run","Move through a shifting hazard field and survive for as long as possible.","dodge"],
"robo-escape":["Robo Escape","Hit every target before the timer runs out and build a high score.","click"],
"robo-trials":["Robo Trials","Match the called-out color quickly and avoid losing precious seconds.","color"],
"robo-expedition":["Robo Expedition","Work through a compact interactive grid challenge and score points.","grid"],
"robo-showdown":["Robo Showdown","Explore the board, mark your route and find the exit.","maze"],
"aqua-sprint":["Aqua Sprint","Watch the sequence, remember the pattern and repeat it correctly.","memory"],
"aqua-quest":["Aqua Quest","Unscramble a space-themed word before the countdown reaches zero.","word"],
"aqua-dash":["Aqua Dash","Type the displayed word accurately to keep your streak alive.","typing"],
"aqua-rescue":["Aqua Rescue","Solve quick number questions to earn points against the clock.","math"],
"aqua-rally":["Aqua Rally","Time each stop carefully and stack up a new personal best.","stack"],
"aqua-run":["Aqua Run","Draw carefully, manage your total and score as close to 21 as you can.","cards"],
"aqua-escape":["Aqua Escape","Collect glowing energy orbs, avoid hazards and beat your best score.","collect"],
"aqua-trials":["Aqua Trials","Move through a shifting hazard field and survive for as long as possible.","dodge"],
"aqua-expedition":["Aqua Expedition","Hit every target before the timer runs out and build a high score.","click"],
"aqua-showdown":["Aqua Showdown","Match the called-out color quickly and avoid losing precious seconds.","color"],
"jungle-sprint":["Jungle Sprint","Work through a compact interactive grid challenge and score points.","grid"],
"jungle-quest":["Jungle Quest","Explore the board, mark your route and find the exit.","maze"],
"jungle-dash":["Jungle Dash","Watch the sequence, remember the pattern and repeat it correctly.","memory"],
"jungle-rescue":["Jungle Rescue","Unscramble a space-themed word before the countdown reaches zero.","word"],
"jungle-rally":["Jungle Rally","Type the displayed word accurately to keep your streak alive.","typing"],
"jungle-run":["Jungle Run","Solve quick number questions to earn points against the clock.","math"],
"jungle-escape":["Jungle Escape","Time each stop carefully and stack up a new personal best.","stack"],
"jungle-trials":["Jungle Trials","Draw carefully, manage your total and score as close to 21 as you can.","cards"],
"jungle-expedition":["Jungle Expedition","Collect glowing energy orbs, avoid hazards and beat your best score.","collect"],
"jungle-showdown":["Jungle Showdown","Move through a shifting hazard field and survive for as long as possible.","dodge"],
"desert-sprint":["Desert Sprint","Hit every target before the timer runs out and build a high score.","click"],
"desert-quest":["Desert Quest","Match the called-out color quickly and avoid losing precious seconds.","color"],
"desert-dash":["Desert Dash","Work through a compact interactive grid challenge and score points.","grid"],
"desert-rescue":["Desert Rescue","Explore the board, mark your route and find the exit.","maze"],
"desert-rally":["Desert Rally","Watch the sequence, remember the pattern and repeat it correctly.","memory"],
"desert-run":["Desert Run","Unscramble a space-themed word before the countdown reaches zero.","word"],
"desert-escape":["Desert Escape","Type the displayed word accurately to keep your streak alive.","typing"],
"desert-trials":["Desert Trials","Solve quick number questions to earn points against the clock.","math"],
"desert-expedition":["Desert Expedition","Time each stop carefully and stack up a new personal best.","stack"],
"desert-showdown":["Desert Showdown","Draw carefully, manage your total and score as close to 21 as you can.","cards"],
"arctic-sprint":["Arctic Sprint","Collect glowing energy orbs, avoid hazards and beat your best score.","collect"],
"arctic-quest":["Arctic Quest","Move through a shifting hazard field and survive for as long as possible.","dodge"],
"arctic-dash":["Arctic Dash","Hit every target before the timer runs out and build a high score.","click"],
"arctic-rescue":["Arctic Rescue","Match the called-out color quickly and avoid losing precious seconds.","color"],
"arctic-rally":["Arctic Rally","Work through a compact interactive grid challenge and score points.","grid"],
"arctic-run":["Arctic Run","Explore the board, mark your route and find the exit.","maze"],
"arctic-escape":["Arctic Escape","Watch the sequence, remember the pattern and repeat it correctly.","memory"],
"arctic-trials":["Arctic Trials","Unscramble a space-themed word before the countdown reaches zero.","word"],
"arctic-expedition":["Arctic Expedition","Type the displayed word accurately to keep your streak alive.","typing"],
"arctic-showdown":["Arctic Showdown","Solve quick number questions to earn points against the clock.","math"],
"volcano-sprint":["Volcano Sprint","Time each stop carefully and stack up a new personal best.","stack"],
"volcano-quest":["Volcano Quest","Draw carefully, manage your total and score as close to 21 as you can.","cards"],
"volcano-dash":["Volcano Dash","Collect glowing energy orbs, avoid hazards and beat your best score.","collect"],
"volcano-rescue":["Volcano Rescue","Move through a shifting hazard field and survive for as long as possible.","dodge"],
"volcano-rally":["Volcano Rally","Hit every target before the timer runs out and build a high score.","click"],
"volcano-run":["Volcano Run","Match the called-out color quickly and avoid losing precious seconds.","color"],
"volcano-escape":["Volcano Escape","Work through a compact interactive grid challenge and score points.","grid"],
"volcano-trials":["Volcano Trials","Explore the board, mark your route and find the exit.","maze"],
"volcano-expedition":["Volcano Expedition","Watch the sequence, remember the pattern and repeat it correctly.","memory"],
"volcano-showdown":["Volcano Showdown","Unscramble a space-themed word before the countdown reaches zero.","word"]
});
const cfg=data[slug]||["Arcade Challenge","Play a quick arcade challenge.","collect"];
document.title=cfg[0]+" | VoidForge Arcade";
const root=document.getElementById("arcadeGame");
root.innerHTML='<header class="top"><a href="../index.html" class="back">← VoidForge</a><span class="pill">ARCADE ORIGINAL</span></header><main><section class="intro"><div class="eyebrow">VOIDFORGE MINI ARCADE</div><h1>'+cfg[0]+'</h1><p>'+cfg[1]+'</p><div class="stats"><div><small>SCORE</small><b id="score">0</b></div><div><small>TIME</small><b id="time">45</b></div><div><small>BEST</small><b id="best">0</b></div><div><small>STREAK</small><b id="streak">0×</b></div><div><small>LIVES</small><b id="lives">—</b></div></div></section><section class="play"><div class="stage"><div id="prompt" class="prompt"></div><div id="board" class="board"></div></div><div class="controls"><button id="start" class="primary">Start game</button><button id="pause" class="secondary" disabled>Pause</button><button id="reset" class="secondary">Restart</button><select id="difficulty" class="secondary" aria-label="Difficulty"><option value="60">Easy · 60s</option><option value="45" selected>Normal · 45s</option><option value="30">Hard · 30s</option></select><button id="fullscreen" class="secondary" type="button">Fullscreen</button></div><p id="status" class="status" aria-live="polite">Press Start game to begin.</p></section><p class="hint">Touch friendly · Keyboard supported · Scores saved on this device</p></main>';
const $=id=>document.getElementById(id),board=$("board"),prompt=$("prompt"),key="vfArcadeBest_"+slug;
let score=0,time=45,active=false,tick=null,round=0,streak=0,lives=3,best=(()=>{try{return Number(localStorage.getItem(key)||0)||0;}catch{return 0;}})(),gameTimers=[];
function gameInterval(fn,delay){const id=setInterval(fn,delay);gameTimers.push(id);return id;}
function clearGameTimers(){gameTimers.forEach(id=>clearInterval(id));gameTimers=[];tick=null;}
function clearMoveControls(){if(window.__vfArcadeMoveHandler){document.removeEventListener("keydown",window.__vfArcadeMoveHandler);window.__vfArcadeMoveHandler=null;}}
$("best").textContent=best;
function update(){$("score").textContent=score;$("time").textContent=time;}
function finish(){active=false;clearGameTimers();clearMoveControls();$("pause").disabled=true;$("pause").textContent="Pause";if(score>best){best=score;try{localStorage.setItem(key,String(best));}catch(error){console.warn("Could not save arcade best score",error);}$("best").textContent=best;}$("status").textContent="Round over — score "+score+". Press Restart to play again.";}
function add(n){streak++;const multiplier=1+Math.floor(streak/5);score+=Math.round(n*multiplier*100)/100;$("streak").textContent=streak+"×"+(multiplier>1?" · "+multiplier+"x":"");update();}
function start(){clearGameTimers();clearMoveControls();score=0;streak=0;lives=Number($("difficulty").value)>=60?5:Number($("difficulty").value)<=30?3:4;$("streak").textContent="0×";$("lives").textContent=cfg[2]==="dodge"?lives:"—";time=Number($("difficulty").value)||45;round=0;active=true;$("pause").disabled=false;$("pause").textContent="Pause";update();setup();$("status").textContent="Good luck!";tick=gameInterval(()=>{if(!active)return;if(--time<=0){time=0;update();finish();}else update();},1000);}
$("pause").addEventListener("click",()=>{if(!active){if(time<=0)return;active=true;$("pause").textContent="Pause";$("status").textContent="Game resumed.";return;}active=false;$("pause").textContent="Resume";$("status").textContent="Paused — press Resume to continue.";});
$("fullscreen").addEventListener("click",()=>{const target=document.querySelector(".play");if(!document.fullscreenElement){if(target.requestFullscreen)target.requestFullscreen().catch(()=>{});}else if(document.exitFullscreen)document.exitFullscreen();});
function setup(){clearMoveControls();board.replaceChildren();prompt.textContent="";if(["collect","dodge"].includes(cfg[2]))return moveGame();if(["click","color"].includes(cfg[2]))return clickGame();if(["grid","maze","memory"].includes(cfg[2]))return gridGame();if(["word","typing","math"].includes(cfg[2]))return questionGame();if(cfg[2]==="stack")return stackGame();if(cfg[2]==="cards")return cardsGame();}
function moveGame(){
 const arena=document.createElement("div");arena.className="arena";
 const p=document.createElement("button");p.className="player";p.textContent="▲";
 const g=document.createElement("span");g.className="goal";g.textContent="★";
 arena.append(p,g);let x=48,y=76,gx=20+Math.random()*60,gy=15+Math.random()*70;
 const hazards=[];
 if(cfg[2]==="dodge"){for(let i=0;i<3;i++){const h=document.createElement("span");h.textContent="✦";h.style.cssText="position:absolute;left:"+Math.random()*85+"%;top:"+(-10-i*25)+"%;font-size:27px;color:#ff718f;text-shadow:0 0 14px #ff426c;transform:translate(-50%,-50%);pointer-events:none";arena.append(h);hazards.push(h);}}
 function paint(){p.style.left=x+"%";p.style.top=y+"%";g.style.left=gx+"%";g.style.top=gy+"%";}
 function move(dx,dy){if(!active)return;x=Math.max(4,Math.min(96,x+dx));y=Math.max(7,Math.min(93,y+dy));paint();if(Math.abs(x-gx)<9&&Math.abs(y-gy)<11){add(cfg[2]==="collect"?2:1);gx=7+Math.random()*86;gy=8+Math.random()*82;round++;paint();}}
 const directions={left:()=>move(-7,0),right:()=>move(7,0),up:()=>move(0,-7),down:()=>move(0,7)};
 const pad=document.createElement("div");pad.setAttribute("aria-label","Touch movement controls");pad.style.cssText="position:absolute;left:10px;bottom:10px;display:grid;grid-template-columns:repeat(3,34px);grid-template-rows:repeat(2,34px);gap:4px;z-index:3";
 [["",""],["up","▲"],["",""],["left","◀"],["down","▼"],["right","▶"]].forEach(([dir,label])=>{const b=document.createElement("button");b.type="button";b.textContent=label;b.setAttribute("aria-label",dir||"");b.style.cssText="border:1px solid #687493;border-radius:9px;background:#26334dcc;color:white;font-weight:900;touch-action:manipulation";if(dir)b.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();directions[dir]();});pad.append(b);});
 arena.append(pad);
 paint();
 arena.addEventListener("pointerdown",e=>{if(e.target.closest("button"))return;const r=arena.getBoundingClientRect();const dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);if(Math.abs(dx)>Math.abs(dy))move(dx<0?-7:7,0);else move(0,dy<0?-7:7);});
 const handler=e=>{const m={ArrowLeft:[-7,0],a:[-7,0],ArrowRight:[7,0],d:[7,0],ArrowUp:[0,-7],w:[0,-7],ArrowDown:[0,7],s:[0,7]}[e.key];if(active&&m){e.preventDefault();move(m[0],m[1]);}};
 window.__vfArcadeMoveHandler=handler;document.addEventListener("keydown",handler);
 if(hazards.length){let step=0;gameInterval(()=>{if(!active)return;step++;hazards.forEach((h,i)=>{let top=(parseFloat(h.style.top)||0)+(5+i*1.2);let left=parseFloat(h.style.left)||0;if(top>108){top=-8;left=4+Math.random()*92;}h.style.top=top+"%";h.style.left=left+"%";if(Math.abs(x-left)<8&&Math.abs(y-top)<10){lives--;time=Math.max(0,time-2);$("lives").textContent=lives;streak=0;$("streak").textContent="0×";h.style.top="-12%";h.style.left=(5+Math.random()*90)+"%";update();if(lives<=0)finish();}});},380);}
 board.append(arena);$("status").textContent=cfg[2]==="dodge"?"Dodge the falling energy shards. Touch the pad or use WASD / arrow keys.":"Collect the star. Use the touch pad, tap the arena or move with WASD / arrow keys.";
}
function clickGame(){board.replaceChildren();const colors=["VIOLET","CYAN","CORAL","LIME","GOLD"];let wanted=colors[Math.floor(Math.random()*5)];prompt.textContent=cfg[2]==="color"?"TAP: "+wanted:"Tap the targets!";colors.forEach((c,i)=>{const b=document.createElement("button");b.className="tile color-tile";b.textContent=c;b.style.setProperty("--tile",["#9575ff","#54c9e7","#f08091","#8bd18a","#e9b75e"][i]);b.addEventListener("click",()=>{if(!active)return;if(cfg[2]==="color"){if(c===wanted){add(2);wanted=colors[Math.floor(Math.random()*5)];prompt.textContent="TAP: "+wanted;}else{streak=0;$("streak").textContent="0×";time=Math.max(0,time-2);update();}}else{add(1);b.disabled=true;b.classList.add("dim");if([...board.querySelectorAll("button")].every(x=>x.disabled))clickGame();}});board.append(b);});}
function gridGame(){
 board.replaceChildren();
 if(slug==="sudoku-lite")return sudokuGame();
 if(slug==="connect-four")return connectFourGame();
 if(slug==="checkers")return checkersGame();
 if(slug==="chess-arena")return chessArenaGame();
 if(slug==="gem-match")return gemMatchGame();
 if(slug==="shape-shift")return shapeShiftGame();
 if(cfg[2]==="memory"){
  const length=Math.min(3+Math.floor(round/2),8),seq=Array.from({length},()=>Math.floor(Math.random()*9));let step=0,showing=true;
  prompt.textContent="Watch the sequence ("+length+" steps), then repeat it";
  for(let i=0;i<9;i++){const b=document.createElement("button");b.className="tile";b.setAttribute("aria-label","Memory tile "+(i+1));b.addEventListener("click",()=>{if(!active||showing)return;if(i===seq[step]){b.classList.add("good");setTimeout(()=>b.classList.remove("good"),220);if(++step===length){round++;add(4+length);gridGame();}}else{step=0;streak=0;$("streak").textContent="0×";time=Math.max(0,time-3);update();$("status").textContent="Wrong tile — watch the sequence again.";}});board.append(b);}
  let n=0;const show=gameInterval(()=>{if(!active)return;if(n>=length){clearInterval(show);showing=false;prompt.textContent="Your turn — repeat all "+length+" tiles";return;}const b=board.children[seq[n++]];b.classList.add("good");setTimeout(()=>b.classList.remove("good"),280);},520);return;
 }
 if(cfg[2]==="maze"){
  const size=5,cells=Array.from({length:size*size},()=>({n:1,s:1,e:1,w:1,seen:false})),stack=[0];cells[0].seen=true;
  while(stack.length){const at=stack[stack.length-1],row=Math.floor(at/size),col=at%size,options=[];if(row>0&&!cells[at-size].seen)options.push(["n",at-size,"s"]);if(col<size-1&&!cells[at+1].seen)options.push(["e",at+1,"w"]);if(row<size-1&&!cells[at+size].seen)options.push(["s",at+size,"n"]);if(col>0&&!cells[at-1].seen)options.push(["w",at-1,"e"]);if(!options.length){stack.pop();continue;}const [wall,next,opposite]=options[Math.floor(Math.random()*options.length)];cells[at][wall]=0;cells[next][opposite]=0;cells[next].seen=true;stack.push(next);}
  let player=0;board.style.gridTemplateColumns="repeat(5,minmax(0,1fr))";board.style.gap="3px";prompt.textContent="Find the exit. Move with arrows, WASD or tap an open neighboring tile.";
  function renderMaze(){board.replaceChildren();cells.forEach((cell,i)=>{const b=document.createElement("button");b.type="button";b.className="tile";b.textContent=i===player?"◆":i===size*size-1?"EXIT":"";b.style.cssText="min-height:54px;padding:0;border-radius:7px;background:"+(i===player?"#5b64b7":i===size*size-1?"#245e50":"#202a40")+";border-top:"+(cell.n?"3px solid #77839e":"3px solid transparent")+";border-right:"+(cell.e?"3px solid #77839e":"3px solid transparent")+";border-bottom:"+(cell.s?"3px solid #77839e":"3px solid transparent")+";border-left:"+(cell.w?"3px solid #77839e":"3px solid transparent");b.setAttribute("aria-label",i===player?"Your position":i===24?"Exit":"Maze cell "+(i+1));b.addEventListener("click",()=>{const delta=i-player;if(Math.abs(delta)===1&&Math.floor(i/size)===Math.floor(player/size))moveMaze(delta>0?"e":"w");else if(Math.abs(delta)===size)moveMaze(delta>0?"s":"n");});board.append(b);});}
  function moveMaze(dir){if(!active)return;const cell=cells[player];if(cell[dir])return;player+=dir==="n"?-size:dir==="s"?size:dir==="e"?1:-1;renderMaze();if(player===size*size-1){round++;add(8+round);$("status").textContent="Maze cleared! A new maze is ready.";gridGame();}}
  clearMoveControls();const handler=e=>{const dir={ArrowUp:"n",w:"n",ArrowDown:"s",s:"s",ArrowLeft:"w",a:"w",ArrowRight:"e",d:"e"}[e.key];if(active&&dir){e.preventDefault();moveMaze(dir);}};window.__vfArcadeMoveHandler=handler;document.addEventListener("keydown",handler);renderMaze();return;
 }
 prompt.textContent="Lights Out: turn every tile dark. Each tap flips that tile and its neighbors.";board.style.gridTemplateColumns="repeat(4,minmax(0,1fr))";
 const lights=Array(16).fill(false);let moves=0;
 function flip(i){const r=Math.floor(i/4),c=i%4;for(const n of [i,r>0?i-4:-1,r<3?i+4:-1,c>0?i-1:-1,c<3?i+1:-1])if(n>=0)lights[n]=!lights[n];}
 for(let n=0;n<7;n++)flip(Math.floor(Math.random()*16));
 function render(){board.replaceChildren();lights.forEach((on,i)=>{const b=document.createElement("button");b.className="tile";b.textContent=on?"✦":"·";b.style.minHeight="66px";b.style.background=on?"#6958a6":"#202a3e";b.style.color=on?"#fff":"#66728b";b.setAttribute("aria-label","Tile "+(i+1)+(on?" on":" off"));b.addEventListener("click",()=>{if(!active)return;flip(i);moves++;render();if(lights.every(v=>!v)){add(8+Math.max(0,7-moves));round++;$("status").textContent="Board cleared in "+moves+" moves! New puzzle.";gameInterval(()=>{if(active)gridGame();},850);}});board.append(b);});}
 render();
}
function sudokuGame(){
 const solution=[1,2,3,4,3,4,1,2,2,1,4,3,4,3,2,1],given=[1,0,0,4,0,4,1,0,2,0,4,0,0,3,0,1],values=given.slice();let selected=-1;
 board.style.gridTemplateColumns="repeat(4,minmax(0,1fr))";prompt.textContent="Complete the 4×4 Sudoku. Each row, column and 2×2 box needs 1–4.";
 function render(){board.replaceChildren();values.forEach((v,i)=>{const b=document.createElement("button");b.className="tile";b.textContent=v||"·";b.disabled=!!given[i];b.style.minHeight="66px";b.style.borderColor=selected===i?"#a99bff":given[i]?"#63718d":"#414862";b.style.background=given[i]?"#303b54":selected===i?"#4c4775":"#252c40";b.addEventListener("click",()=>{if(!active||given[i])return;selected=i;values[i]=values[i]%4+1;render();check();});board.append(b);});}
 function check(){if(values.every(Boolean)){if(values.every((v,i)=>v===solution[i])){add(12);round++;$("status").textContent="Perfect Sudoku! New puzzle starting.";gameInterval(()=>{if(active){values.splice(0,16,...given);selected=-1;render();}},900);}else{$("status").textContent="Not quite — check each row, column and 2×2 box.";}}}
 const handler=e=>{if(!active||selected<0||!["1","2","3","4"].includes(e.key))return;values[selected]=Number(e.key);render();check();};window.__vfArcadeMoveHandler=handler;document.addEventListener("keydown",handler);render();
}
function connectFourGame(){
 const rows=6,cols=7;let cells=Array(rows*cols).fill(0),turn=1,locked=false;
 board.style.gridTemplateColumns="repeat(7,minmax(0,1fr))";prompt.textContent="Connect four. Player 1 starts — tap a column to drop a disc.";
 function wins(r,c,p){for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){let n=1;for(const sign of [-1,1]){let rr=r+dr*sign,cc=c+dc*sign;while(rr>=0&&rr<rows&&cc>=0&&cc<cols&&cells[rr*cols+cc]===p){n++;rr+=dr*sign;cc+=dc*sign;}}if(n>=4)return true;}return false;}
 function render(){board.replaceChildren();for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const b=document.createElement("button");b.className="tile";b.textContent=cells[r*cols+c]===1?"🔵":cells[r*cols+c]===2?"🟡":"·";b.style.minHeight="48px";b.style.padding="0";b.style.fontSize="clamp(16px,3vw,24px)";b.style.background="#1e2940";b.setAttribute("aria-label","Column "+(c+1)+", row "+(r+1));b.addEventListener("click",()=>drop(c));board.append(b);}}
 function drop(c){if(!active||locked)return;let r=rows-1;while(r>=0&&cells[r*cols+c])r--;if(r<0)return;cells[r*cols+c]=turn;render();if(wins(r,c,turn)){locked=true;if(turn===1)add(10);$("status").textContent="Player "+turn+" connects four! Starting a new match.";const t=gameInterval(()=>{clearInterval(t);if(active){cells=Array(rows*cols).fill(0);turn=1;locked=false;render();$("status").textContent="Player 1 starts the next round."; }},1100);return;}if(cells.every(Boolean)){$("status").textContent="Draw! New board.";cells=Array(rows*cols).fill(0);turn=1;render();return;}turn=3-turn;$("status").textContent="Player "+turn+" — choose a column.";}
 render();
}
function checkersGame(){
 const size=6;let pieces=Array(size*size).fill(0),selected=-1,locked=false;
 for(let r=0;r<2;r++)for(let c=0;c<size;c++)if((r+c)%2===1)pieces[r*size+c]=2;
 for(let r=4;r<6;r++)for(let c=0;c<size;c++)if((r+c)%2===1)pieces[r*size+c]=1;
 board.style.gridTemplateColumns="repeat(6,minmax(0,1fr))";prompt.textContent="Checkers mini: move diagonally, jump to capture. You are blue; the forge AI is red.";
 function movesFor(side){const out=[];for(let i=0;i<pieces.length;i++)if(pieces[i]===side||pieces[i]===side+2){const r=Math.floor(i/size),c=i%size,dirs=pieces[i]>2?[-1,1]:side===1?[-1]:[1];for(const dr of dirs)for(const dc of [-1,1]){const nr=r+dr,nc=c+dc;if(nr<0||nr>=size||nc<0||nc>=size)continue;const ni=nr*size+nc;if(!pieces[ni])out.push({from:i,to:ni,capture:-1});else if(pieces[ni]!==side&&pieces[ni]!==side+2){const jr=nr+dr,jc=nc+dc;if(jr>=0&&jr<size&&jc>=0&&jc<size&&!pieces[jr*size+jc])out.push({from:i,to:jr*size+jc,capture:ni});}}}return out;}
 function render(){board.replaceChildren();pieces.forEach((p,i)=>{const b=document.createElement("button");b.className="tile";b.style.minHeight="54px";b.style.padding="0";b.style.borderRadius="7px";b.style.background:(Math.floor(i/size)+i%size)%2?"#252d42":"#111827";b.style.borderColor=selected===i?"#fff":"#414862";b.textContent=p?(p===1?"🔵":p===2?"🔴":p===3?"👑":"♛"):"";b.disabled=!active||locked;b.addEventListener("click",()=>choose(i));board.append(b);});}
 function choose(i){if(!active||locked)return;if(selected<0){if(pieces[i]===1||pieces[i]===3){selected=i;render();}return;}const move=movesFor(1).find(m=>m.from===selected&&m.to===i);if(!move){selected=pieces[i]===1||pieces[i]===3?i:-1;render();return;}apply(move,1);}
 function apply(m,side){const p=pieces[m.from];pieces[m.from]=0;pieces[m.to]=p;if(m.capture>=0){pieces[m.capture]=0;if(side===1)add(2);}const row=Math.floor(m.to/size);if((side===1&&row===0)||(side===2&&row===size-1))pieces[m.to]=side+2;selected=-1;render();const enemy=side===1?2:1;if(!pieces.some(v=>v===enemy||v===enemy+2)||movesFor(enemy).length===0){if(side===1)add(8);$("status").textContent=side===1?"You win the checkers round!":"The forge AI wins this round.";locked=true;return;}if(side===1){locked=true;$("status").textContent="Forge AI is thinking…";const t=gameInterval(()=>{clearInterval(t);if(!active)return;const opts=movesFor(2);opts.sort((a,b)=>(b.capture>=0)-(a.capture>=0));const chosen=opts[0];if(chosen)apply(chosen,2);locked=false;render();$("status").textContent="Your move — blue pieces.";},500);}else{locked=false;render();}}
 render();
}
function chessArenaGame(){
 const size=5;let player=12,targets=new Set();function refill(){targets.clear();while(targets.size<5){const n=Math.floor(Math.random()*25);if(n!==player)targets.add(n);}}
 board.style.gridTemplateColumns="repeat(5,minmax(0,1fr))";refill();prompt.textContent="Knight challenge: move like a chess knight and capture all five stars.";
 function render(){board.replaceChildren();for(let i=0;i<25;i++){const b=document.createElement("button");b.className="tile";b.style.minHeight="58px";b.style.padding="0";b.style.borderRadius="7px";b.style.background=i===player?"#4e5c9b":targets.has(i)?"#225c4a":"#20283a";b.textContent=i===player?"♞":targets.has(i)?"★":"";b.addEventListener("click",()=>moveTo(i));board.append(b);}}
 function moveTo(i){if(!active||i===player)return;const r=Math.floor(player/size),c=player%size,nr=Math.floor(i/size),nc=i%size;if(!((Math.abs(r-nr)===2&&Math.abs(c-nc)===1)||(Math.abs(r-nr)===1&&Math.abs(c-nc)===2))){$("status").textContent="That is not a knight move.";return;}player=i;if(targets.delete(i)){add(3);$("status").textContent="Star captured — "+targets.size+" remaining.";}render();if(!targets.size){round++;add(8);player=12;refill();render();$("status").textContent="All targets captured! New board.";}}
 render();
}
function gemMatchGame(){
 const size=6,palette=["💎","🔷","🟣","🟢","🔶"],colors=Array.from({length:size*size},()=>Math.floor(Math.random()*palette.length));let busy=false;
 board.style.gridTemplateColumns="repeat(6,minmax(0,1fr))";prompt.textContent="Tap a connected group of three or more matching gems to clear it.";
 function cluster(start){const color=colors[start],seen=new Set([start]),queue=[start];while(queue.length){const i=queue.pop(),r=Math.floor(i/size),c=i%size;for(const n of [r>0?i-size:-1,r<size-1?i+size:-1,c>0?i-1:-1,c<size-1?i+1:-1])if(n>=0&&!seen.has(n)&&colors[n]===color){seen.add(n);queue.push(n);}}return [...seen];}
 function render(){board.replaceChildren();colors.forEach((v,i)=>{const b=document.createElement("button");b.className="tile";b.textContent=palette[v];b.style.minHeight="52px";b.style.padding="0";b.style.fontSize="clamp(17px,3vw,25px)";b.addEventListener("click",()=>clear(i));board.append(b);});}
 function clear(i){if(!active||busy)return;const group=cluster(i);if(group.length<3){$("status").textContent="Find a group of at least three matching gems.";return;}busy=true;add(group.length*2);group.forEach(n=>colors[n]=-1);render();const t=gameInterval(()=>{clearInterval(t);if(!active){busy=false;return;}group.forEach(n=>colors[n]=Math.floor(Math.random()*palette.length));busy=false;render();},180);}
 render();
}
function shapeShiftGame(){
 const shapes=["●","◆","▲","■"],target=shapes[Math.floor(Math.random()*shapes.length)];let hits=0;const tiles=Array.from({length:16},(_,i)=>i<4?target:shapes.filter(x=>x!==target)[Math.floor(Math.random()*3)]).sort(()=>Math.random()-.5);
 board.style.gridTemplateColumns="repeat(4,minmax(0,1fr))";prompt.textContent="Find every "+target+" shape.";
 function render(){board.replaceChildren();tiles.forEach((v,i)=>{const b=document.createElement("button");b.className="tile";b.textContent=v;b.style.minHeight="66px";b.addEventListener("click",()=>{if(!active||b.disabled)return;if(v===target){b.disabled=true;b.classList.add("good");hits++;add(1);if(hits===4){round++;shapeShiftGame();}}else{b.classList.add("dim");b.disabled=true;streak=0;$("streak").textContent="0×";time=Math.max(0,time-1);update();}});board.append(b);});}
 render();
}
const words=["PLANET","ORBIT","GALAXY","COMET","NEBULA","ROCKET","ASTEROID"];
function questionGame(){board.replaceChildren();let answer;if(cfg[2]==="math"){const a=2+Math.floor(Math.random()*18),b=2+Math.floor(Math.random()*12),op=round%3===0?"+":round%3===1?"−":"×";answer=String(op==="+"?a+b:op==="−"?Math.abs(a-b):a*b);prompt.textContent=a+" "+op+" "+b+" = ?";}else{const word=words[Math.floor(Math.random()*words.length)];answer=word;let display=cfg[2]==="typing"?word:word.split("").sort(()=>Math.random()-.5).join("");if(cfg[2]!=="typing"&&display===word)display=word.slice(1)+word[0];prompt.textContent=(cfg[2]==="typing"?"Type this word: ":"Unscramble: ")+display;}const input=document.createElement("input");input.className="answer";input.placeholder="Your answer";input.autocomplete="off";const submit=document.createElement("button");submit.className="primary";submit.textContent="Check";const check=()=>{if(!active)return;if(input.value.trim().toUpperCase()===answer){round++;add(2+Math.min(3,Math.floor(round/4)));questionGame();}else{$("status").textContent="Not quite — try again.";input.select();}};submit.addEventListener("click",check);input.addEventListener("keydown",e=>{if(e.key==="Enter")check();});board.append(input,submit);input.focus();}
function stackGame(){board.replaceChildren();prompt.textContent="Stop the moving block near the center";const bar=document.createElement("div");bar.className="stack-bar";const moving=document.createElement("div");moving.className="moving";bar.append(moving);board.append(bar);let pos=0,dir=1;const anim=gameInterval(()=>{if(!active){clearInterval(anim);return;}pos+=dir*2.5;if(pos>85||pos<0)dir*=-1;moving.style.left=pos+"%";},30);const stop=document.createElement("button");stop.className="primary";stop.textContent="STOP";stop.addEventListener("click",()=>{if(!active)return;clearInterval(anim);add(Math.max(0,5-Math.round(Math.abs(pos-42)/12)));stackGame();});board.append(stop);}
function cardsGame(){
 prompt.textContent="Blackjack: beat the dealer without going over 21.";
 let player=[],dealer=[],done=false;
 const display=document.createElement("div");display.className="card-total";display.style.gridColumn="1/-1";display.style.textAlign="center";display.style.padding="16px";display.style.background="#20283a";display.style.borderRadius="14px";
 const dealerLine=document.createElement("div"),playerLine=document.createElement("div");dealerLine.style.marginBottom="10px";display.append(dealerLine,playerLine);
 const draw=document.createElement("button");draw.className="primary";draw.textContent="Hit";
 const hold=document.createElement("button");hold.className="secondary";hold.textContent="Stand";
 function card(){const n=1+Math.floor(Math.random()*13);return n>10?10:n;}
 function total(hand){let n=hand.reduce((a,b)=>a+b,0),aces=hand.filter(v=>v===1).length;while(aces>0&&n+10<=21){n+=10;aces--;}return n;}
 function paint(reveal=false){dealerLine.textContent="Dealer: "+(reveal?dealer.join(" · ")+"  = "+total(dealer):dealer[0]+" · 🂠");playerLine.textContent="You: "+player.join(" · ")+"  = "+total(player);}
 function end(){if(done)return;done=true;draw.disabled=true;hold.disabled=true;const p=total(player),d=total(dealer);if(p>21){time=Math.max(0,time-4);update();$("status").textContent="Bust! The dealer wins.";}else if(d>21||p>d){add(6);$("status").textContent="You beat the dealer!";}else if(p===d){add(1);$("status").textContent="Push — it's a tie.";}else{$("status").textContent="Dealer wins this hand.";}paint(true);const t=gameInterval(()=>{clearInterval(t);if(active)cardsGame();},950);}
 function hit(){if(!active||done)return;player.push(card());paint();if(total(player)>=21)end();}
 draw.addEventListener("click",hit);
 hold.addEventListener("click",()=>{if(!active||done)return;while(total(dealer)<17)dealer.push(card());end();});
 player=[card(),card()];dealer=[card(),card()];paint();board.append(display,draw,hold);
 if(total(player)===21)end();
}
$("start").addEventListener("click",start);$("reset").addEventListener("click",start);
})();