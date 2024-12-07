# Use Miniconda as the base image
FROM continuumio/miniconda3:latest
ENV PATH="/root/miniconda3/bin:${PATH}"

# Install Node.js and pnpm
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create conda environment
RUN conda create -n myenv python=3.9 -y && conda init

# Set PATH for conda

# Set working directory
WORKDIR /app

# Copy package files and install Node dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

# Copy Python requirements and install
COPY requirements.txt .
RUN conda run -n myenv pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose ports
EXPOSE 3000 
EXPOSE 6547

# Run both Node and Python applications
CMD ["sh", "-c", "\
    conda init && \
    conda activate myenv && \
    pnpm run dev & python main3.py \
    "]