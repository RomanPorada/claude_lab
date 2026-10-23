# Atoms & Molecules API — Cloud Lab 1 (Azure)

Вебзастосунок AtomLab (каталог атомів і молекул, кошик, замовлення) з курсу «Вебтехнології та вебдизайн».
Реєстрація, авторизація (JWT), каталог і замовлення зберігаються в PostgreSQL (раніше — JSON-файл і localStorage).
Один контейнер віддає і фронтенд, і REST API.

**Публічна адреса:** `http://<вставте output public_url>`  
**Swagger UI:** `/docs` · **Health:** `/health`

Публічні: `/atoms`, `/molecules`, `/auth/register`, `/auth/login`. З `Authorization: Bearer <JWT>`: `/auth/me`, `/orders`.

## Структура
```
app/                 Node.js API (src/), SQL-схема і seed (db/)
web/                 React-фронтенд (з курсу «Вебтехнології», гілка lab_7-12)
Dockerfile           багатоетапна збірка: React → статика всередині образу API
compose.yaml         локальний запуск: API + PostgreSQL (volume pgdata)
infra/main.tf        уся інфраструктура Azure в Terraform
.github/workflows/   CI/CD: push у lab1 → build → ACR (тег = sha) → Container Apps
```

## Локально
```bash
docker compose up --build        # http://localhost:3000/atoms
docker compose down              # дані в volume лишаються
```

## Хмара
```bash
cd infra && cp terraform.tfvars.example terraform.tfvars   # заповнити
terraform init && terraform apply
terraform destroy                                           # після захисту
```
Архітектура: Internet → Application Gateway (публічний) → Container Apps (internal env, VNet) → PostgreSQL Flexible Server (приватна підмережа, без публічного доступу).
