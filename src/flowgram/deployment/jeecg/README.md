# JeecgBoot integration

The Vue route `flowgram/index` hosts the editor and hands its existing session token to the same-origin iframe using a source-checked, origin-checked postMessage handshake. The token is kept in editor memory and is never stored in workflow documents or URLs. The backend checks the JeecgBoot session and current permission codes on every API call.

Permissions: `flowgram:view`, `flowgram:edit`, `flowgram:run`, `flowgram:manage`, `flowgram:history`. View is required for every operation. Manage controls workflow creation, rename, archive and restore. Edit controls schema changes. Run-only users execute the persisted schema. History grants team-wide access to persisted run reports. Live task control is restricted to the executor or a user with manage permission.

Workflows are shared by authorized platform users. This integration does not implement separate tenant workspaces. Writes are atomic and serialized in a single gateway instance; revision checks reject stale updates. Archive is recoverable. The previous shared draft is migrated once as `legacy-shared`, and its original file is retained.

The runtime stays on loopback port 4000. The integration gateway uses loopback port 4001. All public `/flowgram/api`, `/flowgram/workflows`, `/flowgram/runs` and `/flowgram/session` routes pass through the gateway. Legacy workspace, tRPC and documentation routes must not reach the raw runtime.

Run reports are collected independently of the browser, persisted, and available after restart. Interrupted tasks are marked after repeated runtime lookup failures; execution itself is not resumed. Common secret-named fields are masked in stored reports. Free text may contain sensitive data and history permission should be assigned accordingly.

Run tests: `node --test deployment/jeecg/gateway.test.mjs` (Node 22+ for gateway). The editor uses the upstream toolchain. No real model or transcription service is configured by this integration.
