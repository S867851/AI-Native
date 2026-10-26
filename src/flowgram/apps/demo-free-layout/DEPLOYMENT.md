# Independent test deployment

This deployment adapts the official free-layout example for a standalone web service.

- Static asset prefix: `/flowgram/`.
- Runtime requests: same-origin `/flowgram/api/*`, proxied to the Node runtime.
- Node runtime: `127.0.0.1:4000`; not connected to JeecgBoot accounts or data.
- Draft storage: `FLOWGRAM_DATA_DIR/workflow.json`. One shared draft, explicit Save; no automatic save or multi-project management.
- Model-free initial workflow: Start → End. This verifies the actual runtime without external model credentials.
- Authentication is supplied by the independent deployment reverse proxy; never expose the reference runtime directly.
- Execution tasks remain in the reference runtime's process memory. They are not a durable execution history and are not preserved across restarts.

Build using the Node and Rush versions configured in this repository:

```sh
node common/scripts/install-run-rush.js install --to @flowgram.ai/demo-free-layout --to @flowgram.ai/runtime-nodejs
node common/scripts/install-run-rush.js build --to @flowgram.ai/demo-free-layout --to @flowgram.ai/runtime-nodejs
cd apps/demo-free-layout
node ../../common/scripts/install-run-rushx.js ts-check
node ../../common/scripts/install-run-rushx.js build:prod
```

From a built runtime directory, run the deployment smoke test:

```sh
node scripts/deployment-smoke.mjs
```

The test starts a temporary runtime on port 4000 and verifies schema rejection, draft save/load, actual workflow execution, and draft persistence across restart. Do not run it on a host already using port 4000.

This adaptation is a test workbench, not a completed Agent application platform. Real audio transcription, model credentials, long-running job recovery, durable run history, and JeecgBoot integration require separate work.
