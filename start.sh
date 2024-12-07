#!/bin/bash

# Initialize conda for bash
eval "$(conda shell.bash hook)"
conda init
# Activate conda environment
conda activate myenv

# Start both applications
pnpm run dev & python main3.py