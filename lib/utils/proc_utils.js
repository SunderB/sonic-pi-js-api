'use babel';
let ProcUtils;

const fs                    = require('fs');
const child_process         = require('child_process');

module.exports = ( ProcUtils = {
  start_process(cmd, args, out_path, err_path) {
    if (!cmd) {
      throw Error("No command given!");
    }

    const child = child_process.spawn(cmd, args);

    var out_pipe = null
    var err_pipe = null
    if (out_path) {
      out_pipe = fs.createWriteStream(out_path);
      child.stdout.pipe(out_pipe);
    }
    if (err_path) {
      out_pipe = fs.createWriteStream(out_path);
      child.stderr.pipe(err_pipe);
    }

    child.on('close', (code, signal) => {
      console.log(`[ProcUtils]: \`${cmd} ${args}\` exited with code ${code} and signal ${signal}`);
    });

    return child;
  }

});
