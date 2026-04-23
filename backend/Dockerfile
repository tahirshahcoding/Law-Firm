# Use the official lightweight Python image
FROM python:3.11-slim

# Set environment variables for Python optimization
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies required for PostgreSQL (psycopg2)
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# Copy the rest of the project files
COPY . /app/

CMD ["sh", "-c", "gunicorn core.wsgi:application --bind 0.0.0.0:${PORT:-10000}"]