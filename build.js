const fs = require('fs');
const path = require('path');
const { transformFileSync } = require('@babel/core');
const { minify } = require('terser');
const { minify: minifyHtml } = require('html-minifier-terser');

async function build() {
  const root = path.join(__dirname, '..');
  const srcDir = path.join(root, 'src');
  const distDir = path.join(root, 'dist');

  fs.mkdirSync(distDir, { recursive: true });

  const transpiled = transformFileSync(path.join(srcDir, 'app.jsx'), {
    presets: ['@babel/preset-react']
  }).code;

  const minifiedJs = await minify(transpiled, {
    compress: true,
    mangle: true
  });

  let html = fs.readFileSync(path.join(srcDir, 'index.html'), 'utf8');

  const visitorCounter = `
  <div id="visitor-counter" style="text-align:center;margin-top:20px">
    <a href="https://hits.sh/marcusqa.github.io/qa-and-testing-diagram.github.io/">
      <img
        alt="Hits"
        src="https://hits.sh/marcusqa.github.io/qa-and-testing-diagram.github.io.svg?label=Visitors"
      />
    </a>
  </div>
  `;

  html = html
    .replace(/<!-- DEV_ONLY_START -->[\s\S]*?<!-- DEV_ONLY_END -->/, '')
    .replace(
      '<!-- PROD_SCRIPT -->',
      `<script>${minifiedJs.code}</script>${visitorCounter}`
    );

  const minifiedHtml = await minifyHtml(html, {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true
  });

  fs.writeFileSync(path.join(distDir, 'index.html'), minifiedHtml);

  const staticFiles = ['favicon.ico', 'favicon.png'];

  staticFiles.forEach((file) => {
    const srcPath = path.join(srcDir, file);
    const distPath = path.join(distDir, file);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, distPath);
      console.log(`Copied dist/${file}`);
    }
  });

  console.log('Built dist/index.html');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
