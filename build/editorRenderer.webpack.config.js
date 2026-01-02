/*---------------------------------------------------------------------------------------------
 *  Webpack configuration for custom editor renderer bundle
 *  This creates a browser-compatible bundle that includes @antv/infographic
 *--------------------------------------------------------------------------------------------*/

//@ts-check
'use strict';

const path = require('path');
const sharedConfig = require('./shared.infographic.webpack.config');

/**@type {import('webpack').Configuration}*/
const config = {
    ...sharedConfig,
    entry: './src/customEditor/editorRenderer.entry.ts',
    output: {
        path: path.resolve(__dirname, '..', 'dist'),
        filename: 'editorRenderer.bundle.js',
        libraryTarget: 'window',
        libraryExport: 'default',
        library: 'InfographicRenderer'
    }
};

module.exports = config;
