rm -rf archive.zip
npm run build
node compress.js
zip archive.zip index.js index.html runner.jpg
advzip -z archive.zip -4 -i 100
