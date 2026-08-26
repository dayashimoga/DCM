FROM docker.io/library/python:3.11-slim

WORKDIR /app

COPY apps/provider-agent/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/provider-agent/ ./

ENV PYTHONPATH=/app

ENTRYPOINT ["python", "-m", "agent.cli"]
CMD ["run"]
