// @ts-check
const path = require('path');

/**@type {import('webpack').Configuration}*/
const config = {
    mode: 'none',
    target: 'web',
    resolve: {
        extensions: ['.ts', '.js'],
        fallback: {
            "path": false,
            "fs": false
        },
        extensionAlias: {
            '.js': ['.js', '.ts']
        }
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'ts-loader'
                }]
            },
            {
                test: /\.m?js$/,
                resolve: {
                    fullySpecified: false
                }
            }
        ]
    },
    plugins: [
        new (require('webpack')).NormalModuleReplacementPlugin(
            /measury/,
            function(resource) {
                // Provide empty module for measury to avoid build errors in browser context
                if (resource.context.includes('@antv/infographic')) {
                    resource.request = path.resolve(__dirname, '..', 'src', 'measury-stub.js');
                }
            }
        ),
        new (require('webpack')).NormalModuleReplacementPlugin(
            /renderer[\\\/]fonts/,
            path.resolve(__dirname, '..', 'src', 'fonts-stub.js')
        )
    ],
    devtool: 'nosources-source-map',
    infrastructureLogging: {
        level: 'log'
    }
};

module.exports = config;
