# Live admin updates

Admin pages connect to `/admin/live` using the existing authenticated session. Status changes, registrations and deletions notify connected dashboards to reload their current search and counts from MySQL. The socket carries no child details. If WebSocket upgrades are unavailable, the browser uses an authenticated event stream (`/admin/live/events`) and a 30-second polling fallback. Reconnecting or returning to the page triggers a refresh.

The current production Nginx configuration for `chikios.shrood.app` does not forward WebSocket upgrades. To enable actual WebSockets, add this location **inside the existing HTTPS server block**, before or alongside `location /`, then run `nginx -t` and reload Nginx only if the test succeeds:

```nginx
location = /admin/live {
    proxy_pass http://localhost:3003;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 75s;
}
```

No server configuration is modified by deployment. The existing Nginx setup should pass the event-stream fallback, which explicitly disables proxy buffering. Check that live updates work across two authenticated browser sessions after deploying; do not rely on a stale status indicator if connectivity is lost. Direct database edits are not broadcast; the polling fallback refreshes them within about 30 seconds while the page is visible. These in-memory notifications assume one app process, matching the current PM2 fork configuration; multi-process deployments need a shared broadcast mechanism.