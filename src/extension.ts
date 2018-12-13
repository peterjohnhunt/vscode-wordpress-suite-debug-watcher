'use strict';
import { commands, window, ExtensionContext, extensions } from 'vscode';
import { Watcher } from './classes/class-watcher';

export function activate(context: ExtensionContext) {
    let api = extensions.getExtension('peterjohnhunt.wordpress-suite').exports;

    let openDisposable = commands.registerCommand('extension.open-log', (uri) => {
        let selected = uri ? uri.path : false;
        let site = api.sites.getSite(selected);

        if (site){
            site.watcher.openLog();
        }
    });
    context.subscriptions.push(openDisposable);

    let clearDisposable = commands.registerCommand('extension.clear-log', (uri) => {
        let selected = uri ? uri.path : false;
        let site = api.sites.getSite(selected);

        if (site) {
            site.watcher.clearLog();
        }
    });
    context.subscriptions.push(clearDisposable);

    const sites = api.sites.getSites();
    if (sites.length) {
        for (let site of sites){
            site.watcher = new Watcher(site);
            context.subscriptions.push(site.watcher);
        }
    }
}

export function deactivate() {
}