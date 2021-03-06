var proxyquire =  require('proxyquire').noPreserveCache(),
    _ = require('underscore'),
    utils = require('./utils');

describe('Options', function() {
    var fs, path, options, config;

    function setup() {
        // remove commander from require cache
        utils.unloadModule('commander');
        
        fs = {};
        path = {};
        config = { '@noCallThru': true };
        var Options = proxyquire('../lib/options', {
            'fs': fs,
            'path': path,
            'mssql-conf.json': config,
            'test-conf.json': config
        });
        options = new Options();
    }

    describe('init', function() {
        beforeEach(function() {
           setup(); 
        });

        it('parses and copies args', function() {
            fs.existsSync = jasmine.createSpy().andReturn(true);

            options.init([
                'node.exe', 'test.js',
                '-s', 'localhost',
                '-u', 'sa',
                '-p', 'password',
                '-o', '1234',
                '-t', '5500',
                '-d', 'test',
                '-q', '.tables',
                '-v', '7_2',
                '-e',
                '-f', 'xml',
                '-c', 'config.json'
            ], {});

            expect(options.args).toEqual({
                server: 'localhost',
                user: 'sa',
                pass: 'password',
                port: '1234',
                timeout: '5500',
                database: 'test',
                query: '.tables',
                tdsVersion: '7_2',
                encrypt: true,
                format: 'xml',
                config: 'config.json'
            });
        });

        it('throws if config does not exist', function() {
            fs.existsSync = jasmine.createSpy().andReturn(false);

            var args = [
                'node.exe', 'test.js',
                '-c', 'config.json'
            ];

            var err = new Error("config file 'config.json' does not exist.");
            expect(options.init.bind(options, args, {})).toThrow(err);
        });
    });

    describe('getConnectionInfo', function() {
        beforeEach(function() {
           setup(); 
        });

        it('defaults the config file name to mssql-conf.json', function () {
            path.resolve = jasmine.createSpy().andReturn('mssql-conf.json');
            fs.existsSync = jasmine.createSpy().andReturn(true);

            options.getConnectionInfo();

            expect(fs.existsSync).toHaveBeenCalledWith('mssql-conf.json');
        });

        it('defaults the user and server name', function () {
            path.resolve = jasmine.createSpy().andReturn('mssql-conf.json');
            fs.existsSync = jasmine.createSpy().andReturn(true);

            var info = options.getConnectionInfo();

            expect(info.server).toEqual('localhost');
            expect(info.user).toEqual('sa');
        });

        it('creates the config object', function () {
            path.resolve = jasmine.createSpy().andReturn('test-conf.json');
            fs.existsSync = jasmine.createSpy().andReturn(true);

            options.init([
                'node.exe', 'test.js',
                '-s', 'example.com',
                '-u', 'theuser',
                '-p', 'thepass',
                '-o', '5400',
                '-t', '1000',
                '-d', 'catalog',
                '-q', '.tables',
                '-v', '7_3',
                '-e',
                '-f', 'json',
                '-c', 'test-conf.json'
            ], {});

            var info = options.getConnectionInfo();

            expect(info).toEqual({
                user: 'theuser',
                password: 'thepass',
                server: 'example.com',
                database: 'catalog',
                port: '5400',
                timeout: '1000',
                options: {
                    tdsVersion: '7_3',
                    encrypt: true
                }
            });
        });

        it('args override config', function () {
            path.resolve = jasmine.createSpy().andReturn('test-conf.json');
            fs.existsSync = jasmine.createSpy().andReturn(true);

            config.user = 'theuser';
            config.pass = 'thepass';
            config.server = 'example2.com';

            options.init([
                'node.exe', 'test.js',
                '-s', 'example.com',
            ], {});

            var info = options.getConnectionInfo();

            expect(info).toEqual({
                user: 'theuser',
                password: 'thepass',
                server: 'example.com',
                database: undefined,
                port: undefined,
                timeout: undefined,
                options: {
                    tdsVersion: undefined,
                    encrypt: false
                }
            });
        });
    });
});