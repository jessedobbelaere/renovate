import shell from 'shelljs';
import { program, exec } from './utils.mjs';

const version = program.release;
const sha = program.sha;

let err = false;

shell.echo(`Publishing version: ${version}`);

shell.echo('Publishing npm package ...');
if (
  !exec(`npm --no-git-tag-version version ${version}`) ||
  !exec(`npm publish`)
) {
  err = true;
}

shell.echo('Publishing docker images ...');
if (!exec(`./.github/workflows/release-docker.sh ${version} ${sha}`)) {
  err = true;
}

if (err) {
  shell.exit(1);
}
