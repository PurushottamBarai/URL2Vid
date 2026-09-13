FROM node:18-bullseye-slim

# Install FFmpeg and Python (required by yt-dlp)
RUN apt-get update && \
    apt-get install -y ffmpeg python3 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package.json
COPY package*.json ./

# Copy frontend and backend package files
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies for both (using the root script)
RUN npm run install-all

# Copy all source code
COPY . .

# Build the frontend
RUN npm run build --prefix frontend

# Expose backend port
EXPOSE 3001

# Start the unified server
CMD ["npm", "start"]
