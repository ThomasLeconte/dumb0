export enum IpcRoutes {
    // App
    APP_CLOSE = 'app-close',
    APP_SET_TITLE = 'app-set-window-title',
    // Datasources
    DATASOURCE_GET_ALL = 'datasource-get-all',
    DATASOURCE_GET_BY_ID = 'datasource-get-by-id',
    DATASOURCE_GET_STATS = 'datasource-get-stats',
    DATASOURCE_CREATE = 'datasource-create',
    DATASOURCE_UPDATE = 'datasource-update',
    DATASOURCE_DELETE = 'datasource-delete',
    DATASOURCE_EXECUTE_QUERY = 'datasource-execute-query',
    DATASOURCE_GET_QUERY_HISTORY = 'datasource-get-query-history',
    DATASOURCE_DELETE_QUERY_HISTORY = 'datasource-delete-query-history',
    TABLES_GET_ALL = 'tables-get-all',
    TABLES_GET_STATS = 'tables-get-stats',

}
