'use strict';

require('./style/main.scss');

require('./index.html');

const Elm = require('./Main.elm');
const mountNode = document.getElementById('main');

Elm.Main.embed(mountNode);
