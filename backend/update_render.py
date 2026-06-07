import json, urllib.request

with open('credentials.json') as f:
    creds = json.load(f)

creds_str = json.dumps(creds)

env_vars = [
    {'key': 'ADMIN_IDS', 'value': '961116530'},
    {'key': 'BOT_TOKEN', 'value': '8414524315:AAErYNwkwWV-_891Ov3sVutDE8Hg9Pr-GyQ'},
    {'key': 'SPREADSHEET_ID', 'value': '17bQxuQT6N8Jrb7QrY78-lr_g3GZFnqwUsjbucse43Jw'},
    {'key': 'ADMIN_SECRET', 'value': 'lab-secret-2024'},
    {'key': 'OWNER_PIN', 'value': '1234'},
    {'key': 'PORT', 'value': '10000'},
    {'key': 'GOOGLE_CREDENTIALS_JSON', 'value': creds_str},
]

body = json.dumps(env_vars).encode()
req = urllib.request.Request(
    'https://api.render.com/v1/services/srv-d8i62ccvikkc738bvnrg/env-vars',
    data=body,
    headers={
        'Authorization': 'Bearer rnd_Q5I5jjaihkfAGdmpzWr4PSX2rZY6',
        'Content-Type': 'application/json'
    },
    method='PUT'
)
with urllib.request.urlopen(req) as r:
    result = json.loads(r.read())
    print('Response type:', type(result))
    # Handle both list and dict responses
    items = result if isinstance(result, list) else result.get('envVars', result.get('data', []))
    for v in items:
        k = v.get('key') or v.get('envVar', {}).get('key', '')
        val = v.get('value') or v.get('envVar', {}).get('value', '')
        if k == 'GOOGLE_CREDENTIALS_JSON':
            parsed = json.loads(val)
            print('OK - type:', parsed['type'])
            print('project:', parsed['project_id'])
            print('email:', parsed['client_email'])
