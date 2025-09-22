import requests
import time

BASE_URL = "http://localhost:8000"
USERNAME = "alice"
EMAIL = "alice@example.com"
PASSWORD = "secret"

stats = {}

def bench_register():
    url = f"{BASE_URL}/register"
    payload = {"username": USERNAME, "email": EMAIL, "password": PASSWORD}
    start = time.time()
    resp = requests.post(url, json=payload)
    elapsed = time.time() - start
    stats['register'] = {'status': resp.status_code, 'elapsed': elapsed, 'body': resp.text}
    return resp

def bench_login():
    url = f"{BASE_URL}/login"
    data = {"username": USERNAME, "password": PASSWORD}
    start = time.time()
    resp = requests.post(url, data=data)
    elapsed = time.time() - start
    stats['login'] = {'status': resp.status_code, 'elapsed': elapsed, 'body': resp.text}
    if resp.ok:
        return resp.json().get('access_token')
    return None

def bench_me(token):
    url = f"{BASE_URL}/me"
    headers = {"Authorization": f"Bearer {token}"}
    start = time.time()
    resp = requests.get(url, headers=headers)
    elapsed = time.time() - start
    stats['me'] = {'status': resp.status_code, 'elapsed': elapsed, 'body': resp.text}
    return resp

def main():
    print("Benchmarking /register...")
    bench_register()
    print("Benchmarking /login...")
    token = bench_login()
    print("Benchmarking /me...")
    if token:
        bench_me(token)
    else:
        print("Login failed, cannot test /me")
    print("\n--- Benchmark Results ---")
    for k, v in stats.items():
        print(f"{k.upper()}: status={v['status']}, time={v['elapsed']:.4f}s")
        print(f"Response: {v['body'][:200]}")
        print()

if __name__ == "__main__":
    main()
