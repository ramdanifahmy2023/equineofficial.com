# Frontend regression

Run against a running Equine frontend. The suite uses a fresh Chromium context and only local preview data. It does not submit an order to an external service.

```sh
PLAYWRIGHT_MODULE=/home/ubuntu/Sites/CloakBrowser/js/node_modules/playwright-core \
CHROMIUM_PATH=/home/ubuntu/.cloakbrowser/chromium-146.0.7680.177.5/chrome \
node tests/frontend-regression.cjs
```

`PLAYWRIGHT_MODULE` can point to another installed Playwright Core module. If omitted, the script resolves `playwright-core` normally. `CHROMIUM_PATH` selects the browser executable.

`AUDIT_BASE_URL` defaults to `http://127.0.0.1:3020`; `AUDIT_OUTPUT` defaults to `/tmp/equine-frontend-regression`. The output includes results and a payment-page screenshot.

The checks cover variant selection, wishlist interaction, native-dialog keyboard behavior, modal handoff, order snapshots and refresh, simulated payment states, unknown orders, settings persistence and storage failures, supported sorting, size-chart disclosure, contrast, and responsive route smoke tests.
