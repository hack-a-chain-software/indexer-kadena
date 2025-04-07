const fs = require('fs');
const path = require('path');

class TestTimingReporter {
  constructor(globalConfig, options) {
    this._logFile = path.resolve(
      __dirname,
      `./tests/logs/${new Date().toISOString()}--test-timing.log`,
    );
    fs.writeFileSync(this._logFile, 'Test Timing Log: ' + new Date().toISOString() + '\n');
  }

  onTestResult(test, testResult, results) {
    const entries = testResult.testResults.map(t => {
      const time = t.duration != null ? `${t.duration}ms` : 'N/A';
      return `${t.fullName} | ${time}`;
    });

    fs.appendFileSync(this._logFile, entries.join('\n') + '\n');
  }
}

module.exports = TestTimingReporter;
