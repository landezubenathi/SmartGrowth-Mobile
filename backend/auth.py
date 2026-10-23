"""Local account authentication and account-scoped access control for SmartGrowth.

This is a demonstrator foundation, NOT a production identity platform. Use HTTPS,
managed secrets, independent security review and appropriate operations before launch.
"""
from __future__ import annotations

import hashlib
import hmac
import os
import re
import secrets
import sqlite3
import time
import uuid
from datetime import datetime, timezone
from contextlib import contextmanager

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from growth_modules import DB

router = APIRouter(prefix='/api/auth', tags=['Accounts'])
ITERATIONS = 310_000
SESSION_SECONDS = 7 * 24 * 60 * 60


def connection():
    db = sqlite3.connect(DB, timeout=15)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA busy_timeout=15000')
    db.execute('''CREATE TABLE IF NOT EXISTS accounts (
        user_id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, display_name TEXT NOT NULL,
        salt TEXT NOT NULL, password_digest TEXT NOT NULL, created_at TEXT NOT NULL)''')
    db.execute('''CREATE TABLE IF NOT EXISTS auth_sessions (
        token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL,
        expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL,
        FOREIGN KEY(user_id) REFERENCES accounts(user_id))''')
    db.commit()
    return db


@contextmanager
def auth_session():
    db = connection()
    try:
        with db:
            yield db
    finally:
        db.close()


def password_hash(password: str, salt: bytes) -> str:
    return hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, ITERATIONS).hex()


def clean_email(email: str) -> str:
    value = email.strip().lower()
    if len(value) > 254 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', value):
        raise HTTPException(422, 'Enter a valid email address')
    return value


def create_account(db, *, user_id: str, email: str, display_name: str, password: str):
    salt = secrets.token_bytes(16)
    db.execute('INSERT INTO accounts VALUES(?,?,?,?,?,?)',
               (user_id, email, display_name, salt.hex(), password_hash(password,salt), datetime.now(timezone.utc).isoformat()))


def init_auth():
    with auth_session() as db:
        # Seeded test accounts are OPT-IN for the local Windows demo only.
        if os.getenv('SMARTGROWTH_SEED_DEMO') == '1':
            # Developer-only, explicit opt-in. Never ship a predictable demonstration password.
            demo_password = os.getenv('SMARTGROWTH_DEMO_PASSWORD', '')
            buyer_password = os.getenv('SMARTGROWTH_BUYER_PASSWORD', '')
            if len(demo_password) < 10 or len(buyer_password) < 10:
                raise RuntimeError('Set SMARTGROWTH_DEMO_PASSWORD and SMARTGROWTH_BUYER_PASSWORD (10+ characters each) for local seeding.')
            seeds = [
                ('demo', 'demo@smartgrowth.local', 'Demo Entrepreneur', demo_password),
                ('buyer', 'buyer@smartgrowth.local', 'Demo Buyer', buyer_password),
            ]
            for user_id, email, display_name, password in seeds:
                if not db.execute('SELECT 1 FROM accounts WHERE email=?', (email,)).fetchone():
                    create_account(db, user_id=user_id, email=email, display_name=display_name, password=password)


def public_account(row):
    return {'user_id':row['user_id'], 'username':row['user_id'], 'email':row['email'], 'display_name':row['display_name'], 'displayName':row['display_name']}


def create_session(db, row):
    token = secrets.token_urlsafe(36)
    now = int(time.time())
    db.execute('DELETE FROM auth_sessions WHERE expires_at < ?', (now,))
    db.execute('INSERT INTO auth_sessions VALUES (?,?,?,?)',
               (hashlib.sha256(token.encode()).hexdigest(), row['user_id'], now + SESSION_SECONDS, now))
    return {'token': token, 'expires_at':now + SESSION_SECONDS, 'account':public_account(row)}


def current_account(request: Request):
    header = request.headers.get('authorization', '')
    if not header.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Sign in to continue')
    token = header[7:].strip()
    if len(token) < 32 or len(token) > 256:
        raise HTTPException(status_code=401, detail='Session expired. Sign in again')
    hashed = hashlib.sha256(token.encode()).hexdigest()
    with auth_session() as db:
        row = db.execute('''SELECT a.*,s.expires_at FROM auth_sessions s
                            JOIN accounts a ON a.user_id=s.user_id
                            WHERE s.token_hash=?''', (hashed,)).fetchone()
    if not row or row['expires_at'] <= int(time.time()):
        raise HTTPException(status_code=401, detail='Session expired. Sign in again')
    return public_account(row)


