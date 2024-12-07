eval "$(conda shell.bash hook)"
conda init
# Activate conda environment
conda activate myenv

pip install -r requirements.txt

# Start both applications
pnpm run dev & python main3.py
