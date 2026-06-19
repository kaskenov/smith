import gulp from 'gulp';
import ts from 'gulp-typescript';
import { spawn } from 'node:child_process';
import { rmSync, mkdirSync, existsSync } from 'node:fs';

const tsProject = ts.createProject('tsconfig.json');

function clean() {
  rmSync('dist', { recursive: true, force: true });
  return Promise.resolve();
}

function build() {
  if (!existsSync('src')) {
    mkdirSync('dist', { recursive: true });
    return Promise.resolve();
  }
  return gulp.src('src/**/*.ts', { allowEmpty: true }).pipe(tsProject()).pipe(gulp.dest('dist'));
}

function watch() {
  gulp.watch('src/**/*.ts', build);
}

function test(cb: (err?: Error) => void) {
  const proc = spawn('npx', ['jest', '--coverage'], { stdio: 'inherit', shell: true });
  proc.on('exit', (code) => cb(code === 0 ? undefined : new Error('tests failed')));
}

const prepublish = gulp.series(clean, build);

export { clean, build, watch, test, prepublish };
export default build;
