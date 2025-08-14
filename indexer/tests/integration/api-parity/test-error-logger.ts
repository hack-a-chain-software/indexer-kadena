import fs from 'fs';

export const logoutError = (
  error: any,
  testName: string,
  hash: string,
  kadenaData: any,
  hackachainData: any,
) => {
  console.error(`❌ #${testName} - FAILED at hash: ${hash}`);
  fs.mkdirSync(`./tests/integration/api-parity/logs/${testName}/${hash}`, {
    recursive: true,
  });
  fs.writeFileSync(
    `./tests/integration/api-parity/logs/${testName}/${hash}/kadena.json`,
    JSON.stringify({ kadenaData }, null, 2),
  );
  fs.writeFileSync(
    `./tests/integration/api-parity/logs/${testName}/${hash}/hackachain.json`,
    JSON.stringify({ hackachainData }, null, 2),
  );
  let cleanMessage = error.message.replace(/\x1B\[[0-9;]*m/g, ''); // Remove ANSI escape codes
  try {
    cleanMessage = JSON.parse(`"${cleanMessage}"`);
  } catch (e) {
    // If JSON parsing fails, manually replace common escape sequences
    cleanMessage = cleanMessage.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  fs.writeFileSync(
    `./tests/integration/api-parity/logs/${testName}/${hash}/diffs.json`,
    cleanMessage,
  );
};
