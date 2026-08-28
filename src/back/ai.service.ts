const {Mistral} = require("@mistralai/mistralai")

export class AiService {
    private static mistralClient = new Mistral({
        apiKey: process.env.AI_API_KEY ?? "vgv3PFnsvCi2FHJjQtDznBWasesB8oMG"
    })

    public static analyzeQuery(args) {
        const {query} = args;
        console.log("query is ", query)

        return this.mistralClient.chat.complete({
            model: 'ministral-14b-latest',
            messages: [
                {
                    role: "system",
                    content: `Analyse cette requête SQL pour identifier les problèmes de performance (scans séquentiels,
                    index manquants, jointures coûteuses, etc.) et propose des optimisations concrètes (ajout d'index,
                    réécriture de la requête, etc.). Sois précis et justifie chaque suggestion. Voici la requête : ${query}`
                }
            ],
            responseFormat: {
                type: 'text'
            }
        })
    }
}