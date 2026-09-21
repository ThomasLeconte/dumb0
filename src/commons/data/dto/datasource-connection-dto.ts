export class DatasourceConnectionDto {
    public username: string;
    public applicationName: string;
    public ipAdress: string;
    public startDate: Date;
    public lastQuery: string;


    constructor(username: string, applicationName: string, ipAdress: string, startDate: Date, lastQuery: string) {
        this.username = username;
        this.applicationName = applicationName;
        this.ipAdress = ipAdress;
        this.startDate = startDate;
        this.lastQuery = lastQuery;
    }
}