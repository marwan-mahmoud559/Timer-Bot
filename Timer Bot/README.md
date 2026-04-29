# Discord Timer Bot

بوت ديسكورد لجلسات مذاكرة وبريك مع تايمر بصورة ديناميكية بتتحدث كل 30 ثانية.

## الأوامر

- `/timer study_minutes:<n> break_minutes:<n>` — بدء جلسة مذاكرة + بريك
- `/break` — إيقاف التايمر الشغال

## التشغيل محليًا

```bash
npm install
# ضيف DISCORD_BOT_TOKEN في ملف .env أو كـ environment variable
DISCORD_BOT_TOKEN=YOUR_TOKEN npm run dev
```

## النشر على Railway

1. ارفع المشروع على GitHub.
2. على Railway: **New Project → Deploy from GitHub repo** واختار الريبو.
3. روح **Variables** وضيف:
   - `DISCORD_BOT_TOKEN` = توكن البوت من Discord Developer Portal
4. Railway هيعمل build و start تلقائيًا (`npm run build` ثم `npm start`).
5. هتلاقي رابط دعوة البوت في الـ Deploy Logs أول ما يشتغل.

## الصلاحيات اللي البوت محتاجها على ديسكورد

View Channel · Send Messages · Embed Links · Attach Files · Read Message History · Use External Emojis · Use Application Commands
