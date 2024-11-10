/**
 * 純工具類
 */

import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from "discord.js";

export class DiscordButton {
    // 類的屬性
	// 管理按鈕的組件，所有的新增都在這邊執行
    private static btnComponents: { [key: string]: ButtonBuilder } = {
        'fetch-message': new ButtonBuilder().setCustomId('fetch-message').setLabel('確認連結訊息').setStyle(ButtonStyle.Primary),
        'tweet-check': new ButtonBuilder().setCustomId('tweet-check').setLabel('TweetId 加入到資料庫').setStyle(ButtonStyle.Primary),
        'reset-button': new ButtonBuilder().setCustomId('reset-button').setLabel('刪除頻道訊息').setStyle(ButtonStyle.Danger),
    };
    private static actionRowInstance: ActionRowBuilder<ButtonBuilder>;

    // 類的方法
	// actionRow單例的實現
    public static getActionRow() {
        if (!this.actionRowInstance) {
            this.actionRowInstance = new ActionRowBuilder<ButtonBuilder>().addComponents(Object.values(this.btnComponents));
        }
        return this.actionRowInstance;
    }

    // 更新被點擊按鈕的狀態 (樣式)
	// 傳入的是interaction交互事件，由內部來進行判斷
    public static updateBtnState(interaction: ButtonInteraction) {
        // 注意: 這裡btnComponents集合的key要和customId一樣才能成功捕獲
        const button = this.btnComponents[interaction.customId];
        button.setStyle(ButtonStyle.Danger);
    }

    // 重置所有按鈕為初始狀態
    public static resetBtnState() {
        Object.values(this.btnComponents).forEach(btn => {
            btn.setStyle(ButtonStyle.Primary);
        });
    }
}
