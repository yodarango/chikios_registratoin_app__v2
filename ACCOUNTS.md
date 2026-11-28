# User accounts

The application creates the `users` table on startup if needed. When it creates a new table, it also creates an `admin` account from `ADMIN_USERNAME` and `ADMIN_PASSWORD` if both are configured. Those credentials are used only for this initial account; subsequent logins use the database. Changing the environment variables later does not change that account's password. Existing sessions from before this change must sign in again.

If a `users` table already exists, it is reused and a `type` column is added if missing, with `user` as its default. The table must have `id`, unique `username`, and bcrypt `password_hash` columns compatible with the application. An incompatible table causes startup to fail rather than overwrite existing data. No initial admin is added to an existing table; create one using the command below.

Create an account on the server, using a hidden password prompt in a shell such as zsh or bash:

```sh
read -rs 'ACCOUNT_PASSWORD?Password: '; echo
printf '%s\n' "$ACCOUNT_PASSWORD" | npm run create-user -- example_username admin 'First' 'Last'
unset ACCOUNT_PASSWORD
```

For bash, use `read -rs -p 'Password: ' ACCOUNT_PASSWORD; echo` for the first line instead. Use `user` instead of `admin` for a non-admin account. Usernames are case-insensitive and may not contain whitespace; passwords may be at most 72 UTF-8 bytes. Use a strong, unique password for each account. Do not pass passwords as command-line arguments.

All admins have the same dashboard access. Non-admins can sign in but cannot access `/admin`, its APIs, or live updates. Update or remove a user's database record to change their access; requests and live connections check the current account type. There is no account-management interface or password-reset workflow yet.

Set names for existing accounts, including the initial admin, with `npm run set-user-name -- example_username 'First' 'Last'`. Until a name is set, new status changes show the username. The status label records the name and time of the latest check-in or check-out, displayed in Nashville time. Existing statuses have no attribution until changed; this is not a history of all changes.

Before deployment, back up the database and confirm the application database user can create and alter tables. Startup adds name columns to `users` and attribution columns to `registrant`. Verify the production database schema, HTTPS/proxy configuration, and account creation in staging. The application currently has no login rate limiting or password-reset workflow.