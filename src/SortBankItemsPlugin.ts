import { Plugin } from '@highlite/core';
import { PanelManager } from '@highlite/core';
import PanelHTML from '../resources/html/panel.html';
import PanelCSS from '../resources/css/panel.css';

const BANK_SWAP_MODE: Number = 0;
const BANK_INSERT_MODE: Number = 1;

export default class SortBankItemsPlugin extends Plugin {
    pluginName = "SortBankItems";
    author: string = "Geeno";
    panelManager: PanelManager = new PanelManager();
    bankOpen: bool = false;
    sortTask: Number = null;

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

        const playerBank: Object =
            document.highlite.gameHooks
                .EntityManager
                .Instance
                .MainPlayer
                .BankStorageItems;
        const bankedItems: Array = playerBank.cloneItems();

        bankedItems.sort((a, b) => {
            const idA: Number = (a) ? a.Def.ID : bankedItems.length + 1000;
            const idB: Number = (b) ? b.Def.ID : bankedItems.length + 1000;

            return idA - idB;
        });

        const sortMapping: Object = {};
        for (let index in bankedItems) {
            if (!bankedItems[index]) {
                continue;
            }

            const itemID: Number = bankedItems[index].Def.ID;
            sortMapping[itemID] = index;
        }

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
    }

    private actUponTheBank(index: Number, mapping: Object): void {
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

        const itemID: Number = parseInt(mappingKeys[index]);
        const itemIndex: Number =
            playerBank.Items.findIndex((e) => (e && e.Def.ID === itemID));

        let taskCooldown: Number = 476 + Math.round(Math.random() * 300);
        if (-1 === itemIndex) {
            taskCooldown = 10;
        } else {
            const newIndex: Number = parseInt(mapping[itemID]);
            if (itemIndex !== newIndex) {
                this.log(`swapping ${itemIndex} with ${newIndex} (item ID ${itemID})`);
                playerBank.reorganizeItems(itemIndex, newIndex, BANK_SWAP_MODE, true);
            } else {
                taskCooldown = 10;
            }
        }

        this.sortTask = setTimeout((index: Number, mapping: Object) => {
            this.actUponTheBank(index, mapping);
        }, taskCooldown, index + 1, mapping);
    }

    BankUIManager_showBankMenu(): void {
        this.log('bank opens');
        this.bankOpen = true;
    }

    BankUIManager_handleCenterMenuWillBeRemoved(): void {
        this.log('bank closes');
        this.bankOpen = false;
    }
}
