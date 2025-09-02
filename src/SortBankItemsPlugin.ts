import { Plugin } from '@highlite/core';
import { PanelManager } from '@highlite/core';
import PanelHTML from '../resources/html/panel.html';
import PanelCSS from '../resources/css/panel.css';

export default class SortBankItemsPlugin extends Plugin {
    pluginName = "SortBankItems";
    author: string = "Geeno";
    panelManager: PanelManager = new PanelManager();

    constructor() {
        super()
    };

    init(): void {
        this.log('init');
    }

    start(): void {
        this.log('start');

        const panelItems: HTMLElement[] =
            this.panelManager.requestMenuItem('🔄', 'Sort Bank Items');

        const panelBlock: HTMLDivElement = panelItems[1];
        panelBlock.innerHTML = PanelHTML;

        const styleElement: HTMLStyleElement = document.createElement('style');
        styleElement.innerText = `${PanelCSS}`;
        panelBlock.appendChild(styleElement);

        const sortIdButton: HTMLButtonElement =
            panelBlock.querySelector('#sort_bank_items_plugin_button_id');
        const sortValueButton: HTMLButtonElement =
            panelBlock.querySelector('#sort_bank_items_plugin_button_value');

        sortIdButton.addEventListener('click', (_e) => { this.sortById(_e); });
        sortValueButton.addEventListener('click', (_e) => { this.sortByValue(_e); });
    }

    stop(): void {
        this.log('stop');

        this.panelManager.removeMenuItem('🔄');
    }

    private sortById(_event: Event): void {
        this.log('sort by id');
    }

    private sortByValue(_event: Event): void {
        this.log('sort by value');
    }
}
