export class DatasourceSavedQueryDto {
    public id: number;
    public name: string;
    public query: string;


    constructor(id: number, name: string, query: string) {
        this.id = id;
        this.name = name;
        this.query = query;
    }
}