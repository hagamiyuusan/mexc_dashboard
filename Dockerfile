# Use Python as base image
FROM python:3.9-slim

# Install Node.js and pnpm
RUN apt-get update && apt-get install -y \
    curl \
    dos2unix \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install Node dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

# Copy Python requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose ports
EXPOSE 3000 6547

COPY start.sh .
RUN chmod +x start.sh && \
    dos2unix start.sh

# Run both Node and Python applications
CMD ["/bin/bash", "./start.sh"]