require('dotenv').config();

const mongoose = require('mongoose');
const { connect, disconnect } = require('../src/config/db');
const { setEnabled } = require('../src/domain/features');
const { createAuditEvent } = require('../src/domain/audit');

async function main() {
  const args = process.argv.slice(2);
  const nameIdx = args.indexOf('--name');
  const byIdx = args.indexOf('--by');
  const onIdx = args.indexOf('--on');
  const offIdx = args.indexOf('--off');

  if (nameIdx === -1 || byIdx === -1 || (onIdx === -1 && offIdx === -1)) {
    console.error('Usage: node toggle-feature.js --name=<flag> --by=<actor> --on|--off');
    process.exit(1);
  }

  const name = args[nameIdx + 1];
  const changedBy = args[byIdx + 1];
  const enabled = onIdx !== -1;

  await connect();

  try {
    const { before, after } = await setEnabled(name, enabled, changedBy);

    await createAuditEvent({
      actor: changedBy,
      action: `feature_flag_${enabled ? 'enabled' : 'disabled'}`,
      target: name,
      targetType: 'FeatureFlag',
      before,
      after,
      requestId: 'cli-toggle-feature',
    });

    console.log(`Feature flag "${name}" set to ${enabled}`);
  } catch (err) {
    console.error('Failed to toggle feature:', err.message);
    process.exit(1);
  } finally {
    await disconnect();
  }
}

main();
