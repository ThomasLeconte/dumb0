import {ChatCompletionResponse} from "@mistralai/mistralai/models/components";
import {SqliteService} from "./sqlite.service";
import PostgresqlService from "./postgresql.service";
import {TableIndexesDto} from "../commons/data/dto/table-indexes-dto";

const {Mistral} = require("@mistralai/mistralai")

export class AiService {
    private static mistralClient = new Mistral({
        apiKey: process.env.AI_API_KEY ?? "vgv3PFnsvCi2FHJjQtDznBWasesB8oMG"
    })

    private static cache = new Map<string, ChatCompletionResponse>();

    public static async analyzeQuery(args) {
        const {query, datasourceId} = args as {query: string, datasourceId: string}
        const regex = /(?<=[FROM,JOIN]\s)([a-zA-Z]{1,})/gm
        const tables = query.match(regex).map(matche => matche);
        const indexesStats = await (async () => {
            const datasource = await SqliteService.getDatasourceById(datasourceId);
            if (!datasource) {
                throw new Error(`Datasource not found with id ${datasourceId}`);
            }

            const db = await PostgresqlService.initConnection(datasource);

            try {
                const indexes = new Map<string, TableIndexesDto[]>();

                await Promise.all(
                    tables.map(async (table) => {
                        const tableIndexes = await PostgresqlService.getTableIndexes(db, table);
                        console.log(tableIndexes);
                        indexes.set(table, tableIndexes);
                    })
                );

                return indexes;
            } finally {
                db.end();
            }
        })();

        const indexesStatsFormatted = Array.from(indexesStats.entries()).map(entry => {
            return {tableName: entry[0],
                indexes: entry[1].map(v => {return {name: v.name, def: v.def}})}
        })

        if(this.cache.has(query)) return Promise.resolve(this.cache.get(query));
        return this.mistralClient.chat.complete({
            model: 'ministral-14b-latest',
            messages: [
                {
                    role: "system",
                    content: `Analyse cette requête SQL pour identifier les problèmes de performance (scans séquentiels,
                    index manquants, jointures coûteuses, etc.) et propose des optimisations concrètes (ajout d'index,
                    réécriture de la requête, etc.). Sois précis et justifie chaque suggestion. Pour t'aider dans l'analyse,
                    voici les statistiques des index de chaque table de la requête que tu pourras analyser : ${JSON.stringify(indexesStatsFormatted)}.
                    Chaque partie de ta réponse devra être aérée visuellement, pour rendre la lecture confortable. Voici la requête : ${query}`
                }
            ],
            responseFormat: {
                type: 'text'
            }
        }).then((res) => {
            this.cache.set(query, res);
            return res;
        }).catch((err) => {
            console.error(err);
            throw new Error(err.message ?? "Error during query analyze...");
        })
    }
}