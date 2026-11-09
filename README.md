# VoidForge Studios Web Launcher

A static, GitHub Pages-compatible launcher for VoidForge Studios browser games.

## Adding a game

The launcher reads every available game from `games.json`. Add an object with a
unique `id` and an `entry` directory containing an `index.html` file; it will
automatically appear in Library and Discover and launch in the shared game
player. Game files are fetched normally by the service worker, so this works
for every registered game rather than applying special handling to Minecraft.

```json
{
  "id": "my-game",
  "name": "My Game",
  "entry": "my-game",
  "status": "Available"
}
```

BADGES
[![Deploy VoidForge to GitHub Pages](https://github.com/VoidForgeStudios272/VoidForgeStudios272.github.io/actions/workflows/pages.yml/badge.svg)](https://github.com/VoidForgeStudios272/VoidForgeStudios272.github.io/actions/workflows/pages.yml)
[![CodeQL](https://github.com/VoidForgeStudios272/VoidForgeStudios272.github.io/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/VoidForgeStudios272/VoidForgeStudios272.github.io/actions/workflows/github-code-scanning/codeql)
[![pages-build-deployment](https://github.com/VoidForgeStudios272/VoidForgeStudios272.github.io/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/VoidForgeStudios272/VoidForgeStudios272.github.io/actions/workflows/pages/pages-build-deployment)


## Online chat (Firebase)

VoidForge's Global Lobby uses Firebase Authentication (anonymous sign-in) and
Cloud Firestore realtime listeners. The browser Firebase web config is public
client configuration, not a server secret. Keep all access control in Firestore
Security Rules; never put service-account credentials in this repository.

1. Create a Firebase project and register a Web App.
2. Enable **Authentication → Sign-in method → Anonymous**.
3. Create a **Cloud Firestore** database.
4. Copy the Web App config into `assets/firebase-config.js` (start from
   `assets/firebase-config.example.js`).
5. Publish the rules from `firestore.rules` in the Firebase Console under
   Firestore → Rules.
6. Reload the deployed site and open **Online Chat**.

The initial implementation provides one public Global Lobby, live message
updates, profile display names, a 75-message recent history, and 500-character
message limits. Anonymous accounts are browser/device identities, not verified
accounts. The public lobby is visible to all authenticated chat visitors; do
not use it for private or sensitive information. Add App Check and stronger
abuse controls before opening it to a large public audience.


### Private chats

The Online Chat page also includes invite-only private conversations. Create a
room to generate an 8-character invite code, then share it with one person.
The first valid join fills the second participant slot; each room supports at
most two Firebase anonymous-authenticated users. Private messages are stored
under `rooms/{roomId}/messages` and Firestore rules restrict reads and writes
to the room's two members. The room list and invite code are saved locally in
that browser, so clearing browser storage removes the shortcut to the room.
Keep the invite code private: anyone who obtains it before the room is full can
attempt to join. Firebase anonymous identities are browser/device identities,
not verified accounts, and are not automatically recoverable on another device.
