# Wall Calendar Challenge

This is a small React + Vite project implementing an interactive wall-calendar component with:

- Wall calendar aesthetic with hero image
- Day-range selection (click to choose start, click a later date to set end; clicking a new date after start+end resets selection)
- Month notes and notes attached to selected date range
- Local storage persistence for notes
- Responsive layout (desktop side-by-side hero + calendar, mobile stacked)

How to run locally

1. Install dependencies

```bash
# from project root
npm install
```

2. Start dev server

```bash
npm run dev
```

This opens a Vite dev server (by default http://localhost:5173). The WallCalendar component is at the root.

Notes on implementation

- No backend is included; notes are saved to localStorage as simple keys.
- The range note key is `range-note:YYYY-MM-DD|YYYY-MM-DD` and the month note key is `month-note:YYYY-M`.
- The hero uses a royalty-free Unsplash image as a visual anchor; swap `HERO_IMAGE` in `src/components/WallCalendar.jsx` to change.
 - The hero uses a royalty-free Unsplash image as a visual anchor by default. You can also upload a local image using the file control in the header — uploaded images are stored in `localStorage` (same-origin) so color extraction from the image will succeed. If the remote image blocks canvas access due to CORS, color extraction will fail silently and the default accent will be used; uploading a local image or hosting the image with permissive CORS headers fixes this.

Suggested improvements / extras

- Add animations for selecting ranges or a flip animation when switching months.
- Allow tapping-and-dragging range selection on touch devices.
- Add holiday or event markers.
