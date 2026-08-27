export class CreateQueryFormDto {
    public name: string;
    public query: string;
    public datasourceId: number;


    constructor(name: string, query: string, datasourceId: number) {
        this.name = name;
        this.query = query;
        this.datasourceId = datasourceId;
    }
}