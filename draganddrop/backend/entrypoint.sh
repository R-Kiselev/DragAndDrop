#!/bin/bash

# В Dockerfile CMD или entrypoint.sh, или в docker-compose.yml command:
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
