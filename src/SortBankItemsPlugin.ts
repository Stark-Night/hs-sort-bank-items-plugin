import { Plugin } from '@highlite/core';
import { PanelManager } from '@highlite/core';
import { SoundManager } from '@highlite/core';
import { NotificationManager } from '@highlite/core';
import { SettingsTypes } from '@highlite/core';
import PanelHTML from '../resources/html/panel.html';
import PanelCSS from '../resources/css/panel.css';
import NotificationSound from '../resources/sounds/notification.mp3';

const BANK_SWAP_MODE: number = 0;
const BANK_INSERT_MODE: number = 1;

export default class SortBankItemsPlugin extends Plugin {
    pluginName = "SortBankItems";
    author: string = "Geeno";
    version: string = '1.0.0';

    private panelManager: PanelManager = new PanelManager();
    private soundManager: SoundManager = new SoundManager();
    private notifyManager: NotificationManager = new NotificationManager();

    private bankOpen: bool = false;
    private sortTask: number = null;

    constructor() {
        super();

        this.settings.notifymessage = {
            text: 'Notifications',
            type: SettingsTypes.checkbox,
            value: false,
            callback: () => { return; },
        };

        this.settings.notifysound = {
            text: 'Sounds',
            type: SettingsTypes.checkbox,
            value: false,
            callback: () => { return; },
        };

        this.settings.soundvolume = {
            text: 'Sound volume',
            type: SettingsTypes.range,
            value: 100,
            min: 0,
            max: 100,
            callback: () => { return; },
        };
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

        const versionSpan: HTMLSpanElement =
            panelBlock.querySelector('#sort_bank_items_plugin_version');
        versionSpan.innerText = this.version;

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
            // The array is always filled, empty spaces are "null".
            // In order to push the null at the end it needs an
            // "infinity" value.
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
            // The "inifinity" number is arbitrary, but I didn't want
            // to use the special keywords.
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

            if (this.settings.notifymessage.value) {
                const message = 'Bank items sorting complete!';
                this.notifyManager.createNotification(message);
            }

            if (this.settings.notifysound.value) {
                const volume =
                    (this.settings.soundvolume.value as number) / 100;

                this.soundManager.playSound(NotificationSound, volume);
            }

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
                // Swap the two items at the given indices.  The last
                // argument indicates whether the player is
                // initialized, which is true for user-initiated
                // tasks.
                playerBank.reorganizeItems(itemIndex, newIndex, BANK_SWAP_MODE, true);
            } else {
                taskCooldown = 10;
            }
        }

        // The sorting *must* be carried through a timeout to ensure
        // the game does not break.  In the best case, sorting
        // everything in one go results in a log out, in the worst
        // case data *might* end up corrupted and I'd rather not
        // see it happen.
        this.sortTask = setTimeout((index: number, mapping: Object) => {
            this.actUponTheBank(index, mapping);
        }, taskCooldown, index + 1, mapping);
    }

    BankUIManager_showBankMenu(): void {
        this.bankOpen = true;
    }

    BankUIManager_handleCenterMenuWillBeRemoved(): void {
        // This hook is executed both when the window is closed
        // through the top corner X and when the player walks away.
        this.bankOpen = false;
    }
}
