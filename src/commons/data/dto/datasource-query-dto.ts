export class DatasourceQueryDto {
    public id: number;
    public query: string;
    public executed_at: string;

    constructor(id: number, query: string, executed_at: string) {
        this.id = id;
        this.query = query;
        this.executed_at = executed_at;
    }
}
