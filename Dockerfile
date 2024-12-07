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

# Miniconda base image
FROM continuumio/miniconda3:latest

# Install Node.js and npm in the Miniconda image
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create conda environment
RUN conda create -n myenv python=3.9 -y
SHELL ["conda", "run", "-n", "myenv", "/bin/bash", "-c"]

# Expose ports
EXPOSE 3000 
EXPOSE 6547  

# Copy from node_base
COPY --from=node_base /app /app

# Set working directory
WORKDIR /app

# Install Python dependencies in conda environment
COPY requirements.txt .
RUN conda run -n myenv pip install --no-cache-dir -r requirements.txt

# Copy Python script
COPY main3.py .

# Run both commands using conda environment
CMD ["conda", "activate", "myenv", "bash", "-c", "pnpm run dev & python main3.py"]
