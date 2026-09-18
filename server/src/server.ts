import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Vasundhara Backend Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
