# Use the official lightweight Python image
FROM python:3.11-slim

# Set environment variables for Python optimization
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set up a new user named "user" with user ID 1000 for Hugging Face Spaces
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Set the working directory inside the container
WORKDIR $HOME/app

# Copy requirements first for better caching
COPY --chown=user requirements.txt $HOME/app/
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# Copy the rest of the app
COPY --chown=user . $HOME/app/

RUN chmod +x build.sh

# Expose port 7860 as required by Hugging Face Spaces
EXPOSE 7860

CMD ["sh", "-c", "./build.sh && gunicorn core.wsgi:application --bind 0.0.0.0:7860"]