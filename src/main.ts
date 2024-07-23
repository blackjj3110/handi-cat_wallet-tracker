import dotenv from "dotenv"
import { WatchTransaction } from "./lib/watch-transactions";
import { bot } from "./providers/telegram";
import { StartCommand } from "./bot/commands/start-command";
import { NewMembersHandler } from "./bot/handlers/new-members-handler";
import { AddCommand } from "./bot/commands/add-command";
import { CallbackQueryHandler } from "./bot/handlers/callback-query-handler";
import express, { Express } from "express"
import { PrismaWalletRepository } from "./repositories/prisma/wallet";
import { WatchWallets } from "./lib/watch-wallets";
import { Utils } from "./lib/token-utils";
import { TokenParser } from "./parsers/token-parser";
import { fetchAndCalculate, getTokenMktCap, test } from "./test";
import { FormatNumbers } from "./lib/format-numbers";
import { ManageCommand } from "./bot/commands/manage-command";

dotenv.config()

const WALLET_ADDRESSES = [
    '4eADUUa7sumjdV1uJCBCZxCyeDYTbMruVwKNzWAnYZU4',
    '48ry8Bci3B62UNcUVvU2wavwSv9vjKCWEu9bTNmj6JqN',
    'Eah4NJNMLUsJwQnTyELgm28uqy3Jtn3ft1YJ7r6WH55d',
]

const PORT = process.env.PORT || 3001

class Main {
    private prismaWalletRepository: PrismaWalletRepository
    private walletWatcher: WatchTransaction
    constructor(private app: Express = express()) {
        this.app.use(express.json({ limit: '50mb' }))

        this.setupRoutes()

        this.prismaWalletRepository = new PrismaWalletRepository()
        this.walletWatcher = new WatchTransaction()
    }

    setupRoutes() {
        // Default endpoint
        this.app.get('/', async (req, res) => {
            try {
                res.status(200).send('Hello world');
            } catch (error) {
                console.error('Error processing update:', error);
                res.status(500).send('Error processing update');
            }
        });
        this.app.post(`*`, async (req, res) => {
            try {
                bot.processUpdate(req.body);
                
                res.status(200).send('Update received');
            } catch (error) {
                console.error('Error processing update:', error);
                res.status(500).send('Error processing update');
            }
        });
    }

    public async init(): Promise<void> {
        // Bot
        const newMembersHandler = new NewMembersHandler(bot)
        const callbackQueryHandler = new CallbackQueryHandler(bot)
        const startCommand = new StartCommand(bot)
        const addCommand = new AddCommand(bot)
        const manageCommand = new ManageCommand(bot)
 
        newMembersHandler.newMember()
        callbackQueryHandler.call()
        startCommand.start()
        addCommand.addCommandHandler()
        await manageCommand.manageCommandHandler()

        // const utils = new Utils()
        // await utils.getTokenMktCap('raydium', 'E2dT9axcJuaQ8NM6JcFaSjYCPhidgJTSqpGS8LQbCsVm')
        // await utils.isRaydiumToken('43UKTULPFkHd9K6a8nWjjwtisEgWRWPoD6ocEmH8pump')
        // await fetchAndCalculate()
        // await getTokenMktCap('26hYxfqDaDtd4iykEyb9vav9YbeuV5PhDNQLNbAbpump', 0.01442674864824286)
        // const token = new TokenParser(connection)
        // await token.getTokenInfo('Gg8cq7hYxc7bBdGAN5nNxfJPL9fhUwwebWy5bkJqpump')
        // await test()
        // const numbers = new FormatNumbers()
        // const f = 1.0308055978875173e-10.toFixed(10)
        // console.log('FORMATTED', f)

 
        this.app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

        await this.setupWalletWatcher();
        await this.listenForDatabaseChanges();
    }

    public async setupWalletWatcher(refetch?: boolean): Promise<void> {
        const allWallets = await this.prismaWalletRepository.getAllWalletsWithUserIds()

        if (refetch) {
            await this.walletWatcher.updateWallets(allWallets);
        } else {
            await this.walletWatcher.watchSocket(allWallets);
        }
    }

    public async listenForDatabaseChanges(): Promise<void> {
        const stream = await this.prismaWalletRepository.pulseWallet();

        for await (const event of stream) {
            console.log('New event:', event);

            if (event.action === 'create' || event.action === 'delete') {
                // Refetch wallets and update watcher on create/delete actions
                await this.setupWalletWatcher(true);
            }
        }
    }
}

const main = new Main()
main.init()



