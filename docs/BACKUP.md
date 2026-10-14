# Database backup

The production database (PostgreSQL 18 on Railway) is dumped every night by GitHub Actions
([.github/workflows/backup.yml](../.github/workflows/backup.yml)).
Photos live in Cloudinary and are not part of the database backup.

The `pg_dump` client version (image `postgres:18-alpine`) must not be older than the server.
If Railway upgrades Postgres, change the version number in the workflow and here.

## Setup (once)

1. Railway → Postgres service → Variables → copy `DATABASE_PUBLIC_URL`.
   If it is missing: Settings → Networking → TCP Proxy.
2. Pick a long encryption passphrase and store it in a password manager.
   Without it the backup cannot be opened.
3. GitHub → Settings → Secrets and variables → Actions → New repository secret:
   - `DATABASE_PUBLIC_URL`
   - `BACKUP_PASSPHRASE`
4. Run it manually: Actions → Backup → Run workflow. You should get a green check
   and a `db-backup-…` artifact containing `olga-<date>.dump.gpg`.

Artifacts are kept for 30 days. GitHub disables scheduled workflows in a repository with
no activity for 60 days, so check from time to time that the daily runs are still happening.

## Restore

1. Actions → pick a Backup run → download the artifact and unzip it.
2. Decrypt it (you will be asked for the passphrase):

   ```bash
   gpg -o olga.dump -d olga-<date>.dump.gpg
   ```

3. Start an empty database (locally, to verify). Use an image version no lower than
   the one the dump was taken from:

   ```bash
   docker run -d --name restore-test -e POSTGRES_PASSWORD=test -p 5433:5432 postgres:18-alpine
   docker exec restore-test createdb -U postgres olga_restore
   docker exec -i restore-test pg_restore -U postgres --no-owner -d olga_restore < olga.dump
   ```

4. Check that the data is there:

   ```bash
   docker exec restore-test psql -U postgres -d olga_restore -c "select count(*) from products;"
   ```

Restore into the production database only deliberately and with a dump you have already verified:
first make sure the backup opens locally (steps 1-4).

## Manual backup

```bash
mkdir -p ~/olga-backups
read -s DBURL        # paste DATABASE_PUBLIC_URL, press Enter once
docker run --rm -e DBURL="$DBURL" -v ~/olga-backups:/backup postgres:18-alpine \
  sh -c 'pg_dump "$DBURL" -Fc --no-owner -f /backup/olga-prod-$(date +%F).dump'
unset DBURL
```

Run each command separately: `read` consumes the next line if you paste them together.
Keep the copy outside the project folder: the dump contains customer data.
