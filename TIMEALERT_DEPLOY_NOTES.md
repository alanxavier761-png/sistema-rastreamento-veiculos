# TimeAlert - Notas de Deploy e Configuração

## Data: 25/01/2026

## Servidor: 72.62.111.179 (Hostinger VPS)

---

## Resumo das Alterações

### 1. Estrutura de Dados Criada

**Banco de Dados MySQL:** `timealert_db`

- **Plan:** Básico (ID: 1) - 50 funcionários, R$ 199,90/mês
- **Company:** Empresa Demo (ID: 1) - CNPJ: 12.345.678/0001-90
- **Users:**
  - Alan Xavier (ID: 1) - Owner - `alan-owner-001`
  - Gestor Demo (ID: 2) - Manager - `gestor-001`
  - João Silva (ID: 3) - Employee - `func-teste-001`
- **Manager:** ID: 1 - WhatsApp: 5511988888888
- **Employee:** ID: 1 - WhatsApp: 5511958528853
- **Work Schedules:** Segunda a Sexta, 09:00-18:00 (almoço 12:00-13:30)

### 2. Autenticação Local

Modificado o sistema para aceitar autenticação local via headers HTTP:

**Arquivos modificados no VPS:**
- `/var/www/timealert/server/_core/context.ts` - Adicionado suporte a headers `x-local-user-id` e `x-local-user-role`
- `/var/www/timealert/client/src/main.tsx` - Cliente tRPC envia headers de autenticação
- `/var/www/timealert/client/src/pages/Login.tsx` - Login armazena ID correto do usuário
- `/var/www/timealert/server/routers.ts` - `adminProcedure` e `directorProcedure` aceitam role `owner`

**Credenciais de Login:**
- Owner: `ALAN.XAVIER` / `36367017`
- Manager: `GESTOR` / `123456`

### 3. Integração WhatsApp (wa.me)

**Configurações:**
- API URL: `https://us.api-wa.me`
- API Key: `3100x77c43e012f`
- Instância: TIMER ALERT 2.0
- Número conectado: 5511954604281

**Webhook configurado:**
- Mensagens recebidas: `http://72.62.111.179:3003/api/webhooks/client-api/incoming`

### 4. Serviços Rodando (PM2)

```bash
pm2 list
# timealert - porta 3003
# base44-app - porta 3002
# pdf-analyzer - porta 3001
```

---

## Comandos Úteis

```bash
# SSH para o VPS
ssh -i ~/.ssh/id_ed25519_hostinger root@72.62.111.179

# Logs do TimeAlert
pm2 logs timealert --lines 50

# Reiniciar TimeAlert
pm2 restart timealert

# Rebuild do TimeAlert
cd /var/www/timealert && pnpm build && pm2 restart timealert

# MySQL - Verificar dados
mysql -u timealert -ptimealert2024 timealert_db -e "SELECT * FROM employees;"

# Testar API
curl -s 'http://localhost:3003/api/trpc/employees.list' \
  -H 'x-local-user-id: 1' \
  -H 'x-local-user-role: owner'
```

---

## Problemas Conhecidos

1. **wa.me API Timeout (504):** O envio de mensagens está dando timeout. Verificar conexão WebSocket no painel portal.api-wa.me.

2. **OAuth não configurado:** A autenticação OAuth original não está funcionando (OAUTH_SERVER_URL não configurado). Usando autenticação local.

---

## Próximos Passos

1. Resolver timeout da API wa.me (verificar conexão da instância)
2. Testar fluxo completo de notificação
3. Implementar mais funcionários via interface
4. Configurar Groq API para análise de fotos

---

## URLs de Acesso

- **TimeAlert:** http://72.62.111.179:3003
- **wa.me Portal:** https://portal.api-wa.me
