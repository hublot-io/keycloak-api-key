const path = require('path')

module.exports = {
    entry: './lib/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'keycoquelico.js',
        library: {
            name:   'Keycoquelico',
            type:   'umd'    
        }
    },
}