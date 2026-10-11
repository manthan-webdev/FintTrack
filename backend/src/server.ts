import createApp from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const app = createApp();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[FinTrack Backend] REST API Server running on port ${PORT}`);
  console.log(`[FinTrack Backend] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[FinTrack Backend] Health check: http://localhost:${PORT}/api/health`);
});
