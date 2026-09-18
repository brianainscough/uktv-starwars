# Galaxy Atlas

A 1920x1080 Connected TV catalogue built with Preact, TypeScript, Vite, and Norigin Spatial Navigation. It uses the public [SWAPI](https://swapi.dev/) dataset to browse planets, starships, vehicles, people, films, and species.

## Run locally

```bash
npm install
npm run dev
```

Open the Vite URL in a browser. The application is designed for a 1080p viewport. Arrow keys and Enter simulate a TV remote D-pad and Select button. The search field is available by moving to it with the keyboard or a remote with text input.

## Notes

- Spatial focus is managed with `@noriginmedia/norigin-spatial-navigation`; category buttons and archive records are focusable nodes.
- API requests show a loading state and surface connection or HTTP failures in the UI.
- Transport categories display name, model, manufacturer, cost, length, crew, passengers, and cargo capacity where SWAPI provides them.