# Требования к проекту

- docker
- nodeJS + pnpm
- NextJS

# Запуск проекта

```bash
#1. Запуск докер с БД и Файлового хранилища:
docker compose -f ./docker-compose.yml up -d

#2. Установка всех необходимых пакетов для запуска
pnpm install

#3. Запуск проекта
pnpm dev
```
