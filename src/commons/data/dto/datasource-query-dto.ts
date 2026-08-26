export class DatasourceQueryDto {
    public id: number;
    public query: string;
    public executed_at: Date;

    constructor(id: number, query: string, executed_at: Date) {
        this.id = id;
        this.query = query;
        this.executed_at = executed_at;
    }
}