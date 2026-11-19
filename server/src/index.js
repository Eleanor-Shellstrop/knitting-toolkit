import { createApp } from './app.js';

const port = Number(process.env.PORT) || 3001;

createApp().listen(port, () => {
  if (process.env.NODE_ENV === 'production') {
    console.log(`Knitting Toolkit running on http://localhost:${port}`);
  } else {
    console.log(`API listening on port ${port} — open the app at http://localhost:5173`);
  }
});
