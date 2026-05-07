#!/usr/bin/env python3
"""
MacMini-AI-Coach Telegram Bot
Natural language interface → OpenClaw → response → Telegram
Token persistence via AES-256-CBC encrypted storage
arm64/M4 Pro optimized
"""

import os
import asyncio
import logging
import json
import base64
import hashlib
from pathlib import Path
from datetime import datetime

from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    filters,
    ContextTypes,
)
import httpx
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend

# ── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    level=logging.INFO,
    handlers=[
        logging.FileHandler(Path.home() / ".telegram-bot" / "bot.log"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger("macmini-bot")

# ── Config ───────────────────────────────────────────────────────────────────

OPENCLAW_URL    = os.getenv("OPENCLAW_URL", "http://localhost:8000")
OLLAMA_URL      = os.getenv("OLLAMA_URL",   "http://localhost:11434")
OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL", "qwen3:14b")
TOKEN_STORE     = Path.home() / ".telegram-bot" / "token.enc"
ENV_FILE        = Path.home() / ".telegram-bot" / ".env"
LOG_DIR         = Path.home() / ".telegram-bot"
REQUEST_TIMEOUT = 300  # seconds — accommodates cold model load

# Allowed Telegram user IDs (whitelist) — set in .env as ALLOWED_USER_IDS=123,456

RAW_IDS = os.getenv("ALLOWED_USER_IDS", "")
ALLOWED_USER_IDS = set(int(x.strip()) for x in RAW_IDS.split(",") if x.strip())

# ── AES-256-CBC Token Persistence ────────────────────────────────────────────

def _derive_key(password: str) -> bytes:
    """Derive 32-byte AES key from machine-specific password."""
    salt = b"macmini-ai-coach-salt-v1"
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)

def encrypt_token(token: str, password: str) -> None:
    """Encrypt bot token and write to disk."""
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    key = _derive_key(password)
    iv  = os.urandom(16)
    padder = padding.PKCS7(128).padder()
    padded = padder.update(token.encode()) + padder.finalize()
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    enc    = cipher.encryptor()
    ct     = enc.update(padded) + enc.finalize()
    TOKEN_STORE.write_bytes(iv + ct)
    log.info("Token encrypted and stored at %s", TOKEN_STORE)

def decrypt_token(password: str) -> str:
    """Decrypt bot token from disk."""
    if not TOKEN_STORE.exists():
        raise FileNotFoundError(f"No encrypted token at {TOKEN_STORE}. Run setup first.")
    raw = TOKEN_STORE.read_bytes()
    iv, ct = raw[:16], raw[16:]
    key    = _derive_key(password)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    dec    = cipher.decryptor()
    padded = dec.update(ct) + dec.finalize()
    unpadder = padding.PKCS7(128).unpadder()
    return (unpadder.update(padded) + unpadder.finalize()).decode()

def load_token() -> str:
    """Load token: encrypted file first, .env fallback, env var last."""
    password = os.getenv("TOKEN_ENCRYPT_PASSWORD")
    if password and TOKEN_STORE.exists():
        try:
            return decrypt_token(password)
        except Exception as e:
            log.warning("Encrypted token load failed (%s) — falling back to .env", e)
    # Fallback: read .env file
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if line.startswith("TELEGRAM_BOT_TOKEN="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    # Last resort: environment variable
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if token:
        return token
    raise EnvironmentError(
        "No bot token found. Run setup (python bot.py –setup) or set TELEGRAM_BOT_TOKEN."
    )

# ── NLP → OpenClaw / Ollama routing ──────────────────────────────────────────

SECURITY_BLOCKLIST = [
    "client name", "account number", "portfolio position", "trade",
    "pii", "social security", "passport", "credit card",
]

def is_blocked(text: str) -> bool:
    """Hard block: PII / sensitive financial data must never transit Telegram."""
    lowered = text.lower()
    return any(phrase in lowered for phrase in SECURITY_BLOCKLIST)

async def query_openclaw(message: str) -> str:
    """Send natural language message to OpenClaw and return response."""
    payload = {
        "message": message,
        "source": "telegram",
        "timestamp": datetime.utcnow().isoformat(),
    }
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        try:
            resp = await client.post(f"{OPENCLAW_URL}/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("response") or data.get("message") or str(data)
        except httpx.ConnectError:
            log.warning("OpenClaw unreachable — falling back to Ollama direct")
            return await query_ollama_direct(message)
        except Exception as e:
            log.error("OpenClaw error: %s", e)
            return f"OpenClaw error: {e}"

async def query_ollama_direct(message: str) -> str:
    """Fallback: query Ollama directly when OpenClaw is down."""
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": message,
        "stream": False,
    }
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        try:
            resp = await client.post(f"{OLLAMA_URL}/api/generate", json=payload)
            resp.raise_for_status()
            return resp.json().get("response", "No response from Ollama.")
        except Exception as e:
            log.error("Ollama fallback error: %s", e)
            return f"Both OpenClaw and Ollama are unreachable. Error: {e}"

# ── Command Handlers ──────────────────────────────────────────────────────────

async def cmd_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    if ALLOWED_USER_IDS and user_id not in ALLOWED_USER_IDS:
        await update.message.reply_text("Unauthorized.")
        log.warning("Unauthorized access attempt from user_id=%s", user_id)
        return
    await update.message.reply_text(
        "MacMini-AI-Coach online.\n\n"
        "Send any natural language message and I will route it through your agent stack.\n\n"
        "Commands:\n"
        "/status — system health\n"
        "/models — loaded Ollama models\n"
        "/help — this message"
    )

async def cmd_status(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if ALLOWED_USER_IDS and update.effective_user.id not in ALLOWED_USER_IDS:
        await update.message.reply_text("Unauthorized.")
        return

    results = []

    # Check OpenClaw
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{OPENCLAW_URL}/health")
            results.append(f"OpenClaw: {'[PASS] online' if r.status_code == 200 else '[WARN] ' + str(r.status_code)}")
    except Exception:
        results.append("OpenClaw: [FAIL] unreachable")

    # Check Ollama
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{OLLAMA_URL}/api/tags")
            models = [m["name"] for m in r.json().get("models", [])]
            results.append(f"Ollama: [PASS] {len(models)} models")
    except Exception:
        results.append("Ollama: [FAIL] unreachable")

    results.append(f"Bot: [PASS] running")
    results.append(f"Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")

    await update.message.reply_text("\n".join(results))

async def cmd_models(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if ALLOWED_USER_IDS and update.effective_user.id not in ALLOWED_USER_IDS:
        await update.message.reply_text("Unauthorized.")
        return
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{OLLAMA_URL}/api/tags")
            models = r.json().get("models", [])
            if not models:
                await update.message.reply_text("No models currently loaded.")
                return
            lines = [f"• {m['name']} ({round(m.get('size',0)/1e9,1)} GB)" for m in models]
            await update.message.reply_text("Installed models:\n" + "\n".join(lines))
    except Exception as e:
        await update.message.reply_text(f"Could not reach Ollama: {e}")

async def cmd_help(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "Available commands:\n"
        "/start — initialize\n"
        "/status — OpenClaw + Ollama health check\n"
        "/models — list installed Ollama models\n"
        "/help — this message\n\n"
        "Or just type any natural language message.\n\n"
        "SECURITY: Never send client names, account numbers, portfolio data, or PII."
    )

# ── Natural Language Handler ──────────────────────────────────────────────────

async def handle_message(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    if ALLOWED_USER_IDS and user_id not in ALLOWED_USER_IDS:
        await update.message.reply_text("Unauthorized.")
        log.warning("Unauthorized message from user_id=%s", user_id)
        return

    text = update.message.text or ""
    log.info("Message from user_id=%s: %s", user_id, text[:80])

    # Hard security block
    if is_blocked(text):
        await update.message.reply_text(
            "[WARN] BLOCKED — Message contains sensitive financial or PII keywords.\n"
            "Telegram transmits through third-party servers.\n"
            "Use a local channel for this data."
        )
        log.warning("Blocked sensitive message from user_id=%s", user_id)
        return

    # Typing indicator
    await update.message.chat.send_action("typing")

    # Route through OpenClaw (with Ollama fallback)
    response = await query_openclaw(text)

    # Telegram message limit is 4096 chars — split if needed
    if len(response) <= 4096:
        await update.message.reply_text(response)
    else:
        for i in range(0, len(response), 4096):
            await update.message.reply_text(response[i:i+4096])

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    import sys

    # Setup mode: encrypt token for first-time config
    if "--setup" in sys.argv:
        token    = input("Enter your Telegram bot token: ").strip()
        password = input("Enter encryption password (save this): ").strip()
        encrypt_token(token, password)
        print(f"Token encrypted and saved to {TOKEN_STORE}")
        print("Set TOKEN_ENCRYPT_PASSWORD in your .env before starting the bot.")
        return

    LOG_DIR.mkdir(parents=True, exist_ok=True)
    token = load_token()

    app = Application.builder().token(token).build()

    # Register handlers
    app.add_handler(CommandHandler("start",  cmd_start))
    app.add_handler(CommandHandler("status", cmd_status))
    app.add_handler(CommandHandler("models", cmd_models))
    app.add_handler(CommandHandler("help",   cmd_help))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    log.info("Bot starting — polling for messages")
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
