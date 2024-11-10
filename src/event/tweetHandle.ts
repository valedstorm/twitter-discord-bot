import Database from 'better-sqlite3';
import dedent from 'dedent';

// 定義介面
interface tweetObj {
    domain: string,
    uid: string,
    tweetId: string
}

export class TweetHandle {
    private static instance: TweetHandle;
    private dbInstance: Database.Database;

    // 在這裡，當TweetHandle實例被建立時 初始化建立一次dbInstance的連線
    // 私有化構造函數，取得實例使用.getInstance()
	private constructor() {
        // 在創建實例時初始化資料庫連線
        this.dbInstance = new Database(__dirname + './../../main.db', {
            // verbose: console.log // 打印每次執行的SQL語句，方便調試時偵錯
        });
    }

    /**
     * TweetHandle 單例模式實現，同時實例化資料庫連線
     */
    public static getInstance() {
        if (!this.instance) {
            this.instance = new TweetHandle();
        }
        return this.instance;
    }
    
    /**
     * 去除資料庫中已存在、或被重複加入的 tweetId
     */
    public unique(urls: string[]) {
        const uniqueTweetId = new Set(); // 確保本次加入的是唯一的tweetId
        const resultObjs: tweetObj[] = [];

        // 取得sqlite過去已加入的tweetId
        const sqlTweetId = this.fetchSQL();

        urls.forEach(url => {
            const obj = this.parse(url);
            const tweetId = obj.tweetId;
            if (!uniqueTweetId.has(tweetId) && !sqlTweetId?.has(tweetId)) {
                uniqueTweetId.add(tweetId); // 告訴後面加入的，我(tweetId)已經存在一次了
                resultObjs.push(obj)
            }
        });
        
        const result = this.insertSQL(resultObjs);
        return result;
    }

    // 解析URL參數
    private parse(url: string) {
        const process = new URL(url);
        const pathname = process.pathname.split('/').filter(Boolean);
        const domain = process.hostname;
        const uid = pathname[0]; // 假定的位置
        const tweetId = pathname.pop();

        // 檢查 tweetId 是否為 undefined，在這裡拋出錯誤
        if (!tweetId) {
            throw new Error('TweetID .pop() is undefined.');
        }
        return { domain, uid, tweetId };
    }

    // 讀取SQLite資料庫 TweetId
    private fetchSQL() {
        const db = this.dbInstance;
        try {
            const rows = db.prepare('SELECT tweetId FROM twitter').pluck().all();
            return new Set(rows);
        } catch (e) {
            console.error('Error fetching: ', e);
			return;
        }
    }

    // 插入 tweetObjs 物件到資料庫，返回結果的字串
    private insertSQL(objs: tweetObj[]): string {
        const db = this.dbInstance;
        const insert = db.prepare('INSERT OR IGNORE INTO twitter (domain, uid, tweetId) VALUES (@domain, @uid, @tweetId)');
        let changes = 0; // 紀錄執行事務時總共影響的資料列數
        const resultUrls: string[] = [];

        // 建立事務 (原子化/不可分割)
        const insertMany = db.transaction(objs => {
            for (const obj of objs) {
                const result = insert.run(obj);
                changes += result.changes;
                if (result.changes !== 0) {
                    const url = `https://${obj.domain}/${obj.uid}/status/${obj.tweetId}`;
                    resultUrls.push(url);
                }
            }
        });
        // 執行事務
        insertMany(objs);
        const content = dedent`
            \`\`\`
            成功插入 ${changes} 條資料
            ${resultUrls.join('\n')}
            \`\`\`
        `;
        return content;
    }
}
