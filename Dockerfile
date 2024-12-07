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

# Install Node.js and npm in the Python image
RUN apt-get update && apt-get install -y \
    curl \
    python3-venv \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Create and activate virtual environment
ENV VIRTUAL_ENV=/app/venv
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Copy from node_base
COPY --from=node_base /app /app

# Install Python dependencies in virtual environment
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python script
COPY main3.py .

# Expose ports
EXPOSE 3000
EXPOSE 6547

# Run commands directly
CMD ["sh", "-c", "source /app/venv/bin/activate && pnpm run dev & python main3.py"]