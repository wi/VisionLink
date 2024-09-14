const path = require('path');
const pak = require('../package.json');

module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        extensions: ['.js', '.json'],
      },
    ],
    [
      'react-native-reanimated/plugin',
      {
        globals: ['__labelImage'],
      },
    ],
  ],
};