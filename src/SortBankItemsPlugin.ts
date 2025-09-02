import { Plugin } from '@highlite/core';
import { PanelManager } from '@highlite/core';
import PanelHTML from '../resources/html/panel.html';
import PanelCSS from '../resources/css/panel.css';

const BANK_SWAP_MODE: number = 0;
const BANK_INSERT_MODE: number = 1;

export default class SortBankItemsPlugin extends Plugin {
    pluginName = "SortBankItems";
    author: string = "Geeno";

    private panelManager: PanelManager = new PanelManager();
    private bankOpen: bool = false;
    private sortTask: number = null;

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
        if (!this.settings.enable.value || !this.bankOpen) {
            this.warn('bank is closed');
            return;
        }

        const bankedItems: Array = this.cloneBankItems();
        bankedItems.sort((a, b) => {
            const idA: number = (a) ? a.Def.ID : bankedItems.length + 1000;
            const idB: number = (b) ? b.Def.ID : bankedItems.length + 1000;

            return idA - idB;
        });

        const sortMapping: Object = this.generateMapping(bankedItems);

        if (null !== this.sortTask) {
            clearTimeout(this.sortTask);
            this.sortTask = null;
        }

        this.actUponTheBank(0, sortMapping);
    }

    private sortByValue(_event: Event): void {
        this.log('sort by value');
        if (!this.settings.enable.value || !this.bankOpen) {
            this.warn('bank is closed');
            return;
        }

        const bankedItems: Array = this.cloneBankItems();
        bankedItems.sort((a, b) => {
            const costA: number = (a) ? a.Def.Cost : 9009009;
            const costB: number = (b) ? b.Def.Cost : 9009009;

            return costA - costB;
        });

        const sortMapping: Object = this.generateMapping(bankedItems);

        if (null !== this.sortTask) {
            clearTimeout(this.sortTask);
            this.sortTask = null;
        }

        this.actUponTheBank(0, sortMapping);
    }

    private cloneBankItems(): Array {
        const playerBank: Object =
            document.highlite.gameHooks
                .EntityManager
                .Instance
                .MainPlayer
                .BankStorageItems;

        return playerBank.cloneItems();
    }

    private generateMapping(sortedItems: Array): Object {
        const mapping: Object = {};
        for (let index in sortedItems) {
            if (!sortedItems[index]) {
                continue;
            }

            const itemID: number = sortedItems[index].Def.ID;
            mapping[itemID] = index;
        }

        return mapping;
    }

    private actUponTheBank(index: number, mapping: Object): void {
        if (!this.settings.enable.value || !this.bankOpen) {
            this.warn('bank is closed');
            this.sortTask = null;
            return;
        }

        const playerBank: Object =
            document.highlite.gameHooks
                .EntityManager
                .Instance
                .MainPlayer
                .BankStorageItems;

        const mappingKeys: Array = Object.keys(mapping);
        if (index >= mappingKeys.length) {
            this.log('no more items');
            this.sortTask = null;
            return;
        }

        const itemID: number = parseInt(mappingKeys[index]);
        const itemIndex: number =
            playerBank.Items.findIndex((e) => (e && e.Def.ID === itemID));

        let taskCooldown: number = 476 + Math.round(Math.random() * 300);
        if (-1 === itemIndex) {
            taskCooldown = 10;
        } else {
            const newIndex: number = parseInt(mapping[itemID]);
            if (itemIndex !== newIndex) {
                playerBank.reorganizeItems(itemIndex, newIndex, BANK_SWAP_MODE, true);
            } else {
                taskCooldown = 10;
            }
        }

        this.sortTask = setTimeout((index: number, mapping: Object) => {
            this.actUponTheBank(index, mapping);
        }, taskCooldown, index + 1, mapping);
    }

    BankUIManager_showBankMenu(): void {
        this.bankOpen = true;
    }

    BankUIManager_handleCenterMenuWillBeRemoved(): void {
        this.bankOpen = false;
    }
}
