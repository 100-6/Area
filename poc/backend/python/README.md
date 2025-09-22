# Basic Auth API

Simple FastAPI application providing user registration and login with JWT.

## Features
- Register user (username, email, password)
- Login with username + password (OAuth2 password flow)
- JWT bearer token issuance
- Protected /me endpoint
- SQLite storage via SQLAlchemy

## Requirements
Python 3.11+

## Setup
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run
```bash
python app.py
# or
uvicorn app:app --reload
```

## Endpoints
### Register
```bash
curl -X POST http://localhost:8000/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","email":"alice@example.com","password":"secret"}'
```
### Login
```bash
curl -X POST http://localhost:8000/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=alice&password=secret'
```
Response:
```json
{"access_token":"<token>", "token_type":"bearer"}
```
### Me
```bash
curl http://localhost:8000/me -H 'Authorization: Bearer <token>'
```

## Environment
Change the SECRET_KEY in `auth.py`