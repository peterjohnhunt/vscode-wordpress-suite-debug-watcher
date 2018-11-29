'use strict';
import { commands, window, ExtensionContext, extensions } from 'vscode';
import { Watcher } from './classes/class-watcher';

export function activate(context: ExtensionContext) {
    let watchers = [];
    let api = extensions.getExtension('peterjohnhunt.wordpress-suite').exports;

    let openDisposable = commands.registerCommand('extension.open-log', (uri) => {
        if (!uri) {
            window.showInformationMessage('Please Select A Site');
            return;
        }
        
        let site = api.getSite(uri.path);

        if (site){
            site.watcher.openLog();
        }
    });
    context.subscriptions.push(openDisposable);

    let clearDisposable = commands.registerCommand('extension.clear-log', (uri) => {
        if (!uri) {
            window.showInformationMessage('Please Select A Site');
            return;
        }

        let site = api.getSite(uri.path);

        if (site) {
            site.watcher.clearLog();
        }
    });
    context.subscriptions.push(clearDisposable);

    for (let site of api.getSites()){
        site.watcher = new Watcher(site.getRoot());
    }
}

export function deactivate() {
}