import { window, workspace } from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import filewatcher from 'filewatcher';

import { Config } from './class-config';

export class Watcher{
    private _watcher: filewatcher;
    private _config: Config;
    private _root = '';
    private _name = '';
    private _file = '';
    private _contents = '';
    private _buttons = ['Open', 'Clear'];
    private _regex = '^\\[\\d{2}-\\w{3}-\\d{4} \\d{2}:\\d{2}:\\d{2} UTC\\] ';
    private _types = {
        'error': 'PHP Parse error:',
        'notice': 'PHP Notice:',
        'deprecated': 'PHP Deprecated:',
        'warning': 'PHP Warning:',
    };

    constructor(root){
        this._watcher = filewatcher();
        this._config = new Config();
        this._root = root;
        this._name = path.basename(root).toUpperCase();
        this._file = path.join(root, 'wp-content/debug.log');

        fs.readFile(this._file, 'utf8', (err,data) => {
            if (err) return;
            
            this._setContents(data);

            this._showInfo('Watching Debug Log');

            this._watcher.add(this._file);
            this._watcher.on('change', (file, stat) => {
                fs.readFile(file, 'utf8', (err,data) => {
                    if (err) return;

                    if ( data ) {
                        let config = this._config.get('messages');
                        let messages = this._getMessages(data);
                        let isStackTrace = false;

                        for (let message of messages){
                            let type = this._getType(message);

                            if (!message) continue;

                            if ( message.indexOf('PHP Stack trace:') !== -1 ) {
                                isStackTrace = true;
                                continue;
                            }

                            if ( isStackTrace ) {
                                if (message.search(new RegExp('^PHP\\s+\\d+\\. ')) !== -1) {
                                    continue;
                                } else {
                                    isStackTrace = false;
                                }
                            }
                            
                            if (config[type]) {
                                if (type == 'error' ) {
                                    this._showError(message);                            
                                } else if (['notice', 'deprecated', 'warning'].indexOf(type) !== -1) {
                                    this._showWarning(message);
                                } else if (type == 'info'){
                                    this._showInfo(message, this._buttons);
                                }
                            }
                        }
                    } else if ( this._getContents() != '' ) {
                        this._showInfo('Debug Log Cleared');
                    }

                    this._setContents(data);
                });
            });
        });
    }

    private _getMessages(newContents){
        let oldContents = this._getContents();

        if (newContents.length > oldContents.length) {
            return newContents.replace(oldContents, '').trim().split(new RegExp(this._regex, 'gm'));
        }

        return [];
    }

    private _getTypes(){
        return this._types;
    }

    private _getSearch(type){
        let types = this._getTypes();
        return types[type];
    }

    private _getType(message){
        let keys = Object.keys(this._getTypes());

        for (let type of keys){
            let search = this._getSearch(type);
            
            if (message.indexOf(search) == 0) {
                return type;
            }
        }

        return 'info';
    }

    private _setContents(contents){
        this._contents = contents;
    }

    private _getContents(){
        return this._contents;
    }

    private _prepare(message){
        return this._name + ': ' + message;
    }

    private _showInfo(message, buttons=[]){
        window.showInformationMessage(this._prepare(message), ...buttons).then(selection => this._handleButtons(selection));
    }

    private _showWarning(message) {
        window.showWarningMessage(this._prepare(message), ...this._buttons).then(selection => this._handleButtons(selection));
    }

    private _showError(message) {
        window.showErrorMessage(this._prepare(message), ...this._buttons).then(selection => this._handleButtons(selection));
    }

    private _handleButtons(selection){
        if (selection == 'Open') {
            this.openLog();
        } else if (selection == 'Clear') {
            this.clearLog();
        }
    }

    public openLog(){
        workspace.openTextDocument(this._file).then(doc => {
            window.showTextDocument(doc);
            this._showInfo('Debug Log Opened');
        });
    }

    public clearLog(){
        fs.writeFile(this._file, '', (err) => {
            if (err) return;
            this._showInfo('Debug Log Cleared');
        })
    }
}