# Бекап бази даних

Продакшн-база (PostgreSQL 18 на Railway) копіюється щоночі через GitHub Actions
([.github/workflows/backup.yml](../.github/workflows/backup.yml)).
Фото лежать у Cloudinary і до бекапу бази не входять.

Версія клієнта `pg_dump` (образ `postgres:18-alpine`) не має бути старшою за сервер.
Якщо Railway оновить Postgres, змініть номер версії в workflow і тут.

## Налаштування (один раз)

1. Railway → сервіс Postgres → Variables → скопіювати `DATABASE_PUBLIC_URL`.
   Якщо його немає: Settings → Networking → TCP Proxy.
2. Придумати довгу парольну фразу для шифрування і зберегти її в менеджері паролів.
   Без неї бекап не відкрити.
3. GitHub → Settings → Secrets and variables → Actions → New repository secret:
   - `DATABASE_PUBLIC_URL`
   - `BACKUP_PASSPHRASE`
4. Перевірити вручну: Actions → Backup → Run workflow. Має бути зелена позначка
   і артефакт `db-backup-…` з файлом `olga-<дата>.dump.gpg`.

Артефакти зберігаються 30 днів. GitHub вимикає розклад у репозиторії, де 60 днів
немає активності, тож іноді перевіряйте, що щоденні запуски є.

## Відновлення

1. Actions → потрібний запуск Backup → завантажити артефакт і розпакувати zip.
2. Розшифрувати (запитає парольну фразу):

   ```bash
   gpg -o olga.dump -d olga-<дата>.dump.gpg
   ```

3. Підняти порожню базу (локально, для перевірки). Версія образу не нижча за версію,
   з якої знято дамп:

   ```bash
   docker run -d --name restore-test -e POSTGRES_PASSWORD=test -p 5433:5432 postgres:18-alpine
   docker exec restore-test createdb -U postgres olga_restore
   docker exec -i restore-test pg_restore -U postgres --no-owner -d olga_restore < olga.dump
   ```

4. Перевірити, що дані на місці:

   ```bash
   docker exec restore-test psql -U postgres -d olga_restore -c "select count(*) from products;"
   ```

Відновлення в продакшн-базу робити лише свідомо і з уже перевіреним дампом:
спершу переконатися, що бекап відкривається локально (кроки 1-4).

## Ручний бекап

```bash
mkdir -p ~/olga-backups
read -s DBURL        # вставити DATABASE_PUBLIC_URL, Enter один раз
docker run --rm -e DBURL="$DBURL" -v ~/olga-backups:/backup postgres:18-alpine \
  sh -c 'pg_dump "$DBURL" -Fc --no-owner -f /backup/olga-prod-$(date +%F).dump'
unset DBURL
```

Кожну команду вводити окремо: `read` забирає наступний рядок, якщо вставити їх разом.
Зберігати копію поза папкою проєкту: у дампі дані покупців.
