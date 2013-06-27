# source-map-visualization

http://sokra.github.com/source-map-visualization/

## Contribute

Development:

``` text
npm install webpack-dev-server -g
npm install
webpack-dev-server --content-page index.html --colors --devtool eval
```

Publish:

``` text
git checkout gh-pages
git merge master
webpack --colors --progress -p --devtool sourcemap
git add assets
git commit -m "Publish"
git checkout master
git push
```