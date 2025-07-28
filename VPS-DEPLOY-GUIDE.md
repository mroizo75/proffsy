# VPS Deployment Guide - Proffsy

## 🚀 Løsning for VPS-problemer

### Problem 1: Redis Connection Error ✅ FIKSET
```
Redis Client Error [Error: getaddrinfo ENOTFOUND redis-15308.c335.europe-west2-1.gce.redns.redis-cloud.com]
```

**Løsning**: Redis er nå valgfritt. Hvis Redis ikke er tilgjengelig, bruker applikasjonen in-memory rate limiting.

### Problem 2: React.Children.only Error ✅ FIKSET
```
Error: React.Children.only expected to receive a single React element child.
```

**Løsning**: Fjernet alle `legacyBehavior` fra Link-komponenter.

## 📋 VPS Setup Instruksjoner

### 1. Miljøvariabler (.env.local på VPS)

```bash
# Minimum påkrevde variabler
NEXTAUTH_SECRET=your-super-secure-secret-key-for-production-min-32-chars-long
NEXTAUTH_URL=https://www.proffsy.no
DATABASE_URL="mysql://username:password@localhost:3306/proffsy"
NEXT_PUBLIC_APP_URL=https://www.proffsy.no

# Admin bruker (anbefalt)
ADMIN_EMAIL=admin@proffsy.no

# Redis (VALGFRITT - kan fjernes hvis problemer)
# REDIS_USERNAME=default
# REDIS_PASSWORD=your-redis-password
# REDIS_HOST=redis-15308.c335.europe-west2-1.gce.redns.redis-cloud.com
# REDIS_PORT=15308
```

### 2. Deployment Kommandoer

```bash
# 1. Installer dependencies
npm install

# 2. Generer Prisma client
npx prisma generate

# 3. Kjør database migrasjoner
npx prisma db push

# 4. Seed admin-bruker
npx tsx prisma/seed.ts

# 5. Bygg applikasjonen
npm run build

# 6. Start produksjonen
npm start
```

### 3. Database Setup

Sørg for at MySQL-databasen er opprettet og tilgjengelig:

```sql
CREATE DATABASE proffsy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Nginx Konfigurasjon (eksempel)

```nginx
server {
    server_name www.proffsy.no;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. PM2 Setup (process manager)

```bash
# Installer PM2
npm install -g pm2

# Start applikasjonen
pm2 start npm --name "proffsy" -- start

# Sett opp auto-restart
pm2 startup
pm2 save
```

## 🔧 Feilsøking

### Redis-problemer
- **Løsning**: Fjern Redis-miljøvariabler fra .env.local
- **Fallback**: Applikasjonen bruker automatisk in-memory rate limiting

### Build-feil
- **Løsning**: Sørg for at alle `legacyBehavior` er fjernet
- **Kommando**: `npx @next/codemod@latest new-link . --force`

### Database-problemer
- Sjekk at DATABASE_URL er korrekt
- Sjekk at MySQL-serveren kjører
- Kjør `npx prisma db push` for å oppdatere schema

## ✅ Etter Deployment

1. Test at hjemmesiden laster: https://www.proffsy.no
2. Test admin-innlogging:
   - Gå til: https://www.proffsy.no/login
   - Email: admin@proffsy.no
   - Passord: admin123
3. Verifiser at admin-panelet fungerer

## 🔒 Sikkerhet

- Endre admin-passordet etter første innlogging
- Sett sterk NEXTAUTH_SECRET (min 32 tegn)
- Konfigurer HTTPS med SSL-sertifikat
- Begrens tilgang til admin-API-endepunkter

## 📞 Support

Alle kritiske feil er fikset:
- ✅ Redis connection errors
- ✅ React.Children.only errors  
- ✅ JWT authentication
- ✅ Admin user setup
- ✅ Link component issues

Applikasjonen skal nå deploye og kjøre uten problemer på VPS. 