async def scoped_account(request: Request):
    """Enforce account ownership on legacy API user IDs without trusting the client.

    Covers path, query and JSON body user_id/buyer_user_id fields. All existing
    growth routers are included through this dependency, including shared reads.
    """
    if request.url.path.endswith('/health'):
        return None
    account = current_account(request)
    own_id = account['user_id']
    requested_ids = []
    for name in ('user_id', 'buyer_user_id'):
        if name in request.path_params:
            requested_ids.append(request.path_params[name])
        requested_ids.extend(request.query_params.getlist(name))
    if request.method in ('POST','PUT','PATCH') and request.headers.get('content-type','').split(';')[0].strip() == 'application/json':
        try:
            body = await request.json()
        except Exception:
            body = None
        if isinstance(body,dict):
            requested_ids.extend(body[k] for k in ('user_id','buyer_user_id') if k in body)
    if any(uid != own_id for uid in requested_ids):
        raise HTTPException(status_code=403, detail='You can only access your own business records')
    request.state.account = account
    return account


class RegisterForm(BaseModel):
    display_name: str = Field(min_length=2, max_length=70)
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=10, max_length=128)


class LoginForm(BaseModel):
    email: str
    password: str


class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(min_length=10, max_length=128)


@router.post('/register', status_code=201)
def register(data: RegisterForm):
    email = clean_email(data.email)
    name = data.display_name.strip()
    if len(name) < 2: raise HTTPException(422, 'Enter your name')
    with auth_session() as db:
        if db.execute('SELECT 1 FROM accounts WHERE email=?',(email,)).fetchone():
            raise HTTPException(409, 'An account with this email already exists')
        user_id = 'u_' + uuid.uuid4().hex[:24]
        try:
            create_account(db,user_id=user_id,email=email,display_name=name,password=data.password)
        except sqlite3.IntegrityError:
            raise HTTPException(409, 'An account with this email already exists')
        row = db.execute('SELECT * FROM accounts WHERE user_id=?',(user_id,)).fetchone()
        return create_session(db,row)


_attempts = {}


@router.post('/login')
def login(data:LoginForm, request:Request):
    email = clean_email(data.email)
    key = (request.client.host if request.client else 'unknown', email)
    now=time.monotonic()
    recent=[t for t in _attempts.get(key,[]) if now-t<300]
    if len(recent) >= 12:
        raise HTTPException(429, 'Too many attempts. Try again shortly')
    with auth_session() as db:
        row=db.execute('SELECT * FROM accounts WHERE email=?',(email,)).fetchone()
        if not row:
            # keep invalid emails somewhat expensive, without revealing account presence
            password_hash(data.password, b'0'*16)
            recent.append(now);_attempts[key]=recent
            raise HTTPException(401, 'Invalid email or password')
        if not hmac.compare_digest(row['password_digest'], password_hash(data.password,bytes.fromhex(row['salt']))):
            recent.append(now);_attempts[key]=recent
            raise HTTPException(401, 'Invalid email or password')
        _attempts.pop(key,None)
        return create_session(db,row)


@router.get('/me')
def me(account=Depends(current_account)):
    return {'account':account}


@router.post('/logout')
def logout(request:Request, account=Depends(current_account)):
    token=request.headers['authorization'][7:].strip()
    with auth_session() as db:
        db.execute('DELETE FROM auth_sessions WHERE token_hash=?',(hashlib.sha256(token.encode()).hexdigest(),))
    return {'success':True}


@router.post('/change-password')
def change_password(data:ChangePassword, request:Request, account=Depends(current_account)):
    with auth_session() as db:
        row=db.execute('SELECT * FROM accounts WHERE user_id=?',(account['user_id'],)).fetchone()
        if not row or not hmac.compare_digest(row['password_digest'],password_hash(data.current_password,bytes.fromhex(row['salt']))):
            raise HTTPException(403,'Current password is incorrect')
        salt=secrets.token_bytes(16)
        db.execute('UPDATE accounts SET salt=?,password_digest=? WHERE user_id=?',
                   (salt.hex(),password_hash(data.new_password,salt),account['user_id']))
        db.execute('DELETE FROM auth_sessions WHERE user_id=?',(account['user_id'],))
    return {'success':True, 'message':'Password updated. Sign in again.'}
