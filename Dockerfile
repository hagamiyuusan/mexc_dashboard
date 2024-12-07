# Node base image for pnpm
FROM node:18-slim as node_base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY . .

# Python base image
FROM python:3.9-slim

# Copy from node_base
COPY --from=node_base /app /app

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python script
COPY main3.py .

# Create start script (fixed version)
COPY <<'EOF' /app/start.sh
#!/bin/bash
pnpm run dev & python main3.py
EOF

# Make script executable
RUN chmod +x /app/start.sh

# Command to run both services
CMD ["/app/start.sh"]