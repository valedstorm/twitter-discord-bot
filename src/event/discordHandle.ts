import { ButtonInteraction, Collection, Message, TextChannel } from 'discord.js';
import { DiscordButton } from './discordButton';
import { TweetHandle } from './tweetHandle';
import dedent from 'dedent';

export class DiscordHandle {
    private globalUrls?: string[];

    /**
     * displayBtnOptions 顯示按鈕選單
     */
    public displayBtnOptions(message: Message) {
        message.reply({
            content: '請選擇你要做的事：',
            components: [DiscordButton.getActionRow()]
        });
    }

    /**
     * handleBtnInteraction 處理按鈕類型的交互事件邏輯
     */
    public async handleBtnInteraction(interaction: ButtonInteraction) {
        // 修改被點擊時的按鈕顏色
        // DiscordButton.updateBtnState(interaction);

        if (interaction.customId === 'fetch-message') {
            // 修改被點擊時的按鈕顏色
            DiscordButton.updateBtnState(interaction);

            // 具體邏輯 (確認連結訊息)
            const msgs = await this.getChannelMessages(interaction);
            const content = dedent`
                結果: ${msgs.length} rows
                \`\`\`
                ${msgs.join('\n')}
                \`\`\`
            `;
            this.globalUrls = msgs; // 將篩選過後的網址數組賦值給自己對象的globalUrls屬性
            await interaction.update({
                content,
                components: [DiscordButton.getActionRow()]
            });
        }

        if (interaction.customId === 'tweet-check') {
            // 如果btn-1沒有被執行過最少一次，不給執行btn-2
            if (!this.globalUrls) {
                interaction.update({
                    content: '請先確認本次的 Url 訊息！',
                    components: [DiscordButton.getActionRow()]
                });
                return; // 跳出本次的 handleBtnInteraction
            }
            // 修改被點擊時的按鈕顏色
            DiscordButton.updateBtnState(interaction);
            
            // 交由tweetHandle處理
            const tweetHandle = TweetHandle.getInstance();
            const result = tweetHandle.unique(this.globalUrls);

            interaction.deferUpdate(); // 不需要後續回應，因為 Discord 已認為交互已被處理
            await (interaction.channel as TextChannel).send({
                content: result,
                components: [DiscordButton.getActionRow()]
            });
        }

        if (interaction.customId === 'reset-button') {
            // 獲取頻道並刪除頻道內所有的訊息
            this.clearChannelMessages(interaction);
            // 重制所有按鈕的狀態
            DiscordButton.resetBtnState();
        }
    }

    /**
     * getChannelMessages 指定頻道內所有的網址訊息
     */
    private async getChannelMessages(interaction: ButtonInteraction) {
        let msgContent: string[] = [];
        let lastMsgId;
        const regex = /https?:\/\/[^s]+/;
        
        while (true) {
            const msgs: Collection<string, Message> | undefined = await interaction.channel?.messages.fetch({ limit: 100, before: lastMsgId });
            
            msgs?.forEach(msg => {
                if (msg.author.bot || msg.id === interaction.id || !regex.test(msg.content)) return; // return 跳過單次循環
                msgContent.push(msg.content);
            });

            if (!msgs || msgs.size < 100) break;
            lastMsgId = msgs.last()!.id;
        }
        msgContent.reverse();
        return msgContent;
    }

    /**
     * clearChannelMessages 清空指定頻道內所有的歷史訊息
     */
    private async clearChannelMessages(interaction: ButtonInteraction) {
        const channel = interaction.channel as TextChannel;
        let deleted;

        do {
            // 獲取訊息並刪除
            const msgs = await channel.messages.fetch({ limit: 100 });
            deleted = msgs.size;
            if (deleted > 0) {
                await channel.bulkDelete(msgs, true);
                // console.log(`已刪除 ${deleted} 條訊息`);
            }
        } while (deleted > 0);
    }
}
